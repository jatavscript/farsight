import { createFileRoute } from "@tanstack/react-router";
import { useSimulation } from "@/lib/simulation/useSimulation";
import { DEFAULT_SCENARIO } from "@/lib/simulation/engine";
import { Header } from "@/components/farsight/Header";
import { ScenarioBuilder } from "@/components/farsight/ScenarioBuilder";
import { SimulationMap } from "@/components/farsight/SimulationMap";
import { PlatformDensityPanel } from "@/components/farsight/PlatformDensityPanel";
import { RiskAlertsPanel } from "@/components/farsight/RiskAlertsPanel";
import { RecommendationsPanel } from "@/components/farsight/RecommendationsPanel";
import { PredictionTimeline } from "@/components/farsight/PredictionTimeline";
import { AgenticLoop } from "@/components/farsight/AgenticLoop";
import { AgentStatus } from "@/components/farsight/AgentStatus";
import { Ticker } from "@/components/farsight/Ticker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FARSIGHT · Railway Intelligence Platform" },
      { name: "description", content: "AI-powered railway control room — predict, prevent, protect. Live multi-agent simulation, crowd-density forecasting, and autonomous recommendations." },
      { property: "og:title", content: "FARSIGHT · Railway Intelligence" },
      { property: "og:description", content: "Predict. Prevent. Protect. Live agentic simulation for Indian Railways." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-widest text-muted-foreground">INITIALIZING FARSIGHT CONTROL ROOM…</div>;
  }
  return <DashboardInner />;
}

function DashboardInner() {
  const { state, reset, setRunning, setSpeed } = useSimulation(DEFAULT_SCENARIO);

  return (
    <div className="min-h-screen p-3 md:p-4 space-y-3">
      <Header state={state} />
      <Ticker state={state} />
      <AgenticLoop state={state} />

      <div className="grid grid-cols-12 gap-3">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <ScenarioBuilder
            initial={state.scenario}
            running={state.running}
            speed={state.speed}
            onRun={reset}
            onToggleRun={() => setRunning(!state.running)}
            onSpeed={setSpeed}
          />
          <PlatformDensityPanel state={state} />
        </div>

        {/* Center map */}
        <div className="col-span-12 lg:col-span-6 space-y-3">
          <div className="panel scanline scanline-after">
            <div className="panel-header">
              <span>Live Simulation Map · {state.scenario.station}</span>
              <span className="text-muted-foreground">T+{state.tick}</span>
            </div>
            <div className="aspect-[5/3] bg-background/40">
              <SimulationMap state={state} />
            </div>
          </div>
          <PredictionTimeline state={state} />
          <AgentStatus state={state} />
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <RiskAlertsPanel state={state} />
          <RecommendationsPanel state={state} />
        </div>
      </div>

      <footer className="text-center text-[10px] font-mono tracking-widest text-muted-foreground py-2">
        FARSIGHT · PREDICT · PREVENT · PROTECT · v1.0 DEMO
      </footer>
    </div>
  );
}
