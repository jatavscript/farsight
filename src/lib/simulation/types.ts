export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Scenario {
  station: string;
  passengers: number;
  platforms: number;
  weather: "Clear" | "Rain" | "Fog" | "Storm";
  festival: boolean;
  delayMinutes: number;
  securityStaff: number;
  emergency: boolean;
}

export interface Vec2 { x: number; y: number; }

export interface PassengerAgent {
  id: string;
  pos: Vec2;
  target: Vec2;
  platform: number;
  speed: number;
  stress: number;
  state: "walking" | "queued" | "panic" | "boarding";
}

export interface TrainAgent {
  id: string;
  name: string;
  platform: number;
  status: "arriving" | "boarding" | "departing" | "delayed" | "scheduled";
  delay: number;
  progress: number; // 0-1 along platform
  etaSec: number;
}

export interface SecurityAgent {
  id: string;
  pos: Vec2;
  target: Vec2;
  zone: number;
  status: "patrol" | "responding" | "redirecting";
}

export interface PlatformInfo {
  id: number;
  density: number; // 0-1
  count: number;
  capacity: number;
  risk: RiskLevel;
}

export interface Prediction {
  platform: number;
  horizonMin: 15 | 30 | 60;
  predictedDensity: number;
  minutesToCritical: number | null;
  risk: RiskLevel;
}

export interface Recommendation {
  id: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  action: string;
  reason: string;
  impact: string;
  platform?: number;
  issuedTick: number;
  status: "pending" | "active" | "complete";
}

export interface SimState {
  tick: number;
  scenario: Scenario;
  passengers: PassengerAgent[];
  trains: TrainAgent[];
  security: SecurityAgent[];
  platforms: PlatformInfo[];
  predictions: Prediction[];
  recommendations: Recommendation[];
  alerts: { id: string; tick: number; text: string; level: RiskLevel }[];
  densityHistory: { tick: number; values: number[] }[];
  running: boolean;
  speed: number;
  loopStage: "OBSERVE" | "PREDICT" | "REASON" | "RECOMMEND" | "ACT";
}
