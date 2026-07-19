import { Router } from "express";
import { GetLeaderBoardData, getUserPortfolio } from "../controllers/PortfolioController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/leaderboard", asyncHandler(GetLeaderBoardData));
router.get("/:username", asyncHandler(getUserPortfolio));

export default router;
