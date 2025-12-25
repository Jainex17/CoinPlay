import { RequestWithUser } from "../middleware/checkAuth";
import { BetsModel } from "../models/Bets";
import { PortfolioModel } from "../models/Portfolio";
import { Request, Response } from "express";

export const canClaimCash = async (req: RequestWithUser, res: Response) => {
  const userid = req.user?.uid;

  if (!userid) {
    res.status(401).json({ message: "Unauthorized", success: false });
    return;
  }

  const portfolio = await PortfolioModel.findById(userid);

  if (
    portfolio &&
    portfolio.last_claim_date < new Date(Date.now() - 1000 * 60 * 60 * 12)
  ) {
    res.json({ canClaim: true, last_claim_date: portfolio.last_claim_date });
    return;
  } else {
    res.json({ canClaim: false, last_claim_date: portfolio?.last_claim_date });
    return;
  }
};

export const ClaimCash = async (req: RequestWithUser, res: Response) => {
  try {
    const { currentTime } = req.body; // new Date().toISOString() user system time
    const userid = req.user?.uid;
    const cash = 1500;

    if (!userid) {
      res.status(401).json({ message: "Unauthorized", success: false });
      return;
    }

    let portfolio = await PortfolioModel.findById(userid);
    if (!portfolio) {
      portfolio = await PortfolioModel.findOrCreate(userid);
    }

    const lastClaimTime = new Date(portfolio.last_claim_date);
    const currentTimeDate = new Date(currentTime);
    const hoursSinceLastClaim =
      (currentTimeDate.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
    const CURRENT_TIMESTAMP = new Date(currentTime);

    if (hoursSinceLastClaim >= 12) {
      await PortfolioModel.updateClaim(userid, cash, CURRENT_TIMESTAMP);
    } else {
      res
        .status(400)
        .json({ message: "You can only claim cash every 12 hours" });
      return;
    }

    res.json({
      message: "Cash claimed successfully",
      success: true,
      cash: cash,
    });
  } catch (error) {
    console.error("Error in claim cash:", error);
    res.status(500).json({ message: "Failed to claim cash" });
  }
};

export const getUserPortfolio = async (req: RequestWithUser, res: Response) => {
  try {
    const userid = req.user?.uid;

    if (!userid) {
      res.status(401).json({ message: "Unauthorized", success: false });
      return;
    }
    const portfolio = await PortfolioModel.findById(userid);
    if (!portfolio) {
      res.status(404).json({ message: "Portfolio not found", success: false });
      return;
    }

    const allBets = await BetsModel.findAllBetsByUser(userid);

    res.json({
      success: true,
      cash: portfolio.cash,
      bets: allBets,
      claimed_cash: portfolio.claimed_cash,
      last_claim_date: portfolio.last_claim_date,
    });
  } catch (error) {
    console.error("Error in get portfolio:", error);
    res.status(500).json({ message: "Failed to get portfolio", success: false });
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const portfolio = await PortfolioModel.findByUsername(username);
    if (!portfolio) {
      res.status(404).json({ message: "Portfolio not found", success: false });
      return;
    }
    const allBets = await BetsModel.findAllBetsByUser(portfolio.uid);

    res.json({
      success: true,
      cash: portfolio.cash,
      bets: allBets,
      claimed_cash: portfolio.claimed_cash,
      last_claim_date: portfolio.last_claim_date,
      user: {
        name: portfolio.name,
        picture: portfolio.picture,
        username: portfolio.username,
        created_at: portfolio.created_at
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