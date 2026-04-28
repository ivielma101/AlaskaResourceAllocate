import { useMemo, useState } from 'react';
import { useSimulationStore } from '@/app/store';
import type { Scenario } from '@/types/domain';

type Snapshot = {
  id: string;
  name: string;
  demand: number;
  stagingCount: number;
  totalAvailable: number;
  locationSummary: string;
};

const describeScenario = (scenario: Scenario): Snapshot => {
  const totalAvailable = scenario.stagingAreas.reduce((sum, staging) => sum + staging.available, 0);
  return {
    id: scenario.id,
    name: scenario.name,
    demand: scenario.incident.demand,
    stagingCount: scenario.stagingAreas.length,
    totalAvailable,
    locationSummary: scenario.incident.location
      ? `${scenario.incident.location.lat.toFixed(2)}, ${scenario.incident.location.lng.toFixed(2)}`
      : 'Unset'
  };
};

export const ScenarioComparisonPanel = () => {
  const scenarios = useSimulationStore((state) => state.scenarios);
  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const [primaryScenarioId, setPrimaryScenarioId] = useState<string>('current');
  const [secondaryScenarioId, setSecondaryScenarioId] = useState<string>('');

  const currentSnapshot: Snapshot = useMemo(() => {
    const totalAvailable = stagingAreas.reduce((sum, staging) => sum + staging.available, 0);
    return {
      id: 'current',
      name: 'Current plan',
      demand: incident.demand,
      stagingCount: stagingAreas.length,
      totalAvailable,
      locationSummary: incident.location
        ? `${incident.location.lat.toFixed(2)}, ${incident.location.lng.toFixed(2)}`
        : 'Unset'
    };
  }, [incident.demand, incident.location, stagingAreas]);

  const scenarioSnapshots = useMemo(() => scenarios.map(describeScenario), [scenarios]);

  const lookupSnapshot = (id: string): Snapshot | undefined => {
    if (!id) return undefined;
    if (id === 'current') return currentSnapshot;
    return scenarioSnapshots.find((scenario) => scenario.id === id);
  };

  const primary = lookupSnapshot(primaryScenarioId) ?? currentSnapshot;
  const secondary = lookupSnapshot(secondaryScenarioId);

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-base font-semibold text-slate-800">Scenario comparison</h2>
      <p className="mt-1 text-sm text-slate-500">
        Explore alternate demand configurations or saved cases side-by-side. Load a scenario to immediately simulate it on the
        interactive map.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Primary view
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            value={primaryScenarioId}
            onChange={(event) => setPrimaryScenarioId(event.target.value)}
          >
            <option value="current">Current plan</option>
            {scenarioSnapshots.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Secondary view
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            value={secondaryScenarioId}
            onChange={(event) => setSecondaryScenarioId(event.target.value)}
          >
            <option value="">— None —</option>
            <option value="current">Current plan</option>
            {scenarioSnapshots.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ScenarioSnapshotCard
          snapshot={primary}
          onLoad={() => primary.id !== 'current' && loadScenario(primary.id)}
        />
        {secondary ? (
          <ScenarioSnapshotCard
            snapshot={secondary}
            onLoad={() => secondary.id !== 'current' && loadScenario(secondary.id)}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-400">
            Select another saved scenario to compare side-by-side.
          </div>
        )}
      </div>
    </section>
  );
};

const ScenarioSnapshotCard = ({ snapshot, onLoad }: { snapshot: Snapshot; onLoad: () => void }) => {
  return (
    <div className="flex h-full flex-col justify-between rounded-md border border-slate-200 p-3">
      <div className="space-y-2 text-sm">
        <p className="text-sm font-semibold text-slate-800">{snapshot.name}</p>
        <dl className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-slate-500">
          <div>
            <dt>Demand</dt>
            <dd className="font-mono text-base text-slate-800">{snapshot.demand.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Staging</dt>
            <dd className="font-mono text-base text-slate-800">{snapshot.stagingCount}</dd>
          </div>
          <div>
            <dt>Resources</dt>
            <dd className="font-mono text-base text-slate-800">{snapshot.totalAvailable.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd className="font-mono text-base text-slate-800">{snapshot.locationSummary}</dd>
          </div>
        </dl>
      </div>
      {snapshot.id !== 'current' && (
        <button
          type="button"
          onClick={onLoad}
          className="mt-3 w-full rounded-md border border-sky-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sky-600 hover:bg-sky-50"
        >
          Load scenario
        </button>
      )}
    </div>
  );
};
