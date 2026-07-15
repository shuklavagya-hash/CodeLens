'use client';
// UploadRepo.jsx
// =====================================================================
// KAAM: ek button jo hidden <input type="file"> ko trigger karta hai.
// `webkitdirectory` attribute ki wajah se browser poore FOLDER ko pick
// karne deta hai (single file nahi) — user ek baar mein apni repo ki
// poori folder select kar sakta hai.
//
// Actual filtering (sirf .js/.jsx/.ts/.tsx rakhna) yahan nahi hoti —
// backend (routes/analyze.js) karta hai, taaki upload-logic simple rahe.
// =====================================================================

import { useRef } from 'react';

// Folder ke andar ye directories kabhi bhejni nahi hain — inhe browser ka
// folder-picker bhi select kar leta hai (webkitdirectory .gitignore ko
// respect nahi karta), aur node_modules akela hi 10k+ files add kar deta
// hai jo backend ka in-memory buffer crash kar deta hai.
const IGNORED_DIR_SEGMENTS = ['node_modules', '.git', '.next', 'dist', 'build', '.venv', '__pycache__'];

function isRelevantFile(file) {
  // webkitRelativePath jaisa hota hai: "MyRepo/node_modules/foo/index.js"
  const path = file.webkitRelativePath || file.name;
  const segments = path.split('/');

  // Sirf ignored directories skip karte hain — baaki HAR file type
  // (images, JSON, CSS, markdown, sab kuch) rakhte hain, taaki user
  // apni poori repo ka structure dekh sake, sirf code files nahi.
  return !segments.some((segment) => IGNORED_DIR_SEGMENTS.includes(segment));
}

export default function UploadRepo({ onUploadComplete, analyzing }) {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const allFiles = Array.from(event.target.files || []);
    if (allFiles.length === 0) return;

    const files = allFiles.filter(isRelevantFile);

    if (files.length === 0) {
      alert('No files found in this folder (after skipping node_modules, .git, etc).');
      event.target.value = '';
      return;
    }

    onUploadComplete(files);
    // reset so selecting the same folder again still fires onChange
    event.target.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        webkitdirectory="true"
        directory=""
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={analyzing}
        className="text-xs font-medium px-4 py-2 rounded-md bg-signal text-blueprint-deep hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? 'Analyzing…' : 'Upload Repository'}
      </button>
    </div>
  );
}
