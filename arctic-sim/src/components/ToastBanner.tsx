import { useEffect } from 'react';
import { useSimulationStore } from '@/app/store';

const toneStyles: Record<string, string> = {
  info: 'bg-slate-200 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  error: 'bg-rose-100 text-rose-700'
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
    <div className={`rounded-md px-4 py-2 text-sm shadow ${toneStyles[tone] ?? toneStyles.info}`}>
      {toast.message}
    </div>
  );
};
