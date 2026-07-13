// routes/impact.js
// =====================================================================
// KAAM: Ek file/node ka naam lo, uska "blast radius" wapas bhejo —
// matlab kaun-kaun si doosri files potentially break ho sakti hain
// agar ye file change hui.
//
// Ye pure graph-traversal hai (graphService mein BFS), koi AI involved
// nahi — isliye result hamesha 100% accurate hai jo bhi graph mein
// data hai uske hisaab se.
// =====================================================================

import express from 'express';
import { computeBlastRadius, getLastGraph } from '../services/graphService.js';

const router = express.Router();

// GET /api/impact/:nodeId
router.get('/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;

    if (!getLastGraph()) {
      return res.status(400).json({
        success: false,
        message: 'Pehle /api/analyze se ek repo analyze karo, phir impact check karo.',
      });
    }

    const affectedSet = computeBlastRadius(nodeId);

    res.json({
      success: true,
      nodeId,
      affected: Array.from(affectedSet), // Set ko array mein convert karna zaroori hai JSON ke liye
      affectedCount: affectedSet.size - 1, // khud node ko minus karke
    });
  } catch (error) {
    console.error('Impact error:', error);
    res.status(500).json({ success: false, message: 'Blast radius calculate karte waqt error aaya.' });
  }
});

export default router;
