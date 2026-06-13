import type { SimState } from "@/lib/simulation/types";

const statusColor = {
  arriving: "var(--color-primary)",
  boarding: "var(--color-risk-low)",
  departing: "var(--color-muted-foreground)",
  delayed: "var(--color-risk-critical)",
  scheduled: "var(--color-muted-foreground)",
} as const;

export function AgentStatus({ state }: { state: SimState }) {
  const responding = state.security.filter(s => s.status === "responding").length;
  return (
    <div className="panel">
      <div className="panel-header">
        <span>Agent Fleet</span>
        <span className="text-muted-foreground">{state.passengers.length + state.security.length + state.trains.length} ACTIVE</span>
      </div>
      <div className="p-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label="PASSENGERS" v={state.passengers.length} color="var(--color-cyan)" />
        <Stat label="SECURITY" v={`${responding}/${state.security.length}`} color="var(--color-accent)" />
        <Stat label="TRAINS" v={state.trains.length} color="var(--color-primary)" />
      </div>
      <div className="px-3 pb-3 space-y-1 max-h-44 overflow-y-auto">
        {state.trains.map(t => (
          <div key={t.id} className="flex items-center justify-between text-xs font-mono py-1 border-t border-border">
            <span>P{t.platform}</span>
            <span className="flex-1 px-2 truncate">{t.name}</span>
            <span style={{ color: statusColor[t.status] }} className="uppercase">
              {t.status}{t.delay > 0 ? ` +${t.delay}m` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, v, color }: { label: string; v: number | string; color: string }) {
  return (
    <div className="rounded-md border border-border p-2 text-center">
      <div className="text-[9px] font-mono tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color }}>{v}</div>
    </div>
  );
}
