import type { LatLng } from '@/types/geo';

type PopulationPoint = {
  location: LatLng;
  weight: number;
  label: string;
};

const POPULATION_POINTS: PopulationPoint[] = [
  { location: { lat: 61.2176, lng: -149.8997 }, weight: 5, label: 'Anchorage Bowl' },
  { location: { lat: 64.8359, lng: -147.7767 }, weight: 3.8, label: 'Fairbanks North Star' },
  { location: { lat: 58.3019, lng: -134.4197 }, weight: 2.9, label: 'Juneau' },
  { location: { lat: 60.5544, lng: -151.2583 }, weight: 2.4, label: 'Kenai Peninsula' },
  { location: { lat: 61.5801, lng: -149.4394 }, weight: 3.1, label: 'Mat-Su Valley' },
  { location: { lat: 55.3422, lng: -131.6461 }, weight: 1.5, label: 'Ketchikan Gateway' },
  { location: { lat: 60.5433, lng: -145.7574 }, weight: 1.1, label: 'Valdez-Cordova' },
  { location: { lat: 64.8381, lng: -147.6517 }, weight: 1.8, label: 'Eielson Corridor' },
  { location: { lat: 61.1308, lng: -146.3483 }, weight: 1.2, label: 'Prince William Sound' },
  { location: { lat: 57.7899, lng: -152.4072 }, weight: 1.6, label: 'Kodiak Island' },
  { location: { lat: 63.8612, lng: -152.4698 }, weight: 0.6, label: 'Interior Villages' },
  { location: { lat: 66.8983, lng: -162.5979 }, weight: 0.8, label: 'Kotzebue Sound' }
];

export const getPopulationPoints = () => POPULATION_POINTS;
