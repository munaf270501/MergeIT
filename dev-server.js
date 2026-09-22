import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import createOrderHandler from './api/create-order.js';
import verifyPaymentHandler from './api/verify-payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env or .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Forward requests to Vercel serverless handlers
app.post('/api/create-order', (req, res) => createOrderHandler(req, res));
app.post('/api/verify-payment', (req, res) => verifyPaymentHandler(req, res));

// Serve static frontend files
app.use(express.static(__dirname));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 MergeIt AI Local Dev Server running at: http://localhost:${PORT}`);
  console.log(`✅ Vercel serverless routes mounted at /api/create-order & /api/verify-payment\n`);
});
