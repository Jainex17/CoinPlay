import { Router } from "express";
import GamblingRoutes from "./GamblingRoutes";
import AuthRoutes from "./AuthRoutes";
import PortfolioRoutes from "./PortfolioRoutes";

const router = Router();

router.use('/gambling', GamblingRoutes);
router.use('/auth', AuthRoutes);
router.use('/portfolio', PortfolioRoutes);

export default router;
