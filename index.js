import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verifyLink = "https://mysupernft-hash.github.io/check-email.html";

    await transporter.sendMail({
      from: `"SuperNFT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your SuperNFT account",
      html: `
        <h2>Welcome to SuperNFT</h2>
        <p>Click below to verify:</p>
        <a href="${verifyLink}">Verify Account</a>
      `,
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
});

app.get("/", (req, res) => {
  res.send("SuperNFT Backend Running 🚀");
});

app.listen(process.env.PORT || 8080, () =>
  console.log("Backend running")
);
