import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      logger.info("Database Connected")
    );
    mongoose.connection.on("error", (err) =>
      logger.error({ err }, "Database connection error")
    );

    await mongoose.connect(`${process.env.MONGODB_URI}/quillspace`, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to DB");
  }
};

export default connectDB;