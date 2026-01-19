const express = require("express");
const nodemailer = require("nodemailer");
const fs = require("fs");
const app = express();
app.use(express.json());

// Function to read users from JSON file
function readUsers() {
  if (!fs.existsSync("users.json")) return [];
  return JSON.parse(fs.readFileSync("users.json"));
}

// Function to save users
function saveUsers(users) {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER, // your SendGrid username/email
    pass: process.env.EMAIL_PASS  // your SendGrid password/API key
  }
});

// ------------------ SIGNUP ROUTE ------------------
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  // ------------------ PASTE THIS SNIPPET HERE ------------------
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (!existingUser.verified) {
      // resend verification link
      const verifyLink = `https://supernft-backend.onrender.com/verify?email=${encodeURIComponent(email)}`;
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
  // --------------------------------------------------------------

  // If new user, save to users.json with verified = false
  const newUser = { email, password, verified: false };
  users.push(newUser);
  saveUsers(users);

  const verifyLink = `https://supernft-backend.onrender.com/verify?email=${encodeURIComponent(email)}`;
  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your SuperNFT account",
    html: `<p>Click to verify your account:</p><a href="${verifyLink}">${verifyLink}</a>`
  });

  res.json({ message: "Signup successful! Check your email to verify." });
});

app.listen(3000, () => console.log("Server running on port 3000"));
