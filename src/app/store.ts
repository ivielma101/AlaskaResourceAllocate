import { create } from 'zustand';
import { haversineKm } from '@/lib/geo';
import { deleteScenario, loadScenarios, saveScenario } from '@/lib/persist';
import { getDemandRiskLevel } from '@/lib/risk';
import type {
  AllocationDecision,
  AllocationResult,
  Incident,
  Scenario,
  StagingArea
} from '@/types/domain';
import type { LatLng } from '@/types/geo';

export type TravelMetrics = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  distanceKm?: number;
  etaMinutes?: number;
  fallbackDistanceKm?: number;
  errorMessage?: string;
};

export type RouteStep = {
  instruction: string;
  distanceText: string;
  durationText: string;
};

export type RouteGuidance = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  summary?: {
    distanceKm: number;
    etaMinutes: number;
  };
  steps?: RouteStep[];
  errorMessage?: string;
  destinationName?: string;
};

export type RoutingGuidanceState = {
  staging: Record<string, RouteGuidance>;
  hospital: RouteGuidance | null;
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const DEFAULT_TRAVEL_SPEED = 200;
const CRITICAL_WINDOW_MINUTES = 45;
const DEFAULT_ANCHORAGE: LatLng = { lat: 61.2181, lng: -149.9003 };

export type ToastMessage = {
  message: string;
  tone?: 'info' | 'success' | 'error';
};

export type SimulationState = {
  incident: Incident;
  stagingAreas: StagingArea[];
  travelSpeedKph: number;
  scenarios: Scenario[];
  toast: ToastMessage | null;
  travelMetrics: Record<string, TravelMetrics>;
  routingGuidance: RoutingGuidanceState;
  setIncidentLocation: (location: LatLng | null) => void;
  setDemand: (demand: number) => void;
  reset: () => void;
  addStaging: (location?: LatLng, initial?: Partial<Omit<StagingArea, 'id' | 'location'>>) => StagingArea;
  updateStaging: (id: string, patch: Partial<Omit<StagingArea, 'id'>>) => void;
  removeStaging: (id: string) => void;
  setTravelSpeed: (speed: number) => void;
  computeAllocation: () => AllocationResult | null;
  refreshScenarios: () => void;
  saveScenario: (name: string) => void;
  deleteScenario: (id: string) => void;
  loadScenario: (id: string) => void;
  createDemoScenario: () => void;
  setToast: (toast: ToastMessage | null) => void;
  setTravelMetric: (id: string, metrics: TravelMetrics) => void;
  setTravelMetrics: (updates: Record<string, TravelMetrics>) => void;
  clearTravelMetrics: (ids?: string[]) => void;
  setRoutingGuidance: (target: 'staging' | 'hospital', id: string | null, guidance: RouteGuidance) => void;
  clearRoutingGuidance: (target?: 'staging' | 'hospital', ids?: string[]) => void;
};

const initialIncident: Incident = {
  location: null,
  demand: 0
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  incident: { ...initialIncident },
  stagingAreas: [],
  travelSpeedKph: DEFAULT_TRAVEL_SPEED,
  scenarios: loadScenarios(),
  toast: null,
  travelMetrics: {},
  routingGuidance: { staging: {}, hospital: null },
  setIncidentLocation: (location) =>
    set((state) => ({
      incident: { ...state.incident, location },
      travelMetrics: location ? state.travelMetrics : {},
      routingGuidance: location ? state.routingGuidance : { staging: {}, hospital: null }
    })),
  setDemand: (demand) =>
    set((state) => ({ incident: { ...state.incident, demand: Math.max(0, demand) } })),
  reset: () =>
    set({
      incident: { ...initialIncident },
      stagingAreas: [],
      travelMetrics: {},
      routingGuidance: { staging: {}, hospital: null },
      toast: { message: 'Reset incident and staging areas', tone: 'info' }
    }),
  addStaging: (location, initial) => {
    const id = generateId();
    const nameBase = initial?.name ?? `Staging ${get().stagingAreas.length + 1}`;
    const staging: StagingArea = {
      id,
      name: nameBase,
      location: location ?? DEFAULT_ANCHORAGE,
      available: Math.max(0, initial?.available ?? 0)
    };
    set((state) => ({
      stagingAreas: [...state.stagingAreas, staging],
      travelMetrics: { ...state.travelMetrics, [id]: { status: 'idle' } },
      routingGuidance: {
        staging: { ...state.routingGuidance.staging, [id]: { status: 'idle' } },
        hospital: state.routingGuidance.hospital
      }
    }));
    set({ toast: { message: `Added ${staging.name}`, tone: 'success' } });
    return staging;
  },
  updateStaging: (id, patch) =>
    set((state) => {
      const nextAreas = state.stagingAreas.map((area) =>
        area.id === id
          ? {
              ...area,
              ...patch,
              available: patch.available !== undefined ? Math.max(0, patch.available) : area.available
            }
          : area
      );
      const travelMetrics = { ...state.travelMetrics };
      const routingGuidance = {
        staging: { ...state.routingGuidance.staging },
        hospital: state.routingGuidance.hospital
      };
      if (patch.location) {
        travelMetrics[id] = { status: 'idle' };
        routingGuidance.staging[id] = { status: 'idle' };
      }
      if (patch.available !== undefined && patch.available <= 0) {
        travelMetrics[id] = { status: 'idle' };
      }
      return { stagingAreas: nextAreas, travelMetrics, routingGuidance };
    }),
  removeStaging: (id) => {
    const area = get().stagingAreas.find((s) => s.id === id);
    set((state) => {
      const travelMetrics = { ...state.travelMetrics };
      delete travelMetrics[id];
      const routingGuidance = {
        staging: { ...state.routingGuidance.staging },
        hospital: state.routingGuidance.hospital
      };
      delete routingGuidance.staging[id];
      return { stagingAreas: state.stagingAreas.filter((s) => s.id !== id), travelMetrics, routingGuidance };
    });
    if (area) {
      set({ toast: { message: `Removed ${area.name}`, tone: 'info' } });
    }
  },
  setTravelSpeed: (speed) => set({ travelSpeedKph: Math.max(10, speed) }),
  computeAllocation: () => {
    const { incident, stagingAreas, travelSpeedKph, travelMetrics } = get();
    if (!incident.location || incident.demand <= 0 || stagingAreas.length === 0) {
      return null;
    }

    const remainingDecisions: AllocationDecision[] = [];
    const sortedAreas = [...stagingAreas]
      .filter((area) => area.available > 0)
      .map((area) => {
        const metrics = travelMetrics[area.id];
        const distanceKm =
          metrics?.distanceKm ?? metrics?.fallbackDistanceKm ?? haversineKm(area.location, incident.location!);
        const etaMinutes = metrics?.etaMinutes ?? (distanceKm / travelSpeedKph) * 60;
        return {
          area,
          distanceKm,
          etaMinutes
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    let remainingDemand = incident.demand;
    let totalDistanceKm = 0;
    let totalEta = 0;
    let totalSent = 0;
    let criticalServed = 0;
    let surgePenalty = 0;

    for (const entry of sortedAreas) {
      if (remainingDemand <= 0) break;
      const quantity = Math.min(entry.area.available, remainingDemand);
      if (quantity <= 0) continue;
      remainingDemand -= quantity;
      totalSent += quantity;
      totalDistanceKm += entry.distanceKm;
      totalEta += entry.etaMinutes;
      if (entry.etaMinutes <= CRITICAL_WINDOW_MINUTES) {
        criticalServed += quantity;
      } else {
        surgePenalty += Math.round(((entry.etaMinutes - CRITICAL_WINDOW_MINUTES) / CRITICAL_WINDOW_MINUTES) * quantity);
      }
      remainingDecisions.push({
        stagingId: entry.area.id,
        stagingName: entry.area.name,
        distanceKm: entry.distanceKm,
        etaMinutes: entry.etaMinutes,
        quantity
      });
    }

    const unmet = Math.max(0, incident.demand - totalSent);
    const averageEtaMinutes = remainingDecisions.length > 0 ? totalEta / remainingDecisions.length : null;
    const travelBurden = remainingDecisions.length > 0 ? totalDistanceKm / remainingDecisions.length : 0;
    const immediateDemand = Math.ceil(incident.demand * 0.4);
    const criticalCoveragePercent = immediateDemand === 0 ? 100 : Math.min(100, Math.round((criticalServed / immediateDemand) * 100));
    const criticalGap = Math.max(0, immediateDemand - criticalServed);
    const surgeDemand = Math.max(incident.demand, incident.demand + surgePenalty);
    const unmetRatio = incident.demand > 0 ? unmet / incident.demand : 0;
    const etaPenalty = averageEtaMinutes ? Math.max(0, averageEtaMinutes - CRITICAL_WINDOW_MINUTES) / CRITICAL_WINDOW_MINUTES : 0;
    const distancePenalty = Math.min(1, travelBurden / 400);
    const pressureIndex = Math.min(100, Math.round((unmetRatio * 0.55 + etaPenalty * 0.3 + distancePenalty * 0.15) * 100));
    const riskLevel: AllocationResult['riskLevel'] = unmet === 0
      ? 'Low'
      : incident.demand > 0 && unmet / incident.demand <= 0.3
      ? 'Medium'
      : 'High';

    const demandRiskLevel = getDemandRiskLevel(incident.demand);

    return {
      demand: incident.demand,
      totalSent,
      unmet,
      averageEtaMinutes,
      totalDistanceKm,
      surgeDemand,
      criticalCoveragePercent,
      criticalGap,
      pressureIndex,
      riskLevel,
      demandRiskLevel,
      decisions: remainingDecisions
    };
  },
  refreshScenarios: () => set({ scenarios: loadScenarios() }),
  saveScenario: (name) => {
    const { incident, stagingAreas } = get();
    if (!incident.location || incident.demand <= 0) {
      set({ toast: { message: 'Set incident location and demand before saving', tone: 'error' } });
      return;
    }
    const scenario: Scenario = {
      id: generateId(),
      name: name.trim() || `Scenario ${new Date().toLocaleString()}`,
      incident,
      stagingAreas,
      savedAt: new Date().toISOString()
    };
    saveScenario(scenario);
    set({ toast: { message: `Saved "${scenario.name}"`, tone: 'success' } });
    get().refreshScenarios();
  },
  deleteScenario: (id) => {
    deleteScenario(id);
    set({ toast: { message: 'Deleted scenario', tone: 'info' } });
    get().refreshScenarios();
  },
  loadScenario: (id) => {
    const scenario = get().scenarios.find((s) => s.id === id);
    if (!scenario) return;
    set({
      incident: scenario.incident,
      stagingAreas: scenario.stagingAreas,
      travelMetrics: {},
      routingGuidance: { staging: {}, hospital: null },
      toast: { message: `Loaded "${scenario.name}"`, tone: 'success' }
    });
  },
  createDemoScenario: () => {
    set({
      incident: {
        location: { lat: 64.5122, lng: -165.4064 },
        demand: 120
      },
      stagingAreas: [
        {
          id: generateId(),
          name: 'Anchorage',
          location: { lat: 61.2181, lng: -149.9003 },
          available: 60
        },
        {
          id: generateId(),
          name: 'Fairbanks',
          location: { lat: 64.8378, lng: -147.7164 },
          available: 50
        },
        {
          id: generateId(),
          name: 'Juneau',
          location: { lat: 58.3019, lng: -134.4197 },
          available: 30
        },
        {
          id: generateId(),
          name: 'Seattle',
          location: { lat: 47.6062, lng: -122.3321 },
          available: 80
        }
      ],
      travelMetrics: {},
      routingGuidance: { staging: {}, hospital: null },
      toast: { message: 'Demo scenario ready', tone: 'success' }
    });
  },
  setToast: (toast) => set({ toast }),
  setTravelMetric: (id, metrics) =>
    set((state) => ({
      travelMetrics: {
        ...state.travelMetrics,
        [id]: {
          ...(state.travelMetrics[id] ?? { status: 'idle' }),
          ...metrics
        }
      }
    })),
  setTravelMetrics: (updates) =>
    set((state) => {
      const next = { ...state.travelMetrics };
      for (const [id, metrics] of Object.entries(updates)) {
        next[id] = {
          ...(next[id] ?? { status: 'idle' }),
          ...metrics
        };
      }
      return { travelMetrics: next };
    }),
  clearTravelMetrics: (ids) =>
    set((state) => {
      if (!ids) {
        return { travelMetrics: {} };
      }
      const next = { ...state.travelMetrics };
      ids.forEach((id) => {
        delete next[id];
      });
      return { travelMetrics: next };
    }),
  setRoutingGuidance: (target, id, guidance) =>
    set((state) => {
      if (target === 'hospital') {
        return { routingGuidance: { ...state.routingGuidance, hospital: guidance } };
      }
      if (!id) {
        return {};
      }
      return {
        routingGuidance: {
          staging: { ...state.routingGuidance.staging, [id]: guidance },
          hospital: state.routingGuidance.hospital
        }
      };
    }),
  clearRoutingGuidance: (target, ids) =>
    set((state) => {
      if (!target) {
        return { routingGuidance: { staging: {}, hospital: null } };
      }
      if (target === 'hospital') {
        return { routingGuidance: { ...state.routingGuidance, hospital: null } };
      }
      if (!ids) {
        return { routingGuidance: { ...state.routingGuidance, staging: {} } };
      }
      const next = { ...state.routingGuidance.staging };
      ids.forEach((id) => {
        delete next[id];
      });
      return { routingGuidance: { ...state.routingGuidance, staging: next } };
    })
}));
