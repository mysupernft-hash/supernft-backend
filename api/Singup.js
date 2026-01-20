import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import Cors from "cors";

// Init CORS middleware
const cors = Cors({
  methods: ["POST", "HEAD"],
});

// Helper to run CORS in Vercel
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Path to users.json
const usersFile = path.join(process.cwd(), "users.json");

// Default export for Vercel
export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Read users.json
  let users = [];
  try {
    const data = fs.readFileSync(usersFile, "utf-8");
    users = JSON.parse(data);
  } catch (err) {
    console.log("users.json not found, creating new");
  }

  // Check if user exists
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    if (!existingUser.verified) {
      return res.json({ message: "User already registered, verification pending" });
    } else {
      return res.status(400).json({ message: "User already registered" });
    }
  }

  // Add new user
  const newUser = { name, email, password, verified: false };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  // Send verification email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verifyLink = `https://mysupernft-hash.github.io/login.html`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `
        <h2>Welcome to SuperNFT</h2>
        <p>
