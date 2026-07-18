import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import User from "./models/userModel.js";

const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const createAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from .env");
        }
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing from .env");
        }

        await mongoose.connect(`${process.env.MONGODB_URI}/quillspace`);
        console.log("Connected to database.");

        const existingUser = await User.findOne({ email: ADMIN_EMAIL });

        if (existingUser) {
            if (existingUser.role === "admin") {
                console.log(`"${ADMIN_EMAIL}" is already an admin. Nothing to do.`);
            } else {
                existingUser.role = "admin";
                await existingUser.save();
                console.log(`Existing user "${ADMIN_EMAIL}" has been promoted to admin.`);
            }
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: "admin",
            });
            console.log(`Admin user created: ${ADMIN_EMAIL}`);
        }

        await mongoose.disconnect();
        console.log("Done. You can now log in with this account.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exit(1);
    }
};

createAdmin();