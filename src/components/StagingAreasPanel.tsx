import { ChangeEvent } from 'react';
import { useSimulationStore } from '@/app/store';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';

export const StagingAreasPanel = () => {
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const travelMetrics = useSimulationStore((state) => state.travelMetrics);
  const addStaging = useSimulationStore((state) => state.addStaging);
  const updateStaging = useSimulationStore((state) => state.updateStaging);
  const removeStaging = useSimulationStore((state) => state.removeStaging);

  const handleNameChange = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    updateStaging(id, { name: event.target.value });
  };

  const handleAvailableChange = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    updateStaging(id, { available: Number.isFinite(value) ? value : 0 });
  };

  return (
    <section id="resources" aria-labelledby="resources-heading" className="panel-surface">
      <div className="panel-content">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Resources</p>
            <h2 id="resources-heading" className="panel-title">
              Staging nodes
            </h2>
          </div>
          <button type="button" onClick={() => addStaging()} className="btn-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
            Add site
          </button>
        </div>
        <p className="panel-description">Shift + click the map to add markers. Drag them to refine positions.</p>
        <div className="space-y-4">
          {stagingAreas.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No staging areas yet. Add one to begin planning.
            </p>
          )}
          {stagingAreas.map((area) => {
            const metrics = travelMetrics[area.id];

            return (
              <article key={area.id} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
                  <label className="flex-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                    Name
                    <input
                      type="text"
                      value={area.name}
                      onChange={(event) => handleNameChange(area.id, event)}
                      className="input-surface mt-2"
                    />
                  </label>
                  <label className="w-full text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600 sm:w-32">
                    Available
                    <input
                      type="number"
                      min={0}
                      value={area.available}
                      onChange={(event) => handleAvailableChange(area.id, event)}
                      className="input-surface mt-2"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono text-slate-700">
                    {area.location.lat.toFixed(3)}, {area.location.lng.toFixed(3)}
                  </span>
                  <button type="button" onClick={() => removeStaging(area.id)} className="btn-destructive">
                    Delete
                  </button>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    <span>Google Maps travel time</span>
                    <span className="text-[9px] font-medium tracking-[0.4em] text-slate-500">Live</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    {(!metrics || metrics.status === 'idle') && (
                      <p className="text-xs text-slate-600">Set an incident location to retrieve routing estimates.</p>
                    )}
                    {metrics?.status === 'loading' && (
                      <p className="text-xs text-slate-600">Fetching distance matrix…</p>
                    )}
                    {metrics?.status === 'ready' && (
                      <dl className="flex flex-wrap gap-4">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.32em] text-slate-600">Distance</dt>
                          <dd className="mt-1 font-mono text-sm text-slate-900">
                            {metrics.distanceKm !== undefined ? formatKilometers(metrics.distanceKm) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.32em] text-slate-600">ETA</dt>
                          <dd className="mt-1 font-mono text-sm text-slate-900">
                            {metrics.etaMinutes !== undefined ? formatMinutes(metrics.etaMinutes) : '—'}
                          </dd>
                        </div>
                      </dl>
                    )}
                    {metrics?.status === 'error' && (
                      <div className="space-y-1 text-xs">
                        <p className="text-rose-600">Unable to load Google Maps travel time.</p>
                        {metrics.fallbackDistanceKm !== undefined && (
                          <p className="text-slate-600">
                            Fallback distance: {formatKilometers(metrics.fallbackDistanceKm)}
                          </p>
                        )}
                        {metrics.errorMessage && (
                          <p className="text-[10px] uppercase tracking-[0.32em] text-rose-500/80">
                            {metrics.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
