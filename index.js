import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8080;

// middleware
app.use(cors());
app.use(bodyParser.json());

// file DB
const USERS_FILE = "./users.json";

// helpers
const readUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// health check (VERY IMPORTANT FOR RAILWAY)
app.get("/", (req, res) => {
  res.send("SuperNFT backend is running");
});

/* =========================
   SIGNUP
========================= */
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const users = readUsers();
  const existing = users.find(u => u.email === email);

  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashed,
    verified: true   // email verification future me add kar sakte ho
  });

  saveUsers(users);

  res.json({ message: "Signup successful" });
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.status(401).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Login successful",
    email: user.email
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log("SuperNFT backend running on port", PORT);
});
