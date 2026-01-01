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
        const initialPrice = parseFloat(coin.initial_price);
        const circulatingSupply = parseFloat(coin.circulating_supply);
        const priceMultiplier = parseFloat(coin.price_multiplier);
        coin.price = initialPrice + circulatingSupply * priceMultiplier;

        coin.marketCap = coin.price * circulatingSupply;
        coin.volume24h = await TransactionsModel.getVolume24hByCoin(coin.cid);
        coin.holders = await PortfolioModel.getHoldersByCoinId(coin.cid);

        const history = await TransactionsModel.getPriceHistoryByCoin(coin.cid);
        if (history.length === 0) {
            history.push({
                price_per_token: coin.initial_price,
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

export const createCoin = async (req: RequestWithUser, res: Response) => {
    try {
        const { name, symbol } = req.body;
        const circulating_supply = 0;
        const creator_id = req.user?.uid;

        if (!creator_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!name || !symbol) {
            return res.status(400).json({ error: "Bad request" });
        }

        const coin = await CoinModel.createCoin({ name, symbol, creator_id, circulating_supply });
        res.status(201).json({ coin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
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

        const initialPrice = parseFloat(coin.initial_price);
        const circulatingSupply = parseFloat(coin.circulating_supply);
        const priceMultiplier = parseFloat(coin.price_multiplier);
        const price = initialPrice + circulatingSupply * priceMultiplier;
        const tokens = Math.floor(usdAmount / price);

        if (tokens < 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Minimum purchase is $${price.toFixed(2)} for 1 token` });
        }

        const actualCost = Math.floor(tokens * price);

        if (user.balance < actualCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }

        await PortfolioModel.buyCoin({
            user_id,
            coin_id: coin.cid,
            amount: tokens,
        }, client);

        const updatedUser = await UserModel.updateBalance(user_id, actualCost, client);
        if (!updatedUser) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }

        await CoinModel.updateCirculatingSupply(coin.cid, tokens, client);

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokens,
            price_per_token: price,
            total_cost: actualCost,
            type: "buy"
        }, client);

        await client.query('COMMIT');
        res.status(200).json({ success: true, transaction });
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

        const tokens = Math.floor(tokenAmount);
        if (!symbol || !tokens || tokens < 1) {
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
        if (!portfolio || portfolio.amount < tokens) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens" });
        }

        const updatedPortfolio = await PortfolioModel.sellCoin({
            user_id,
            coin_id: coin.cid,
            amount: tokens,
        }, client);

        if (!updatedPortfolio) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient tokens" });
        }

        const updatedCoin = await CoinModel.decreaseCirculatingSupply(coin.cid, tokens, client);
        if (!updatedCoin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Failed to update circulating supply" });
        }

        const initialPrice = parseFloat(updatedCoin.initial_price);
        const circulatingSupply = parseFloat(updatedCoin.circulating_supply);
        const priceMultiplier = parseFloat(updatedCoin.price_multiplier);
        const price = initialPrice + circulatingSupply * priceMultiplier;
        const usdValue = Math.floor(tokens * price);

        if (usdValue < 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Sell amount too small, minimum value is $1" });
        }

        await UserModel.addBalance(user_id, usdValue, client);

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount: tokens,
            price_per_token: price,
            total_cost: usdValue,
            type: "sell"
        }, client);

        await client.query('COMMIT');
        res.status(200).json({ success: true, transaction });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: "Internal server error" });
    } finally {
        client.release();
    }
}