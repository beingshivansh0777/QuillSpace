import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

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