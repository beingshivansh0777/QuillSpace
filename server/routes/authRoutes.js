import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  googleAuth,
  updateProfile,
  getPublicProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../contollers/authController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/google", googleAuth);
authRouter.get("/me", auth, getMe);
authRouter.patch("/update-profile", upload.single("avatar"), auth, updateProfile);
authRouter.patch("/change-password", auth, changePassword);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);
authRouter.get("/user/:username", getPublicProfile);

export default authRouter;