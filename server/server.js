import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import adminRouter from "./routes/adminRoutes.js";
import blogRouter from "./routes/blogRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();

// Middlewares

// ✅ CORS setup for your frontend
const allowedOrigins = [
  "https://quill-space-six.vercel.app", // deployed frontend
  "http://localhost:5173", // local dev (vite)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like mobile apps or curl
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // if using auth headers or cookies
  })
);

app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API is working"));
app.use("/api/admin", adminRouter);
app.use("/api/blog", blogRouter);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

export default app;
