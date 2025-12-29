import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import { createCoin, getAllCoins, getCoinBySymbol } from "../controllers/CoinController";
const router = Router();

router.get("/", getAllCoins);
router.get("/:symbol", getCoinBySymbol);
router.post("/create", checkAuth, createCoin);

export default router;