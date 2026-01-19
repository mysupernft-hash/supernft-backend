import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// TEMP in-memory DB (later Mongo/Firebase laga sakte ho)
const users = [];

/* ---------------- EMAIL SETUP ---------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("SuperNFT backend running 🚀");
});

/* ---------------- SIGNUP ---------------- */
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  const existing = users.find(u => u.email === email);

  if (existing) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  users.push({
    email,
    password,
    verified: false,
    token
  });

  const verifyLink = `${process.env.BASE_URL}/verify?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `
        <h2>Welcome to SuperNFT 🚀</h2>
        <p>Click below to verify your email:</p>
        <a href="${verifyLink}">${verifyLink}</a>
      `
    });

    res.json({ message: "Signup successful. Check your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email not sent" });
  }
});

/* ---------------- VERIFY ---------------- */
app.get("/verify", (req, res) => {
  const { token } = req.query;

  const user = users.find(u => u.token === token);

  if (!user) {
    return res.send("Invalid or expired verification link");
  }

  user.verified = true;
  user.token = null;

  res.send(`
    <h2>Email Verified ✅</h2>
    <p>Your SuperNFT account is activated.</p>
    <a href="${process.env.FRONTEND_URL}/login.html">Go to Login</a>
  `);
});

/* ---------------- LOGIN ---------------- */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (!user.verified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }

  res.json({ message: "Login successful" });
});

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log("SuperNFT backend running on port", PORT);
});
