import type {
  PassengerAgent, Scenario, SecurityAgent, SimState, TrainAgent, Vec2,
} from "./types";
import {
  ENTRY_GATE, EXIT_GATE, MAP_H, MAP_W, TICKET, WAITING,
  platformBoardingPoint, platformLine, platformY,
} from "./layout";
import { computePlatformDensities, predictDensities } from "./prediction";
import { generateRecommendations } from "./recommendation";

const VISIBLE_PASSENGERS = 320; // sampled agents on the canvas

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

function spawnPassenger(id: string, scenario: Scenario): PassengerAgent {
  // weighted platform pick — platform 4 is "hot" in the demo
  const r = Math.random();
  let platform = Math.ceil(Math.random() * scenario.platforms);
  if (scenario.platforms >= 4 && r < 0.45) platform = 4;
  const entry: Vec2 = {
    x: ENTRY_GATE.x + rand(-15, 15),
    y: ENTRY_GATE.y + rand(-80, 80),
  };
  return {
    id,
    pos: entry,
    target: TICKET,
    platform,
    speed: rand(0.55, 1.0),
    stress: 0,
    state: "walking",
  };
}

export function createInitialState(scenario: Scenario): SimState {
  const passengers: PassengerAgent[] = Array.from({ length: VISIBLE_PASSENGERS }, (_, i) =>
    spawnPassenger(`p-${i}`, scenario),
  );
  const trains: TrainAgent[] = Array.from({ length: scenario.platforms }, (_, i) => ({
    id: `t-${i + 1}`,
    name: ["Rajdhani", "Shatabdi", "Duronto", "Vande Bharat", "Tejas", "Garib Rath"][i % 6] + ` ${1200 + i * 13}`,
    platform: i + 1,
    status: i === 3 ? "delayed" : i === 0 ? "boarding" : "scheduled",
    delay: i === 3 ? scenario.delayMinutes : 0,
    progress: i === 0 ? 0.6 : 0,
    etaSec: i === 0 ? 0 : 60 + i * 45,
  }));
  const security: SecurityAgent[] = Array.from({ length: Math.max(4, Math.min(10, scenario.securityStaff)) }, (_, i) => ({
    id: `s-${i + 1}`,
    pos: { x: 220 + (i * 70) % 660, y: 600 - 20 },
    target: { x: 220 + (i * 70) % 660, y: 600 - 20 },
    zone: (i % scenario.platforms) + 1,
    status: "patrol",
  }));

  const state: SimState = {
    tick: 0,
    scenario,
    passengers,
    trains,
    security,
    platforms: [],
    predictions: [],
    recommendations: [],
    alerts: [],
    densityHistory: [],
    running: true,
    speed: 1,
    loopStage: "OBSERVE",
  };
  state.platforms = computePlatformDensities(state);
  return state;
}

function stepPassenger(p: PassengerAgent, scenario: Scenario, redirectFrom: Set<number>): void {
  // Decide next target based on state.
  if (p.state === "walking" && p.target === TICKET && dist(p.pos, TICKET) < 14) {
    p.target = WAITING;
  } else if (p.state === "walking" && p.target === WAITING && dist(p.pos, WAITING) < 14) {
    if (redirectFrom.has(p.platform) && Math.random() < 0.4) {
      // pick a calmer platform
      const alt = ((p.platform) % scenario.platforms) + 1;
      p.platform = alt;
    }
    p.target = platformBoardingPoint(p.platform, scenario.platforms);
  } else if (p.target.x > 880 && dist(p.pos, p.target) < 12) {
    // boarded -> exit
    p.target = EXIT_GATE;
    p.state = "walking";
  } else if (p.target === EXIT_GATE && dist(p.pos, EXIT_GATE) < 14) {
    // recycle
    Object.assign(p, spawnPassenger(p.id, scenario));
    return;
  } else if (dist(p.pos, platformBoardingPoint(p.platform, scenario.platforms)) < 16) {
    p.state = "queued";
    // shuffle along the platform line
    const line = platformLine(p.platform, scenario.platforms);
    p.target = { x: rand(line.x1 + 20, line.x2 - 20), y: line.y + rand(-8, 8) };
  }

  const dx = p.target.x - p.pos.x;
  const dy = p.target.y - p.pos.y;
  const d = Math.hypot(dx, dy) || 1;
  const speed = p.speed * (p.state === "panic" ? 1.6 : 1);
  p.pos.x += (dx / d) * speed;
  p.pos.y += (dy / d) * speed;
  // clamp
  p.pos.x = Math.max(0, Math.min(MAP_W, p.pos.x));
  p.pos.y = Math.max(0, Math.min(MAP_H, p.pos.y));
}

function stepTrain(t: TrainAgent): void {
  if (t.status === "scheduled") {
    t.etaSec = Math.max(0, t.etaSec - 1);
    if (t.etaSec <= 0) t.status = "arriving";
  } else if (t.status === "arriving") {
    t.progress = Math.min(1, t.progress + 0.01);
    if (t.progress >= 1) {
      t.status = "boarding";
      t.etaSec = 30;
    }
  } else if (t.status === "boarding") {
    t.etaSec = Math.max(0, t.etaSec - 1);
    if (t.etaSec <= 0) t.status = "departing";
  } else if (t.status === "departing") {
    t.progress = Math.max(0, t.progress - 0.015);
    if (t.progress <= 0) {
      t.status = "scheduled";
      t.etaSec = 90 + Math.random() * 60;
      t.progress = 0;
    }
  } else if (t.status === "delayed") {
    if (Math.random() < 0.002) {
      t.status = "arriving";
      t.delay = 0;
    }
  }
}

function stepSecurity(s: SecurityAgent, state: SimState): void {
  const dx = s.target.x - s.pos.x;
  const dy = s.target.y - s.pos.y;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    s.pos.x += (dx / d) * 1.6;
    s.pos.y += (dy / d) * 1.6;
  } else if (s.status === "patrol") {
    // wander
    s.target = { x: rand(220, 880), y: rand(180, 580) };
  }
}

export function tick(state: SimState): SimState {
  if (!state.running) return state;
  state.tick++;

  // Stage cycle for the agentic loop indicator
  const cycle = state.tick % 20;
  state.loopStage =
    cycle < 4 ? "OBSERVE" :
    cycle < 8 ? "PREDICT" :
    cycle < 12 ? "REASON" :
    cycle < 16 ? "RECOMMEND" : "ACT";

  // Determine redirect set from active recs
  const redirectFrom = new Set<number>();
  for (const r of state.recommendations) {
    if (r.action.startsWith("Redirect") && r.platform && r.status !== "complete") {
      redirectFrom.add(r.platform);
    }
  }

  for (const p of state.passengers) stepPassenger(p, state.scenario, redirectFrom);
  for (const t of state.trains) stepTrain(t);

  // Direct security agents to most congested platform if HIGH+
  state.platforms = computePlatformDensities(state);
  const hot = [...state.platforms].sort((a, b) => b.density - a.density)[0];
  for (const s of state.security) {
    if (hot && hot.density >= 0.7) {
      const bp = platformBoardingPoint(hot.id, state.scenario.platforms);
      s.target = { x: bp.x + rand(-60, 60), y: bp.y + rand(-10, 10) };
      s.status = "responding";
    } else {
      s.status = "patrol";
    }
    stepSecurity(s, state);
  }

  // History (cap)
  state.densityHistory.push({ tick: state.tick, values: state.platforms.map(p => p.density) });
  if (state.densityHistory.length > 120) state.densityHistory.shift();

  // Predictions every 10 ticks
  if (state.tick % 10 === 0) {
    state.predictions = predictDensities(state);
  }

  // Recommendations every 15 ticks
  if (state.tick % 15 === 0) {
    const newRecs = generateRecommendations(state);
    for (const r of newRecs) {
      state.recommendations.unshift(r);
      state.alerts.unshift({
        id: `a-${r.id}`,
        tick: state.tick,
        text: r.action,
        level: r.priority === "CRITICAL" ? "CRITICAL" : r.priority === "HIGH" ? "HIGH" : "MEDIUM",
      });
    }
    state.recommendations = state.recommendations.slice(0, 12);
    state.alerts = state.alerts.slice(0, 20);
  }

  // Auto-progress rec statuses
  for (const r of state.recommendations) {
    const age = state.tick - r.issuedTick;
    if (age > 8 && r.status === "pending") r.status = "active";
    if (age > 40 && r.status === "active") r.status = "complete";
  }

  return state;
}

export const DEFAULT_SCENARIO: Scenario = {
  station: "Mumbai CST",
  passengers: 20000,
  platforms: 6,
  weather: "Rain",
  festival: true,
  delayMinutes: 15,
  securityStaff: 8,
  emergency: false,
};
