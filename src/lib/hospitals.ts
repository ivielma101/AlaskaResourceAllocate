import type { LatLng } from '@/types/geo';
import type { Hospital } from '@/types/domain';
import { haversineKm } from '@/lib/geo';

export const HOSPITAL_SEARCH_RADIUS_KM = 350;

export type HospitalWithDistance = Hospital & {
  distanceKm: number | null;
};

export type NearbyHospital = HospitalWithDistance;

const hospitals: Hospital[] = [
  {
    id: 'alaska-native-medical-center',
    name: 'Alaska Native Medical Center',
    city: 'Anchorage',
    location: { lat: 61.182008372, lng: -149.800204779 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 148
  },
  {
    id: 'providence-alaska-medical-center',
    name: 'Providence Alaska Medical Center',
    city: 'Anchorage',
    location: { lat: 61.1883573710001, lng: -149.818746555 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 371
  },
  {
    id: 'mat-su-regional-medical-center',
    name: 'Mat-Su Regional Medical Center',
    city: 'Palmer',
    location: { lat: 61.562790019, lng: -149.258438036 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 74
  },
  {
    id: 'samuel-simmonds-memorial-hospital',
    name: 'Samuel Simmonds Memorial Hospital',
    city: 'Utqiagvik',
    location: { lat: 71.297309274, lng: -156.728960777 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 10
  },
  {
    id: 'fairbanks-memorial-hospital',
    name: 'Fairbanks Memorial Hospital',
    city: 'Fairbanks',
    location: { lat: 64.8318561620001, lng: -147.739146369 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 217
  },
  {
    id: 'south-peninsula-hospital',
    name: 'South Peninsula Hospital',
    city: 'Homer',
    location: { lat: 59.6525660200001, lng: -151.550204005 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 50
  },
  {
    id: 'bartlett-regional-hospital',
    name: 'Bartlett Regional Hospital',
    city: 'Juneau',
    location: { lat: 58.328975615, lng: -134.465208995 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 73
  },
  {
    id: 'providence-seward-medical-center',
    name: 'Providence Seward Medical Center',
    city: 'Seward',
    location: { lat: 60.1053190050001, lng: -149.446269027 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 46
  },
  {
    id: 'searhc-mt-edgecumbe',
    name: 'SEARHC Mt. Edgecumbe',
    city: 'Sitka',
    location: { lat: 57.0518299830001, lng: -135.354972992 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 27
  },
  {
    id: 'providence-valdez-medical-center',
    name: 'Providence Valdez Medical Center',
    city: 'Valdez',
    location: { lat: 61.13023788, lng: -146.35508078 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 21
  },
  {
    id: 'central-peninsula-hospital',
    name: 'Central Peninsula Hospital',
    city: 'Soldotna',
    location: { lat: 60.4933289950001, lng: -151.076581968 },
    airborneCapable: true,
    traumaLevel: 3,
    capacity: 50
  },
  {
    id: 'peace-health-ketchikan-medical-center',
    name: 'Peace Health Ketchikan Medical Center',
    city: 'Ketchikan',
    location: { lat: 55.3537680050001, lng: -131.686160998 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 54
  },
  {
    id: 'yukon-kuskokwim-delta-regional-hospital',
    name: 'Yukon-Kuskokwim Delta Regional Hospital',
    city: 'Bethel',
    location: { lat: 60.788075093, lng: -161.785488231 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 37
  },
  {
    id: 'searhc-wrangell-medical-center',
    name: 'SEARHC Wrangell Medical Center',
    city: 'Wrangell',
    location: { lat: 56.470404, lng: -132.3836088 },
    airborneCapable: false,
    traumaLevel: 3,
    capacity: 22
  }
];

export const getHospitals = () => hospitals;

export const getHospitalsInScope = (origin: LatLng | null): HospitalWithDistance[] => {
  const withDistance = hospitals.map((hospital) => ({
    ...hospital,
    distanceKm: origin ? haversineKm(origin, hospital.location) : null
  }));

  if (!origin) {
    return withDistance.sort((a, b) => b.traumaLevel - a.traumaLevel || a.name.localeCompare(b.name));
  }

  return withDistance.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
};

export const findHospitalsWithinRadius = (
  origin: LatLng | null,
  radiusKm: number = HOSPITAL_SEARCH_RADIUS_KM
): NearbyHospital[] => {
  if (!origin) return [];
  return getHospitalsInScope(origin).filter((hospital) => (hospital.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusKm);
};
