import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = "./users.json";
if(!fs.existsSync(DB_PATH)){
  fs.writeFileSync(DB_PATH, "[]");
}

function readUsers(){
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveUsers(u){
  fs.writeFileSync(DB_PATH, JSON.stringify(u, null, 2));
}

// ---------- SENDGRID / SMTP ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth:{
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ---------- SIGNUP ----------
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: "Fill all fields" });

  const users = readUsers();
  if(users.find(u => u.email === email)){
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  users.push({ email, password: hashed, verified: false });
  saveUsers(users);

  const verifyLink = `https://mysupernft-hash.github.io/verify.html?email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject:"Verify your SuperNFT account",
    html:`<p>Click to verify:</p><a href="${verifyLink}">${verifyLink}</a>`
  });

  res.json({ message: "Signup successful! Check email for verification" });
});

// ---------- VERIFY EMAIL ----------
app.get("/verify", (req, res) => {
  const email = req.query.email;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if(!user) return res.send("Verification failed");

  user.verified = true;
  saveUsers(users);
  res.send("Email verified! Go to login");
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);

  if(!user) return res.status(400).json({ message: "User not found" });
  if(!user.verified) return res.status(403).json({ message: "Email not verified" });

  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.status(401).json({ message: "Wrong password" });

  res.json({ message: "Login successful" });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server running on port", PORT));
