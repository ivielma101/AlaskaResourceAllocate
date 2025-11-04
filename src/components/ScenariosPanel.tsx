import { FormEvent, useState } from 'react';
import { useSimulationStore } from '@/app/store';

export const ScenariosPanel = () => {
  const [name, setName] = useState('');
  const scenarios = useSimulationStore((state) => state.scenarios);
  const saveScenario = useSimulationStore((state) => state.saveScenario);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const deleteScenarioAction = useSimulationStore((state) => state.deleteScenario);
  const refreshScenarios = useSimulationStore((state) => state.refreshScenarios);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveScenario(name);
    setName('');
  };

  return (
    <section id="history" aria-labelledby="history-heading" className="panel-surface">
      <div className="panel-content">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">History</p>
            <h2 id="history-heading" className="panel-title">
              Saved scenarios
            </h2>
          </div>
          <button
            type="button"
            onClick={refreshScenarios}
            className="btn-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em]"
          >
            Refresh
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-xs font-medium uppercase tracking-[0.3em] text-slate-600">
            Scenario name
            <input
              type="text"
              placeholder="Winter surge"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-surface mt-2"
              required
            />
          </label>
          <button type="submit" className="btn-primary justify-center sm:w-auto">
            Save snapshot
          </button>
        </form>
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1 text-sm">
          {scenarios.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600">
              No saved scenarios yet.
            </p>
          )}
          {scenarios
            .slice()
            .sort((a, b) => (a.savedAt > b.savedAt ? -1 : 1))
            .map((scenario) => (
              <article
                key={scenario.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{scenario.name}</p>
                  <p className="text-xs text-slate-600">Saved {new Date(scenario.savedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadScenario(scenario.id)}
                    className="btn-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em]"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteScenarioAction(scenario.id)}
                    className="btn-destructive"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
};
