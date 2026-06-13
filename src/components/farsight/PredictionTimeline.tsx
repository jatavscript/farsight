import type { SimState } from "@/lib/simulation/types";

const riskColor = {
  LOW: "var(--color-risk-low)",
  MEDIUM: "var(--color-risk-medium)",
  HIGH: "var(--color-risk-high)",
  CRITICAL: "var(--color-risk-critical)",
} as const;

export function PredictionTimeline({ state }: { state: SimState }) {
  const horizons: (15 | 30 | 60)[] = [15, 30, 60];
  return (
    <div className="panel">
      <div className="panel-header">
        <span>Prediction Timeline</span>
        <span className="text-muted-foreground">15 / 30 / 60 MIN</span>
      </div>
      <div className="p-3 overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left pb-2">PLAT</th>
              {horizons.map(h => (
                <th key={h} className="text-center pb-2">+{h}m</th>
              ))}
              <th className="text-right pb-2">ETA→CRIT</th>
            </tr>
          </thead>
          <tbody>
            {state.platforms.map(p => {
              const preds = horizons.map(h =>
                state.predictions.find(pp => pp.platform === p.id && pp.horizonMin === h));
              const eta = preds[0]?.minutesToCritical ?? null;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-1.5">P{p.id}</td>
                  {preds.map((pr, i) => (
                    <td key={i} className="text-center py-1.5">
                      {pr ? (
                        <span style={{ color: riskColor[pr.risk] }}>
                          {Math.round(pr.predictedDensity * 100)}%
                        </span>
                      ) : "—"}
                    </td>
                  ))}
                  <td className="text-right py-1.5"
                    style={{ color: eta != null && eta < 20 ? "var(--color-risk-critical)" : "var(--color-muted-foreground)" }}>
                    {eta != null ? `${eta}m` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
