// routes/analyze.js
// =====================================================================
// KAAM: Jab user apni repo (multiple files) upload kare, unhe padhna
// aur graphService se poora dependency graph banwana.
//
// Multer ka use ho raha hai file-upload handle karne ke liye — memory
// storage use kar rahe hain (disk pe save nahi kar rahe) kyunki humein
// sirf text content chahiye, permanently store nahi karna.
// =====================================================================

import express from 'express';
import multer from 'multer';
import { buildGraph } from '../services/graphService.js';

const router = express.Router();

// memory storage = file disk pe nahi jaati, seedha RAM mein buffer milta hai
// (chhote code files ke liye ye bilkul theek hai, bade binary files ke liye nahi)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/analyze — "files" field mein multiple files aayengi frontend se
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'Koi files upload nahi hui.' });
    }

    // Sirf code files rakhte hain — binary/image/etc filter out karte hain
    const CODE_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;

    const files = uploadedFiles
      .filter((f) => CODE_EXTENSIONS.test(f.originalname))
      .map((f) => ({
        name: f.originalname,
        content: f.buffer.toString('utf8'),
      }));

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Koi supported code file (.js/.jsx/.ts/.tsx) nahi mili uploaded files mein.',
      });
    }

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
