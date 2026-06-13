import { useState } from "react";
import type { Scenario } from "@/lib/simulation/types";

interface Props {
  initial: Scenario;
  running: boolean;
  speed: number;
  onRun: (s: Scenario) => void;
  onToggleRun: () => void;
  onSpeed: (s: number) => void;
}

export function ScenarioBuilder({ initial, running, speed, onRun, onToggleRun, onSpeed }: Props) {
  const [s, setS] = useState<Scenario>(initial);
  const upd = <K extends keyof Scenario>(k: K, v: Scenario[K]) => setS({ ...s, [k]: v });

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Scenario Builder</span>
        <span className="text-muted-foreground">SCN-01</span>
      </div>
      <div className="p-4 space-y-3 text-xs">
        <Field label="Station">
          <select value={s.station} onChange={e => upd("station", e.target.value)} className={inp}>
            {["Mumbai CST", "New Delhi", "Howrah Jn", "Chennai Central", "Bengaluru SBC"].map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Passengers">
          <input type="number" value={s.passengers}
            onChange={e => upd("passengers", +e.target.value)} className={inp} />
        </Field>
        <Field label="Platforms">
          <input type="number" min={2} max={8} value={s.platforms}
            onChange={e => upd("platforms", Math.max(2, Math.min(8, +e.target.value)))} className={inp} />
        </Field>
        <Field label="Weather">
          <select value={s.weather} onChange={e => upd("weather", e.target.value as Scenario["weather"])} className={inp}>
            {["Clear", "Rain", "Fog", "Storm"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Train delay (min)">
          <input type="number" value={s.delayMinutes}
            onChange={e => upd("delayMinutes", +e.target.value)} className={inp} />
        </Field>
        <Field label="Security staff">
          <input type="number" value={s.securityStaff}
            onChange={e => upd("securityStaff", +e.target.value)} className={inp} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Festival" v={s.festival} on={v => upd("festival", v)} />
          <Toggle label="Emergency" v={s.emergency} on={v => upd("emergency", v)} />
        </div>

        <button
          onClick={() => onRun(s)}
          className="w-full mt-2 py-2.5 rounded-md font-mono text-xs tracking-widest font-bold bg-primary text-primary-foreground glow-cyan hover:brightness-110 transition">
          ▶ RUN SIMULATION
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onToggleRun}
            className="py-2 rounded-md border border-border font-mono text-xs hover:bg-secondary">
            {running ? "❚❚ PAUSE" : "▶ RESUME"}
          </button>
          <select value={speed} onChange={e => onSpeed(+e.target.value)}
            className={inp + " font-mono"}>
            {[0.5, 1, 2, 4].map(v => <option key={v} value={v}>{v}× SPEED</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full bg-input/60 border border-border rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}

function Toggle({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return (
    <button onClick={() => on(!v)}
      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border hover:bg-secondary">
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</span>
      <span className={"w-8 h-4 rounded-full relative transition " + (v ? "bg-primary" : "bg-secondary")}>
        <span className={"absolute top-0.5 w-3 h-3 rounded-full bg-background transition " + (v ? "left-4" : "left-0.5")} />
      </span>
    </button>
  );
}
