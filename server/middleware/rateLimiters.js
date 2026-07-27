import rateLimit from "express-rate-limit";

// Baseline — applies to every request. Generous, since normal browsing
// (loading the feed, viewing posts, etc.) shouldn't ever come close to this.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again shortly.",
  },
});

// Strict — for login/register/forgot-password. These are classic
// brute-force targets, so the limit here is much tighter than the baseline.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
});

// Strict — for the AI content-generation endpoint. This one directly costs
// money per call (Gemini API), so it needs its own tight ceiling regardless
// of how generous the general limiter is.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI generation limit reached. Please try again in a few minutes.",
  },
});
