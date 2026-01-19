import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

// 🔥 CORS – VERY IMPORTANT
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Root test
app.get("/", (req, res) => {
  res.send("SuperNFT backend running");
});

// Signup API
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  return res.json({
    message: "Signup success. Verification email sent (demo)."
  });
});

// Login API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login success" });
});

app.listen(PORT, () => {
  console.log("SuperNFT backend running on port", PORT);
});
