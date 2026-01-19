import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = []; // In-memory storage, later use DB

// Create transporter using SendGrid
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});

// Signup route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    if (!existingUser.verified) {
      // Resend verification email
      const verifyLink = `${process.env.FRONTEND_URL}/verify.html?email=${email}`;
      await transporter.sendMail({
        from: `"SuperNFT" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Verify your SuperNFT account",
        html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
      });
      return res.json({ message: "Verification email resent. Check your inbox!" });
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  const newUser = { email, password, verified: false };
  users.push(newUser);

  const verifyLink = `${process.env.FRONTEND_URL}/verify.html?email=${email}`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
    });
    res.json({ message: "Signup successful! Check your email for verification link." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

// Verify route
app.get("/verify", (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).send("Invalid verification link");
  user.verified = true;
  res.send("Email verified! You can now login.");
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (!user.verified) return res.status(400).json({ message: "Email not verified" });
  res.json({ message: "Login successful" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT}`));
