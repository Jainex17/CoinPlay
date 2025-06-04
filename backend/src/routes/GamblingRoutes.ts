import { Router } from "express";
import { coinflip } from "../controllers/GamblingController";
import { checkAuth } from "../middleware/checkAuth";

const router = Router();

router.post('/coinflip', checkAuth, coinflip);

export default router;