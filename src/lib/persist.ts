import { Scenario } from '@/types/domain';

const STORAGE_KEY = 'arctic-sim-scenarios';

const safeParse = (value: string | null): Scenario[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as Scenario[];
    }
  } catch (error) {
    console.warn('Failed to parse scenarios from storage', error);
  }
  return [];
};

export const loadScenarios = (): Scenario[] => {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
};

export const saveScenario = (scenario: Scenario) => {
  if (typeof localStorage === 'undefined') return;
  const scenarios = loadScenarios().filter((s) => s.id !== scenario.id);
  scenarios.push(scenario);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};

export const deleteScenario = (id: string) => {
  if (typeof localStorage === 'undefined') return;
  const scenarios = loadScenarios().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};
