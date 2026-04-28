import { FormEvent, useState } from 'react';
import { useSimulationStore } from '@/app/store';
import type { IconTheme, MapLayerState } from '@/app/store';

const layerOptions: Array<{ key: keyof MapLayerState; label: string; description: string }> = [
  { key: 'showCities', label: 'City labels', description: 'Toggle visibility of major Alaska city nameplates.' },
  { key: 'showHospitals', label: 'Hospitals', description: 'Show or hide hospital icons and tooltips.' },
  { key: 'showRoutes', label: 'Travel routes', description: 'Display staged resource paths between supply and incident.' },
  { key: 'showArrows', label: 'Flow arrows', description: 'Layer arrows that indicate directionality of movement.' },
  { key: 'showDistances', label: 'Distance & ETA callouts', description: 'Annotate travel paths with distance and travel time overlays.' },
  { key: 'showLegend', label: 'Legend', description: 'Display the interactive map key.' }
];

const iconThemes = [
  { value: 'classic', label: 'Classic (operations blue & risk spectrum)' },
  { value: 'contrast', label: 'High contrast (accessibility friendly)' }
];

export const LayerControlPanel = () => {
  const mapLayers = useSimulationStore((state) => state.mapLayers);
  const toggleLayer = useSimulationStore((state) => state.toggleLayer);
  const setIconTheme = useSimulationStore((state) => state.setIconTheme);
  const iconTheme = useSimulationStore((state) => state.iconTheme);
  const setToast = useSimulationStore((state) => state.setToast);
  const [suggestion, setSuggestion] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!suggestion.trim()) {
      return;
    }
    setToast({ message: 'Thanks for the map styling suggestion! We logged it for follow-up.', tone: 'success' });
    setSuggestion('');
  };

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-base font-semibold text-slate-800">Map Layers</h2>
      <p className="mt-1 text-sm text-slate-500">Quickly toggle visibility to focus on the data you need.</p>
      <div className="mt-4 space-y-3">
        {layerOptions.map((layer) => (
          <label key={layer.key} className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={mapLayers[layer.key]}
              onChange={() => toggleLayer(layer.key)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
            />
            <span>
              <span className="font-medium text-slate-700">{layer.label}</span>
              <span className="block text-xs text-slate-500">{layer.description}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">Icon & color theme</label>
        <select
          value={iconTheme}
          onChange={(event) => setIconTheme(event.target.value as IconTheme)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {iconThemes.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          Switch between the standard operations palette and a high-contrast alternative optimised for dark or projected rooms.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="symbol-suggestion">
          Suggest icon or color updates
        </label>
        <textarea
          id="symbol-suggestion"
          value={suggestion}
          onChange={(event) => setSuggestion(event.target.value)}
          placeholder="e.g. Try teal markers for staging or a medevac helicopter icon"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-600"
        >
          Share feedback
        </button>
      </form>
    </section>
  );
};
