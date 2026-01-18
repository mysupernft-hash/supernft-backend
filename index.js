const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set SendGrid API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In-memory database (replace with real DB for production)
let users = []; 

// ---------------- SIGNUP ----------------
app.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token (simple base64 encoding)
  const token = Buffer.from(email).toString('base64');

  // Save user as unverified
  users.push({
    email,
    username,
    password: hashedPassword,
    verified: false,
    token
  });

  // Send verification email
  const msg = {
    to: email,
    from: 'MySuperNft@gmail.com', // verified SendGrid sender
    subject: 'SuperNFT Email Verification',
    html: `<p>Hello ${username},</p>
           <p>Please verify your email by clicking the link below:</p>
           <a href="${process.env.FRONTEND_URL}/verify.html?token=${token}">Verify Email</a>`
  };

  try {
    await sgMail.send(msg);
    res.json({ message: 'Signup successful! Verification email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// ---------------- VERIFY ----------------
app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  const user = users.find(u => u.token === token);
  if (!user) return res.status(400).send('Invalid token');

  user.verified = true;
  res.send('Email verified! You can now login.');
});

// ---------------- LOGIN ----------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ message: 'User not found' });
  if (!user.verified) return res.status(400).json({ message: 'Please verify your email first' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Incorrect password' });

  res.json({ message: 'Login successful' });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
