const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("✅ SuperNFT Backend is Running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// IMPORTANT: Render PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
