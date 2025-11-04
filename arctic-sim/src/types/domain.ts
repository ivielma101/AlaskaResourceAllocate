import type { LatLngLiteral } from 'leaflet';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type Incident = {
  location: LatLngLiteral | null;
  demand: number;
  riskPreset: RiskLevel;
};

export type StagingArea = {
  id: string;
  name: string;
  location: LatLngLiteral;
  available: number;
};

export type Hospital = {
  id: string;
  name: string;
  city: string;
  location: LatLngLiteral;
  airborneCapable: boolean;
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
  riskLevel: RiskLevel;
  decisions: AllocationDecision[];
};

export type Scenario = {
  id: string;
  name: string;
  incident: Incident;
  stagingAreas: StagingArea[];
  savedAt: string;
};
