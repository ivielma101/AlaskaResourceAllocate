import { useMemo, type ReactNode } from 'react';
import { useSimulationStore } from '@/app/store';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';
import { getDemandRiskLevel, getRiskCopy, RISK_BADGE_CLASSES } from '@/lib/risk';

const Pulse = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 text-sky-500">
    <path
      d="M2.5 10h3l2-5 3 10 2-5h5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
    />
  </svg>
);

const Layers = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 text-emerald-600">
    <path
      d="M10 2 2.5 6.5 10 11l7.5-4.5L10 2Zm0 9-7.5-4.5V13L10 17l7.5-4V6.5L10 11Z"
      fill="currentColor"
      opacity={0.65}
    />
    <path
      d="m2.5 13 7.5 4 7.5-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      opacity={0.75}
    />
  </svg>
);

const Gauge = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 text-amber-600">
    <path
      d="M3 15.5a7 7 0 1 1 14 0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={1.4}
    />
    <path d="M10 6v4.5l3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.4} />
  </svg>
);

export const StatusStrip = () => {
  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const computeAllocation = useSimulationStore((state) => state.computeAllocation);

  const demandRisk = useMemo(() => getDemandRiskLevel(incident.demand), [incident.demand]);
  const demandNarrative = useMemo(() => getRiskCopy(demandRisk), [demandRisk]);

  const totalAvailable = useMemo(
    () => stagingAreas.reduce((sum, area) => sum + Math.max(0, area.available), 0),
    [stagingAreas]
  );

  const allocation = useMemo(() => computeAllocation(), [computeAllocation, incident, stagingAreas]);

  const etaCopy = allocation?.averageEtaMinutes
    ? formatMinutes(allocation.averageEtaMinutes)
    : 'Awaiting routes';

  const distanceCopy = allocation ? formatKilometers(allocation.totalDistanceKm) : '—';

  return (
    <section id="status" aria-labelledby="status-heading" className="panel-surface">
      <div className="panel-content">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Operational snapshot</p>
            <h2 id="status-heading" className="panel-title text-3xl tracking-tight">
              Situation overview
            </h2>
          </div>
          <span className="badge-tonal">Live simulation</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatusMetric
            icon={<Pulse />}
            label="Incident posture"
            headline={incident.demand > 0 ? `${incident.demand.toLocaleString()} impacted` : 'Set demand'}
            badge={
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${RISK_BADGE_CLASSES[demandRisk]}`}
              >
                {demandRisk}
              </span>
            }
            meta={incident.location ? `${incident.location.lat.toFixed(2)}°, ${incident.location.lng.toFixed(2)}°` : 'Awaiting centroid'}
            description={demandNarrative}
          />
          <StatusMetric
            icon={<Layers />}
            label="Staging network"
            headline={`${stagingAreas.length} active sites`}
            meta={`${totalAvailable.toLocaleString()} total assets`}
            description={
              stagingAreas.length === 0
                ? 'Shift + click the map to seed your first node.'
                : 'Drag markers on the map to tune staging coverage.'
            }
          />
          <StatusMetric
            icon={<Gauge />}
            label="Allocation telemetry"
            headline={allocation ? allocation.riskLevel : 'Model pending'}
            badge={
              allocation && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${
                    RISK_BADGE_CLASSES[allocation.riskLevel]
                  }`}
                >
                  {allocation.riskLevel}
                </span>
              )
            }
            meta={`${etaCopy} • ${distanceCopy}`}
            description={
              allocation
                ? `${allocation.decisions.length} active routes orchestrated from staging assets.`
                : 'Allocate demand to calculate travel and coverage.'
            }
          />
        </div>
      </div>
    </section>
  );
};

type StatusMetricProps = {
  icon: ReactNode;
  label: string;
  headline: string;
  meta: string;
  description: string;
  badge?: ReactNode;
};

const StatusMetric = ({ icon, label, headline, meta, description, badge }: StatusMetricProps) => {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-sky-300/50 focus-within:border-sky-300/50">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/60">
          {icon}
        </div>
        <dl className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <dt className="panel-eyebrow text-[10px] tracking-[0.28em] text-slate-500">{label}</dt>
            {badge && <dd>{badge}</dd>}
          </div>
          <dd className="text-lg font-semibold text-slate-900" aria-live="polite">
            {headline}
          </dd>
          <dd className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">{meta}</dd>
          <dd className="text-sm text-slate-600">{description}</dd>
        </dl>
      </div>
    </article>
  );
};
