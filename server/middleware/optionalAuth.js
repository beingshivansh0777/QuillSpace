import jwt from "jsonwebtoken";

// Unlike `auth`, this never blocks the request. If a valid token is present,
// req.user gets set (so the route can dedupe by logged-in user). If there's
// no token, or it's invalid/expired, the request just proceeds anonymously.
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // invalid/expired token — just treat as anonymous, don't error out
    }

    next();
};

export default optionalAuth;