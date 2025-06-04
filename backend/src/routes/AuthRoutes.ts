import { Router } from "express";
import { GoogleLogin, GetUser, Logout, ClaimCash, canClaimCash } from "../controllers/AuthController";
import { checkAuth } from "../middleware/checkAuth";

const router = Router();

router.post("/google", GoogleLogin);
router.get("/me", checkAuth, GetUser);
router.post("/logout", Logout);

router.get("/claim", checkAuth, canClaimCash);
router.post("/claim", checkAuth, ClaimCash);

export default router;