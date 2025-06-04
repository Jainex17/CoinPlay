import { Router } from "express";
import { GoogleLogin, GetUser, Logout } from "../controllers/AuthController";
import { checkAuth } from "../middleware/checkAuth";
const router = Router();

router.post("/google", GoogleLogin);
router.get("/me", checkAuth, GetUser);
router.post("/logout", Logout);

export default router;