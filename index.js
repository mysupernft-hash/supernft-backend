const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Temporary in-memory user storage
let users = []; // { email, password, verified }

// ==== Nodemailer Setup ====
// For production replace with your SendGrid SMTP or Gmail SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net", 
    port: 587,
    secure: false,
    auth: {
        user: "apikey", // SendGrid username
        pass: "YOUR_SENDGRID_API_KEY" // SendGrid API key
    }
});

// ==== Signup Route ====
app.post("/signup", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    if(users.find(u => u.email === email)) 
        return res.status(400).json({ message: "Email already registered" });

    users.push({ email, password, verified: false });

    // Send verification link
    const verifyLink = `https://mysupernft-hash.github.io/verify.html?email=${email}`;
    transporter.sendMail({
        from: '"SuperNFT" <no-reply@supernft.com>',
        to: email,
        subject: "Verify your SuperNFT account",
        html: `<p>Click the link to verify your account:</p>
               <a href="${verifyLink}">${verifyLink}</a>`
    }).then(info => {
        console.log("Verification email sent:", info.messageId);
        res.json({ message: "Signup successful! Please check your email to verify." });
    }).catch(err => {
        console.error("Email error:", err);
        res.status(500).json({ message: "Failed to send verification email" });
    });
});

// ==== Verify Route ====
app.post("/verify", (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if(!user) return res.status(400).json({ message: "User not found" });
    user.verified = true;
    res.json({ message: "Email verified successfully!" });
});

// ==== Login Route ====
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if(!user) return res.status(400).json({ message: "User not found" });
    if(!user.verified) return res.status(403).json({ message: "Email not verified" });
    if(user.password !== password) return res.status(401).json({ message: "Wrong password" });
    res.json({ message: "Login successful!" });
});

// ==== Start Server ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
