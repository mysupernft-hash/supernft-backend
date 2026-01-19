import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: "https://mysupernft-hash.github.io"
}));
app.use(express.json());

/* ====== TEMP USER STORE (FILE / MEMORY) ====== */
const users = [];

/* ====== EMAIL TRANSPORT ====== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ====== TEST ROUTE ====== */
app.get("/", (req, res) => {
  res.send("SuperNFT backend running");
});

/* ====== SIGNUP ====== */
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const token = Date.now().toString();

    users.push({
      email,
      password: hashed,
      verified: false,
      token
    });

    const verifyLink =
      `https://supernft-backend.onrender.com/verify?token=${token}`;

    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `
        <h2>Verify your account</h2>
        <p>Click the link below:</p>
        <a href="${verifyLink}">${verifyLink}</a>
      `
    });

    res.json({ message: "Verification email sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====== VERIFY ====== */
app.get("/verify", (req, res) => {
  const user = users.find(u => u.token === req.query.token);
  if (!user) return res.send("Invalid link");

  user.verified = true;
  res.send("Email verified successfully. You can login now.");
});

/* ====== LOGIN ====== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ message: "User not found" });
  if (!user.verified) return res.status(400).json({ message: "Email not verified" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  res.json({ message: "Login success" });
});

app.listen(PORT, () =>
  console.log("SuperNFT backend running on port", PORT)
);
