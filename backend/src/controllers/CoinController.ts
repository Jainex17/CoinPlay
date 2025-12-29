import { Request, Response } from "express";
import { CoinModel } from "../models/Coin";
import { RequestWithUser } from "../middleware/checkAuth";
import { UserModel } from "../models/User";
import { TransactionsModel } from "../models/Transactions";
import { PortfolioModel } from "../models/Portfolio";
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