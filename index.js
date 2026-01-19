// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = "./users.json";

// Helper to read users
const readUsers = () => {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
};

// Helper to save users
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Nodemailer transporter (SendGrid SMTP)
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD,
  },
});

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const users = readUsers();
  const existing = users.find(u => u.email === email);

  const verifyLink = `${req.protocol}://${req.get("host")}/verify?email=${encodeURIComponent(email)}`;

  if (existing) {
    if (!existing.verified) {
      // Resend verification link
      await transporter.sendMail({
        from: `"SuperNFT" <${process.env.SENDGRID_EMAIL}>`,
        to: email,
        subject: "Verify your SuperNFT account",
        html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
      });
      return res.json({ message: "Verification email resent. Check your inbox!" });
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  // Add new user
  users.push({ email, password, verified: false, balance: 0, nft: [] });
  saveUsers(users);

  // Send verification link
  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.SENDGRID_EMAIL}>`,
    to: email,
    subject: "Verify your SuperNFT account",
    html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
  });

  return res.json({ message: "Signup successful! Check your email for verification link." });
});

// EMAIL VERIFICATION
app.get("/verify", (req, res) => {
  const email = req.query.email;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.send("Invalid verification link.");
  user.verified = true;
  saveUsers(users);
  res.send("Email verified! You can now login.");
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (!user.verified) return res.status(400).json({ message: "Email not verified" });

  res.json({ message: "Login successful", user: { email: user.email, balance: user.balance, nft: user.nft } });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT}`));
