import type { RiskLevel } from '@/types/domain';

export const RISK_BADGE_CLASSES: Record<RiskLevel, string> = {
  Low: 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]',
  Medium: 'border border-amber-200 bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]',
  High: 'border border-rose-200 bg-rose-50 text-rose-700 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.22)]'
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#047857',
  Medium: '#b45309',
  High: '#b91c1c'
};

export const getDemandRiskLevel = (demand: number): RiskLevel => {
  if (demand <= 0) {
    return 'Low';
  }
  if (demand < 75) {
    return 'Low';
  }
  if (demand < 175) {
    return 'Medium';
  }
  return 'High';
};

export const getRiskCopy = (risk: RiskLevel) => {
  switch (risk) {
    case 'Low':
      return 'Resources appear sufficient for the current demand.';
    case 'Medium':
      return 'Monitor closely—additional resources may be required soon.';
    case 'High':
      return 'Demand significantly exceeds capacity. Immediate action needed.';
    default:
      return '';
  }
};
