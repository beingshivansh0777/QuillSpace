import express from "express";
import { registerUser, loginUser, getMe, googleAuth, updateProfile, getPublicProfile } from "../contollers/authController.js";
import auth from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/google", googleAuth);
authRouter.get("/me", auth, getMe);
authRouter.patch("/update-profile", auth, updateProfile);
authRouter.get("/user/:username", getPublicProfile);   // public — anyone can view

export default authRouter;
 