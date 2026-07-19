import { Router } from "express";
import GamblingRoutes from "./GamblingRoutes";
import AuthRoutes from "./AuthRoutes";
import PortfolioRoutes from "./PortfolioRoutes";
import CoinRoutes from "./CoinRoutes";
import { pool } from "../config/db";

const router = Router();

router.use('/gambling', GamblingRoutes);
router.use('/auth', AuthRoutes);
router.use('/portfolio', PortfolioRoutes);
router.use('/coin', CoinRoutes);

router.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'ok', requestId: res.locals.requestId });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ status: 'degraded', database: 'error', requestId: res.locals.requestId });
    }
})

export default router;
