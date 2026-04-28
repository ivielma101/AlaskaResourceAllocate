import { useSimulationStore } from '@/app/store';

export const MapFeatureDetails = () => {
  const selectedFeature = useSimulationStore((state) => state.selectedFeature);
  const setSelectedFeature = useSimulationStore((state) => state.setSelectedFeature);

  const hasSelection = Boolean(selectedFeature.type);

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Feature details</h2>
        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelectedFeature({ type: null })}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>
      {!hasSelection && (
        <p className="mt-2 text-sm text-slate-500">
          Hover or click any icon, route, or arrow on the map to explore live context about needs, travel plans, and supporting
          infrastructure.
        </p>
      )}
      {hasSelection && (
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
            <p className="font-semibold text-slate-800">{selectedFeature.type}</p>
          </div>
          {selectedFeature.title && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
              <p className="font-semibold text-slate-800">{selectedFeature.title}</p>
            </div>
          )}
          {selectedFeature.description && <p className="text-sm text-slate-500">{selectedFeature.description}</p>}
          {selectedFeature.meta && selectedFeature.meta.length > 0 && (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {selectedFeature.meta.map((entry) => (
                <div key={`${selectedFeature.type}-${entry.label}`} className="rounded-md bg-slate-50 p-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{entry.label}</dt>
                  <dd className="font-mono text-slate-800">{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  );
};
