import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ success: false, message: "Not authorized. Please login." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Only admins can pass
        if (decoded.role !== "admin") {
            return res.json({ success: false, message: "Access denied. Admins only." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.json({ success: false, message: "Invalid or expired token." });
    }
};

export default adminAuth;