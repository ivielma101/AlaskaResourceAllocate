import { haversineKm } from '@/lib/geo';
import { getHospitals } from '@/lib/hospitals';
import type { Incident, Hospital } from '@/types/domain';

export type SeverityBucket = {
  level: 1 | 2 | 3 | 4;
  label: string;
  proportion: number;
};

const DEFAULT_PROFILE: SeverityBucket[] = [
  { level: 4, label: 'Critical trauma', proportion: 0.18 },
  { level: 3, label: 'Severe injuries', proportion: 0.32 },
  { level: 2, label: 'Moderate injuries', proportion: 0.28 },
  { level: 1, label: 'Minor injuries', proportion: 0.22 }
];

export type SeverityRecommendation = SeverityBucket & {
  count: number;
  recommendations: HospitalRecommendation[];
};

type HospitalRecommendation = Hospital & { distanceKm?: number };

export const getSeverityProfile = (totalDemand: number) =>
  DEFAULT_PROFILE.map((bucket) => ({
    ...bucket,
    count: Math.round(totalDemand * bucket.proportion)
  }));

export const recommendHospitalsForSeverity = (incident: Incident | null): SeverityRecommendation[] => {
  const hospitals = getHospitals();
  if (!incident?.location) {
    return DEFAULT_PROFILE.map((bucket) => ({
      ...bucket,
      count: 0,
      recommendations: hospitals
        .filter((hospital) => hospital.traumaLevel >= bucket.level)
        .sort((a, b) => b.traumaLevel - a.traumaLevel)
        .slice(0, 3)
        .map((hospital) => ({ ...hospital }))
    }));
  }

  return getSeverityProfile(incident.demand).map((bucket) => {
    const recommendations = hospitals
      .filter((hospital) => hospital.traumaLevel >= bucket.level)
      .map((hospital) => ({
        ...hospital,
        distanceKm: haversineKm(incident.location!, hospital.location)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm || b.traumaLevel - a.traumaLevel)
      .slice(0, 3);

    return {
      ...bucket,
      recommendations
    };
  });
};
