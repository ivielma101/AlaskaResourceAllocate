import type { LatLng } from '@/types/geo';

type ErmaFeature =
  | { type: 'polygon'; name: string; coordinates: LatLng[] }
  | { type: 'point'; name: string; location: LatLng; summary: string };

const ERMA_FEATURES: ErmaFeature[] = [
  {
    type: 'polygon',
    name: 'North Slope Containment',
    coordinates: [
      { lat: 70.3001, lng: -150.5 },
      { lat: 69.9112, lng: -152.4 },
      { lat: 69.541, lng: -149.9 },
      { lat: 70.0844, lng: -148.6 }
    ]
  },
  {
    type: 'polygon',
    name: 'Cook Inlet Response Planning Zone',
    coordinates: [
      { lat: 60.422, lng: -152.9 },
      { lat: 59.724, lng: -151.2 },
      { lat: 60.045, lng: -150.1 },
      { lat: 60.781, lng: -150.9 }
    ]
  },
  {
    type: 'point',
    name: 'NOAA ERMA Staging Depot',
    location: { lat: 61.1753, lng: -149.8829 },
    summary: 'Anchorage depot stocked with spill response boom and skimmers.'
  },
  {
    type: 'point',
    name: 'Western Alaska Stockpile',
    location: { lat: 64.7336, lng: -156.7955 },
    summary: 'Barges with sorbent materials for Bering Strait incidents.'
  }
];

export const getErmaFeatures = () => ERMA_FEATURES;
