import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { SimState, RiskLevel } from "@/lib/simulation/types";
import {
  ENTRY_GATE, EXIT_GATE, MAP_H, MAP_W, TICKET, WAITING,
  platformLine,
} from "@/lib/simulation/layout";

/* ─────────────────────────────────────────────────────────
   COLOR + LABEL MAPS
   ───────────────────────────────────────────────────────── */
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

const EXIT_B = { x: MAP_W - 60, y: 470 };
const MEDICAL_ROOM = { x: 60, y: 470 };

/* ─────────────────────────────────────────────────────────
   MEDICAL AGENTS (local visual layer)
   They dispatch to the most critical platform when emergency
   or any platform is CRITICAL.
   ───────────────────────────────────────────────────────── */
function useMedicalAgents(state: SimState) {
  const [pos, setPos] = useState([
    { id: "M1", x: MEDICAL_ROOM.x, y: MEDICAL_ROOM.y - 14 },
    { id: "M2", x: MEDICAL_ROOM.x, y: MEDICAL_ROOM.y + 14 },
  ]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);

  const critical = state.platforms.find(p => p.risk === "CRITICAL");
  useEffect(() => {
    if (critical) {
      const line = platformLine(critical.id, state.scenario.platforms);
      targetRef.current = { x: (line.x1 + line.x2) / 2 - 40, y: line.y + 18 };
    } else {
      targetRef.current = null;
    }
  }, [critical, state.scenario.platforms]);

  useEffect(() => {
    const id = setInterval(() => {
      setPos(prev => prev.map((m, i) => {
        const target = targetRef.current ?? {
          x: MEDICAL_ROOM.x,
          y: MEDICAL_ROOM.y + (i === 0 ? -14 : 14),
        };
        const dx = target.x + (i === 0 ? -16 : 16) - m.x;
        const dy = target.y - m.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = Math.min(d, 6);
        return { ...m, x: m.x + (dx / d) * step, y: m.y + (dy / d) * step };
      }));
    }, 250);
    return () => clearInterval(id);
  }, []);

  return pos;
}

/* ─────────────────────────────────────────────────────────
   MAIN MAP
   ───────────────────────────────────────────────────────── */
function SimulationMapInner({ state }: { state: SimState }) {
  const { scenario, passengers, trains, security, platforms, recommendations, predictions } = state;

  const redirectFrom = useMemo(() => new Set(
    recommendations
      .filter(r => r.action.startsWith("Redirect") && r.platform && r.status !== "complete")
      .map(r => r.platform!),
  ), [recommendations]);

  const exitBOpen = useMemo(() => recommendations.some(
    r => /Open emergency Gate|Open Exit Gate B/i.test(r.action) && r.status !== "complete",
  ), [recommendations]);

  const paActive = useMemo(() => new Set(
    recommendations
      .filter(r => r.action.startsWith("Activate Public Announcement") && r.platform && r.status !== "complete")
      .map(r => r.platform!),
  ), [recommendations]);

  const medical = useMedicalAgents(state);

  // Latest 15-min prediction per platform
  const predByPlatform = useMemo(() => {
    const m = new Map<number, typeof predictions[number]>();
    for (const p of predictions) {
      if (p.horizonMin === 15) m.set(p.platform, p);
    }
    return m;
  }, [predictions]);

  // Train data by platform
  const trainByPlatform = useMemo(() => {
    const m = new Map<number, typeof trains[number]>();
    for (const t of trains) m.set(t.platform, t);
    return m;
  }, [trains]);

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-primary) 6%, transparent)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="rail-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.05" />
          <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="platform-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-card) 35%, white 6%)" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--color-card) 92%, black)" />
        </linearGradient>
        <linearGradient id="train-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--color-primary) 60%, white)" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--color-primary) 40%, black)" />
        </linearGradient>
        <linearGradient id="exit-glow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.2" />
        </linearGradient>

        <radialGradient id="heat-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-risk-critical)" stopOpacity="0.7" />
          <stop offset="55%" stopColor="var(--color-risk-critical)" stopOpacity="0.18" />
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

        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-grid)" strokeWidth="0.5" />
        </pattern>
        <pattern id="grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-grid)" strokeWidth="0.25" opacity="0.4" />
        </pattern>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-risk-critical)" strokeOpacity="0.25" strokeWidth="2" />
        </pattern>

        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hard-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent)" />
        </marker>
        <marker id="arrow-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-cyan)" />
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

      {/* HUD corners */}
      {[
        [40, 40, 1, 1], [MAP_W - 40, 40, -1, 1],
        [40, MAP_H - 40, 1, -1], [MAP_W - 40, MAP_H - 40, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <g key={i} stroke="var(--color-primary)" strokeWidth="1.5" fill="none">
          <path d={`M ${x} ${y + 14 * sy} L ${x} ${y} L ${x + 14 * sx} ${y}`} />
        </g>
      ))}

      {/* Concourse zones (above) */}
      <ZoneBox x={100} y={60} w={240} h={120} label="TICKETING CONCOURSE" sub="🎫 COUNTERS · 🛡 SECURITY" />
      <ZoneBox x={380} y={40} w={240} h={100} label="WAITING HALL" sub="🪑 SEATING · ℹ INFO" />
      <ZoneBox x={660} y={60} w={240} h={120} label="FOOD COURT · RETAIL" sub="🍔 F&B · 🛒 SHOPS" />

      {/* Medical Room (left) */}
      <g>
        <rect x={MEDICAL_ROOM.x - 36} y={MEDICAL_ROOM.y - 28} width="72" height="56" rx="6"
          fill="color-mix(in oklab, var(--color-card) 85%, black)"
          stroke="var(--color-risk-critical)" strokeWidth="1" strokeDasharray="2 2" />
        <text x={MEDICAL_ROOM.x} y={MEDICAL_ROOM.y - 14} textAnchor="middle"
          fontFamily="var(--font-mono)" fontSize="7" letterSpacing="2"
          fill="var(--color-risk-critical)">MEDICAL</text>
        <text x={MEDICAL_ROOM.x} y={MEDICAL_ROOM.y + 4} textAnchor="middle"
          fontSize="14">🚑</text>
      </g>

      {/* Track yard */}
      <rect x="120" y="170" width={MAP_W - 240} height={MAP_H - 200} rx="6"
        fill="color-mix(in oklab, var(--color-background) 80%, black)" opacity="0.7" />

      {/* Rail extensions */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        return (
          <g key={`rails-${p.id}`}>
            <line x1="40" y1={line.y} x2={line.x1} y2={line.y}
              stroke="url(#rail-grad)" strokeWidth="2" strokeDasharray="4 6" />
            <line x1={line.x2} y1={line.y} x2={MAP_W - 40} y2={line.y}
              stroke="url(#rail-grad)" strokeWidth="2" strokeDasharray="4 6" />
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
        const r = p.risk === "CRITICAL" ? 180 : p.risk === "HIGH" ? 130 : 90;
        return (
          <circle key={`h-${p.id}`} cx={cx} cy={line.y} r={r} fill={fill}
            className={p.risk === "CRITICAL" ? "animate-critical-glow" : undefined} />
        );
      })}

      {/* Platforms */}
      {platforms.map(p => {
        const line = platformLine(p.id, scenario.platforms);
        const w = line.x2 - line.x1;
        const cx = (line.x1 + line.x2) / 2;
        const color = riskFill[p.risk];
        const isHot = p.risk === "CRITICAL";
        const train = trainByPlatform.get(p.id);
        const pred = predByPlatform.get(p.id);

        return (
          <g key={`pl-${p.id}`} className={isHot ? "animate-shake-x" : undefined}>
            {/* base */}
            <rect x={line.x1} y={line.y - 16} width={w} height={32} rx="5"
              fill="url(#platform-grad)" stroke={color} strokeWidth={isHot ? 1.8 : 1}
              style={{ transition: "stroke 0.6s ease" }} />
            {/* density bar */}
            <rect x={line.x1 + 2} y={line.y + 10} width={(w - 4) * p.density} height="4" rx="2"
              fill={color} opacity="0.95" filter={isHot ? "url(#soft-glow)" : undefined}
              style={{ transition: "width 0.6s ease, fill 0.6s ease" }} />
            {/* hatch overlay if critical */}
            {isHot && (
              <rect x={line.x1} y={line.y - 16} width={w} height={32} rx="5"
                fill="url(#hatch)" pointerEvents="none" />
            )}

            {/* left platform label */}
            <g transform={`translate(${line.x1 - 78}, ${line.y - 18})`}>
              <rect width="66" height="36" rx="4"
                fill="color-mix(in oklab, var(--color-card) 92%, black)"
                stroke={color} strokeWidth="1" />
              <text x="6" y="11" fontFamily="var(--font-mono)" fontSize="7"
                fill="var(--color-muted-foreground)" letterSpacing="1">PLATFORM</text>
              <text x="6" y="26" fontFamily="var(--font-display)" fontSize="16"
                fill={color} fontWeight={700}>P{p.id}</text>
              <text x="40" y="11" fontFamily="var(--font-mono)" fontSize="6"
                fill="var(--color-muted-foreground)" letterSpacing="1">STATUS</text>
              <text x="40" y="22" fontFamily="var(--font-mono)" fontSize="8"
                fill={color} fontWeight={700}>{riskLabel[p.risk]}</text>
              <text x="40" y="32" fontFamily="var(--font-mono)" fontSize="9"
                fill={color} fontWeight={700}
                style={{ transition: "fill 0.6s ease" }}>
                {(p.density * 100).toFixed(0)}%
              </text>
            </g>

            {/* right train info plate */}
            {train && (
              <g transform={`translate(${line.x2 + 12}, ${line.y - 22})`}>
                <rect width="110" height="44" rx="4"
                  fill="color-mix(in oklab, var(--color-card) 92%, black)"
                  stroke="var(--color-cyan)" strokeWidth="0.8" strokeOpacity="0.55" />
                <text x="6" y="11" fontFamily="var(--font-mono)" fontSize="7"
                  fill="var(--color-muted-foreground)" letterSpacing="1">🚆 TRAIN</text>
                <text x="6" y="23" fontFamily="var(--font-mono)" fontSize="8"
                  fill="var(--color-cyan)" fontWeight={700}>{train.name}</text>
                <text x="6" y="34" fontFamily="var(--font-mono)" fontSize="7"
                  fill="var(--color-muted-foreground)" letterSpacing="1">
                  {train.status.toUpperCase()}
                </text>
                {train.delay > 0 && (
                  <text x="104" y="34" textAnchor="end" fontFamily="var(--font-mono)" fontSize="7"
                    fill="var(--color-risk-high)" fontWeight={700}>+{train.delay}m</text>
                )}
              </g>
            )}

            {/* Floating prediction card (only when alarming) */}
            {pred && (pred.risk === "HIGH" || pred.risk === "CRITICAL") && (
              <g transform={`translate(${cx - 70}, ${line.y - 78})`}>
                <rect width="140" height="48" rx="6"
                  fill="color-mix(in oklab, var(--color-card) 96%, black)"
                  stroke={riskFill[pred.risk]} strokeWidth="1.2"
                  filter="url(#soft-glow)" />
                <text x="8" y="12" fontFamily="var(--font-mono)" fontSize="7"
                  letterSpacing="2" fill={riskFill[pred.risk]} fontWeight={700}>
                  ⚠ ETA {pred.risk}
                </text>
                <text x="8" y="26" fontFamily="var(--font-mono)" fontSize="8"
                  fill="var(--color-muted-foreground)">
                  Now {(p.density * 100).toFixed(0)}% → {(pred.predictedDensity * 100).toFixed(0)}%
                </text>
                <text x="8" y="40" fontFamily="var(--font-mono)" fontSize="8"
                  fill={riskFill[pred.risk]} fontWeight={700}>
                  {pred.minutesToCritical != null
                    ? `CRITICAL IN ${pred.minutesToCritical}m`
                    : `+15m HORIZON`}
                </text>
                {/* pointer */}
                <path d={`M 70 48 L 64 56 L 76 56 Z`} fill={riskFill[pred.risk]} />
              </g>
            )}

            {/* PA active indicator */}
            {paActive.has(p.id) && (
              <g transform={`translate(${cx - 14}, ${line.y - 36})`}>
                <circle r="9" fill="var(--color-accent)" opacity="0.18" className="animate-pulse" />
                <text fontSize="11" textAnchor="middle" y="3.5">📢</text>
              </g>
            )}

            {/* Redirection chevron */}
            {redirectFrom.has(p.id) && (
              <g>
                <line x1={cx + 70} y1={line.y - 28} x2={cx - 70} y2={line.y - 28}
                  stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrow)"
                  strokeDasharray="6 4" opacity="0.95" className="animate-dash-flow" />
                <text x={cx} y={line.y - 34} textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize="8" fill="var(--color-accent)" letterSpacing="2">REROUTING</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Trains (smooth animated) */}
      {trains.map(t => {
        const line = platformLine(t.platform, scenario.platforms);
        const trainW = 230;
        let x = line.x1;
        if (t.status === "arriving") x = 40 + (line.x1 - 40 + (line.x2 - line.x1 - trainW) * t.progress);
        else if (t.status === "boarding") x = (line.x1 + line.x2 - trainW) / 2;
        else if (t.status === "departing") x = line.x1 + (line.x2 - line.x1 - trainW) + (MAP_W - 40 - (line.x2)) * (1 - t.progress);
        else return null;
        return (
          <g key={t.id} className="smooth-train" style={{ transform: `translate(${x}px, ${line.y - 11}px)` }}>
            <rect y="18" width={trainW} height="3" rx="2" fill="black" opacity="0.35" />
            <rect width={trainW} height={22} rx="5" fill="url(#train-grad)"
              stroke="var(--color-primary)" strokeWidth="1.2" />
            <path d={`M0,4 L0,18 Q0,22 4,22 L14,22 L14,0 L4,0 Q0,0 0,4 Z`}
              fill="var(--color-primary)" />
            <circle cx="7" cy="11" r="1.8" fill="white" filter="url(#soft-glow)" />
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x={26 + i * 24} y="5" width="14" height="6" rx="1"
                fill="color-mix(in oklab, var(--color-cyan) 35%, var(--color-card))"
                stroke="var(--color-cyan)" strokeOpacity="0.5" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
              <rect key={i} x={50 + i * 48} y="14" width="3" height="6"
                fill="var(--color-cyan)" opacity={t.status === "boarding" ? 0.95 : 0.4}
                className={t.status === "boarding" ? "animate-pulse" : undefined} />
            ))}
          </g>
        );
      })}

      {/* Subtle flow streams Entry → Ticket → Waiting */}
      <g opacity="0.22" stroke="var(--color-cyan)" strokeWidth="0.6" fill="none">
        <path d={`M ${ENTRY_GATE.x} ${ENTRY_GATE.y} Q ${TICKET.x} ${TICKET.y + 60} ${WAITING.x} ${WAITING.y}`}
          strokeDasharray="2 4" className="animate-dash-flow" />
        <path d={`M ${WAITING.x} ${WAITING.y} L ${WAITING.x} 300`}
          strokeDasharray="2 4" className="animate-dash-flow" />
      </g>

      {/* Exit B redirect flow when active */}
      {exitBOpen && (
        <g>
          <path d={`M ${WAITING.x} 200 Q ${EXIT_B.x - 120} 320 ${EXIT_B.x - 20} ${EXIT_B.y}`}
            stroke="var(--color-cyan)" strokeWidth="2" strokeDasharray="6 6"
            fill="none" markerEnd="url(#arrow-cyan)" className="animate-dash-flow"
            filter="url(#soft-glow)" />
          <text x={EXIT_B.x - 90} y={EXIT_B.y - 60} fontFamily="var(--font-mono)"
            fontSize="8" letterSpacing="2" fill="var(--color-cyan)">
            REROUTE → EXIT B
          </text>
        </g>
      )}

      {/* Markers */}
      <Marker x={ENTRY_GATE.x} y={ENTRY_GATE.y} label="ENTRY" icon="→" tone="primary" />
      <Marker x={EXIT_GATE.x} y={EXIT_GATE.y} label="EXIT A" icon="→" tone="primary" />
      <Marker x={TICKET.x} y={TICKET.y} label="TICKETS" icon="🎫" tone="muted" />
      <Marker x={WAITING.x} y={WAITING.y} label="WAITING" icon="🪑" tone="muted" />

      {/* Exit Gate B — glows + opens when recommendation active */}
      <g>
        {exitBOpen && (
          <rect x={EXIT_B.x - 44} y={EXIT_B.y - 20} width="88" height="40" rx="6"
            fill="url(#exit-glow)" opacity="0.45" filter="url(#hard-glow)"
            className="animate-pulse" />
        )}
        <rect x={EXIT_B.x - 38} y={EXIT_B.y - 14} width="76" height="28" rx="5"
          fill="color-mix(in oklab, var(--color-card) 92%, black)"
          stroke={exitBOpen ? "var(--color-cyan)" : "var(--color-muted-foreground)"}
          strokeWidth={exitBOpen ? 1.5 : 1}
          strokeDasharray={exitBOpen ? undefined : "3 3"} />
        <text x={EXIT_B.x - 26} y={EXIT_B.y + 4} textAnchor="middle"
          fill={exitBOpen ? "var(--color-cyan)" : "var(--color-muted-foreground)"}
          fontSize="13" fontFamily="var(--font-mono)" fontWeight={700}>→</text>
        <text x={EXIT_B.x + 6} y={EXIT_B.y + 4} textAnchor="middle"
          fill={exitBOpen ? "var(--color-cyan)" : "var(--color-muted-foreground)"}
          fontSize="9" fontFamily="var(--font-mono)" letterSpacing="2">EXIT B</text>
        {exitBOpen && (
          <text x={EXIT_B.x} y={EXIT_B.y - 22} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="7" letterSpacing="2"
            fill="var(--color-cyan)" className="animate-blink">● OPEN</text>
        )}
      </g>

      {/* Passengers */}
      {passengers.map(p => (
        <circle key={p.id} cx={p.pos.x} cy={p.pos.y} r={p.state === "panic" ? 2.8 : 2.2}
          fill={p.state === "panic" ? "var(--color-risk-critical)" : "var(--color-cyan)"}
          opacity={p.state === "queued" ? 0.95 : 0.8} />
      ))}

      {/* Security (smooth) */}
      {security.map((s, idx) => (
        <g key={s.id} className="smooth-agent"
          style={{ transform: `translate(${s.pos.x}px, ${s.pos.y}px)` }}>
          {s.status === "responding" && (
            <circle r="14" fill="none" stroke="var(--color-accent)" strokeWidth="1"
              opacity="0.4" className="animate-pulse" />
          )}
          <circle r="7" fill="var(--color-accent)" stroke="white" strokeWidth="1.2" />
          <text textAnchor="middle" y="-9" fontFamily="var(--font-mono)" fontSize="6"
            fill="var(--color-accent)" fontWeight={700}>S{idx + 1}</text>
          <text textAnchor="middle" y="3" fontSize="8">🛡</text>
        </g>
      ))}

      {/* Medical agents */}
      {medical.map((m, idx) => (
        <g key={m.id} className="smooth-agent"
          style={{ transform: `translate(${m.x}px, ${m.y}px)` }}>
          <circle r="8" fill="var(--color-risk-critical)" stroke="white" strokeWidth="1.2"
            className="animate-med-pulse" />
          <text textAnchor="middle" y="-10" fontFamily="var(--font-mono)" fontSize="6"
            fill="var(--color-risk-critical)" fontWeight={700}>M{idx + 1}</text>
          <text textAnchor="middle" y="3" fontSize="8">🚑</text>
        </g>
      ))}

      {/* Legend */}
      <g transform="translate(48, 540)">
        <rect width="380" height="42" rx="6"
          fill="color-mix(in oklab, var(--color-card) 92%, black)"
          stroke="var(--color-border)" />
        <text x="10" y="13" fontFamily="var(--font-mono)" fontSize="8"
          letterSpacing="2" fill="var(--color-muted-foreground)">LEGEND</text>
        <LegendDot x={10} y={28} color="var(--color-cyan)" label="PAX" />
        <LegendDot x={60} y={28} color="var(--color-accent)" label="🛡 SECURITY" />
        <LegendDot x={150} y={28} color="var(--color-risk-critical)" label="🚑 MEDICAL" />
        <LegendDot x={240} y={28} color="var(--color-risk-high)" label="HOTSPOT" />
        <LegendDot x={310} y={28} color="var(--color-risk-low)" label="SAFE" />
      </g>

      {/* LIVE */}
      <g transform={`translate(${MAP_W - 130}, 48)`}>
        <rect width="90" height="22" rx="4"
          fill="color-mix(in oklab, var(--color-card) 92%, black)"
          stroke="var(--color-risk-critical)" />
        <circle cx="11" cy="11" r="4" fill="var(--color-risk-critical)" className="animate-blink" />
        <text x="22" y="14" fontFamily="var(--font-mono)" fontSize="9"
          letterSpacing="3" fill="var(--color-risk-critical)" fontWeight={700}>LIVE</text>
      </g>

      {/* Compass */}
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

/* ─────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────── */
function ZoneBox({ x, y, w, h, label, sub }: {
  x: number; y: number; w: number; h: number; label: string; sub: string;
}) {
  return (
    <g opacity="0.9">
      <rect x={x} y={y} width={w} height={h} rx="8"
        fill="color-mix(in oklab, var(--color-card) 70%, transparent)"
        stroke="var(--color-border)" />
      <text x={x + w / 2} y={y + 16} textAnchor="middle" fontFamily="var(--font-mono)"
        fontSize="9" letterSpacing="2" fill="var(--color-primary)" fontWeight={700}>{label}</text>
      <text x={x + w / 2} y={y + 30} textAnchor="middle" fontFamily="var(--font-mono)"
        fontSize="8" letterSpacing="1" fill="var(--color-muted-foreground)">{sub}</text>
    </g>
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
      <text x="8" y="3" fontFamily="var(--font-mono)" fontSize="7"
        letterSpacing="1" fill="var(--color-muted-foreground)">{label}</text>
    </g>
  );
}

export const SimulationMap = memo(SimulationMapInner);
