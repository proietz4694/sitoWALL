require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- LOGICA PERSISTENZA (RENDER / FLY / LOCALE) ---
const baseDataDir =
  process.env.RENDER === 'true'
    ? '/data'
    : fs.existsSync('/data')
      ? '/data'
      : path.join(__dirname, 'data');

const uploadDir = path.join(baseDataDir, 'uploads');

if (!fs.existsSync(baseDataDir)) fs.mkdirSync(baseDataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use('/uploads', express.static(uploadDir));

// --- CONFIGURAZIONE DATABASE ---
const dbPath = path.join(baseDataDir, 'wewerehere.db');
const db = new Database(dbPath);

db.prepare(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    text TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

// --- CONFIGURAZIONE MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- API ENDPOINTS ---

// GET all messages
app.get('/api/messages', (req, res) => {
    try {
        const messages = db
          .prepare('SELECT * FROM messages ORDER BY created_at DESC')
          .all();
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST new message
app.post('/api/messages', upload.single('image'), (req, res) => {
    try {
        const { name, text } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !text) {
            return res.status(400).json({ error: 'Name and text required' });
        }

        const result = db
          .prepare('INSERT INTO messages (name, text, image) VALUES (?, ?, ?)')
          .run(name, text, imagePath);

        res.json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Your trace has been left successfully!'
        });
    } catch (err) {
        console.error('Error saving message:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/all-messages', (req, res) => {
    try {
        const messages = db
          .prepare('SELECT * FROM messages ORDER BY created_at DESC')
          .all();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/messages/:id', (req, res) => {
    try {
        const result = db
          .prepare('DELETE FROM messages WHERE id = ?')
          .run(req.params.id);
        res.json({ success: result.changes > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
