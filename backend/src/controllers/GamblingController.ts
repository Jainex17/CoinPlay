import { Response } from "express";
import { RequestWithUser } from "../middleware/checkAuth";
import { BetsModel } from "../models/Bets";
import { randomInt } from 'crypto';

export const coinflip = async (req: RequestWithUser, res: Response) => {
    const userid = req.user?.uid;
    const { userChoice, betAmount } = req.body;

    if (!userid) {
      return res.status(400).json({
            success: false,
            message: 'User choice is required',
        });
    }

    if ((userChoice !== 'heads' && userChoice !== 'tails') ||
        !Number.isSafeInteger(betAmount) || betAmount < 1 || betAmount > 100_000) {
        return res.status(400).json({ success: false, message: 'Invalid bet' });
    }

    const flip = randomInt(2) === 0 ? 'heads' : 'tails';
    const isWin = userChoice === flip;
    const gameResult = isWin ? 'win' : 'lose';

    let newBalance: number;
    try {
        newBalance = await BetsModel.CoinFlipResult(userid, betAmount, gameResult);
    } catch (error) {
        if (error instanceof Error && (error.message === 'Insufficient balance' || error.message === 'User not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Coin flip failed', error);
        return res.status(500).json({ success: false, message: 'Unable to place bet' });
    }

    res.json({
        success: true,
        message: `Coin landed on ${flip}! You ${isWin ? 'won' : 'lost'}!`,
        result: flip,
        isWin: isWin,
        AmountWagered: Number(betAmount),
        newBalance: Number(newBalance),
    });
}
