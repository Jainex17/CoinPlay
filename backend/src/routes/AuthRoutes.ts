import { Router } from "express";
import { GoogleLogin, GetUser, Logout, canClaimCash, ClaimCash } from "../controllers/AuthController";
import { checkAuth } from "../middleware/checkAuth";
const router = Router();

router.post("/google", GoogleLogin);
router.get("/me", checkAuth, GetUser);
router.post("/logout", checkAuth, Logout);

router.get("/claim", checkAuth, canClaimCash);
router.post("/claim", checkAuth, ClaimCash);

export default router;