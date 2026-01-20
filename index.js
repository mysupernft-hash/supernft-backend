import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// TEMP in-memory users
const users = [];

// SIGNUP API
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already registered" });
  }

  // Save user
  users.push({ name, email, password, verified: false });

  // Nodemailer config
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = `https://mysupernft-hash.github.io/login.html`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `<h2>Welcome to SuperNFT</h2>
             <p>Click below to verify your account:</p>
             <a href="${verifyLink}">Verify Account</a>`
    });

    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

// Optional GET route
app.get("/", (req, res) => {
  res.send("SuperNFT backend running. Use POST /signup to register.");
});

app.listen(PORT, () => {
  console.log(`SuperNFT backend running on port ${PORT}`);
});
