import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// ✅ SIGNUP API
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // 🚨 TEMP: database skip (testing purpose)

  // ✅ EMAIL CONFIG (GMAIL)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = `https://mysupernft-hash.github.io/login.html`;

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

  res.json({
    success: true,
    message: "Verification email sent"
  });
});

export default router;
