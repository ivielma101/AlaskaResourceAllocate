import { useMemo } from 'react';
import { useSimulationStore, type RouteGuidance } from '@/app/store';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';

const STATUS_LABELS: Record<RouteGuidance['status'], string> = {
  idle: 'Idle',
  loading: 'Routing',
  ready: 'Ready',
  error: 'Error'
};

const STATUS_STYLES: Record<RouteGuidance['status'], string> = {
  idle: 'border border-white/10 bg-white/5 text-slate-300',
  loading: 'border border-sky-400/40 bg-sky-500/10 text-sky-100',
  ready: 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  error: 'border border-rose-400/40 bg-rose-500/10 text-rose-100'
};

type RouteCardProps = {
  title: string;
  guidance: RouteGuidance;
  subtitle?: string;
};

const RouteCard = ({ title, guidance, subtitle }: RouteCardProps) => {
  const statusLabel = STATUS_LABELS[guidance.status];
  const statusClass = STATUS_STYLES[guidance.status];

  return (
    <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle && <p className="text-xs text-slate-300/80">{subtitle}</p>}
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {guidance.status === 'ready' && guidance.summary && (
        <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-200">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Distance</dt>
            <dd className="mt-1 font-mono text-sm text-white">
              {formatKilometers(guidance.summary.distanceKm)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.32em] text-slate-400">ETA</dt>
            <dd className="mt-1 font-mono text-sm text-white">
              {formatMinutes(guidance.summary.etaMinutes)}
            </dd>
          </div>
        </dl>
      )}

      {guidance.status === 'ready' && guidance.steps && guidance.steps.length > 0 && (
        <ol className="mt-4 space-y-2 text-xs text-slate-200">
          {guidance.steps.map((step, index) => {
            const meta = [step.distanceText, step.durationText].filter(Boolean).join(' • ');
            return (
              <li key={`${title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-medium text-white">{step.instruction}</p>
                {meta && <p className="mt-1 text-[11px] text-slate-400">{meta}</p>}
              </li>
            );
          })}
        </ol>
      )}

      {guidance.status === 'idle' && (
        <p className="mt-4 text-xs text-slate-300/90">
          Set an incident location to generate driving directions.
        </p>
      )}

      {guidance.status === 'loading' && (
        <p className="mt-4 text-xs text-slate-300/90">Calculating route using Google Maps…</p>
      )}

      {guidance.status === 'error' && (
        <p className="mt-4 text-xs text-rose-200">
          Unable to compute a route{guidance.errorMessage ? ` (${guidance.errorMessage})` : ''}.
        </p>
      )}
    </div>
  );
};

export const RoutingPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const routingGuidance = useSimulationStore((state) => state.routingGuidance);

  const hasIncidentLocation = Boolean(incident.location);

  const stagingRoutes = useMemo(
    () =>
      stagingAreas.map((area) => ({
        area,
        guidance: routingGuidance.staging[area.id] ?? { status: 'idle' as const }
      })),
    [stagingAreas, routingGuidance.staging]
  );

  const hospitalRoute = routingGuidance.hospital;

  return (
    <section id="routing" aria-labelledby="routing-heading" className="panel-surface">
      <div className="panel-content text-sm">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Routing</p>
            <h2 id="routing-heading" className="panel-title text-2xl">
              Movement guidance
            </h2>
            <p className="panel-description">
              Step-by-step directions from the incident to staging nodes and the closest hospital.
            </p>
          </div>
        </div>

        {!hasIncidentLocation && (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-300/90">
            Select an incident location on the map to generate routing guidance.
          </p>
        )}

        {hasIncidentLocation && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white">Staging nodes</h3>
              <p className="mt-1 text-xs text-slate-300/90">
                Driving routes from the incident to each staging site.
              </p>
              <div className="mt-4 space-y-3">
                {stagingRoutes.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-xs text-slate-300/90">
                    Add staging areas on the map to receive driving guidance for responders.
                  </p>
                )}
                {stagingRoutes.map(({ area, guidance }) => (
                  <RouteCard key={area.id} title={area.name} guidance={guidance} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white">Nearest hospital</h3>
              <p className="mt-1 text-xs text-slate-300/90">
                Fastest driving route from the incident to the closest monitored facility.
              </p>
              <div className="mt-4">
                {hospitalRoute ? (
                  <RouteCard
                    title={hospitalRoute.destinationName ?? 'Nearest facility'}
                    guidance={hospitalRoute}
                    subtitle="Closest hospital by straight-line distance"
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-xs text-slate-300/90">
                    Routing will appear once a hospital is identified in range of the incident.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
