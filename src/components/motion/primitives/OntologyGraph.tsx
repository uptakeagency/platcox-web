import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import type { BaseReactProps } from "../types";

export interface OntologyNode {
  id: string;
  x: number;
  y: number;
  label: string;
  weight?: number;
}

export interface OntologyEdge {
  from: string;
  to: string;
}

export interface OntologyGraphProps extends BaseReactProps {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
}

// OntologyGraph: keyboard-accessible interactive graph viz.
// Her node tabindex=0 + role=button → screen reader + klavye navigasyonu.
// Enter/Space toggle detail overlay; Escape window-level kapatma.
// Breathing + edge-flow CSS keyframe'leri (global.css) reduced-motion
// @media içinde otomatik pause.
export default function OntologyGraph({
  nodes,
  edges,
  className,
  ariaLabel,
}: OntologyGraphProps) {
  // Reduced-motion durumunda CSS keyframe'leri pause oluyor; component-level
  // davranış değişmiyor ama hook tüketimi tutarlı kalsın diye çağırıyoruz.
  useReducedMotion();
  const { ref } = useInViewport({ threshold: 0.3 });
  const [openId, setOpenId] = useState<string | null>(null);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Window-level Escape: open detail varsa kapat. Node-level keyDown ise
  // toggle yapıyor (Enter/Space).
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <svg
      ref={ref as unknown as RefObject<SVGSVGElement>}
      viewBox="0 0 200 120"
      className={className}
      aria-label={ariaLabel}
      role="img"
      data-detail-open={openId ? "true" : "false"}
    >
      {edges.map((edge, i) => {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={0.6}
            strokeDasharray="3 2"
            data-ontology-edge
          />
        );
      })}
      {nodes.map((node) => {
        const isOpen = openId === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            role="button"
            tabIndex={0}
            onFocus={() => setOpenId(node.id)}
            onBlur={() =>
              setOpenId((current) => (current === node.id ? null : current))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenId((current) =>
                  current === node.id ? null : node.id,
                );
              }
            }}
            aria-label={node.label}
            aria-describedby={isOpen ? `detail-${node.id}` : undefined}
            style={{ cursor: "pointer" }}
          >
            <circle
              r={4 + (node.weight ?? 0)}
              fill="currentColor"
              data-ontology-node
            />
            {isOpen && (
              <text
                id={`detail-${node.id}`}
                y={-10}
                textAnchor="middle"
                fontSize={8}
                fill="currentColor"
              >
                {node.label}
              </text>
            )}
            <title>{node.label}</title>
          </g>
        );
      })}
    </svg>
  );
}
