import { useEffect, useRef, useState, useCallback } from "react";
import type { Scenario, SimState } from "./types";
import { createInitialState, DEFAULT_SCENARIO, tick } from "./engine";

export function useSimulation(initial: Scenario = DEFAULT_SCENARIO) {
  const stateRef = useRef<SimState>(createInitialState(initial));
  const [, force] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const loop = useCallback((t: number) => {
    if (!lastRef.current) lastRef.current = t;
    const dt = t - lastRef.current;
    const interval = 1000 / (4 * stateRef.current.speed); // 4 ticks per sim-second baseline
    if (dt >= interval) {
      lastRef.current = t;
      tick(stateRef.current);
      force(n => (n + 1) % 1000000);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loop]);

  const reset = useCallback((scenario: Scenario) => {
    stateRef.current = createInitialState(scenario);
    force(n => n + 1);
  }, []);
  const setRunning = useCallback((r: boolean) => {
    stateRef.current.running = r;
    force(n => n + 1);
  }, []);
  const setSpeed = useCallback((s: number) => {
    stateRef.current.speed = s;
    force(n => n + 1);
  }, []);

  return { state: stateRef.current, reset, setRunning, setSpeed };
}
