// routes/analyze.js
// =====================================================================
// KAAM: Jab user apni repo (multiple files) upload kare, unhe padhna
// aur graphService se poora dependency graph banwana.
//
// Multer ka use ho raha hai file-upload handle karne ke liye — memory
// storage use kar rahe hain (disk pe save nahi kar rahe) kyunki humein
// sirf text content chahiye, permanently store nahi karna.
//
// NOTE: Yahan sab file types accept karte hain (sirf .js/.jsx/.ts/.tsx
// tak restrict nahi karte) taaki user ko apni poori repo ka structure
// dikhe — images, JSON, CSS, markdown, sab nodes ki tarah graph mein
// aayenge. Import/dependency edges obviously sirf code files se banenge
// (graphService sirf unhi files mein import statements dhoondta hai).
// =====================================================================

import express from 'express';
import multer from 'multer';
import { buildGraph } from '../services/graphService.js';

const router = express.Router();

// memory storage = file disk pe nahi jaati, seedha RAM mein buffer milta hai
// (chhote code files ke liye ye bilkul theek hai, bade binary files ke liye nahi)
const upload = multer({ storage: multer.memoryStorage() });

// Ye extensions binary hoti hain — inka content ko text mein decode karna
// bekaar (garbage) hoga, isliye inke liye content empty rakhte hain.
// Node phir bhi graph mein dikhega, bas iska code-snippet/import-parsing
// nahi hogi.
const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|svg|ico|webp|pdf|zip|woff2?|ttf|eot|mp4|mp3)$/i;

// POST /api/analyze — "files" field mein multiple files aayengi frontend se
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'Koi files upload nahi hui.' });
    }

    // Frontend har file ka lastModified timestamp bhi bhejta hai, same
    // order mein jis order files upload hui — yahan unhe zip kar dete hain.
    let lastModifiedTimes = [];
    try {
      lastModifiedTimes = JSON.parse(req.body.lastModifiedTimes || '[]');
    } catch {
      lastModifiedTimes = []; // agar parse fail ho, bas lastModified field skip ho jayega
    }

    const files = uploadedFiles.map((f, i) => ({
      name: f.originalname,
      content: BINARY_EXTENSIONS.test(f.originalname) ? '' : f.buffer.toString('utf8'),
      lastModified: lastModifiedTimes[i] ?? null,
    }));

    const graph = buildGraph(files);

    res.json({
      success: true,
      graph,
      filesAnalyzed: files.length,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ success: false, message: 'Repo analyze karte waqt error aaya.' });
  }
});

export default router;
