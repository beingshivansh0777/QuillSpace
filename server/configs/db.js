import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    mongoose.connection.on("error", (err) =>
      console.log("Database connection error:", err.message)
    );

    await mongoose.connect(`${process.env.MONGODB_URI}/quillspace`, {
      serverSelectionTimeoutMS: 10000, 
    });
  } catch (error) {
    console.log("Failed to connect to DB:", error.message);
  }
};

export default connectDB;