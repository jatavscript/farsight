import type { Recommendation, SimState } from "./types";

let recIdCounter = 0;
const cooldown = new Map<string, number>();

export function generateRecommendations(state: SimState): Recommendation[] {
  const out: Recommendation[] = [];
  const fire = (key: string, rec: Omit<Recommendation, "id" | "issuedTick" | "status">) => {
    const last = cooldown.get(key) ?? -9999;
    if (state.tick - last < 60) return;
    cooldown.set(key, state.tick);
    out.push({
      ...rec,
      id: `rec-${++recIdCounter}`,
      issuedTick: state.tick,
      status: "pending",
    });
  };

  for (const p of state.platforms) {
    if (p.density >= 0.9) {
      fire(`gate-${p.id}`, {
        priority: "CRITICAL",
        action: `Open emergency Gate ${p.id}B near Platform ${p.id}`,
        reason: `Platform ${p.id} at ${(p.density * 100).toFixed(0)}% density — critical congestion`,
        impact: "Reduce congestion by ~20% within 4 minutes",
        platform: p.id,
      });
      fire(`rpf-${p.id}`, {
        priority: "CRITICAL",
        action: `Deploy 2 RPF officers to Platform ${p.id}`,
        reason: "Critical density risk — crowd-control needed on the ground",
        impact: "Stabilize flow and prevent stampede risk",
        platform: p.id,
      });
    } else if (p.density >= 0.7) {
      const alt = state.platforms.reduce((a, b) => (a.density < b.density ? a : b));
      if (alt.id !== p.id) {
        fire(`redirect-${p.id}->${alt.id}`, {
          priority: "HIGH",
          action: `Redirect 35% passengers from Platform ${p.id} → Platform ${alt.id}`,
          reason: `Platform ${p.id} approaching critical (${(p.density * 100).toFixed(0)}%)`,
          impact: `Drop density to ~${((p.density - 0.25) * 100).toFixed(0)}%`,
          platform: p.id,
        });
      }
      fire(`pa-${p.id}`, {
        priority: "HIGH",
        action: `Activate Public Announcement for Platform ${p.id}`,
        reason: "High density — passengers must be informed",
        impact: "Reduce queue panic by ~15%",
        platform: p.id,
      });
    }
  }

  if (state.scenario.delayMinutes >= 10) {
    fire("delay-alert", {
      priority: "MEDIUM",
      action: `Broadcast train-delay advisory (${state.scenario.delayMinutes} min)`,
      reason: "Sustained train delay raises platform dwell time",
      impact: "Prevent cascading congestion across platforms",
    });
  }

  if (state.scenario.weather === "Rain" || state.scenario.weather === "Storm") {
    fire("weather", {
      priority: "MEDIUM",
      action: "Activate covered-walkway lighting & deploy mop crews",
      reason: `Weather: ${state.scenario.weather} — slip risk elevated`,
      impact: "Cut medical incidents by ~40%",
    });
  }

  if (state.scenario.emergency) {
    fire("medical", {
      priority: "CRITICAL",
      action: "Dispatch medical team to incident zone",
      reason: "Active emergency reported",
      impact: "Reduce response time to under 90 seconds",
    });
  }

  return out;
}
