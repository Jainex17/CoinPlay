import { Response } from "express";
import { RequestWithUser } from "../middleware/checkAuth";

export const coinflip = (req: RequestWithUser, res: Response) => {
    const user = req.user;
    
    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    
    res.json({
        success: true,
        message: `Your coinflip result is: ${flip}`,
        result: flip,
    });
}