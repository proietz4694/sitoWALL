const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'INSERISCI_LA_TUA_CHIAVE');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- DATABASE ----
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS cells (
cellId INTEGER PRIMARY KEY,
text TEXT,
image TEXT,
link TEXT,
color TEXT,
payment_status TEXT DEFAULT 'free'
)
`);
});

// ---- LOAD CELLS ----
app.get('/api/loadCells', (req, res) => {
console.log('GET /api/loadCells');
db.all('SELECT * FROM cells', [], (err, rows) => {
if (err) {
console.error(err);
return res.status(500).json([]);
}
res.json(rows);
});
});

// ---- FREE MODE SAVE ----
app.post('/api/leave-trace', (req, res) => {
const { cellId, text, image, link, color } = req.body;

db.run(
`INSERT OR REPLACE INTO cells
(cellId, text, image, link, color, payment_status)
VALUES (?, ?, ?, ?, ?, 'free')`,
[cellId, text, image, link, color],
err => {
if (err) {
console.error(err);
return res.status(500).json({ success: false });
}
res.json({ success: true });
}
);
});

// ---- STRIPE CHECKOUT ----
app.post('/api/create-checkout-session', async (req, res) => {
const { cellId, text, image, link, color } = req.body;

try {
const session = await stripe.checkout.sessions.create({
payment_method_types: ['card'],
line_items: [{
price_data: {
currency: 'eur',
product_data: {
name: `Leave a trace – cella ${cellId}`
},
unit_amount: 100
},
quantity: 1
}],
mode: 'payment',
success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${req.headers.origin}/?canceled=true`
});

db.run(
`INSERT OR REPLACE INTO cells
(cellId, text, image, link, color, payment_status)
VALUES (?, ?, ?, ?, ?, 'pending')`,
[cellId, text, image, link, color]
);

res.json({ url: session.url });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Stripe error' });
}
});

// ---- STRIPE WEBHOOK (ISOLATO) ----
app.post(
'/api/webhook',
express.raw({ type: 'application/json' }),
(req, res) => {
const sig = req.headers['stripe-signature'];
let event;

try {
event = stripe.webhooks.constructEvent(
req.body,
sig,
process.env.STRIPE_WEBHOOK_SECRET
);
} catch (err) {
console.error('Webhook error:', err.message);
return res.status(400).send('Webhook Error');
}

if (event.type === 'checkout.session.completed') {
console.log('Pagamento confermato');

// qui potresti aggiornare la cella se vuoi
}

res.json({ received: true });
}
);

// ---- START SERVER ----
app.listen(PORT, '0.0.0.0', () => {
console.log(`Server running on port ${PORT}`);
});
