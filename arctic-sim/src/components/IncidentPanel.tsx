import { ChangeEvent } from 'react';
import { useSimulationStore } from '@/app/store';

export const IncidentPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const setDemand = useSimulationStore((state) => state.setDemand);
  const reset = useSimulationStore((state) => state.reset);
  const createDemoScenario = useSimulationStore((state) => state.createDemoScenario);

  const handleDemandChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setDemand(Number.isFinite(value) ? value : 0);
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
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Total Demand
        <input
          type="number"
          min={0}
          value={incident.demand}
          onChange={handleDemandChange}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </label>
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
