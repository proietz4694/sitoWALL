const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Crea cartella uploads se non esiste
if (!fs.existsSync("public/uploads")) fs.mkdirSync("public/uploads");

// Multer per upload immagini
const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, "public/uploads"),
filename: (req, file, cb) => {
const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
cb(null, uniqueSuffix + path.extname(file.originalname));
},
});
const upload = multer({ storage: storage });

// Database
const db = new sqlite3.Database("./wewerehere.db");

// Crea tabella tracce
db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS traces (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
message TEXT,
image TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
});

// API per leggere tutte le tracce
app.get("/api/traces", (req, res) => {
db.all("SELECT * FROM traces ORDER BY id DESC", [], (err, rows) => {
if (err) return res.json([]);
res.json(rows || []);
});
});

// API per inserire nuova traccia
app.post("/api/traces", upload.single("image"), (req, res) => {
const { name, message } = req.body;
let imagePath = req.file ? "/uploads/" + req.file.filename : "";

db.run(
"INSERT INTO traces (name, message, image) VALUES (?, ?, ?)",
[name, message, imagePath],
function (err) {
if (err) return res.json({ success: false });
res.json({ success: true, id: this.lastID });
}
);
});

app.listen(PORT, () => {
console.log(`We Were Here backend running on http://localhost:${PORT}`);
});