import type { PlatformInfo, RiskLevel, SimState, Prediction } from "./types";

export function riskFromDensity(d: number): RiskLevel {
  if (d >= 0.9) return "CRITICAL";
  if (d >= 0.7) return "HIGH";
  if (d >= 0.4) return "MEDIUM";
  return "LOW";
}

export function computePlatformDensities(state: SimState): PlatformInfo[] {
  const counts = new Array(state.scenario.platforms).fill(0);
  for (const p of state.passengers) {
    if (p.platform >= 1 && p.platform <= state.scenario.platforms) {
      counts[p.platform - 1]++;
    }
  }
  // Per-platform "capacity" budget (visible agents are a sampled subset of real passengers,
  // but we treat density as count / per-platform target).
  const target = Math.max(20, Math.round(state.passengers.length / state.scenario.platforms) * 1.6);
  return counts.map((count, i) => {
    const density = Math.min(1, count / target);
    return {
      id: i + 1,
      count,
      capacity: target,
      density,
      risk: riskFromDensity(density),
    };
  });
}

export function predictDensities(state: SimState): Prediction[] {
  // Simple rule-based prediction: extrapolate from recent history slope + delay/weather/festival multipliers.
  const horizons: (15 | 30 | 60)[] = [15, 30, 60];
  const history = state.densityHistory.slice(-30);
  const out: Prediction[] = [];

  const weatherMult = state.scenario.weather === "Storm" ? 1.25
    : state.scenario.weather === "Rain" ? 1.12
    : state.scenario.weather === "Fog" ? 1.08 : 1;
  const festMult = state.scenario.festival ? 1.18 : 1;
  const delayMult = 1 + Math.min(0.4, state.scenario.delayMinutes / 60);

  for (const p of state.platforms) {
    const series = history.map(h => h.values[p.id - 1] ?? p.density);
    const slope = series.length >= 2
      ? (series[series.length - 1] - series[0]) / Math.max(1, series.length)
      : 0;
    for (const h of horizons) {
      // 1 tick = 1 simulated second; assume ~1 simulated minute per 4 ticks for nice numbers.
      const ticksAhead = h * 4;
      const projected = Math.max(0, Math.min(1.2,
        p.density + slope * ticksAhead * weatherMult * festMult * delayMult,
      ));
      const minutesToCritical = slope > 0.0005
        ? Math.max(0, Math.round(((0.9 - p.density) / slope) / 4))
        : null;
      out.push({
        platform: p.id,
        horizonMin: h,
        predictedDensity: projected,
        minutesToCritical: minutesToCritical && minutesToCritical < 120 ? minutesToCritical : null,
        risk: riskFromDensity(projected),
      });
    }
  }
  return out;
}
