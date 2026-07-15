'use client';
// GraphView.jsx
// =====================================================================
// KAAM: graph (nodes + edges) ko ek pannable/zoomable SVG canvas pe
// render karna. Node positions khud calculate nahi kar rahe — d3-force
// ka force simulation use kar rahe hain (300 ticks chala ke ek "settled"
// layout nikaal lete hain, phir usko static positions ki tarah use
// karte hain — real-time simulation nahi chalti, isse render fast aur
// predictable rehta hai).
//
// Pan/zoom apna khud ka simple implementation hai (d3-zoom use nahi
// kiya) — bas ek {x, y, k} transform state, mouse drag se x/y update,
// scroll wheel se k update.
//
// Selected node aur blast-radius (affected files) ko highlight karne
// ke liye alag color/opacity use kar rahe hain (edges + nodes dono pe).
// =====================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

export default function GraphView({ graph, selectedNode, blastRadius, onNodeClick, mostRecentNodeId }) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Pan/zoom state — {x, y} is the pan offset, k is the zoom scale
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!graph || dimensions.width === 0) return;

    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.edges.map((e) => ({ ...e }));

    // Bade graphs (bahut saari files) ke liye thoda zyada spacing
    const isLarge = nodes.length > 60;

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((d) => d.id).distance(isLarge ? 70 : 110))
      .force('charge', forceManyBody().strength(isLarge ? -120 : -260))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide(isLarge ? 24 : 46))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    setPositions({ nodes, links });
  }, [graph, dimensions]);

  const fitToView = useCallback(() => {
    if (!positions || positions.nodes.length === 0) return;
    const xs = positions.nodes.map((n) => n.x);
    const ys = positions.nodes.map((n) => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const padding = 80;
    const scaleX = (dimensions.width - padding) / graphWidth;
    const scaleY = (dimensions.height - padding) / graphHeight;
    const k = Math.min(scaleX, scaleY, 1.2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setTransform({ x: dimensions.width / 2 - centerX * k, y: dimensions.height / 2 - centerY * k, k });
  }, [positions, dimensions]);

  // Auto-fit jab naya graph load ho YA container ka size change ho
  // (dono dependencies zaroori hain — warna agar pehli baar container
  // ka size galat/chhota measure hua, graph hamesha usi galat size pe
  // stuck reh jaata)
  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, dimensions.width, dimensions.height]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setTransform((prev) => {
      const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
      const newK = Math.min(Math.max(prev.k * scaleAmount, 0.1), 4);
      return { ...prev, k: newK };
    });
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!positions) return null;

  const isAffected = (id) => blastRadius && blastRadius.has(id);
  const isSelected = (id) => selectedNode && selectedNode.id === id;

  // Bade graphs mein sab labels dikhana cluttered ho jaata hai —
  // zoomed-out ho toh sirf selected/affected nodes ke labels dikhao
  const showAllLabels = transform.k > 0.6 || positions.nodes.length < 40;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        <button
          onClick={() => setTransform((p) => ({ ...p, k: Math.min(p.k * 1.2, 4) }))}
          className="w-8 h-8 panel rounded text-paper hover:border-signal border border-blueprint-line"
        >
          +
        </button>
        <button
          onClick={() => setTransform((p) => ({ ...p, k: Math.max(p.k * 0.8, 0.1) }))}
          className="w-8 h-8 panel rounded text-paper hover:border-signal border border-blueprint-line"
        >
          −
        </button>
        <button
          onClick={fitToView}
          className="w-8 h-8 panel rounded text-paper hover:border-signal border border-blueprint-line text-xs"
          title="Fit to view"
        >
          ⤢
        </button>
      </div>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          <g>
            {positions.links.map((link, i) => {
              const affected = isAffected(link.source.id) && isAffected(link.target.id);
              return (
                <line
                  key={i}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={affected ? '#4DFF88' : '#1A3A1A'}
                  strokeWidth={affected ? 2 : 1}
                  opacity={affected ? 0.9 : 0.35}
                />
              );
            })}
          </g>

          <g>
            {positions.nodes.map((node) => {
              const affected = isAffected(node.id);
              const selected = isSelected(node.id);
              const isMostRecent = mostRecentNodeId && node.id === mostRecentNodeId;
              const showLabel = showAllLabels || affected || selected;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(node);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${node.label}`}
                >
                  {isMostRecent && (
                    // Halki si glow — batata hai ye file sabse recently edit hui
                    <circle r={selected ? 18 : 14} fill="#4DFF88" opacity={0.25} style={{ filter: 'blur(4px)' }} />
                  )}
                  <circle
                    r={selected ? 10 : 6}
                    fill={selected || affected ? '#4DFF88' : '#0A2A12'}
                    stroke={selected ? '#FFFFFF' : '#4DFF88'}
                    strokeWidth={selected ? 2 : 1}
                    opacity={affected || selected ? 1 : 0.75}
                  />
                  {showLabel && (
                    <text
                      x={0}
                      y={selected ? 24 : 18}
                      textAnchor="middle"
                      className="font-data select-none pointer-events-none"
                      fontSize={10}
                      fill={affected || selected ? '#4DFF88' : '#6AAE7A'}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className="absolute bottom-3 left-3 text-[10px] text-muted panel px-2 py-1 rounded">
        Scroll to zoom · Drag to pan · Click a node
      </div>
    </div>
  );
}
