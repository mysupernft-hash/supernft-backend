import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import fs from "fs";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const USERS_FILE = "./users.json";

/* ================= UTIL FUNCTIONS ================= */

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(email, token) {
  const verifyLink = `https://supernft-backend-glpsychi8-supernfts-projects.vercel.app/api/verify?token=${token}`;

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
}

/* ================= SIGNUP ================= */

app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const users = readUsers();
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (!existingUser.verified) {
      await sendVerificationEmail(email, existingUser.verifyToken);
      return res.json({ message: "Verification email resent" });
    }
    return res.status(400).json({ message: "User already registered" });
  }

  const verifyToken = crypto.randomUUID();

  users.push({
    name,
    email,
    password,
    verified: false,
    verifyToken
  });

  writeUsers(users);
  await sendVerificationEmail(email, verifyToken);

  res.json({ message: "Signup successful. Check your email." });
});

/* ================= VERIFY ================= */

app.get("/api/verify", (req, res) => {
  const { token } = req.query;
  const users = readUsers();

  const user = users.find(u => u.verifyToken === token);
  if (!user) return res.send("Invalid verification link");

  user.verified = true;
  writeUsers(users);

  res.redirect("https://mysupernft-hash.github.io/login.html");
});

/* ================= START ================= */

app.get("/", (req, res) => {
  res.send("✅ SuperNFT Backend Running");
});

app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
