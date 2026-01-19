import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const users = []; // TEMP DB (free)

// ---------- EMAIL ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ---------- SIGNUP ----------
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) return res.json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });

  users.push({
    email,
    password: hashed,
    verified: false,
    token
  });

  const verifyLink = `https://supernft-backend.onrender.com/verify?token=${token}`;

  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your SuperNFT account",
    html: `
      <h2>Welcome to SuperNFT</h2>
      <p>Click below to verify your account</p>
      <a href="${verifyLink}">Verify Email</a>
    `
  });

  res.json({ message: "Verification link sent to your email" });
});

// ---------- VERIFY ----------
app.get("/verify", (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u.email === decoded.email);

    if (!user) return res.send("Invalid link");

    user.verified = true;
    res.send("✅ Email verified successfully. You can login now.");
  } catch {
    res.send("❌ Verification link expired");
  }
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (!user.verified)
    return res.status(403).json({ message: "Please verify your email first" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login successful" });
});

// ---------- START ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("✅ Backend running on port", PORT);
});
