import { memo } from "react";
import type { SimState, RiskLevel } from "@/lib/simulation/types";
import {
  ENTRY_GATE, EXIT_GATE, MAP_H, MAP_W, TICKET, WAITING,
  platformLine,
} from "@/lib/simulation/layout";

const riskFill: Record<RiskLevel, string> = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
};

function SimulationMapInner({ state }: { state: SimState }) {
  const { scenario, passengers, trains, security, platforms } = state;
  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="heat" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-critical)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-risk-critical)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heat-h" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-high)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-risk-high)" stopOpacity="0" />
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-grid)" strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />

      {/* Station footprint */}
      <rect x="40" y="40" width={MAP_W - 80} height={MAP_H - 80} rx="14"
        fill="color-mix(in oklab, var(--color-card) 60%, transparent)"
        stroke="var(--color-border)" strokeWidth="1.5" />

      {/* Heatmap halos */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        const cx = (line.x1 + line.x2) / 2;
        if (p.risk === "CRITICAL") {
          return <circle key={`h-${p.id}`} cx={cx} cy={line.y} r={150} fill="url(#heat)" />;
        }
        if (p.risk === "HIGH") {
          return <circle key={`h-${p.id}`} cx={cx} cy={line.y} r={120} fill="url(#heat-h)" />;
        }
        return null;
      })}

      {/* Platforms */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        return (
          <g key={`pl-${p.id}`}>
            <rect x={line.x1} y={line.y - 14} width={line.x2 - line.x1} height={28} rx="4"
              fill="color-mix(in oklab, var(--color-card) 80%, black)"
              stroke={riskFill[p.risk]} strokeWidth="1.2" />
            <text x={line.x1 - 12} y={line.y + 4} textAnchor="end"
              fill="var(--color-muted-foreground)" fontSize="11" fontFamily="var(--font-mono)">
              P{p.id}
            </text>
            <text x={line.x2 + 12} y={line.y + 4} textAnchor="start"
              fill={riskFill[p.risk]} fontSize="11" fontFamily="var(--font-mono)" fontWeight={700}>
              {(p.density * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}

      {/* Trains */}
      {trains.map(t => {
        const line = platformLine(t.platform, scenario.platforms);
        const trainW = 220;
        let x = line.x1;
        if (t.status === "arriving") x = line.x1 + (line.x2 - line.x1 - trainW) * t.progress;
        else if (t.status === "boarding") x = (line.x1 + line.x2 - trainW) / 2;
        else if (t.status === "departing") x = line.x2 - (line.x2 - line.x1 - trainW) * (1 - t.progress);
        else return null;
        return (
          <g key={t.id} transform={`translate(${x}, ${line.y - 10})`}>
            <rect width={trainW} height={20} rx="4"
              fill="color-mix(in oklab, var(--color-primary) 25%, var(--color-card))"
              stroke="var(--color-primary)" strokeWidth="1" />
            <rect width="14" height="20" rx="4" fill="var(--color-primary)" />
            <text x={trainW / 2} y="13" textAnchor="middle"
              fill="var(--color-foreground)" fontSize="9" fontFamily="var(--font-mono)">
              {t.name}
            </text>
          </g>
        );
      })}

      {/* Entry / Exit / Ticket / Waiting */}
      <Marker x={ENTRY_GATE.x} y={ENTRY_GATE.y} label="ENTRY" />
      <Marker x={EXIT_GATE.x} y={EXIT_GATE.y} label="EXIT" />
      <Marker x={TICKET.x} y={TICKET.y} label="TICKETS" />
      <Marker x={WAITING.x} y={WAITING.y} label="WAITING" />

      {/* Passengers */}
      {passengers.map(p => (
        <circle key={p.id} cx={p.pos.x} cy={p.pos.y} r={2.2}
          fill={p.state === "panic" ? "var(--color-risk-critical)" : "var(--color-cyan)"}
          opacity={0.85} />
      ))}

      {/* Security */}
      {security.map(s => (
        <g key={s.id}>
          <circle cx={s.pos.x} cy={s.pos.y} r={6}
            fill="var(--color-accent)" stroke="white" strokeWidth="1" />
          {s.status === "responding" && (
            <circle cx={s.pos.x} cy={s.pos.y} r={6}
              fill="none" stroke="var(--color-accent)" strokeWidth="1.5"
              className="animate-pulse-ring" />
          )}
        </g>
      ))}
    </svg>
  );
}

function Marker({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 32} y={y - 12} width={64} height={24} rx="4"
        fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="1" />
      <text x={x} y={y + 4} textAnchor="middle" fill="var(--color-primary)"
        fontSize="10" fontFamily="var(--font-mono)" letterSpacing="1">
        {label}
      </text>
    </g>
  );
}

export const SimulationMap = memo(SimulationMapInner);
