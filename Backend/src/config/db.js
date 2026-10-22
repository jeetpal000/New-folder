import mongoose from "mongoose";
import "dotenv/config";

export const connectDatabase = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not defined");
    }
    await mongoose.connect(url);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};