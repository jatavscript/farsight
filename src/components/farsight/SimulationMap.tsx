import { memo } from "react";
import type { SimState, RiskLevel } from "@/lib/simulation/types";
import {
  ENTRY_GATE, EXIT_GATE, MAP_H, MAP_W, TICKET, WAITING,
  platformLine, platformBoardingPoint,
} from "@/lib/simulation/layout";

const riskFill: Record<RiskLevel, string> = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
};

const riskLabel: Record<RiskLevel, string> = {
  LOW: "SAFE",
  MEDIUM: "WATCH",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

function SimulationMapInner({ state }: { state: SimState }) {
  const { scenario, passengers, trains, security, platforms, recommendations } = state;
  const redirectFrom = new Set(
    recommendations
      .filter(r => r.action.startsWith("Redirect") && r.platform && r.status !== "complete")
      .map(r => r.platform!),
  );

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Backgrounds & gradients */}
        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-primary) 6%, transparent)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="rail-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
          <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="platform-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-card) 40%, white 6%)" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--color-card) 90%, black)" />
        </linearGradient>
        <linearGradient id="train-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-primary) 55%, white)" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--color-primary) 45%, black)" />
        </linearGradient>

        {/* Heat halos by severity */}
        <radialGradient id="heat-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-critical)" stopOpacity="0.6" />
          <stop offset="60%" stopColor="var(--color-risk-critical)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-risk-critical)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heat-h" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-high)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-risk-high)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heat-m" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-medium)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-risk-medium)" stopOpacity="0" />
        </radialGradient>

        {/* Grids */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-grid)" strokeWidth="0.5" />
        </pattern>
        <pattern id="grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-grid)" strokeWidth="0.25" opacity="0.4" />
        </pattern>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-primary)" strokeOpacity="0.18" strokeWidth="2" />
        </pattern>

        {/* Glow filter */}
        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Marker arrows */}
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent)" />
        </marker>
      </defs>

      {/* Background */}
      <rect width={MAP_W} height={MAP_H} fill="url(#grid-fine)" />
      <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />
      <rect width={MAP_W} height={MAP_H} fill="url(#bg-vignette)" />

      {/* Station footprint */}
      <rect x="30" y="30" width={MAP_W - 60} height={MAP_H - 60} rx="16"
        fill="color-mix(in oklab, var(--color-card) 50%, transparent)"
        stroke="var(--color-border)" strokeWidth="1.5" />

      {/* Corner brackets (HUD) */}
      {[
        [40, 40, 1, 1], [MAP_W - 40, 40, -1, 1],
        [40, MAP_H - 40, 1, -1], [MAP_W - 40, MAP_H - 40, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <g key={i} stroke="var(--color-primary)" strokeWidth="1.5" fill="none">
          <path d={`M ${x} ${y + 14 * sy} L ${x} ${y} L ${x + 14 * sx} ${y}`} />
        </g>
      ))}

      {/* Concourse zones */}
      <g opacity="0.85">
        <rect x="100" y="60" width="240" height="120" rx="8"
          fill="color-mix(in oklab, var(--color-card) 70%, transparent)"
          stroke="var(--color-border)" />
        <text x="220" y="78" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9"
          letterSpacing="2" fill="var(--color-muted-foreground)">TICKETING CONCOURSE</text>

        <rect x="380" y="40" width="240" height="100" rx="8"
          fill="color-mix(in oklab, var(--color-card) 70%, transparent)"
          stroke="var(--color-border)" />
        <text x="500" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9"
          letterSpacing="2" fill="var(--color-muted-foreground)">WAITING HALL</text>

        <rect x="660" y="60" width="240" height="120" rx="8"
          fill="color-mix(in oklab, var(--color-card) 70%, transparent)"
          stroke="var(--color-border)" />
        <text x="780" y="78" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9"
          letterSpacing="2" fill="var(--color-muted-foreground)">FOOD COURT · RETAIL</text>
      </g>

      {/* Track yard background */}
      <rect x="120" y="170" width={MAP_W - 240} height={MAP_H - 200} rx="6"
        fill="color-mix(in oklab, var(--color-background) 80%, black)" opacity="0.7" />

      {/* Rail extensions (arriving/departing routes) */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        return (
          <g key={`rails-${p.id}`}>
            <line x1="40" y1={line.y} x2={line.x1} y2={line.y}
              stroke="url(#rail-grad)" strokeWidth="2" strokeDasharray="4 6" />
            <line x1={line.x2} y1={line.y} x2={MAP_W - 40} y2={line.y}
              stroke="url(#rail-grad)" strokeWidth="2" strokeDasharray="4 6" />
            {/* Sleeper ticks */}
            <line x1={line.x1} y1={line.y - 6} x2={line.x2} y2={line.y - 6}
              stroke="var(--color-grid)" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
            <line x1={line.x1} y1={line.y + 6} x2={line.x2} y2={line.y + 6}
              stroke="var(--color-grid)" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
          </g>
        );
      })}

      {/* Heat halos */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        const cx = (line.x1 + line.x2) / 2;
        const fill =
          p.risk === "CRITICAL" ? "url(#heat-c)" :
          p.risk === "HIGH" ? "url(#heat-h)" :
          p.risk === "MEDIUM" ? "url(#heat-m)" : null;
        if (!fill) return null;
        const r = p.risk === "CRITICAL" ? 170 : p.risk === "HIGH" ? 130 : 90;
        return <circle key={`h-${p.id}`} cx={cx} cy={line.y} r={r} fill={fill} />;
      })}

      {/* Platforms */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        const w = line.x2 - line.x1;
        const cx = (line.x1 + line.x2) / 2;
        const color = riskFill[p.risk];
        const isHot = p.risk === "CRITICAL";
        return (
          <g key={`pl-${p.id}`}>
            {/* base */}
            <rect x={line.x1} y={line.y - 16} width={w} height={32} rx="5"
              fill="url(#platform-grad)" stroke={color} strokeWidth={isHot ? 1.6 : 1} />
            {/* density bar */}
            <rect x={line.x1 + 2} y={line.y + 10} width={(w - 4) * p.density} height="4" rx="2"
              fill={color} opacity="0.9" filter={isHot ? "url(#soft-glow)" : undefined} />
            {/* hatch overlay if hot */}
            {isHot && (
              <rect x={line.x1} y={line.y - 16} width={w} height={32} rx="5"
                fill="url(#hatch)" />
            )}

            {/* left label badge */}
            <g transform={`translate(${line.x1 - 70}, ${line.y - 14})`}>
              <rect width="58" height="28" rx="4"
                fill="color-mix(in oklab, var(--color-card) 90%, black)"
                stroke={color} strokeWidth="1" />
              <text x="10" y="13" fontFamily="var(--font-mono)" fontSize="8"
                fill="var(--color-muted-foreground)" letterSpacing="1">PLAT</text>
              <text x="10" y="24" fontFamily="var(--font-display)" fontSize="14"
                fill={color} fontWeight={700}>{p.id}</text>
              <text x="34" y="13" fontFamily="var(--font-mono)" fontSize="7"
                fill="var(--color-muted-foreground)" letterSpacing="1">STATUS</text>
              <text x="34" y="24" fontFamily="var(--font-mono)" fontSize="8"
                fill={color} fontWeight={700}>{riskLabel[p.risk]}</text>
            </g>

            {/* right density readout */}
            <g transform={`translate(${line.x2 + 12}, ${line.y - 14})`}>
              <rect width="58" height="28" rx="4"
                fill="color-mix(in oklab, var(--color-card) 90%, black)"
                stroke={color} strokeWidth="1" />
              <text x="29" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7"
                fill="var(--color-muted-foreground)" letterSpacing="1">DENSITY</text>
              <text x="29" y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12"
                fill={color} fontWeight={700}>{(p.density * 100).toFixed(0)}%</text>
            </g>

            {/* Redirection chevron */}
            {redirectFrom.has(p.id) && (
              <g>
                <line x1={cx + 60} y1={line.y - 28} x2={cx - 60} y2={line.y - 28}
                  stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrow)"
                  strokeDasharray="6 4" opacity="0.95" className="animate-pulse" />
                <text x={cx} y={line.y - 34} textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize="8" fill="var(--color-accent)" letterSpacing="2">REROUTING</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Trains */}
      {trains.map(t => {
        const line = platformLine(t.platform, scenario.platforms);
        const trainW = 230;
        let x = line.x1;
        if (t.status === "arriving") x = 40 + (line.x1 - 40 + (line.x2 - line.x1 - trainW) * t.progress);
        else if (t.status === "boarding") x = (line.x1 + line.x2 - trainW) / 2;
        else if (t.status === "departing") x = line.x1 + (line.x2 - line.x1 - trainW) + (MAP_W - 40 - (line.x2)) * (1 - t.progress);
        else return null;
        return (
          <g key={t.id} transform={`translate(${x}, ${line.y - 11})`}>
            {/* shadow */}
            <rect y="18" width={trainW} height="3" rx="2" fill="black" opacity="0.35" />
            {/* body */}
            <rect width={trainW} height={22} rx="5" fill="url(#train-grad)"
              stroke="var(--color-primary)" strokeWidth="1.2" />
            {/* cab */}
            <path d={`M0,4 L0,18 Q0,22 4,22 L14,22 L14,0 L4,0 Q0,0 0,4 Z`}
              fill="var(--color-primary)" />
            {/* headlight */}
            <circle cx="7" cy="11" r="1.8" fill="white" filter="url(#soft-glow)" />
            {/* windows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x={26 + i * 24} y="5" width="14" height="6" rx="1"
                fill="color-mix(in oklab, var(--color-cyan) 35%, var(--color-card))"
                stroke="var(--color-cyan)" strokeOpacity="0.5" strokeWidth="0.5" />
            ))}
            {/* doors */}
            {Array.from({ length: 4 }).map((_, i) => (
              <rect key={i} x={50 + i * 48} y="14" width="3" height="6"
                fill="var(--color-cyan)" opacity={t.status === "boarding" ? 0.95 : 0.4}
                className={t.status === "boarding" ? "animate-pulse" : undefined} />
            ))}
            {/* name plate */}
            <rect x={trainW - 96} y="2" width="92" height="9" rx="2"
              fill="color-mix(in oklab, var(--color-background) 80%, black)" />
            <text x={trainW - 50} y="9" textAnchor="middle"
              fill="var(--color-cyan)" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="1">
              {t.name}
            </text>
            <text x={trainW + 6} y="14" fontSize="8" fontFamily="var(--font-mono)"
              fill="var(--color-muted-foreground)">
              {t.status.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Passenger flow lines (subtle) */}
      <g opacity="0.18" stroke="var(--color-cyan)" strokeWidth="0.5" fill="none">
        <path d={`M ${ENTRY_GATE.x} ${ENTRY_GATE.y} Q ${TICKET.x} ${TICKET.y + 60} ${WAITING.x} ${WAITING.y}`} strokeDasharray="2 4" />
        <path d={`M ${WAITING.x} ${WAITING.y} L ${WAITING.x} 300`} strokeDasharray="2 4" />
      </g>

      {/* Entry / Exit / Ticket / Waiting markers */}
      <Marker x={ENTRY_GATE.x} y={ENTRY_GATE.y} label="ENTRY" icon="→" tone="primary" />
      <Marker x={EXIT_GATE.x} y={EXIT_GATE.y} label="EXIT" icon="→" tone="primary" />
      <Marker x={TICKET.x} y={TICKET.y} label="TICKETS" icon="□" tone="muted" />
      <Marker x={WAITING.x} y={WAITING.y} label="WAITING" icon="◇" tone="muted" />

      {/* Passengers */}
      {passengers.map(p => (
        <circle key={p.id} cx={p.pos.x} cy={p.pos.y} r={p.state === "panic" ? 2.8 : 2.2}
          fill={p.state === "panic" ? "var(--color-risk-critical)" : "var(--color-cyan)"}
          opacity={p.state === "queued" ? 0.95 : 0.8} />
      ))}

      {/* Security */}
      {security.map(s => (
        <g key={s.id}>
          {s.status === "responding" && (
            <circle cx={s.pos.x} cy={s.pos.y} r="14" fill="none"
              stroke="var(--color-accent)" strokeWidth="1" opacity="0.4"
              className="animate-pulse" />
          )}
          <circle cx={s.pos.x} cy={s.pos.y} r="6"
            fill="var(--color-accent)" stroke="white" strokeWidth="1.2" />
          <text x={s.pos.x} y={s.pos.y + 2.5} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="6" fontWeight={700}
            fill="white">S</text>
        </g>
      ))}

      {/* Legend (bottom-left) */}
      <g transform="translate(48, 540)">
        <rect width="260" height="42" rx="6"
          fill="color-mix(in oklab, var(--color-card) 92%, black)"
          stroke="var(--color-border)" />
        <text x="10" y="13" fontFamily="var(--font-mono)" fontSize="8"
          letterSpacing="2" fill="var(--color-muted-foreground)">LEGEND</text>
        <LegendDot x={10} y={28} color="var(--color-cyan)" label="PASSENGER" />
        <LegendDot x={90} y={28} color="var(--color-accent)" label="SECURITY" />
        <LegendDot x={170} y={28} color="var(--color-risk-critical)" label="HOTSPOT" />
      </g>

      {/* Live indicator (top-right) */}
      <g transform={`translate(${MAP_W - 130}, 48)`}>
        <rect width="90" height="22" rx="4"
          fill="color-mix(in oklab, var(--color-card) 92%, black)"
          stroke="var(--color-risk-critical)" />
        <circle cx="11" cy="11" r="4" fill="var(--color-risk-critical)" className="animate-blink" />
        <text x="22" y="14" fontFamily="var(--font-mono)" fontSize="9"
          letterSpacing="3" fill="var(--color-risk-critical)" fontWeight={700}>LIVE</text>
      </g>

      {/* Compass / north */}
      <g transform={`translate(${MAP_W - 60}, ${MAP_H - 60})`} opacity="0.7">
        <circle r="18" fill="color-mix(in oklab, var(--color-card) 90%, black)"
          stroke="var(--color-border)" />
        <path d="M0,-14 L4,2 L0,-2 L-4,2 Z" fill="var(--color-primary)" />
        <text y="14" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7"
          fill="var(--color-muted-foreground)" letterSpacing="2">N</text>
      </g>
    </svg>
  );
}

function Marker({
  x, y, label, icon, tone,
}: { x: number; y: number; label: string; icon: string; tone: "primary" | "muted" }) {
  const color = tone === "primary" ? "var(--color-primary)" : "var(--color-muted-foreground)";
  return (
    <g>
      <rect x={x - 38} y={y - 14} width={76} height={28} rx="5"
        fill="color-mix(in oklab, var(--color-card) 92%, black)"
        stroke={color} strokeWidth="1" />
      <text x={x - 26} y={y + 4} textAnchor="middle" fill={color}
        fontSize="13" fontFamily="var(--font-mono)" fontWeight={700}>{icon}</text>
      <text x={x + 6} y={y + 4} textAnchor="middle" fill={color}
        fontSize="9" fontFamily="var(--font-mono)" letterSpacing="2">{label}</text>
    </g>
  );
}

function LegendDot({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="4" fill={color} />
      <text x="8" y="3" fontFamily="var(--font-mono)" fontSize="8"
        letterSpacing="1" fill="var(--color-muted-foreground)">{label}</text>
    </g>
  );
}

export const SimulationMap = memo(SimulationMapInner);
