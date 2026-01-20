import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { webAnalytics } from "@vercel/analytics/express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Enable Vercel Web Analytics
app.use(webAnalytics());

// Temp in-memory users database
const users = [];

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err, success) => {
  if (err) console.error("SMTP Error:", err);
  else console.log("Gmail SMTP ready ✅");
});

// ✅ Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (!existingUser.verified) {
      // Resend verification email
      const verifyLink = `https://mysupernft-hash.github.io/verify-check.html`;
      try {
        await transporter.sendMail({
          from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Verify your SuperNFT account",
          html: `<h2>Welcome back to SuperNFT</h2>
                 <p>Click the button to verify your account:</p>
                 <a href="${verifyLink}" style="padding:10px 20px;background:#38bdf8;color:#020617;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Account</a>`
        });
        return res.json({ message: "Verification email resent. Check your inbox!" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to send verification email" });
      }
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  // Add new user (not verified)
  users.push({ name, email, password, verified: false });

  // Send verification email
  const verifyLink = `https://mysupernft-hash.github.io/verify-check.html`;
  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `<h2>Welcome to SuperNFT</h2>
             <p>Click the button to verify your account:</p>
             <a href="${verifyLink}" style="padding:10px 20px;background:#38bdf8;color:#020617;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Account</a>`
    });
    return res.json({ message: "Verification email sent. Check your inbox!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send verification email" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT} ✅`));
