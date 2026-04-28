import type { LatLng } from '@/types/geo';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type Incident = {
  location: LatLng | null;
  demand: number;
};

export type StagingArea = {
  id: string;
  name: string;
  location: LatLng;
  available: number;
};

export type Hospital = {
  id: string;
  name: string;
  city: string;
  location: LatLng;
  airborneCapable: boolean;
  traumaLevel: 1 | 2 | 3 | 4 | 5;
  capacity: number;
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
  surgeDemand: number;
  criticalCoveragePercent: number;
  criticalGap: number;
  pressureIndex: number;
  riskLevel: RiskLevel;
  demandRiskLevel: RiskLevel;
  decisions: AllocationDecision[];
};

export type Scenario = {
  id: string;
  name: string;
  incident: Incident;
  stagingAreas: StagingArea[];
  savedAt: string;
};
