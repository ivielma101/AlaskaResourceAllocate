export const TopBar = () => {
  return (
    <header
      className="rounded-3xl border border-slate-800 bg-slate-900/80 px-6 py-6 shadow-[0_10px_30px_-20px_rgba(8,15,31,0.9)] backdrop-blur"
      role="banner"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
            <img
              src="/arctic-response-logo.svg"
              alt="Arctic Response logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Arctic</p>
            <h1 className="text-3xl font-semibold text-white">Disaster Tool</h1>
            {/* <p className="text-sm text-slate-400">
              A streamlined view of the active incident, resource posture, and hospital readiness.
            </p> */}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {/* <span className="rounded-full border border-slate-700 px-3 py-1 uppercase tracking-[0.28em]">Live simulation</span>
          <span className="rounded-full border border-slate-700 px-3 py-1 uppercase tracking-[0.28em]">Data refreshes in real time</span> */}
        </div>
      </div>
    </header>
  );
};
