export default function ExplainPanel({ explanation, explaining, onExplain }) {
  return (
    <div className="p-5 flex-1">
      <p className="text-xs text-muted mb-3">AI EXPLANATION (RUNS LOCALLY)</p>

      {!explanation && !explaining && (
        <button
          onClick={onExplain}
          className="w-full text-xs font-medium px-4 py-2 rounded-md border border-signal text-signal hover:bg-signal hover:text-blueprint-deep transition-colors"
        >
          Explain This Change
        </button>
      )}

      {explaining && (
        <p className="text-xs text-signal animate-pulse font-data">Asking local model…</p>
      )}

      {explanation && !explaining && (
        <div>
          <p className="text-sm text-paper/90 leading-relaxed whitespace-pre-wrap">{explanation}</p>
          <button
            onClick={onExplain}
            className="mt-4 text-xs text-muted hover:text-paper underline"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
