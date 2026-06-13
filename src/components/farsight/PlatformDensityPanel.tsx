import type { SimState, RiskLevel } from "@/lib/simulation/types";

const colors: Record<RiskLevel, string> = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
};

export function PlatformDensityPanel({ state }: { state: SimState }) {
  return (
    <div className="panel scanline scanline-after">
      <div className="panel-header">
        <span>Platform Density</span>
        <span className="text-muted-foreground">LIVE</span>
      </div>
      <div className="p-3 space-y-2">
        {state.platforms.map(p => (
          <div key={p.id} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>PLATFORM {p.id}</span>
              <span style={{ color: colors[p.risk] }}>
                {(p.density * 100).toFixed(0)}% · {p.risk}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, p.density * 100)}%`,
                  background: colors[p.risk],
                  boxShadow: p.risk === "CRITICAL" ? `0 0 12px ${colors[p.risk]}` : undefined,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
