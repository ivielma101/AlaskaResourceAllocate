import { ChangeEvent } from 'react';
import { useSimulationStore } from '@/app/store';
import type { RiskLevel } from '@/types/domain';

const riskOptions: { value: RiskLevel; description: string }[] = [
  { value: 'Low', description: 'Manageable demand, ample resources nearby' },
  { value: 'Medium', description: 'Moderate strain on regional logistics' },
  { value: 'High', description: 'Significant shortage and urgent response' }
];

export const IncidentPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const setDemand = useSimulationStore((state) => state.setDemand);
  const setRiskPreset = useSimulationStore((state) => state.setRiskPreset);
  const reset = useSimulationStore((state) => state.reset);
  const createDemoScenario = useSimulationStore((state) => state.createDemoScenario);

  const handleDemandChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setDemand(Number.isFinite(value) ? value : 0);
  };

  const handleRiskSelect = (risk: RiskLevel) => {
    setRiskPreset(risk);
  };

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Incident</h2>
        <button
          type="button"
          className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
          onClick={() => {
            reset();
          }}
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500">Click the map to set the incident location.</p>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        {incident.location ? (
          <div className="flex items-center justify-between">
            <span>Latitude</span>
            <span className="font-mono text-slate-800">{incident.location.lat.toFixed(3)}</span>
          </div>
        ) : (
          <p className="text-slate-500">Click the map to set coordinates.</p>
        )}
        {incident.location && (
          <div className="mt-1 flex items-center justify-between">
            <span>Longitude</span>
            <span className="font-mono text-slate-800">{incident.location.lng.toFixed(3)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Adjuster</p>
        <div className="mt-2 grid gap-2">
          {riskOptions.map((option) => {
            const isActive = incident.riskPreset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRiskSelect(option.value)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition hover:border-sky-400 hover:text-sky-700 ${
                  isActive
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="font-semibold">{option.value} Risk</span>
                  {isActive && (
                    <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white">Active</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Total Demand
        <input
          type="number"
          min={0}
          value={incident.demand}
          onChange={handleDemandChange}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <input
          type="range"
          min={0}
          max={400}
          step={10}
          value={incident.demand}
          onChange={handleDemandChange}
          className="mt-3 w-full accent-sky-500"
        />
      </label>
      <div className="mt-3 rounded-md border border-slate-200 p-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Risk preset</span>
          <span className="font-semibold text-slate-800">{incident.riskPreset}</span>
        </div>
        <p className="mt-1 text-slate-500">
          Adjust the slider or choose a preset to immediately update allocation results and on-map symbology.
        </p>
      </div>
      <button
        type="button"
        onClick={createDemoScenario}
        className="mt-4 w-full rounded-md border border-sky-500 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
      >
        Load Demo Scenario
      </button>
    </section>
  );
};
