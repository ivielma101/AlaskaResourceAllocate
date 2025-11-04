import { useCallback } from 'react';
import { useSimulationStore } from '@/app/store';
import type { RiskLevel } from '@/types/domain';

type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  risk: RiskLevel;
  demand: number;
  location: { lat: number; lng: number };
  travelSpeed?: number;
  staging: Array<{ name: string; lat: number; lng: number; available: number }>;
};

const scenarioPresets: ScenarioPreset[] = [
  {
    id: 'storm',
    name: 'Bering Sea storm surge',
    description: 'Severe coastal flooding impacting western villages and cargo ports.',
    risk: 'High',
    demand: 240,
    location: { lat: 64.5011, lng: -165.4064 },
    travelSpeed: 160,
    staging: [
      { name: 'Anchorage Airlift', lat: 61.2181, lng: -149.9003, available: 120 },
      { name: 'Nome Forward Ops', lat: 64.5011, lng: -165.4064, available: 60 },
      { name: 'Fairbanks Guard', lat: 64.8378, lng: -147.7164, available: 80 }
    ]
  },
  {
    id: 'wildfire',
    name: 'Interior wildfire smoke event',
    description: 'Thick smoke and evacuations requiring airborne-capable facilities.',
    risk: 'Medium',
    demand: 150,
    location: { lat: 65.1667, lng: -152.0833 },
    travelSpeed: 200,
    staging: [
      { name: 'Fairbanks Hub', lat: 64.8378, lng: -147.7164, available: 110 },
      { name: 'Anchorage Support', lat: 61.2181, lng: -149.9003, available: 90 },
      { name: 'Juneau Reserve', lat: 58.3019, lng: -134.4197, available: 50 }
    ]
  },
  {
    id: 'tsunami',
    name: 'Gulf coast tsunami drill',
    description: 'Logistics rehearsal connecting ports to inland incidents.',
    risk: 'Low',
    demand: 90,
    location: { lat: 60.1042, lng: -149.4422 },
    travelSpeed: 220,
    staging: [
      { name: 'Seward Port', lat: 60.1042, lng: -149.4422, available: 45 },
      { name: 'Anchorage Logistics', lat: 61.2181, lng: -149.9003, available: 70 },
      { name: 'Kodiak Support', lat: 57.79, lng: -152.4072, available: 40 }
    ]
  }
];

export const SimulationControlsPanel = () => {
  const reset = useSimulationStore((state) => state.reset);
  const setIncidentLocation = useSimulationStore((state) => state.setIncidentLocation);
  const setRiskPreset = useSimulationStore((state) => state.setRiskPreset);
  const setDemand = useSimulationStore((state) => state.setDemand);
  const addStaging = useSimulationStore((state) => state.addStaging);
  const setTravelSpeed = useSimulationStore((state) => state.setTravelSpeed);
  const setToast = useSimulationStore((state) => state.setToast);

  const applyPreset = useCallback(
    (preset: ScenarioPreset) => {
      reset();
      setIncidentLocation(preset.location);
      setDemand(preset.demand);
      setRiskPreset(preset.risk, { syncDemand: false });
      preset.staging.forEach((stage) => {
        addStaging({ lat: stage.lat, lng: stage.lng }, { name: stage.name, available: stage.available });
      });
      if (preset.travelSpeed) {
        setTravelSpeed(preset.travelSpeed);
      }
      setToast({ message: `Loaded ${preset.name}`, tone: 'success' });
    },
    [addStaging, reset, setDemand, setIncidentLocation, setRiskPreset, setToast, setTravelSpeed]
  );

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-base font-semibold text-slate-800">Simulation presets</h2>
      <p className="mt-1 text-sm text-slate-500">
        Launch interactive drills that reposition resources, adjust risk levels, and recalculate utilisation in real time.
      </p>
      <div className="mt-4 space-y-3">
        {scenarioPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-sky-400 hover:bg-sky-50"
          >
            <span className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{preset.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{preset.risk} risk</span>
            </span>
            <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Tip: drag staging icons on the map after launching a preset to explore alternative travel routes and observe the
        allocation panel update instantly.
      </p>
    </section>
  );
};
