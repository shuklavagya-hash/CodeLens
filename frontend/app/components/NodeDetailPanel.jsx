// NodeDetailPanel.jsx
// =====================================================================
// KAAM: jab GraphView mein koi node click ho, uske baare mein "facts"
// dikhana — kitni files affected hongi (blast radius) aur unke naam,
// aur ye file OS pe last kab modify hui thi (browser ke File API se
// mila lastModified timestamp, koi git integration nahi hai).
// Ye purely graph-data se derive hota hai, koi AI call yahan nahi hoti
// (AI wala explanation ExplainPanel mein alag se hai).
// =====================================================================

function timeAgo(timestamp) {
  if (!timestamp) return null;
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NodeDetailPanel({ node, blastRadius, onClose }) {
  const affectedCount = blastRadius ? blastRadius.size - 1 : 0; // exclude the node itself
  const affectedList = blastRadius ? Array.from(blastRadius).filter((id) => id !== node.id) : [];
  const lastEdited = timeAgo(node.lastModified);

  return (
    <div className="p-5 border-b border-blueprint-line">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted mb-1">SELECTED</p>
          <h2 className="font-display text-sm text-paper break-all">{node.label}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-paper text-lg leading-none"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <div className="bg-blueprint-deep rounded-md p-3 mb-3">
        <p className="text-xs text-muted mb-1">BLAST RADIUS</p>
        <p className="font-display text-2xl text-signal">{affectedCount}</p>
        <p className="text-xs text-muted">
          {affectedCount === 0 ? 'file depends on this' : 'files depend on this — change carefully'}
        </p>
      </div>

      {lastEdited && (
        <div className="mb-3">
          <p className="text-xs text-muted mb-1">LAST EDITED</p>
          <p className="text-xs text-paper/80 font-data">{lastEdited}</p>
        </div>
      )}

      {affectedList.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">AFFECTED FILES</p>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {affectedList.map((id) => (
              <li key={id} className="text-xs text-paper/80 font-data truncate">
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
