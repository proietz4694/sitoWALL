require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const multer = require('multer');
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.warn("⚠️ ATTENZIONE: STRIPE_SECRET_KEY non configurata. Il sistema funzionerà in modalità simulazione.");
}
const stripe = require('stripe')(stripeKey || 'sk_test_placeholder');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Nota: il webhook di Stripe ha bisogno del body raw)
app.use(cors());
app.use('/api/webhook', express.raw({ type: 'application/json' })); // Per il webhook
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- LOGICA PERSISTENZA (FLY.IO) ---
const isFly = fs.existsSync('/data');
const baseDataDir = isFly ? '/data' : path.join(__dirname, 'data');
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
    stripe_session_id TEXT,
    payment_status TEXT DEFAULT 'pending',
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

app.get('/api/messages', (req, res) => {
    try {
        // In modalita' test (senza chiave stripe reale) mostriamo tutto per debug.
        // In produzione mostriamo solo payment_status = 'paid'
        const filter = process.env.STRIPE_SECRET_KEY ? "WHERE payment_status = 'paid'" : "";
        const messages = db.prepare(`SELECT * FROM messages ${filter} ORDER BY created_at DESC`).all();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/create-checkout-session', upload.single('image'), async (req, res) => {
    try {
        const { name, text } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !text) {
            return res.status(400).json({ error: 'Name and text required' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            // Se non c'e' la chiave, simuliamo il successo per permettere test locali
            console.log("Stripe Key missing. Simulating success...");
            db.prepare('INSERT INTO messages (name, text, image, payment_status) VALUES (?, ?, ?, ?)')
                .run(name, text, imagePath, 'paid');
            return res.json({ id: 'dummy_session_id', url: '/index.html' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Trace on the Wall',
                        description: `Message from ${name}`,
                    },
                    unit_amount: 100, // 1.00 EUR
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/index.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/leave.html`,
        });

        db.prepare('INSERT INTO messages (name, text, image, stripe_session_id, payment_status) VALUES (?, ?, ?, ?, ?)')
            .run(name, text, imagePath, session.id, 'pending');

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- STRIPE WEBHOOK ---
app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // Se non c'e' secret, leggiamo il body direttamente (solo per test/debug)
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`Payment confirmed for session ${session.id}`);

        try {
            db.prepare("UPDATE messages SET payment_status = 'paid' WHERE stripe_session_id = ?")
                .run(session.id);
        } catch (err) {
            console.error("Database update error in webhook:", err);
        }
    }

    res.json({ received: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running with Stripe ready on port ${PORT}`);
});
