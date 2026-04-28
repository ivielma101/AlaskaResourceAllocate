import { useMemo } from 'react';
import { useSimulationStore } from '@/app/store';
import { findHospitalsWithinRadius, getHospitalsInScope, HOSPITAL_SEARCH_RADIUS_KM } from '@/lib/hospitals';
import { recommendHospitalsForSeverity } from '@/lib/severity';
import type { SeverityRecommendation } from '@/lib/severity';
import { formatKilometers } from '@/lib/numberFormat';
import type { Hospital } from '@/types/domain';

type HospitalRow = Hospital & { distanceKm: number | null };

export const HospitalsPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const hasIncidentLocation = Boolean(incident.location);

  const nearbyHospitals = useMemo(
    () => findHospitalsWithinRadius(incident.location, HOSPITAL_SEARCH_RADIUS_KM),
    [incident.location]
  );

  const severityRecommendations = useMemo<SeverityRecommendation[]>(
    () => recommendHospitalsForSeverity(incident),
    [incident]
  );

  const allHospitals = useMemo<HospitalRow[]>(() => getHospitalsInScope(incident.location), [incident.location]);

  return (
    <section id="network" aria-labelledby="network-heading" className="panel-surface">
      <div className="panel-content text-sm">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Medical network</p>
            <h2 id="network-heading" className="panel-title text-2xl">
              Hospital readiness
            </h2>
            <p className="panel-description">
              {hasIncidentLocation
                ? `Monitoring facilities within ${HOSPITAL_SEARCH_RADIUS_KM.toLocaleString()} km of the incident.`
                : 'Statewide roster with trauma capability and medevac support.'}
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
            <span className="badge-tonal">
              {nearbyHospitals.length} within {HOSPITAL_SEARCH_RADIUS_KM.toLocaleString()} km
            </span>
            <span className="mt-2 text-[10px] font-medium tracking-[0.4em] text-slate-500">
              {allHospitals.length} facilities monitored
            </span>
          </div>
        </div>
        {!hasIncidentLocation && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Select an incident location to view routing guidance.
          </p>
        )}

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">Severity routing</h3>
            <p className="mt-1 text-xs text-slate-600">Critical tiers are prioritized by capability and proximity.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Recommended hospitals by severity band</caption>
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                      Severity band
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                      Estimated people
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
                      Recommended hospitals
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {severityRecommendations.map((bucket) => (
                    <tr key={bucket.level} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        Trauma level {bucket.level} • {bucket.label}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {incident.demand > 0 ? bucket.count.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {bucket.recommendations.map((hospital) => (
                            <span
                              key={`${bucket.level}-${hospital.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                            >
                              {hospital.name}
                              <span className="font-normal text-slate-600">
                                (Lv {hospital.traumaLevel}
                                {hospital.distanceKm !== undefined
                                  ? ` • ${formatKilometers(hospital.distanceKm)}`
                                  : ''}
                                )
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">All hospitals in scope</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Hospitals with trauma capability and medevac readiness</caption>
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">Hospital</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">City</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">Trauma</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">Capacity</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">Distance</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">Airborne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allHospitals.map((hospital) => (
                    <tr key={hospital.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">{hospital.name}</td>
                      <td className="px-4 py-3 text-slate-600">{hospital.city}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">Lv {hospital.traumaLevel}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{hospital.capacity.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>{hospital.distanceKm === null ? '—' : formatKilometers(hospital.distanceKm ?? 0)}</span>
                          {hasIncidentLocation && hospital.distanceKm !== null &&
                            hospital.distanceKm <= HOSPITAL_SEARCH_RADIUS_KM && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                                In range
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            hospital.airborneCapable
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {hospital.airborneCapable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
