import { useMemo } from 'react';
import { useSimulationStore } from '@/app/store';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';
import { RISK_BADGE_CLASSES } from '@/lib/risk';

export const AllocationPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const travelSpeedKph = useSimulationStore((state) => state.travelSpeedKph);
  const setTravelSpeed = useSimulationStore((state) => state.setTravelSpeed);
  const computeAllocation = useSimulationStore((state) => state.computeAllocation);

  const allocation = useMemo(() => computeAllocation(), [computeAllocation, incident, stagingAreas, travelSpeedKph]);
  const totalAvailable = useMemo(
    () => stagingAreas.reduce((sum, area) => sum + Math.max(0, area.available), 0),
    [stagingAreas]
  );

  const isReady = incident.location !== null && incident.demand > 0 && stagingAreas.length > 0;

  return (
    <section id="logistics" aria-labelledby="logistics-heading" className="panel-surface">
      <div className="panel-content">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Logistics</p>
            <h2 id="logistics-heading" className="panel-title text-2xl">
              Allocation outlook
            </h2>
          </div>
          <label className="flex flex-col items-start text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
            Travel speed (kph)
            <input
              type="number"
              min={10}
              value={travelSpeedKph}
              onChange={(event) => setTravelSpeed(Number(event.target.value) || 0)}
              className="input-surface mt-2 w-24 text-center font-mono"
            />
          </label>
        </div>
        {!isReady && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Place an incident, add staging areas, and set demand to generate an allocation model.
          </p>
        )}
        {isReady && allocation && (
          <div className="space-y-6 text-sm">
            <div className="flex flex-wrap gap-4 xl:flex-nowrap">
              <Metric className="min-w-[180px] flex-1" label="Demand" value={allocation.demand.toLocaleString()} />
              <Metric className="min-w-[180px] flex-1" label="Utilized" value={allocation.totalSent.toLocaleString()} />
              <Metric
                className="min-w-[180px] flex-1"
                label="Unmet"
                value={allocation.unmet.toLocaleString()}
                tone={allocation.unmet > 0 ? 'alert' : 'muted'}
              />
              <Metric
                className="min-w-[200px] flex-1"
                label="Surge-adjusted"
                value={allocation.surgeDemand.toLocaleString()}
                hint="Demand adjusted for delayed arrivals"
              />
              <Metric
                className="min-w-[180px] flex-1"
                label="Average ETA"
                value={
                  allocation.averageEtaMinutes === null ? '—' : formatMinutes(allocation.averageEtaMinutes)
                }
              />
              <Metric className="min-w-[180px] flex-1" label="Distance" value={formatKilometers(allocation.totalDistanceKm)} />
              <Metric
                className="min-w-[200px] flex-1"
                label="Downline resources"
                value={totalAvailable.toLocaleString()}
              />
              <Metric
                className="min-w-[200px] flex-1"
                label="System risk"
                value={allocation.riskLevel}
                badgeClass={RISK_BADGE_CLASSES[allocation.riskLevel]}
                secondary={`${allocation.demandRiskLevel} demand risk`}
              />
            </div>

            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-slate-600">
                  <span>Critical window coverage</span>
                  <span className="text-sm font-semibold text-slate-900">{allocation.criticalCoveragePercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200" role="presentation">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${allocation.criticalCoveragePercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-slate-600">
                  {allocation.criticalGap === 0
                    ? 'All immediate patients can be covered inside the 45 minute window.'
                    : `${allocation.criticalGap.toLocaleString()} patients fall outside the immediate response threshold.`}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-slate-600">
                  <span>Logistics pressure index</span>
                  <span className="text-sm font-semibold text-slate-900">{allocation.pressureIndex}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200" role="presentation">
                  <div
                    className={`h-2 rounded-full ${
                      allocation.pressureIndex > 66
                        ? 'bg-rose-500'
                        : allocation.pressureIndex > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${allocation.pressureIndex}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Higher values indicate compounded stress from unmet demand, travel burden, and response delays.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Allocation decisions by staging site</caption>
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                      Staging
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                      Qty sent
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                      Distance
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                      ETA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocation.decisions.map((decision) => (
                    <tr key={decision.stagingId} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">{decision.stagingName}</td>
                      <td className="px-4 py-3 font-mono text-slate-900">{decision.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{formatKilometers(decision.distanceKm)}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{formatMinutes(decision.etaMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

type MetricProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'alert' | 'muted';
  badgeClass?: string;
  secondary?: string;
  className?: string;
};

const Metric = ({ label, value, hint, tone, badgeClass, secondary, className }: MetricProps) => {
  const rootClass = [
    'flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-4',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <dl className={rootClass}>
      <dt className="text-[11px] uppercase tracking-[0.28em] text-slate-600">{label}</dt>
      <dd className="flex items-baseline gap-2">
        {badgeClass ? (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>{value}</span>
        ) : (
          <span
            className={`text-base font-semibold ${
              tone === 'alert' ? 'text-rose-600' : tone === 'muted' ? 'text-slate-500' : 'text-slate-900'
            }`}
          >
            {value}
          </span>
        )}
        {secondary && <span className="text-xs text-slate-500">{secondary}</span>}
      </dd>
      {hint && <dd className="text-[11px] text-slate-500">{hint}</dd>}
    </dl>
  );
};
