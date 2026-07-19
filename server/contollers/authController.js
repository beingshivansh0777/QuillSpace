import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import imagekit from "../configs/imageKit.js";
import resend from "../configs/resend.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists. Click to login.",
                redirectToLogin: true
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const token = generateToken(user);
        res.json({ success: true, token, message: "Registration successful!" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// LOGIN — works for both users and admins
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found. Please register." });
        }

        if (!user.password) {
            return res.json({
                success: false,
                message: "This account uses Google Sign-In. Please continue with Google."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Incorrect password." });
        }

        const token = generateToken(user);

        res.json({ success: true, token, role: user.role });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GOOGLE LOGIN / REGISTER
// body: { credential, mode }  -> mode is "login" or "register", matching the tab the user was on
export const googleAuth = async (req, res) => {
    try {
        const { credential, mode } = req.body;

        if (!credential) {
            return res.json({ success: false, message: "Missing Google credential." });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (mode === "register") {
            if (user) {
                return res.json({
                    success: false,
                    message: "User already exists. Click to login.",
                    redirectToLogin: true,
                });
            }
            user = await User.create({ name, email, googleId });
        } else {
            // mode === "login"
            if (!user) {
                return res.json({
                    success: false,
                    message: "User is not registered. Please register first.",
                });
            }
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        const token = generateToken(user);
        res.json({ success: true, token, role: user.role, message: "Signed in with Google!" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// PUBLIC PROFILE — anyone can view a user's name, username, and bio
// GET /api/auth/user/:username
export const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username }).select("name username bio avatar createdAt");
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GET ME
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        const { password, ...safeUser } = user.toObject();
        res.json({ success: true, user: { ...safeUser, hasPassword: !!password } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/auth/forgot-password
// body: { email }
// Always responds with the same generic message, whether or not the email
// exists — this prevents attackers from using this endpoint to discover
// which emails are registered.
export const forgotPassword = async (req, res) => {
    const genericMessage = "If an account exists for that email, a reset link has been sent.";

    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: true, message: genericMessage });
        }

        // Raw token goes in the email link; only the hash is stored in the DB —
        // same principle as passwords, so a DB leak alone can't be used to reset accounts.
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

        await resend.emails.send({
            from: "QuillSpace <onboarding@resend.dev>",
            to: user.email,
            subject: "Reset your QuillSpace password",
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #241F2E;">Reset your password</h2>
                    <p style="color: #444;">We received a request to reset the password for your QuillSpace account.</p>
                    <p style="margin: 24px 0;">
                        <a href="${resetUrl}" style="background: #5044E5; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #888; font-size: 13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        });

        res.json({ success: true, message: genericMessage });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// POST /api/auth/reset-password/:token
// body: { newPassword }
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters." });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.json({ success: false, message: "This reset link is invalid or has expired." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// body: { currentPassword?, newPassword }
// currentPassword is required only if the account already has a password set —
// Google-only accounts can set their first password without one.
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.json({ success: false, message: "New password must be at least 6 characters." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        if (user.password) {
            if (!currentPassword) {
                return res.json({ success: false, message: "Please enter your current password." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.json({ success: false, message: "Current password is incorrect." });
            }
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// PATCH /api/auth/update-profile  (multipart/form-data)
export const updateProfile = async (req, res) => {
    try {
        const { username, bio } = req.body;

        if (username) {
            const trimmed = username.trim();

            if (trimmed.length < 3) {
                return res.json({ success: false, message: "Username must be at least 3 characters." });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
                return res.json({ success: false, message: "Username can only contain letters, numbers, and underscores." });
            }

            const existing = await User.findOne({ username: trimmed, _id: { $ne: req.user.id } });
            if (existing) {
                return res.json({ success: false, message: "That username is already taken." });
            }
        }

        if (bio && bio.length > 160) {
            return res.json({ success: false, message: "Bio must be 160 characters or fewer." });
        }

        const updates = {};
        if (username !== undefined) updates.username = username.trim();
        if (bio !== undefined) updates.bio = bio;

        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: req.file.originalname,
                folder: "/avatars",
            });
            updates.avatar = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { height: "300", width: "300", focus: "auto" },
                ],
            });
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        res.json({ success: true, user, message: "Profile updated." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};