// routes/explain.js
// =====================================================================
// KAAM: Ek file ka naam lo, uske neighbors (kise import karta hai +
// kaun ise import karta hai) + code ka chhota snippet nikaalo, aur
// LOCAL AI model (Ollama) se plain-English explanation banwao.
//
// ZAROORI: Poora repo kabhi bhi AI ko nahi dikhaya jaata — sirf ek
// file ka context. Isse hallucination kam hota hai aur bade repo pe
// bhi scale karta hai.
// =====================================================================

import express from 'express';
import { getLastGraph, getFileContent, getNeighbors } from '../services/graphService.js';
import { explainNode } from '../services/narrationService.js';

const router = express.Router();

// POST /api/explain/:nodeId
router.post('/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    if (!getLastGraph()) {
      return res.status(400).json({
        success: false,
        message: 'Pehle /api/analyze se ek repo analyze karo, phir explain maango.',
      });
    }

    const content = getFileContent(nodeId);
    if (!content) {
      return res.status(404).json({ success: false, message: `"${nodeId}" naam ki file graph mein nahi mili.` });
    }

    // Sirf shuru ki ~40 lines bhejte hain AI ko — poora file nahi.
    // Zyaadatar files ka "purpose" top ke imports + pehle function se
    // hi pata chal jaata hai, aur ye prompt ko chhota/fast rakhta hai.
    const snippet = content.split('\n').slice(0, 40).join('\n');

    const { dependsOn, dependedBy } = getNeighbors(nodeId);

    const explanation = await explainNode({
      nodeId,
      snippet,
      dependsOn,
      dependedBy,
    });

    res.json({ success: true, nodeId, explanation });
  } catch (error) {
    console.error('Explain error:', error.message);
    // Yahan error.message forward karte hain kyunki narrationService
    // already ek helpful, specific message deta hai (jaise "Ollama
    // chal nahi raha"), generic crash nahi.
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
