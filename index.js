import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("SuperNFT Backend Running 🚀");
});

// SIGNUP API
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = "https://mysupernft-hash.github.io/login.html";

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

  res.json({ success: true, message: "Verification email sent" });
});

// IMPORTANT FOR VERCEL
export default app;
