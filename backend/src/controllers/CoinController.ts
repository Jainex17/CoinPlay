import { Request, Response } from "express";
import { CoinModel } from "../models/Coin";
import { RequestWithUser } from "../middleware/checkAuth";
import { UserModel } from "../models/User";
import { TransactionsModel } from "../models/Transactions";
import { PortfolioModel } from "../models/Portfolio";
import { pool } from "../config/db";
import { calculateBuyQuote, calculateReferenceBuyQuote, calculateReferenceSellQuote, calculateSellQuote, getSpotPrice, isReferenceQuoteFresh, parseMoney, parseShares } from "../lib/tradingMath";

const getReferenceQuoteMaxAgeMs = () => Math.min(86_400, Math.max(1, Number(process.env.REFERENCE_QUOTE_MAX_AGE_SECONDS || 300))) * 1_000;
const hasFreshReferenceQuote = (coin: any) => isReferenceQuoteFresh(coin.reference_price, coin.reference_price_updated_at, getReferenceQuoteMaxAgeMs());
export const getAllCoins = async (req: Request, res: Response) => {
    try {
        const coins = await CoinModel.getAllCoins();

        const result = await Promise.all(coins.map(async (coin: any) => {
            const creator = await UserModel.findById(coin.creator_id);
            const { cid, ...coinData } = coin;

            const totalSupply = parseFloat(coin.total_supply);
            const tokenReserve = parseFloat(coin.token_reserve);
            const baseReserve = parseFloat(coin.base_reserve);
            const isReferenceAsset = coin.pricing_model === "reference";
            coinData.circulating_supply = isReferenceAsset
                ? parseFloat(coin.circulating_supply)
                : totalSupply - tokenReserve;
            coinData.tokenReserve = tokenReserve;
            coinData.baseReserve = baseReserve;
            coinData.price = isReferenceAsset
                ? parseFloat(coin.reference_price || 0)
                : tokenReserve > 0 ? baseReserve / tokenReserve : 0;
            coinData.referenceQuoteStale = isReferenceAsset && !hasFreshReferenceQuote(coin);

            if (creator) {
                const { name, username, picture } = creator;
                coinData.creator = { name, username, avatar: picture };
            }
            return coinData;
        }));

        res.status(200).json({ coins: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getCoinBySymbol = async (req: Request, res: Response) => {
    try {
        const { symbol } = req.params;
        const coin = await CoinModel.getCoinBySymbol(symbol);

        if (!coin) {
            return res.status(404).json({ error: "Coin not found" });
        }

        const creator = await UserModel.findById(coin.creator_id);

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const totalSupply = parseFloat(coin.total_supply);
        const isReferenceAsset = coin.pricing_model === "reference";
        const referencePrice = parseFloat(coin.reference_price || 0);

        coin.price = isReferenceAsset ? referencePrice : baseReserve / tokenReserve;
        coin.referenceQuoteStale = isReferenceAsset && !hasFreshReferenceQuote(coin);
        coin.tokenReserve = tokenReserve;
        coin.baseReserve = baseReserve;
        coin.totalLiquidity = isReferenceAsset ? 0 : baseReserve * 2;

        const circulatingSupply = isReferenceAsset
            ? parseFloat(coin.circulating_supply)
            : totalSupply - tokenReserve;
        coin.circulating_supply = circulatingSupply;
        coin.circulatingSupply = circulatingSupply;
        coin.marketCap = coin.price * circulatingSupply;
        coin.fullyDilutedMarketCap = coin.price * totalSupply;

        coin.volume24h = await TransactionsModel.getVolume24hByCoin(coin.cid);
        coin.holders = await PortfolioModel.getHoldersByCoinId(coin.cid);

        const price24hAgo = await TransactionsModel.getPrice24hAgoByCoin(coin.cid);
        if (price24hAgo && price24hAgo > 0) {
            coin.change24h = parseFloat((((coin.price - price24hAgo) / price24hAgo) * 100).toFixed(2));
        } else {
            coin.change24h = 0;
        }

        const history = await TransactionsModel.getPriceHistoryByCoin(coin.cid);
        if (history.length === 0) {
            history.push({
                price_per_token: coin.price,
                created_at: coin.created_at
            });
        }
        coin.priceHistory = history;

        if (creator) {
            const { name, username, picture } = creator;
            coin.creator = { name, username, avatar: picture };
        }

        const { cid, ...coinData } = coin;
        res.status(200).json({ coin: coinData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const INITIAL_TOKEN_RESERVE = 1_000_000_000;
const INITIAL_BASE_RESERVE = 1000;
const CREATE_COIN_COST = 1000;
const CREATOR_ALLOCATION_PERCENT = 0.05;

export const createCoin = async (req: RequestWithUser, res: Response) => {
    const client = await pool.connect();
    await client.query('BEGIN');
    try {
        const { name, symbol } = req.body;
        const creator_id = req.user?.uid;

        if (!creator_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (typeof name !== 'string' || typeof symbol !== 'string' || !name.trim() || !symbol) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Name and symbol are required" });
        }

        const symbolRegex = /^[A-Za-z0-9]{3,6}$/;
        if (!symbolRegex.test(symbol)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Symbol must be 3-6 alphanumeric characters" });
        }

        if (name.trim().length > 100) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Name must be 100 characters or fewer" });
        }

        const symbolExists = await CoinModel.symbolExists(symbol);
        if (symbolExists) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Symbol already taken" });
        }

        const user = await UserModel.findByIdForUpdate(creator_id, client);
        if (!user) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await UserModel.updateBalance(creator_id, CREATE_COIN_COST, client);
        if (!updatedUser) {
            await client.query('ROLLBACK');
            return res.status(402).json({ error: "Need $1000 balance to create a coin" });
        }

        const creatorAllocation = Math.floor(INITIAL_TOKEN_RESERVE * CREATOR_ALLOCATION_PERCENT);
        const tokenReserveForLiquidity = INITIAL_TOKEN_RESERVE - creatorAllocation;

        const coin = await CoinModel.createCoin({
            name: name.trim(),
            symbol,
            creator_id,
            token_reserve: tokenReserveForLiquidity,
            base_reserve: INITIAL_BASE_RESERVE,
        }, client);

        await PortfolioModel.buyCoin({
            user_id: creator_id,
            coin_id: coin.cid,
            amount: creatorAllocation,
        }, client);

        await CoinModel.updateCirculatingSupply(coin.cid, creatorAllocation, client);

        const initialPrice = INITIAL_BASE_RESERVE / INITIAL_TOKEN_RESERVE;
        await TransactionsModel.createTransaction({
            user_id: creator_id,
            coin_id: coin.cid,
            amount: creatorAllocation,
            price_per_token: initialPrice,
            total_cost: 0,
            market_price: initialPrice,
            type: "create"
        }, client);

        await client.query('COMMIT');
        res.status(201).json({ coin, creatorAllocation });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            return res.status(409).json({ error: "Symbol already taken" });
        }
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
}

export const buyCoin = async (req: RequestWithUser, res: Response) => {
    const client = await pool.connect();
    await client.query('BEGIN');
    try {
        const { symbol } = req.params;
        const { amount: usdAmount } = req.body;
        const user_id = req.user?.uid;
        const rawIdempotencyKey = req.get("Idempotency-Key");
        const idempotencyKey = rawIdempotencyKey || undefined;

        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (idempotencyKey && (idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey))) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Invalid Idempotency-Key" });
        }
        const amountIn = parseMoney(usdAmount);
        if (!symbol || amountIn === null || amountIn < 0.01 || amountIn > 1_000_000) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Amount must be between $0.01 and $1,000,000.00" });
        }

        const coin = await CoinModel.getCoinBySymbolForUpdate(symbol, client);
        if (!coin) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Coin not found" });
        }
        const user = await UserModel.findByIdForUpdate(user_id, client);
        if (!user) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "User not found" });
        }

        if (idempotencyKey) {
            const existing = await TransactionsModel.findByIdempotencyKey(user_id, idempotencyKey, client);
            if (existing) {
                if (existing.coin_id !== coin.cid || existing.type !== "buy" || Number(existing.total_cost).toFixed(2) !== amountIn.toFixed(2)) {
                    await client.query('ROLLBACK');
                    return res.status(409).json({ error: "Idempotency key was already used for another trade" });
                }
                await client.query('COMMIT');
                return res.status(200).json({ success: true, transaction: existing, tokensReceived: existing.amount, idempotentReplay: true });
            }
        }

        if (coin.pricing_model === "reference") {
            if (!hasFreshReferenceQuote(coin)) {
                await client.query('ROLLBACK');
                return res.status(503).json({ error: "Reference market quote is unavailable or stale" });
            }
            const referencePrice = parseFloat(String(coin.reference_price || 0));
            const referenceQuote = calculateReferenceBuyQuote(amountIn, referencePrice);
            const sharesOut = Number.isFinite(referencePrice) ? referenceQuote.sharesOut : 0;
            if (sharesOut <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Amount too small. Minimum to get 1 share: $${referencePrice.toFixed(2)}` });
            }
            if (user.balance < amountIn) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Insufficient balance" });
            }

            await PortfolioModel.buyCoin({ user_id, coin_id: coin.cid, amount: sharesOut }, client);
            const updatedUser = await UserModel.updateBalance(user_id, amountIn, client);
            const updatedCoin = await CoinModel.updateCirculatingSupply(coin.cid, sharesOut, client);
            if (!updatedUser || !updatedCoin) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Reference asset trade could not be completed" });
            }

            const transaction = await TransactionsModel.createTransaction({
                user_id,
                coin_id: coin.cid,
                amount: sharesOut,
                price_per_token: referencePrice,
                total_cost: amountIn,
                market_price: referencePrice,
                idempotency_key: idempotencyKey,
                type: "buy"
            }, client);
            await client.query('COMMIT');
            return res.status(200).json({ success: true, transaction, tokensReceived: sharesOut });
        }

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const quote = calculateBuyQuote(tokenReserve, baseReserve, amountIn);
        const tokensOut = quote.tokensOut;

        if (tokensOut < 1) {
            await client.query('ROLLBACK');
            const currentPrice = baseReserve / tokenReserve;
            return res.status(400).json({ error: `Amount too small. Minimum to get 1 token: $${currentPrice.toFixed(6)}` });
        }

        const actualCost = amountIn;
        if (user.balance < actualCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }

        await PortfolioModel.buyCoin({
            user_id,
            coin_id: coin.cid,
            amount: tokensOut,
        }, client);

        const updatedUser = await UserModel.updateBalance(user_id, actualCost, client);
        if (!updatedUser) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const updatedCoin = await CoinModel.buyFromPool(coin.cid, tokensOut, amountIn, client);
        if (!updatedCoin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens in pool" });
        }

        const effectivePrice = quote.executionPrice;
        const marketPrice = getSpotPrice(quote.newTokenReserve, quote.newBaseReserve);

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokensOut,
            price_per_token: effectivePrice,
            total_cost: actualCost,
            market_price: marketPrice,
            idempotency_key: idempotencyKey,
            type: "buy"
        }, client);

        await client.query('COMMIT');
        res.status(200).json({ success: true, transaction, tokensReceived: tokensOut });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: "Internal server error" });
    } finally {
        client.release();
    }
}

export const sellCoin = async (req: RequestWithUser, res: Response) => {
    const client = await pool.connect();
    await client.query('BEGIN');
    try {
        const { symbol } = req.params;
        const { amount: tokenAmount } = req.body;
        const user_id = req.user?.uid;
        const rawIdempotencyKey = req.get("Idempotency-Key");
        const idempotencyKey = rawIdempotencyKey || undefined;

        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (idempotencyKey && (idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey))) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Invalid Idempotency-Key" });
        }

        const tokensIn = parseShares(tokenAmount);
        if (!symbol || tokensIn === null || tokensIn > 1_000_000_000) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Bad request" });
        }

        const coin = await CoinModel.getCoinBySymbolForUpdate(symbol, client);
        if (!coin) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Coin not found" });
        }
        if (coin.pricing_model !== "reference" && !Number.isSafeInteger(tokensIn)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Virtual coins must be sold in whole tokens" });
        }
        const user = await UserModel.findByIdForUpdate(user_id, client);
        if (!user) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "User not found" });
        }

        if (idempotencyKey) {
            const existing = await TransactionsModel.findByIdempotencyKey(user_id, idempotencyKey, client);
            if (existing) {
                if (existing.coin_id !== coin.cid || existing.type !== "sell" || Number(existing.amount) !== tokensIn) {
                    await client.query('ROLLBACK');
                    return res.status(409).json({ error: "Idempotency key was already used for another trade" });
                }
                await client.query('COMMIT');
                return res.status(200).json({ success: true, transaction: existing, baseReceived: existing.total_cost, idempotentReplay: true });
            }
        }

        const portfolio = await PortfolioModel.getPortfolioForUpdate(user_id, coin.cid, client);
        if (!portfolio || portfolio.amount < tokensIn) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens" });
        }

        if (coin.pricing_model === "reference") {
            if (!hasFreshReferenceQuote(coin)) {
                await client.query('ROLLBACK');
                return res.status(503).json({ error: "Reference market quote is unavailable or stale" });
            }
            const referencePrice = parseFloat(String(coin.reference_price || 0));
            const referenceQuote = calculateReferenceSellQuote(tokensIn, referencePrice);
            const baseOut = Number.isFinite(referencePrice) ? referenceQuote.baseOut : 0;
            if (baseOut < 0.01) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Sell amount too small, minimum value is $0.01" });
            }

            const updatedPortfolio = await PortfolioModel.sellCoin({ user_id, coin_id: coin.cid, amount: tokensIn }, client);
            const updatedCoin = await CoinModel.decreaseCirculatingSupply(coin.cid, tokensIn, client);
            if (!updatedPortfolio || !updatedCoin) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Reference asset trade could not be completed" });
            }
            await UserModel.addBalance(user_id, baseOut, client);

            const transaction = await TransactionsModel.createTransaction({
                user_id,
                coin_id: coin.cid,
                amount: tokensIn,
                price_per_token: referencePrice,
                total_cost: baseOut,
                market_price: referencePrice,
                idempotency_key: idempotencyKey,
                type: "sell"
            }, client);
            await client.query('COMMIT');
            return res.status(200).json({ success: true, transaction, baseReceived: baseOut });
        }

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const quote = calculateSellQuote(tokenReserve, baseReserve, tokensIn);
        const baseOut = quote.baseOut;

        if (baseOut < 0.01) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Sell amount too small, minimum value is $0.01" });
        }

        const updatedPortfolio = await PortfolioModel.sellCoin({
            user_id,
            coin_id: coin.cid,
            amount: tokensIn,
        }, client);

        if (!updatedPortfolio) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens" });
        }

        const updatedCoin = await CoinModel.sellToPool(coin.cid, tokensIn, baseOut, client);
        if (!updatedCoin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient base in pool" });
        }

        await UserModel.addBalance(user_id, baseOut, client);

        const effectivePrice = quote.executionPrice;
        const marketPrice = getSpotPrice(quote.newTokenReserve, quote.newBaseReserve);

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokensIn,
            price_per_token: effectivePrice,
            total_cost: baseOut,
            market_price: marketPrice,
            idempotency_key: idempotencyKey,
            type: "sell"
        }, client);

        await client.query('COMMIT');
        res.status(200).json({ success: true, transaction, baseReceived: baseOut });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: "Internal server error" });
    } finally {
        client.release();
    }
}
