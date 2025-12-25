import { Router } from "express";
import { canClaimCash, ClaimCash, getUserPortfolio, GetLeaderBoardData, getPortfolio } from "../controllers/PortfolioController";
import { checkAuth } from "../middleware/checkAuth";

const router = Router();

router.get("/", checkAuth, getUserPortfolio);

router.get("/claim", checkAuth, canClaimCash);
router.post("/claim", checkAuth, ClaimCash);

router.get("/leaderboard", GetLeaderBoardData);

router.get("/:username", getPortfolio);

export default router;