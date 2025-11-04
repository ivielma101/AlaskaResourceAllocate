import { useEffect } from 'react';
import { useSimulationStore } from '@/app/store';

const toneStyles: Record<string, string> = {
  info: 'border border-white/15 bg-white/10 text-slate-100 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.8)] backdrop-blur',
  success:
    'border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 shadow-[0_20px_60px_-42px_rgba(16,185,129,0.75)] backdrop-blur',
  error:
    'border border-rose-400/40 bg-rose-400/10 text-rose-100 shadow-[0_20px_60px_-42px_rgba(248,113,113,0.75)] backdrop-blur'
};

export const ToastBanner = () => {
  const toast = useSimulationStore((state) => state.toast);
  const setToast = useSimulationStore((state) => state.setToast);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast, setToast]);

  if (!toast) return null;
  const tone = toast.tone ?? 'info';
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium uppercase tracking-[0.32em] ${
        toneStyles[tone] ?? toneStyles.info
      }`}
    >
      {toast.message}
    </div>
  );
};
