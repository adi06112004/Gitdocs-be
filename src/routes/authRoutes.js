import { Router } from "express";
import {
  login,
  logout,
  getMe,
  forgotPassword,
  resendForgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/resend-forgot-password", resendForgotPassword);
router.post("/reset-password", resetPassword);

export default router;
