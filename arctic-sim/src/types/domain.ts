import type { LatLngLiteral } from 'leaflet';

export type Incident = {
  location: LatLngLiteral | null;
  demand: number;
};

export type StagingArea = {
  id: string;
  name: string;
  location: LatLngLiteral;
  available: number;
};

export type AllocationDecision = {
  stagingId: string;
  stagingName: string;
  distanceKm: number;
  etaMinutes: number;
  quantity: number;
};

export type AllocationResult = {
  demand: number;
  totalSent: number;
  unmet: number;
  averageEtaMinutes: number | null;
  totalDistanceKm: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  decisions: AllocationDecision[];
};

export type Scenario = {
  id: string;
  name: string;
  incident: Incident;
  stagingAreas: StagingArea[];
  savedAt: string;
};
