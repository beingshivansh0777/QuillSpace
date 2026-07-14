import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ✅ Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ success: false, message: "Not authorized. Please login." });
    }

    const token = authHeader.split(" ")[1]; // ✅ Extract token from "Bearer <token>"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ { id, email, role } now available in all routes
        next();
    } catch (error) {
        res.json({ success: false, message: "Invalid or expired token. Please login again." });
    }
};

export default auth;