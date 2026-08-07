import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cron from 'node-cron'
import helmet from 'helmet'
import compression from 'compression'
import mongoose from 'mongoose'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import { createServer } from 'http'
import swaggerSpec from './configs/swagger.js';
import connectDB from './configs/db.js';
import logger from './configs/logger.js';
import { initSocket } from './configs/socket.js';
import adminRouter from './routes/adminRoutes.js';
import blogRouter from './routes/blogRoutes.js';
import authRouter from "./routes/authRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import newsletterRouter from "./routes/newsLetterRoutes.js";
import ticketRouter from "./routes/ticketRoutes.js";
import publishScheduledBlogs from "./jobs/publishScheduled.js";
import followRouter from "./routes/followRoutes.js";
import { generalLimiter } from "./middleware/rateLimiters.js";


const app = express();
const PORT =process.env.PORT || 3000;

await connectDB()

//Security & performance middleware — applied early, before routes
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json())

// Structured request logging — every request gets a log line with method,
// path, status code, and response time, automatically.
app.use(pinoHttp({ logger }));

// Health check — deliberately placed BEFORE the rate limiter, so uptime
// monitors / load balancers never get throttled while checking if the app
// is alive.
app.get('/api/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: dbConnected ? "ok" : "degraded",
        uptime: process.uptime(),
        database: dbConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});

// General rate limit — applies to everything below this line
app.use(generalLimiter);

// Interactive API docs — http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Routes
app.get('/',(req,res) => res.send("API is working"))
app.use('/api/admin',adminRouter)
app.use('/api/reports', reportRouter)
app.use('/api/blog',blogRouter)
app.use("/api/auth", authRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/tickets", ticketRouter);
app.use('/api/follow', followRouter)   

// Checks every minute for scheduled blog posts whose time has arrived,
// and publishes them automatically. Errors are handled and logged inside
// publishScheduledBlogs itself, so this call never needs its own try/catch.
cron.schedule("* * * * *", publishScheduledBlogs);

// Express alone can't host WebSocket connections — Socket.io needs the raw
// http.Server instance underneath it. createServer(app) wraps the Express
// app in exactly that, and both HTTP requests and socket connections now
// share the same server/port, just handled by different libraries.
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
})

export default app;