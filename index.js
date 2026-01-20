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

// In-memory "database" (replace with real DB later)
const users = [];

// SIGNUP POST API
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // Add user as unverified
  const user = { email, password, verified: false };
  users.push(user);

  // Send verification email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = `${process.env.FRONTEND_URL}/verify.html?email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `<h2>Welcome to SuperNFT</h2>
             <p>Click the link below to verify your account:</p>
             <a href="${verifyLink}">Verify Account</a>`
    });
    res.json({ message: "Verification email sent! Check your inbox." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

// VERIFY GET API
app.get("/verify", (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).send("User not found");
  if (user.verified) return res.send("User already verified");

  user.verified = true;
  res.send(`<h2>Email verified successfully!</h2>
            <p>You can now <a href="${process.env.FRONTEND_URL}/login.html">login</a>.</p>`);
});

// Start server
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT}`));
