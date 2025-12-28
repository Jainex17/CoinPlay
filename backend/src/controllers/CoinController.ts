import { Request, Response } from "express";
import { CoinModel } from "../models/Coin";
import { RequestWithUser } from "../middleware/checkAuth";

export const getAllCoins = async (req: Request, res: Response) => {
    try {
        const coins = await CoinModel.getAllCoins();
        res.status(200).json({ coins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const createCoin = async (req: RequestWithUser, res: Response) => {
    try {
        const { name, symbol, circulating_supply } = req.body;
        const creator_id = req.user?.uid;

        if (!creator_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!name || !symbol || !circulating_supply) {
            return res.status(400).json({ error: "Bad request" });
        }

        const coin = await CoinModel.createCoin({ name, symbol, creator_id, circulating_supply });
        res.status(201).json({ coin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}