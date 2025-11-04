import { AllocationPanel } from '@/components/AllocationPanel';
import { IncidentPanel } from '@/components/IncidentPanel';
import { MapView } from '@/components/MapView';
import { StagingAreasPanel } from '@/components/StagingAreasPanel';
import { TopBar } from '@/components/TopBar';
import { HospitalsPanel } from '@/components/HospitalsPanel';
import { StatusStrip } from '@/components/StatusStrip';
import { useSimulationStore } from '@/app/store';
import { ToastBanner } from '@/components/ToastBanner';

const App = () => {
  const toast = useSimulationStore((state) => state.toast);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a href="#main" className="skip-link">
        Skip to dashboard content
      </a>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <TopBar />
        {toast && <ToastBanner />}
        <main
          id="main"
          className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:gap-8"
        >
          <div className="flex flex-col gap-6">
            <IncidentPanel />
            <StagingAreasPanel />
            <AllocationPanel />
          </div>
          <div className="flex flex-col gap-6">
            <section
              aria-label="Operational map"
              className="panel-surface h-[640px] sm:h-[760px] lg:h-[880px] p-0"
            >
              <MapView />
            </section>
            <HospitalsPanel />
          </div>
        </main>
        <StatusStrip />
      </div>
    </div>
  );
};

export default App;
