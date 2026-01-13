import { Request, Response } from "express";
import { CoinModel } from "../models/Coin";
import { RequestWithUser } from "../middleware/checkAuth";
import { UserModel } from "../models/User";
import { TransactionsModel } from "../models/Transactions";
import { PortfolioModel } from "../models/Portfolio";
import { pool } from "../config/db";
export const getAllCoins = async (req: Request, res: Response) => {
    try {
        const coins = await CoinModel.getAllCoins();

        const result = await Promise.all(coins.map(async (coin: any) => {
            const creator = await UserModel.findById(coin.creator_id);
            const { cid, ...coinData } = coin;

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

        const creator = await UserModel.findById(coin.creator_id);

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const totalSupply = parseFloat(coin.total_supply);

        coin.price = baseReserve / tokenReserve;
        coin.tokenReserve = tokenReserve;
        coin.baseReserve = baseReserve;
        coin.totalLiquidity = baseReserve * 2;

        const circulatingSupply = totalSupply - tokenReserve;
        coin.circulatingSupply = circulatingSupply;
        coin.marketCap = coin.price * totalSupply;

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
                price_per_token: baseReserve / tokenReserve,
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
        if (!name || !symbol) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Name and symbol are required" });
        }

        const symbolRegex = /^[A-Za-z0-9]{3,6}$/;
        if (!symbolRegex.test(symbol)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Symbol must be 3-6 alphanumeric characters" });
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

        const coin = await CoinModel.createCoin({
            name,
            symbol,
            creator_id,
            token_reserve: INITIAL_TOKEN_RESERVE,
            base_reserve: INITIAL_BASE_RESERVE,
        }, client);

        await client.query('COMMIT');
        res.status(201).json({ coin });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
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

        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!symbol || !usdAmount || usdAmount <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Bad request" });
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

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const k = tokenReserve * baseReserve;

        const amountIn = parseFloat(usdAmount);
        const newBaseReserve = baseReserve + amountIn;
        const newTokenReserve = k / newBaseReserve;
        const tokensOut = Math.floor(tokenReserve - newTokenReserve);

        if (tokensOut < 1) {
            await client.query('ROLLBACK');
            const currentPrice = baseReserve / tokenReserve;
            return res.status(400).json({ error: `Amount too small. Minimum to get 1 token: $${currentPrice.toFixed(6)}` });
        }

        const actualCost = Math.floor(amountIn);
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

        const effectivePrice = amountIn / tokensOut;

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokensOut,
            price_per_token: effectivePrice,
            total_cost: actualCost,
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

        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: "Unauthorized" });
        }

        const tokensIn = Math.floor(tokenAmount);
        if (!symbol || !tokensIn || tokensIn < 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Bad request" });
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

        const portfolio = await PortfolioModel.getPortfolioForUpdate(user_id, coin.cid, client);
        if (!portfolio || portfolio.amount < tokensIn) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens" });
        }

        const tokenReserve = parseFloat(coin.token_reserve);
        const baseReserve = parseFloat(coin.base_reserve);
        const k = tokenReserve * baseReserve;

        const newTokenReserve = tokenReserve + tokensIn;
        const newBaseReserve = k / newTokenReserve;
        const baseOut = Math.floor(baseReserve - newBaseReserve);

        if (baseOut < 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Sell amount too small, minimum value is $1" });
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

        const effectivePrice = baseOut / tokensIn;

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokensIn,
            price_per_token: effectivePrice,
            total_cost: baseOut,
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