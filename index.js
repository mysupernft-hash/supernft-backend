require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = './users.json';

// Utility to read/write users
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Setup SendGrid transporter
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });

  const users = readUsers();
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (!existingUser.verified) {
      // resend verification
      const verifyLink = `${process.env.FRONTEND_URL}/verify.html?email=${email}`;
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "SuperNFT - Verify your account",
        html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
      });
      return res.json({ message: "Verification link resent. Check your email!" });
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  // New user
  users.push({ email, password, verified: false, wallet: 0 });
  writeUsers(users);

  const verifyLink = `${process.env.FRONTEND_URL}/verify.html?email=${email}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "SuperNFT - Verify your account",
    html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
  });

  res.json({ message: "Signup successful! Check your email for verification link." });
});

// Verification route (GET)
app.get('/verify', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send("Invalid verification link");

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).send("User not found");

  user.verified = true;
  writeUsers(users);

  res.send("Email verified successfully! You can now login.");
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (!user.verified) return res.status(403).json({ message: "Please verify your email first" });

  res.json({ message: "Login successful", email: user.email, wallet: user.wallet });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SuperNFT backend running on port ${PORT}`));
