// server.js
// =====================================================================
// Backend ka MAIN SWITCHBOARD — sab routes ko yahan jodte hain aur
// server start karte hain.
//
// ZAROORI ORDER RULES (FocusFlow project mein humein ye seekhne ko
// mila tha bugs se, isliye yahan pehle se sahi kar rahe hain):
//
//   1) `import 'dotenv/config'` SABSE PEHLI line honi chahiye — ES
//      modules mein saare imports code se pehle load hote hain, agar
//      dotenv sabse pehle load nahi hui, toh baad ke services (jaise
//      narrationService) ko process.env.* undefined milega.
//
//   2) File-upload wala route (/api/analyze, jo multer use karta hai)
//      ko express.json() se PEHLE mount karna hai — kyunki multer
//      multipart/form-data khud handle karta hai, aur express.json()
//      usse conflict kar sakta hai agar pehle aa jaye.
// =====================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import analyzeRoutes from './routes/analyze.js';
import impactRoutes from './routes/impact.js';
import explainRoutes from './routes/explain.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS enable — frontend (localhost:3000) se requests aane deni hain
app.use(cors());

// File-upload wala route pehle (express.json() se pehle — upar wajah likhi hai)
app.use('/api/analyze', analyzeRoutes);

// Baaki routes ke liye JSON body parsing chahiye
app.use(express.json());

app.use('/api/impact', impactRoutes);
app.use('/api/explain', explainRoutes);

// Simple health-check — quick verify karne ke liye ki server chal raha hai
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', provider: process.env.AI_PROVIDER || 'ollama' });
});

app.listen(PORT, () => {
  console.log(`CodeLens backend chal raha hai port ${PORT} pe`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || 'ollama (default)'}`);
});
