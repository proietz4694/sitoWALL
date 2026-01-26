const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = require('stripe')('***REMOVED***');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./pixelkingdom.db');

db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS cells (
cellId INTEGER PRIMARY KEY,
text TEXT,
image TEXT,
link TEXT,
color TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
});

const FREE_MODE = true;

app.post('/api/leave-trace', (req, res) => {
const { cellId, text, image, link, color } = req.body;

if (FREE_MODE) {
db.run(
'INSERT INTO cells (cellId, text, image, link, color) VALUES (?, ?, ?, ?, ?)',
[cellId, text, image, link, color],
err => {
if (err) return res.json({ success: false, error: err });
res.json({ success: true, free: true });
}
);
} else {
res.json({ pay: true });
}
});

app.post('/api/create-checkout-session', async (req, res) => {
const { cellId, text, image, link, color } = req.body;

try {
const session = await stripe.checkout.sessions.create({
payment_method_types: ['card'],
line_items: [{
price_data: {
currency: 'eur',
product_data: {
name: `Leave Your Trace - cella #${cellId}`,
},
unit_amount: 100,
},
quantity: 1,
}],
mode: 'payment',
success_url: `https://wewerehere.co/?success=true&cellId=${cellId}&text=${encodeURIComponent(text)}&image=${encodeURIComponent(image)}&link=${encodeURIComponent(link)}&color=${encodeURIComponent(color)}`,
cancel_url: `https://wewerehere.co/?canceled=true`,
});

res.json({ url: session.url });
} catch (err) {
console.log(err);
res.status(500).json({ error: 'Impossibile creare sessione' });
}
});

app.get('/api/loadCells', (req, res) => {
db.all('SELECT * FROM cells', [], (err, rows) => {
if (err) return res.json([]);
res.json(rows);
});
});

app.listen(PORT, () => {
console.log(`Pixel Kingdom backend avviato su http://localhost:${PORT}`);
});