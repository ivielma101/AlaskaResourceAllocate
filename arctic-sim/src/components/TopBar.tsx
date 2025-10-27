export const TopBar = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-800">Arctic Allocation (MVP)</h1>
        <a
          href="https://www.buffalo.edu/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <img src="/ub-logo.svg" alt="University at Buffalo" className="h-7 w-auto" />
          <span className="hidden sm:inline">University at Buffalo</span>
        </a>
      </div>
    </header>
  );
};
