import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import { createCoin, getAllCoins } from "../controllers/CoinController";
const router = Router();

router.get("/", getAllCoins);
router.post("/create", checkAuth, createCoin);

export default router;