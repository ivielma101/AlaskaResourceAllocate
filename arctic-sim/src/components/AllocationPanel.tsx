import { useMemo } from 'react';
import { useSimulationStore } from '@/app/store';

const formatNumber = (value: number, fractionDigits = 1) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });

const riskStyles: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-rose-100 text-rose-700'
};

export const AllocationPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const travelSpeedKph = useSimulationStore((state) => state.travelSpeedKph);
  const setTravelSpeed = useSimulationStore((state) => state.setTravelSpeed);
  const computeAllocation = useSimulationStore((state) => state.computeAllocation);

  const allocation = useMemo(() => computeAllocation(), [computeAllocation, incident, stagingAreas, travelSpeedKph]);

  const isReady = incident.location !== null && incident.demand > 0 && stagingAreas.length > 0;

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-800">Allocation Results</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Travel speed (kph)
          <input
            type="number"
            min={10}
            value={travelSpeedKph}
            onChange={(event) => setTravelSpeed(Number(event.target.value) || 0)}
            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </label>
      </div>
      {!isReady && (
        <p className="mt-4 text-sm text-slate-500">
          Place an incident, add staging areas, and set demand to view allocation results.
        </p>
      )}
      {isReady && allocation && (
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase text-slate-500">Demand</p>
              <p className="text-base font-semibold text-slate-800">{allocation.demand.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Sent</p>
              <p className="text-base font-semibold text-slate-800">{allocation.totalSent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Unmet</p>
              <p className="text-base font-semibold text-slate-800">{allocation.unmet.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Average ETA</p>
              <p className="text-base font-semibold text-slate-800">
                {allocation.averageEtaMinutes === null
                  ? '—'
                  : `${formatNumber(allocation.averageEtaMinutes, 0)} min`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total distance</p>
              <p className="text-base font-semibold text-slate-800">{formatNumber(allocation.totalDistanceKm)} km</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Risk</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskStyles[allocation.riskLevel]}`}>
                {allocation.riskLevel}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Staging</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Qty Sent</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Distance (km)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">ETA (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocation.decisions.map((decision) => (
                  <tr key={decision.stagingId}>
                    <td className="px-3 py-2 text-slate-700">{decision.stagingName}</td>
                    <td className="px-3 py-2 font-mono">{decision.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono">{formatNumber(decision.distanceKm)}</td>
                    <td className="px-3 py-2 font-mono">{formatNumber(decision.etaMinutes, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
