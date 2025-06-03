import { Router } from "express";
import { coinflip } from "../controllers/GamblingController";
import { checkAuth } from "../middleware/checkAuth";

const router = Router();

// Protected route - requires authentication
router.get('/coinflip', checkAuth, coinflip);


export default router;