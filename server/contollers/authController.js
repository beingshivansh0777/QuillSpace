import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";

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
        const user = await User.create({ name, email, password: hashedPassword }); // role defaults to "user"

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
            return res.json({ success: false, message: "Invalid Credentials." });
        }

        const token = generateToken(user);

        // ✅ Send role so frontend knows where to redirect
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
            // Brand new user — create with no password, role defaults to "user"
            user = await User.create({ name, email, googleId });
        } else {
            // mode === "login"
            if (!user) {
                return res.json({
                    success: false,
                    message: "User is not registered. Please register first.",
                });
            }
            // Existing account — link the googleId if it wasn't set yet
            // (e.g. they originally registered with email/password).
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

// GET ME
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// UPDATE PROFILE — username + bio
// PATCH /api/auth/update-profile
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

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        res.json({ success: true, user, message: "Profile updated." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
