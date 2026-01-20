import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import Cors from "cors";

const cors = Cors({ methods: ["POST", "HEAD"] });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

  const usersFile = path.join(process.cwd(), "users.json");
  let users = [];
  try { users = JSON.parse(fs.readFileSync(usersFile, "utf-8")); } catch (err) {}

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    if (!existingUser.verified) return res.json({ message: "User already registered, verification pending" });
    return res.status(400).json({ message: "User already registered" });
  }

  const newUser = { name, email, password, verified: false };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const verifyLink = `https://mysupernft-hash.github.io/login.html`;

  try {
    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `<h2>Welcome to SuperNFT</h2><p>Click to verify:</p><a href="${verifyLink}">Verify Account</a>`
    });
    return res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Email sending failed" });
  }
}
