import type { Recommendation, SimState } from "@/lib/simulation/types";

const priorityColor = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
} as const;

function StatusPill({ s }: { s: Recommendation["status"] }) {
  const map = {
    pending: { c: "var(--color-muted-foreground)", t: "PENDING" },
    active: { c: "var(--color-primary)", t: "EXECUTING" },
    complete: { c: "var(--color-risk-low)", t: "RESOLVED" },
  } as const;
  const v = map[s];
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
      style={{ color: v.c, borderColor: v.c }}>
      {v.t}
    </span>
  );
}

export function RecommendationsPanel({ state }: { state: SimState }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span>AI Recommendations</span>
        <span className="text-muted-foreground">AGENTIC</span>
      </div>
      <div className="p-3 space-y-2 max-h-[28rem] overflow-y-auto">
        {state.recommendations.length === 0 && (
          <div className="text-xs text-muted-foreground font-mono py-8 text-center">
            OBSERVING SYSTEM…
          </div>
        )}
        {state.recommendations.map(r => (
          <div key={r.id} className="rounded-md border p-3 space-y-1.5"
            style={{
              borderColor: priorityColor[r.priority],
              background: `color-mix(in oklab, ${priorityColor[r.priority]} 6%, var(--color-card))`,
            }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest"
                style={{ color: priorityColor[r.priority] }}>
                {r.priority}
              </span>
              <StatusPill s={r.status} />
            </div>
            <div className="text-sm font-medium leading-snug">{r.action}</div>
            <div className="text-xs text-muted-foreground">{r.reason}</div>
            <div className="text-xs font-mono" style={{ color: priorityColor[r.priority] }}>
              → {r.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
