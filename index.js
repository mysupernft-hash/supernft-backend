import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import crypto from "crypto";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

const readUsers = () =>
  fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE))
    : [];

const saveUsers = (data) =>
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

/* ---------------- SIGNUP ---------------- */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  let users = readUsers();
  let existing = users.find(u => u.email === email);

  if (existing) {
    if (!existing.verified) {
      return res.json({ message: "Already registered, please verify email" });
    }
    return res.status(400).json({ message: "User already registered" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  users.push({
    name,
    email,
    password,
    verified: false,
    token
  });

  saveUsers(users);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verifyLink = `https://supernft-backend.onrender.com/verify?token=${token}`;

  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your SuperNFT account",
    html: `
      <h2>Welcome to SuperNFT</h2>
      <p>Click to verify:</p>
      <a href="${verifyLink}">Verify Account</a>
    `
  });

  res.json({ success: true, message: "Verification email sent" });
});

/* ---------------- VERIFY ---------------- */
app.get("/verify", (req, res) => {
  const { token } = req.query;
  let users = readUsers();

  const user = users.find(u => u.token === token);
  if (!user) return res.send("Invalid link");

  user.verified = true;
  user.token = null;
  saveUsers(users);

  res.redirect("https://mysupernft-hash.github.io/login.html");
});

app.listen(process.env.PORT || 8080, () =>
  console.log("SuperNFT Backend Running 🚀")
);
