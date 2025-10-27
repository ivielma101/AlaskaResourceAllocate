import { create } from 'zustand';
import type { LatLngLiteral } from 'leaflet';
import { haversineKm } from '@/lib/geo';
import { deleteScenario, loadScenarios, saveScenario } from '@/lib/persist';
import type {
  AllocationDecision,
  AllocationResult,
  Incident,
  Scenario,
  StagingArea
} from '@/types/domain';

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const DEFAULT_TRAVEL_SPEED = 200;
const DEFAULT_ANCHORAGE: LatLngLiteral = { lat: 61.2181, lng: -149.9003 };

export type ToastMessage = {
  message: string;
  tone?: 'info' | 'success' | 'error';
};

type SimulationState = {
  incident: Incident;
  stagingAreas: StagingArea[];
  travelSpeedKph: number;
  scenarios: Scenario[];
  toast: ToastMessage | null;
  setIncidentLocation: (location: LatLngLiteral | null) => void;
  setDemand: (demand: number) => void;
  reset: () => void;
  addStaging: (location?: LatLngLiteral, initial?: Partial<Omit<StagingArea, 'id' | 'location'>>) => StagingArea;
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
  setIncidentLocation: (location) =>
    set((state) => ({ incident: { ...state.incident, location } })),
  setDemand: (demand) =>
    set((state) => ({ incident: { ...state.incident, demand: Math.max(0, demand) } })),
  reset: () =>
    set({
      incident: { ...initialIncident },
      stagingAreas: [],
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
    set((state) => ({ stagingAreas: [...state.stagingAreas, staging] }));
    set({ toast: { message: `Added ${staging.name}`, tone: 'success' } });
    return staging;
  },
  updateStaging: (id, patch) =>
    set((state) => ({
      stagingAreas: state.stagingAreas.map((area) =>
        area.id === id
          ? {
              ...area,
              ...patch,
              available: patch.available !== undefined ? Math.max(0, patch.available) : area.available
            }
          : area
      )
    })),
  removeStaging: (id) => {
    const area = get().stagingAreas.find((s) => s.id === id);
    set((state) => ({ stagingAreas: state.stagingAreas.filter((s) => s.id !== id) }));
    if (area) {
      set({ toast: { message: `Removed ${area.name}`, tone: 'info' } });
    }
  },
  setTravelSpeed: (speed) => set({ travelSpeedKph: Math.max(10, speed) }),
  computeAllocation: () => {
    const { incident, stagingAreas, travelSpeedKph } = get();
    if (!incident.location || incident.demand <= 0 || stagingAreas.length === 0) {
      return null;
    }

    const remainingDecisions: AllocationDecision[] = [];
    const sortedAreas = [...stagingAreas]
      .filter((area) => area.available > 0)
      .map((area) => {
        const distanceKm = haversineKm(area.location, incident.location!);
        const etaMinutes = (distanceKm / travelSpeedKph) * 60;
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

    for (const entry of sortedAreas) {
      if (remainingDemand <= 0) break;
      const quantity = Math.min(entry.area.available, remainingDemand);
      if (quantity <= 0) continue;
      remainingDemand -= quantity;
      totalSent += quantity;
      totalDistanceKm += entry.distanceKm;
      totalEta += entry.etaMinutes;
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
    const riskLevel: AllocationResult['riskLevel'] = unmet === 0
      ? 'Low'
      : incident.demand > 0 && unmet / incident.demand <= 0.3
      ? 'Medium'
      : 'High';

    return {
      demand: incident.demand,
      totalSent,
      unmet,
      averageEtaMinutes,
      totalDistanceKm,
      riskLevel,
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
      toast: { message: 'Demo scenario ready', tone: 'success' }
    });
  },
  setToast: (toast) => set({ toast })
}));
