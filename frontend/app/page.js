'use client';

import { useState } from 'react';
import UploadRepo from './components/UploadRepo';
import GraphView from './components/GraphView';
import NodeDetailPanel from './components/NodeDetailPanel';
import ExplainPanel from './components/ExplainPanel';

// Small demo graph so the UI is fully clickable before the backend is wired up.
// Shape matches what /api/analyze is expected to return.
const DEMO_GRAPH = {
  nodes: [
    { id: 'server.js', label: 'server.js', type: 'file' },
    { id: 'sessionService.js', label: 'sessionService.js', type: 'file' },
    { id: 'aiService.js', label: 'aiService.js', type: 'file' },
    { id: 'pipelineService.js', label: 'pipelineService.js', type: 'file' },
    { id: 'documentService.js', label: 'documentService.js', type: 'file' },
    { id: 'contextService.js', label: 'contextService.js', type: 'file' },
    { id: 'chunkService.js', label: 'chunkService.js', type: 'file' },
    { id: 'upload.js', label: 'routes/upload.js', type: 'file' },
    { id: 'session.js', label: 'routes/session.js', type: 'file' },
  ],
  edges: [
    { source: 'server.js', target: 'sessionService.js' },
    { source: 'server.js', target: 'upload.js' },
    { source: 'server.js', target: 'session.js' },
    { source: 'upload.js', target: 'pipelineService.js' },
    { source: 'pipelineService.js', target: 'documentService.js' },
    { source: 'pipelineService.js', target: 'contextService.js' },
    { source: 'pipelineService.js', target: 'chunkService.js' },
    { source: 'pipelineService.js', target: 'aiService.js' },
    { source: 'session.js', target: 'sessionService.js' },
  ],
};

export default function Home() {
  const [graph, setGraph] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [blastRadius, setBlastRadius] = useState(new Set());
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);

  const handleUploadComplete = async (repoFiles) => {
    setAnalyzing(true);
    setGraph(null);
    setSelectedNode(null);
    setExplanation('');

    try {
      const formData = new FormData();
      repoFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) throw new Error(data.message || 'Analysis failed');
      setGraph(data.graph);
    } catch (error) {
      console.error('Analyze error, falling back to demo graph:', error);
      // Backend not ready yet — keep the UI usable with demo data
      setGraph(DEMO_GRAPH);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadDemoGraph = () => {
    setGraph(DEMO_GRAPH);
    setSelectedNode(null);
    setBlastRadius(new Set());
    setExplanation('');
  };

  // Compute blast radius locally (BFS over edges) so the UI works even
  // before /api/impact/:nodeId exists on the backend.
  const computeBlastRadius = (nodeId, edges) => {
    const affected = new Set([nodeId]);
    let frontier = [nodeId];

    while (frontier.length > 0) {
      const next = [];
      for (const current of frontier) {
        edges.forEach((edge) => {
          if (edge.target === current && !affected.has(edge.source)) {
            affected.add(edge.source);
            next.push(edge.source);
          }
        });
      }
      frontier = next;
    }
    return affected;
  };

  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    setExplanation('');

    if (graph) {
      setBlastRadius(computeBlastRadius(node.id, graph.edges));
    }
  };

  const handleExplain = async () => {
    if (!selectedNode) return;
    setExplaining(true);
    setExplanation('');

    try {
      const response = await fetch(`http://localhost:5000/api/explain/${encodeURIComponent(selectedNode.id)}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Explain failed');
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Explain error:', error);
      setExplanation(
        `Could not reach the local AI service. Make sure the backend and Ollama are running. (${error.message})`
      );
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="panel border-b flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <h1 className="font-display text-lg text-paper">CodeLens</h1>
          <p className="text-xs text-muted">See what breaks before you touch it</p>
        </div>
        <div className="flex items-center gap-3">
          <UploadRepo onUploadComplete={handleUploadComplete} analyzing={analyzing} />
          <button
            onClick={loadDemoGraph}
            className="text-xs px-3 py-2 border border-blueprint-line rounded-md text-muted hover:text-paper hover:border-signal transition-colors"
          >
            Load Demo Graph
          </button>
        </div>
      </header>

      {/* Main body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph canvas */}
        <main className="flex-1 relative">
          {!graph && !analyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <p className="font-display text-sm text-muted mb-2">NO GRAPH LOADED</p>
              <p className="text-sm text-muted max-w-xs">
                Upload a repository, or load the demo graph, to see how its files depend on each other.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-display text-sm text-signal animate-pulse">PARSING REPOSITORY…</p>
            </div>
          )}

          {graph && (
            <GraphView
              graph={graph}
              selectedNode={selectedNode}
              blastRadius={blastRadius}
              onNodeClick={handleNodeClick}
            />
          )}
        </main>

        {/* Right-hand detail + explain panel */}
        {selectedNode && (
          <aside className="w-80 panel border-l flex flex-col overflow-y-auto">
            <NodeDetailPanel
              node={selectedNode}
              blastRadius={blastRadius}
              onClose={() => {
                setSelectedNode(null);
                setBlastRadius(new Set());
                setExplanation('');
              }}
            />
            <ExplainPanel
              explanation={explanation}
              explaining={explaining}
              onExplain={handleExplain}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
