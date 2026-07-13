'use client';

import { useRef } from 'react';

export default function UploadRepo({ onUploadComplete, analyzing }) {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
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
