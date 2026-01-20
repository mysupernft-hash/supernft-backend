import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// ✅ MUST
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("SuperNFT backend running 🚀");
});

// ✅ AUTH ROUTE
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("SuperNFT backend running on port " + PORT);
});
