import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cron from 'node-cron'
import connectDB from './configs/db.js';
import adminRouter from './routes/adminRoutes.js';
import blogRouter from './routes/blogRoutes.js';
import authRouter from "./routes/authRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import newsletterRouter from "./routes/newsLetterRoutes.js";
import ticketRouter from "./routes/ticketRoutes.js";
import publishScheduledBlogs from "./jobs/publishScheduled.js";

const app = express();
const PORT =process.env.PORT || 3000;

await connectDB()

//Middlewares
app.use(cors());
app.use(express.json())

//Routes
app.get('/',(req,res) => res.send("API is working"))
app.use('/api/admin',adminRouter)
app.use('/api/reports', reportRouter)       // POST / requires login; GET/dismiss/delete-content require admin (enforced per-route inside reportRoutes.js)
app.use('/api/blog',blogRouter)
app.use("/api/auth", authRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/tickets", ticketRouter);

// Checks every minute for scheduled blog posts whose time has arrived,
// and publishes them automatically.
cron.schedule("* * * * *", publishScheduledBlogs);

app.listen(PORT,() => {
    console.log('Server is running on port'  +  PORT)
})

export default app;