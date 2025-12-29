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
        coin.price = coin.initial_price + coin.circulating_supply * coin.price_multiplier;

        coin.marketCap = coin.price * coin.circulating_supply;
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
        const { amount } = req.body;
        const user_id = req.user?.uid;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!symbol || !amount || amount <= 0) {
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

        const price = coin.initial_price + coin.circulating_supply * coin.price_multiplier;
        const totalCost = price * amount;
        if (user.balance < totalCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }
        await PortfolioModel.buyCoin({
            user_id,
            coin_id: coin.cid,
            amount,
        }, client);

        const updatedUser = await UserModel.updateBalance(user_id, totalCost, client);
        if (!updatedUser) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Insufficient balance" });
        }

        await CoinModel.updateCirculatingSupply(coin.cid, amount, client);

        const transaction = await TransactionsModel.createTransaction({
            user_id,
            coin_id: coin.cid,
            amount,
            price_per_token: price,
            total_cost: totalCost,
            type: "buy"
        }, client);

        await client.query('COMMIT');
        res.status(200).json({ transaction });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
}

export const sellCoin = async (req: RequestWithUser, res: Response) => {
}