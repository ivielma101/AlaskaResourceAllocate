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
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Previous Case</h2>
        <button
          type="button"
          onClick={refreshScenarios}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Refresh
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Scenario name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          Save
        </button>
      </form>
      <div className="mt-4 space-y-2 text-sm">
        {scenarios.length === 0 && <p className="text-slate-500">No saved scenarios yet.</p>}
        {scenarios
          .slice()
          .sort((a, b) => (a.savedAt > b.savedAt ? -1 : 1))
          .map((scenario) => (
            <div
              key={scenario.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-700">{scenario.name}</p>
                <p className="text-xs text-slate-500">
                  Saved {new Date(scenario.savedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadScenario(scenario.id)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-400"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => deleteScenarioAction(scenario.id)}
                  className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-500 hover:border-rose-300"
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
