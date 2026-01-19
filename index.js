// index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// File to store users (simple JSON database)
const USERS_FILE = path.join(__dirname, "users.json");

// Helper to read/write users
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // app password
  }
});

// Signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const users = readUsers();
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (!existingUser.verified) {
      // resend verification
      const verifyLink = `${req.protocol}://${req.get("host")}/verify?email=${email}`;
      await transporter.sendMail({
        from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
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
  users.push({ email, password, verified: false, wallet: 0, nfts: [] });
  writeUsers(users);

  // Send verification email
  const verifyLink = `${req.protocol}://${req.get("host")}/verify?email=${email}`;
  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your SuperNFT account",
    html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
  });

  res.json({ message: "Signup successful! Check your email for verification link." });
});

// Email verification
app.get("/verify", (req, res) => {
  const { email } = req.query;
  if (!email) return res.send("Invalid verification link");

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.send("User not found");
  user.verified = true;
  writeUsers(users);
  res.send("Email verified successfully! You can now login.");
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });
  if (!user.verified) return res.status(400).json({ message: "Email not verified" });
  if (user.password !== password) return res.status(400).json({ message: "Invalid password" });

  res.json({ message: "Login successful", wallet: user.wallet, nfts: user.nfts });
});

// Purchase NFT
app.post("/buy-nft", (req, res) => {
  const { email, nftPrice, nftName } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.wallet < nftPrice) return res.status(400).json({ message: "Insufficient balance" });

  user.wallet -= nftPrice;
  user.nfts.push({ name: nftName, price: nftPrice });
  writeUsers(users);

  res.json({ message: `NFT ${nftName} purchased successfully`, wallet: user.wallet });
});

// Add funds to wallet
app.post("/add-funds", (req, res) => {
  const { email, amount } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });
  user.wallet += amount;
  writeUsers(users);
  res.json({ message: `Added $${amount} to wallet`, wallet: user.wallet });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
