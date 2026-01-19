const express = require("express");
const app = express();
app.use(express.json());

// Dummy in-memory storage (replace with DB later)
let users = [];

// Signup
app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  const existing = users.find(u => u.email === email);
  if(existing) return res.status(400).json({ message: "User already registered" });

  users.push({ email, password, verified: false });
  return res.json({ message: "Signup successful! Check your email for verification." });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if(!user) return res.status(400).json({ message: "Invalid credentials" });
  if(!user.verified) return res.json({ verified: false });
  return res.json({ verified: true });
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
