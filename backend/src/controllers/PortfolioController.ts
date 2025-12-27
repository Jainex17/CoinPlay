import { BetsModel } from "../models/Bets";
import { PortfolioModel } from "../models/Portfolio";
import { Request, Response } from "express";
import { UserModel } from "../models/User";

export const getUserPortfolio = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await UserModel.findByUsername(username);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
      return;
    }
    const allBets = await BetsModel.findAllBetsByUser(user.uid);

    res.json({
      success: true,
      bets: allBets,
      user: {
        name: user.name,
        picture: user.picture,
        username: user.username,
        balance: user.balance,
        claimed_cash: user.claimed_cash,
        last_claim_date: user.last_claim_date,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error("Error in get portfolio:", error);
    res.status(500).json({ message: "Failed to get portfolio", success: false });
  }
};

export const GetLeaderBoardData = async (req: Request, res: Response) => {
  try {
    const { MostCashPlayerData, MostCashWageredData } = await PortfolioModel.getLeaderboard();
    res.json({
      success: true,
      MostCashPlayerData,
      MostCashWageredData
    });
  } catch (err) {
    console.error("Error in get leaderboard:", err);
    res.status(500).json({ message: "Failed to get leaderboard", success: false });
  }
}