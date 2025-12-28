import { Router } from "express";
import GamblingRoutes from "./GamblingRoutes";
import AuthRoutes from "./AuthRoutes";
import PortfolioRoutes from "./PortfolioRoutes";
import CoinRoutes from "./CoinRoutes";

const router = Router();

router.use('/gambling', GamblingRoutes);
router.use('/auth', AuthRoutes);
router.use('/portfolio', PortfolioRoutes);
router.use('/coin', CoinRoutes);

router.get('/health', async (req, res) => {
    try {
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

export default router;