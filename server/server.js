import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js';
import adminRouter from './routes/adminRoutes.js';
import blogRouter from './routes/blogRoutes.js';
import authRouter from "./routes/authRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";


const app = express();
const PORT =process.env.PORT || 3000;

await connectDB()

//Middlewares
app.use(cors());
app.use(express.json())


//Routes
app.get('/',(req,res) => res.send("API is working"))
app.use('/api/admin',adminRouter)
app.use('/api/blog',blogRouter)
app.use("/api/auth", authRouter);   
app.use("/api/notifications", notificationRouter);


app.listen(PORT,() => {
    console.log('Server is running on port'  +  PORT)
})

export default app;



// import express from 'express'
// import 'dotenv/config'
// import cors from 'cors'
// import connectDB from './configs/db.js';
// import adminRouter from './routes/adminRoutes.js';
// import blogRouter from './routes/blogRoutes.js';
// import authRouter from "./routes/authRoutes.js";
// import notificationRouter from "./routes/notificationRoutes.js";

// console.log("1. File started");

// const app = express();
// const PORT = process.env.PORT || 3000;

// console.log("2. Before connectDB()");

// await connectDB();

// console.log("3. After connectDB()");

// //Middlewares
// app.use(cors());
// app.use(express.json())

// console.log("4. Middlewares loaded");

// //Routes
// app.get('/', (req, res) => res.send("API is working"))
// app.use('/api/admin', adminRouter)
// app.use('/api/blog', blogRouter)
// app.use("/api/auth", authRouter);
// app.use("/api/notifications", notificationRouter);

// console.log("5. Routes loaded");

// app.listen(PORT, () => {
//     console.log('6. Server is running on port ' + PORT)
// })

// export default app;