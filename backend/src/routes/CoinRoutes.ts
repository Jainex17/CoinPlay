import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import { asyncHandler } from "../middleware/asyncHandler";
import { createCoin, getAllCoins, getCoinBySymbol, buyCoin, sellCoin } from "../controllers/CoinController";
const router = Router();

router.get("/", asyncHandler(getAllCoins));
router.get("/:symbol", asyncHandler(getCoinBySymbol));
router.post("/create", checkAuth, asyncHandler(createCoin));

router.post("/buy/:symbol", checkAuth, asyncHandler(buyCoin));
router.post("/sell/:symbol", checkAuth, asyncHandler(sellCoin));

export default router;
