export default function NodeDetailPanel({ node, blastRadius, onClose }) {
  const affectedCount = blastRadius ? blastRadius.size - 1 : 0; // exclude the node itself
  const affectedList = blastRadius ? Array.from(blastRadius).filter((id) => id !== node.id) : [];

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
