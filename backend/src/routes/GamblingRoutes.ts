import { Router } from "express";
import { coinflip } from "../controllers/GamblingController";
import { checkAuth } from "../middleware/checkAuth";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post('/coinflip', checkAuth, asyncHandler(coinflip));

export default router;
