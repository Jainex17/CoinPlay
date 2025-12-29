import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import { createCoin, getAllCoins, getCoinBySymbol, buyCoin, sellCoin } from "../controllers/CoinController";
const router = Router();

router.get("/", getAllCoins);
router.get("/:symbol", getCoinBySymbol);
router.post("/create", checkAuth, createCoin);

router.post("/buy/:symbol", checkAuth, buyCoin);
router.post("/sell/:symbol", checkAuth, sellCoin);

export default router;