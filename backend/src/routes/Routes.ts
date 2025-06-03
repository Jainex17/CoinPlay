import { Router } from "express";
import GamblingRoutes from "./GamblingRoutes";
import AuthRoutes from "./AuthRoutes";

const router = Router();

router.use('/gambling', GamblingRoutes);
router.use('/auth', AuthRoutes);

export default router;
