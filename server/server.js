import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js';
import adminRouter from './routes/adminRoutes.js';
import blogRouter from './routes/blogRoutes.js';

const app = express();

await connectDB()

// ✅ Middlewares
const allowedOrigins = [
  "http://localhost:5173",               // local Vite frontend
  "https://quill-space-sand.vercel.app/"     // apna actual Vercel frontend URL daal yaha
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json())

// ✅ Routes
app.get('/', (req, res) => res.send("API is working"))
app.use('/api/admin', adminRouter)
app.use('/api/blog', blogRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT)
})

export default app;
