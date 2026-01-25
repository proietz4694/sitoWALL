const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// JSON storage
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "messages.json");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

function readMessages() {
return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}
function saveMessages(messages) {
fs.writeFileSync(dataFile, JSON.stringify(messages, null, 2));
}

// Upload images
const storage = multer.diskStorage({
destination: (req, file, cb) => {
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
cb(null, uploadDir);
},
filename: (req, file, cb) => {
cb(null, Date.now() + "-" + file.originalname);
},
});
const upload = multer({ storage });

// POST add message
app.post("/api/add", upload.single("image"), (req, res) => {
const name = req.body.name;
const text = req.body.text;

if (!name || !text) return res.json({ success: false });

const messages = readMessages();
messages.push({
id: Date.now(),
name,
text,
image: req.file ? `/uploads/${req.file.filename}` : null,
createdAt: new Date().toISOString(),
});
saveMessages(messages);
res.json({ success: true });
});

// GET all messages
app.get("/api/messages", (req, res) => {
const messages = readMessages();
res.json(messages);
});

app.listen(PORT, () => console.log("Server running on port " + PORT));