import { Router } from "express";
import { canClaimCash, ClaimCash, GetPortfolio } from "../controllers/PortfolioController";
import { checkAuth } from "../middleware/checkAuth";

const router = Router();

router.get("/", checkAuth, GetPortfolio);

router.get("/claim", checkAuth, canClaimCash);
router.post("/claim", checkAuth, ClaimCash);

export default router;