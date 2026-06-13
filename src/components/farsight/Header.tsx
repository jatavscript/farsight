import type { SimState } from "@/lib/simulation/types";

export function Header({ state }: { state: SimState }) {
  const time = new Date(Date.now() + state.tick * 250).toLocaleTimeString("en-IN", { hour12: false });
  const overall = state.platforms.length
    ? state.platforms.reduce((a, p) => a + p.density, 0) / state.platforms.length
    : 0;
  const overallPct = Math.round(overall * 100);
  const status = overall > 0.8 ? "CRITICAL" : overall > 0.6 ? "ELEVATED" : overall > 0.4 ? "WATCH" : "NOMINAL";
  const statusColor =
    overall > 0.8 ? "var(--color-risk-critical)" :
    overall > 0.6 ? "var(--color-risk-high)" :
    overall > 0.4 ? "var(--color-risk-medium)" : "var(--color-risk-low)";

  return (
    <header className="panel flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10 rounded-md border border-primary flex items-center justify-center glow-cyan">
          <span className="font-display text-lg text-primary">F</span>
          <span className="absolute inset-0 rounded-md border border-primary/40 animate-pulse-ring" />
        </div>
        <div>
          <div className="font-display text-xl tracking-[0.3em] text-primary">FARSIGHT</div>
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground">
            RAILWAY INTELLIGENCE · {state.scenario.station.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 font-mono text-xs">
        <Field label="WEATHER" v={state.scenario.weather} />
        <Field label="DELAY" v={`${state.scenario.delayMinutes}m`} />
        <Field label="EVENT" v={state.scenario.festival ? "FESTIVAL" : "STANDARD"} />
        <Field label="PAX" v={state.scenario.passengers.toLocaleString()} />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground">SYSTEM STATUS</div>
          <div className="font-display text-sm tracking-widest" style={{ color: statusColor }}>
            {status} · {overallPct}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground">LOCAL TIME</div>
          <div className="font-mono text-sm">{time}</div>
        </div>
      </div>
    </header>
  );
}

function Field({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="text-[9px] tracking-widest text-muted-foreground">{label}</div>
      <div className="text-primary">{v}</div>
    </div>
  );
}
