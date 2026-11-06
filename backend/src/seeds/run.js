// Chạy riêng: npm run seed
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../libs/db.js";
import { seedDefaultAccounts } from "./default-accounts.seed.js";

dotenv.config();

try {
  await connectDB();
  await seedDefaultAccounts();
} catch (error) {
  console.error("[Seed] Lỗi:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
