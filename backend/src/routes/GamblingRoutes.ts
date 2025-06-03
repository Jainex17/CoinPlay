import { Router } from "express";
import { coinflip } from "../controllers/GamblingController";

const router = Router();

router.get('/coinflip', coinflip);


export default router;