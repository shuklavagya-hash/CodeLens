// graphService.js
// =====================================================================
// KAAM: parserService se mile "kaun kis file ko import karta hai" data
// ko ek graph (nodes + edges) mein badalna. Ye graph frontend ko bhejte
// hain visualize karne ke liye.
//
// Ye service ek chhota in-memory "cache" bhi rakhti hai — jo aakhri
// baar graph banaya gaya tha, uska record — taaki /api/impact aur
// /api/explain routes ko baar-baar poora repo dobara parse na karna
// pade. (Production mein ye database mein hota, hackathon ke liye
// simple memory variable kaafi hai.)
// =====================================================================

import { extractImportPaths, resolveImportToFile } from './parserService.js';

// Module-level cache — sirf ek user, ek session ke liye theek hai (hackathon scope)
let lastGraph = null;       // { nodes: [...], edges: [...] }
let fileContents = {};      // { fileName: content } — explain ke liye code snippet chahiye hota hai

/**
 * Saari uploaded files se poora dependency graph banata hai.
 * @param {{name: string, content: string}[]} files
 * @returns {{nodes: object[], edges: object[]}}
 */
export function buildGraph(files) {
  const allFileNames = files.map((f) => f.name);

  const nodes = files.map((f) => ({
    id: f.name,
    label: f.name,
    type: 'file',
  }));

  const edges = [];

  for (const file of files) {
    const importPaths = extractImportPaths(file.content);

    for (const importPath of importPaths) {
      const resolved = resolveImportToFile(importPath, allFileNames);

      // Sirf tab edge banao jab dono taraf ki file humare paas ho
      // (agar import kisi npm package ka hai, resolved null aayega — skip)
      if (resolved && resolved !== file.name) {
        edges.push({ source: file.name, target: resolved });
      }
    }
  }

  const graph = { nodes, edges };

  // Cache update — baad ke requests (impact/explain) isi ko use karenge
  lastGraph = graph;
  fileContents = {};
  files.forEach((f) => {
    fileContents[f.name] = f.content;
  });

  return graph;
}

/** Aakhri baar bana graph wapas deta hai (null agar abhi tak kuch analyze nahi hua) */
export function getLastGraph() {
  return lastGraph;
}

/** Ek file ka original content deta hai (AI explanation ke liye context chahiye) */
export function getFileContent(fileName) {
  return fileContents[fileName] || '';
}

/**
 * "Blast radius" nikaalta hai — agar ye file badli, toh kaun-kaun si
 * doosri files potentially break ho sakti hain (matlab jo isko import
 * karti hain, unhe bhi, aur unko import karne walon ko bhi... aage tak).
 *
 * Ye pure graph-traversal (BFS) hai — koi AI guess nahi, isliye 100%
 * accurate hai (jo bhi data graph mein hai uske hisaab se).
 *
 * @param {string} nodeId - jis file ka blast radius chahiye
 * @returns {Set<string>} - affected file names (khud nodeId bhi shamil hai)
 */
export function computeBlastRadius(nodeId) {
  const affected = new Set([nodeId]);
  if (!lastGraph) return affected;

  let frontier = [nodeId];

  while (frontier.length > 0) {
    const next = [];
    for (const current of frontier) {
      // Dhoondo: kaun-kaun "current" ko import kar raha hai (target === current)
      lastGraph.edges.forEach((edge) => {
        if (edge.target === current && !affected.has(edge.source)) {
          affected.add(edge.source);
          next.push(edge.source);
        }
      });
    }
    frontier = next;
  }

  return affected;
}

/** Ek node ke direct neighbors (kise import karta hai + kaun ise import karta hai) */
export function getNeighbors(nodeId) {
  if (!lastGraph) return { dependsOn: [], dependedBy: [] };

  const dependsOn = lastGraph.edges
    .filter((e) => e.source === nodeId)
    .map((e) => e.target);

  const dependedBy = lastGraph.edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);

  return { dependsOn, dependedBy };
}
