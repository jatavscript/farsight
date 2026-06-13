import type { SimState } from "@/lib/simulation/types";

const STAGES = ["OBSERVE", "PREDICT", "REASON", "RECOMMEND", "ACT"] as const;

export function AgenticLoop({ state }: { state: SimState }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span>Agentic Decision Loop</span>
        <span className="text-muted-foreground">T+{state.tick}</span>
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        {STAGES.map((s, i) => {
          const active = state.loopStage === s;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 font-mono text-[11px] font-bold transition-all"
                  style={{
                    borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    background: active ? "color-mix(in oklab, var(--color-primary) 20%, transparent)" : "transparent",
                    color: active ? "var(--color-primary)" : "var(--color-muted-foreground)",
                    boxShadow: active ? "0 0 18px var(--color-primary)" : undefined,
                  }}>
                  {i + 1}
                </div>
                <span className="text-[10px] font-mono tracking-wider"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}>
                  {s}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="h-px flex-1 bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
