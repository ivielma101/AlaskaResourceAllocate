import { AllocationPanel } from '@/components/AllocationPanel';
import { IncidentPanel } from '@/components/IncidentPanel';
import { MapView } from '@/components/MapView';
import { ScenariosPanel } from '@/components/ScenariosPanel';
import { StagingAreasPanel } from '@/components/StagingAreasPanel';
import { ToastBanner } from '@/components/ToastBanner';
import { TopBar } from '@/components/TopBar';
import { useSimulationStore } from '@/app/store';

const App = () => {
  const toast = useSimulationStore((state) => state.toast);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <TopBar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        {toast && <ToastBanner />}
        <div className="grid flex-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <IncidentPanel />
            <StagingAreasPanel />
            <ScenariosPanel />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="h-[60vh] min-h-[360px] rounded-lg bg-white shadow">
              <MapView />
            </div>
            <AllocationPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
