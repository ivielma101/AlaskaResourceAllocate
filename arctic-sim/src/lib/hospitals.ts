import type { LatLngLiteral } from 'leaflet';
import { haversineKm } from '@/lib/geo';
import type { Hospital } from '@/types/domain';

export const HOSPITAL_SEARCH_RADIUS_KM = 350;

export type NearbyHospital = Hospital & {
  distanceKm: number;
};

const hospitals: Hospital[] = [
  {
    id: 'providence-anchorage',
    name: 'Providence Alaska Medical Center',
    city: 'Anchorage',
    location: { lat: 61.1889, lng: -149.8828 },
    airborneCapable: true
  },
  {
    id: 'alaska-native-medical-center',
    name: 'Alaska Native Medical Center',
    city: 'Anchorage',
    location: { lat: 61.1837, lng: -149.8212 },
    airborneCapable: true
  },
  {
    id: 'matsu-regional',
    name: 'Mat-Su Regional Medical Center',
    city: 'Palmer',
    location: { lat: 61.5942, lng: -149.1228 },
    airborneCapable: true
  },
  {
    id: 'fairbanks-memorial',
    name: 'Fairbanks Memorial Hospital',
    city: 'Fairbanks',
    location: { lat: 64.8363, lng: -147.7200 },
    airborneCapable: true
  },
  {
    id: 'bartlett-regional',
    name: 'Bartlett Regional Hospital',
    city: 'Juneau',
    location: { lat: 58.3116, lng: -134.4120 },
    airborneCapable: true
  },
  {
    id: 'yukon-kuskokwim',
    name: 'Yukon-Kuskokwim Delta Regional Hospital',
    city: 'Bethel',
    location: { lat: 60.7931, lng: -161.7558 },
    airborneCapable: true
  },
  {
    id: 'norton-sound',
    name: 'Norton Sound Regional Hospital',
    city: 'Nome',
    location: { lat: 64.5031, lng: -165.3954 },
    airborneCapable: false
  },
  {
    id: 'seward-provid',
    name: 'Providence Seward Medical & Care Center',
    city: 'Seward',
    location: { lat: 60.1056, lng: -149.4382 },
    airborneCapable: false
  }
];

export const getHospitals = () => hospitals;

export const findHospitalsWithinRadius = (
  origin: LatLngLiteral,
  radiusKm: number = HOSPITAL_SEARCH_RADIUS_KM
): NearbyHospital[] =>
  hospitals
    .map((hospital) => ({
      ...hospital,
      distanceKm: haversineKm(origin, hospital.location)
    }))
    .filter((hospital) => hospital.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
