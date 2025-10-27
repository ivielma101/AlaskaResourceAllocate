import { ChangeEvent } from 'react';
import { useSimulationStore } from '@/app/store';

export const StagingAreasPanel = () => {
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
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
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Staging Areas</h2>
        <button
          type="button"
          onClick={() => addStaging()}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:border-slate-400"
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500">Shift + click the map to add staging markers. Drag them to adjust their locations.</p>
      <div className="mt-4 space-y-3">
        {stagingAreas.length === 0 && (
          <p className="text-sm text-slate-500">No staging areas yet. Add one to begin planning.</p>
        )}
        {stagingAreas.map((area) => (
          <div key={area.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <div className="flex items-center gap-2">
              <label className="flex-1 text-xs uppercase tracking-wide text-slate-500">
                Name
                <input
                  type="text"
                  value={area.name}
                  onChange={(event) => handleNameChange(area.id, event)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="w-32 text-xs uppercase tracking-wide text-slate-500">
                Available
                <input
                  type="number"
                  min={0}
                  value={area.available}
                  onChange={(event) => handleAvailableChange(area.id, event)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">{area.location.lat.toFixed(3)}, {area.location.lng.toFixed(3)}</span>
              <button
                type="button"
                onClick={() => removeStaging(area.id)}
                className="text-xs font-medium text-rose-500 hover:text-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
