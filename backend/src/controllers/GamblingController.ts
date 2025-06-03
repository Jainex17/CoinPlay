import { Request, Response } from "express";

export const coinflip = (req: Request, res: Response) => {
    res.send('coinflip');
}