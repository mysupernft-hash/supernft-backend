import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

const users = []; // temp memory (free backend)

app.get("/", (req, res) => {
  res.send("SuperNFT Backend is running 🚀");
});

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = { email, password, verified: false };
  users.push(user);

  const verifyLink = `https://supernft-backend.onrender.com/verify?email=${email}`;

  console.log("Verification link:", verifyLink);

  res.json({
    success: true,
    message: "Signup successful. Check email for verification link."
  });
});

// VERIFY
app.get("/verify", (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);

  if (!user) return res.send("Invalid link");

  user.verified = true;
  res.send("Email verified successfully. You can login now.");
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.verified) {
    return res.status(403).json({ message: "Email not verified" });
  }

  res.json({
    success: true,
    message: "Login successful"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
