import { Router } from "express";
import { GetLeaderBoardData, getUserPortfolio } from "../controllers/PortfolioController";

const router = Router();

router.get("/leaderboard", GetLeaderBoardData);
router.get("/:username", getUserPortfolio);

export default router;