import { useMemo, useState } from 'react';
import { useSimulationStore } from '@/app/store';
import { findHospitalsWithinRadius, HOSPITAL_SEARCH_RADIUS_KM } from '@/lib/hospitals';
import { formatKilometers } from '@/lib/numberFormat';

export const HospitalsPanel = () => {
  const incident = useSimulationStore((state) => state.incident);
  const [radiusKm, setRadiusKm] = useState<number>(HOSPITAL_SEARCH_RADIUS_KM);

  const nearbyHospitals = useMemo(() => {
    if (!incident.location) return [];
    return findHospitalsWithinRadius(incident.location, radiusKm);
  }, [incident.location, radiusKm]);

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800">Nearby Hospitals</h2>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Search radius</p>
          <p className="text-xs font-semibold text-slate-700">{radiusKm.toLocaleString()} km</p>
        </div>
      </div>
      <input
        type="range"
        min={50}
        max={800}
        step={10}
        value={radiusKm}
        onChange={(event) => setRadiusKm(Number(event.target.value))}
        className="mt-3 w-full accent-sky-500"
      />
      {!incident.location && (
        <p className="mt-2 text-sm text-slate-500">Select an incident location to view nearby hospitals.</p>
      )}
      {incident.location && nearbyHospitals.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          No hospitals found within the configured search radius.
        </p>
      )}
      {incident.location && nearbyHospitals.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Hospital</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">City</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Distance</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Airborne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nearbyHospitals.map((hospital, index) => (
                <tr key={hospital.id} className={index === 0 ? 'bg-sky-50/50' : undefined}>
                  <td className="px-3 py-2 text-slate-700">{hospital.name}</td>
                  <td className="px-3 py-2 text-slate-600">{hospital.city}</td>
                  <td className="px-3 py-2 font-mono">{formatKilometers(hospital.distanceKm)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        hospital.airborneCapable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
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
      )}
    </section>
  );
};
