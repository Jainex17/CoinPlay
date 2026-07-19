import { Router } from "express";
import { GoogleLogin, GetUser, Logout, canClaimCash, ClaimCash } from "../controllers/AuthController";
import { checkAuth } from "../middleware/checkAuth";
import { asyncHandler } from "../middleware/asyncHandler";
const router = Router();

router.post("/google", asyncHandler(GoogleLogin));
router.get("/me", checkAuth, asyncHandler(GetUser));
router.post("/logout", checkAuth, asyncHandler(Logout));

router.get("/claim", checkAuth, asyncHandler(canClaimCash));
router.post("/claim", checkAuth, asyncHandler(ClaimCash));

export default router;
