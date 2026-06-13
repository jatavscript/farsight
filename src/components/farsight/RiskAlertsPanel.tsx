import type { SimState } from "@/lib/simulation/types";

const colors = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
} as const;

export function RiskAlertsPanel({ state }: { state: SimState }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span>Risk Alerts</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-blink" />
          <span className="text-destructive">LIVE</span>
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
        {state.alerts.length === 0 && (
          <div className="text-xs text-muted-foreground font-mono py-8 text-center">
            ALL SYSTEMS NOMINAL
          </div>
        )}
        {state.alerts.map(a => (
          <div key={a.id}
            className="flex items-start gap-2 text-xs p-2 rounded border"
            style={{
              borderColor: colors[a.level],
              background: `color-mix(in oklab, ${colors[a.level]} 8%, transparent)`,
            }}>
            <span className="font-mono font-bold mt-0.5" style={{ color: colors[a.level] }}>
              [{a.level}]
            </span>
            <span className="flex-1">{a.text}</span>
            <span className="font-mono text-muted-foreground">T+{a.tick}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
