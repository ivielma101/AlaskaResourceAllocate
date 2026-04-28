import { ChangeEvent, useMemo } from 'react';
import { useSimulationStore } from '@/app/store';
import { getDemandRiskLevel, getRiskCopy, RISK_BADGE_CLASSES } from '@/lib/risk';

export const IncidentPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const setDemand = useSimulationStore((state) => state.setDemand);
  const reset = useSimulationStore((state) => state.reset);
  const createDemoScenario = useSimulationStore((state) => state.createDemoScenario);

  const demandRisk = useMemo(() => getDemandRiskLevel(incident.demand), [incident.demand]);
  const demandRiskCopy = useMemo(() => getRiskCopy(demandRisk), [demandRisk]);

  const handleDemandChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setDemand(Number.isFinite(value) ? value : 0);
  };

  return (
    <section id="incident" aria-labelledby="incident-heading" className="panel-surface">
      <div className="panel-content">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Incident setup</p>
            <h2 id="incident-heading" className="panel-title">
              Define the event
            </h2>
          </div>
          <button
            type="button"
            className="btn-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em]"
            onClick={() => {
              reset();
            }}
          >
            Reset
          </button>
        </div>
        <p className="panel-description">
          Click anywhere on the map to place the incident centroid.
        </p>
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
          <div className="min-w-[180px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="panel-eyebrow text-[10px] tracking-[0.28em]">Latitude</p>
            <p className="mt-2 font-mono text-base text-slate-900">
              {incident.location ? incident.location.lat.toFixed(3) : '—'}
            </p>
          </div>
          <div className="min-w-[180px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="panel-eyebrow text-[10px] tracking-[0.28em]">Longitude</p>
            <p className="mt-2 font-mono text-base text-slate-900">
              {incident.location ? incident.location.lng.toFixed(3) : '—'}
            </p>
          </div>
          <div className="min-w-[200px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="panel-eyebrow text-[10px] tracking-[0.28em]">Current risk</p>
            <p className="mt-2 font-semibold text-slate-900">{demandRisk}</p>
            <p className="text-xs text-slate-600">{demandRiskCopy}</p>
          </div>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Total demand
          <input
            type="number"
            min={0}
            value={incident.demand}
            onChange={handleDemandChange}
            className="input-surface mt-2"
            aria-describedby="incident-demand-hint"
          />
        </label>
        <p id="incident-demand-hint" className="text-xs text-slate-500">
          Estimate the number of impacted people requiring allocation support.
        </p>
        <button type="button" onClick={createDemoScenario} className="btn-primary w-full justify-center rounded-xl">
          Load demo scenario
        </button>
      </div>
    </section>
  );
};
