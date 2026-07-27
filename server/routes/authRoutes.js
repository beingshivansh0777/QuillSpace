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
  deleteAccount,
} from "../contollers/authController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/schemas.js";

const authRouter = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Shivansh Mishra" }
 *               email: { type: string, example: "you@example.com" }
 *               password: { type: string, example: "yourpassword" }
 *     responses:
 *       200:
 *         description: Registration successful, returns a JWT
 */
authRouter.post("/register", authLimiter, validate(registerSchema), registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns a JWT
 */
authRouter.post("/login", authLimiter, validate(loginSchema), loginUser);

authRouter.post("/google", googleAuth);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the logged-in user's own profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's profile
 */
authRouter.get("/me", auth, getMe);

authRouter.patch("/update-profile", upload.single("avatar"), auth, updateProfile);
authRouter.patch("/change-password", auth, validate(changePasswordSchema), changePassword);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: A generic confirmation, regardless of whether the email exists
 */
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);

authRouter.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);
authRouter.delete("/delete-account", auth, deleteAccount);

/**
 * @openapi
 * /api/auth/user/{username}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public profile (name, username, bio, avatar only)
 */
authRouter.get("/user/:username", getPublicProfile);

export default authRouter;