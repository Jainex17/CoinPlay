import { Response } from "express";
import { RequestWithUser } from "../middleware/checkAuth";
import { PortfolioModel } from "../models/Portfolio";

export const coinflip = async (req: RequestWithUser, res: Response) => {
    const userid = req.user.uid;
    const { userChoice, betAmount } = req.body;

    if (!userChoice) {
        return res.status(400).json({
            success: false,
            message: 'User choice is required',
        });
    }

    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = userChoice === flip;
    const gameResult = isWin ? 'win' : 'lose';

    const newBalance = await PortfolioModel.CoinFlipResult(userid, Number(betAmount), gameResult);

    res.json({
        success: true,
        message: `Coin landed on ${flip}! You ${isWin ? 'won' : 'lost'}!`,
        result: flip,
        isWin: isWin,
        AmountWagered: Number(betAmount),
        newBalance: Number(newBalance),
    });
}