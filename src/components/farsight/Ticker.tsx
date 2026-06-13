import type { SimState } from "@/lib/simulation/types";

export function Ticker({ state }: { state: SimState }) {
  const items: string[] = [];
  for (const t of state.trains) {
    items.push(`${t.name} · P${t.platform} · ${t.status.toUpperCase()}${t.delay ? ` +${t.delay}m DELAY` : ""}`);
  }
  for (const a of state.alerts.slice(0, 4)) {
    items.push(`◆ ${a.level} · ${a.text}`);
  }
  const text = items.join("     ◆     ");
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center">
        <div className="bg-primary text-primary-foreground px-3 py-1.5 font-mono text-xs tracking-widest font-bold whitespace-nowrap">
          LIVE FEED
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap py-1.5">
          <div className="inline-block animate-ticker font-mono text-xs text-primary">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
