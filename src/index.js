import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("Auth Service Running 🚀"));

connectDB();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Auth service running on port ${PORT}`));
