const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ---------- DATA SETUP ----------
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "messages.json");

// Create data folder/file if missing
if (!fs.existsSync(dataDir)) {
fs.mkdirSync(dataDir);
}
if (!fs.existsSync(dataFile)) {
fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Helpers
function readMessages() {
const raw = fs.readFileSync(dataFile, "utf-8");
return JSON.parse(raw);
}
function saveMessages(messages) {
fs.writeFileSync(dataFile, JSON.stringify(messages, null, 2));
}

// ---------- IMAGE UPLOAD ----------
const storage = multer.diskStorage({
destination: function (req, file, cb) {
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
cb(null, uploadDir);
},
filename: function (req, file, cb) {
const uniqueName = Date.now() + "-" + file.originalname;
cb(null, uniqueName);
},
});
const upload = multer({ storage });

// ---------- API ----------

// Add message
app.post("/api/add", upload.single("image"), (req, res) => {
const { name, text } = req.body;

if (!name || !text) {
return res.json({ success: false, message: "Missing fields" });
}

const messages = readMessages();

const newMessage = {
id: Date.now(),
name,
text,
image: req.file ? `/uploads/${req.file.filename}` : null,
createdAt: new Date().toISOString(),
};

messages.push(newMessage);
saveMessages(messages);

res.json({ success: true });
});

// Get all messages
app.get("/api/messages", (req, res) => {
const messages = readMessages();
res.json(messages);
});

// ---------- START ----------
app.listen(PORT, () => {
console.log("We Were Here running on port " + PORT);
});