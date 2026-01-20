import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Load EMAIL_USER & EMAIL_PASS from .env

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON body

// Temporary in-memory "database"
let users = [];

// ✅ SIGNUP API
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    if (!existingUser.verified) {
      return res.status(400).json({ message: "Email already registered, please verify." });
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  // Add user to "database"
  const newUser = { name, email, password, verified: false };
  users.push(newUser);

  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = `https://mysupernft-hash.github.io/verify-check.html?email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `
        <h2>Welcome to SuperNFT</h2>
        <p>Click below to verify your account:</p>
        <a href="${verifyLink}">Verify Account</a>
      `
    });

    return res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }
});

// ✅ LOGIN API
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (!user.verified) return res.status(400).json({ message: "Please verify your email first" });

  return res.json({ success: true, message: `Welcome ${user.name}` });
});

// ✅ Email verification route
app.get("/verify", (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).send("User not found");

  user.verified = true;
  return res.send("Email verified successfully! You can now login.");
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT}`));
