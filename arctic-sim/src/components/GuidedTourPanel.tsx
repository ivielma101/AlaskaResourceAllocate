import { FormEvent, useState } from 'react';
import { useSimulationStore } from '@/app/store';

const tourSteps = [
  {
    title: 'Place an incident',
    detail: 'Click the map to drop an incident marker and set demand using the risk adjuster.'
  },
  {
    title: 'Layer your data',
    detail: 'Use the map layer controls to show hospitals, cities, or travel distances as needed.'
  },
  {
    title: 'Route resources',
    detail: 'Drag staging icons or apply a preset to generate flow lines and travel time estimates.'
  },
  {
    title: 'Inspect nearby care',
    detail: 'Click hospitals or arrows to reveal airborne readiness, utilisation, and routing context.'
  }
];

export const GuidedTourPanel = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const setToast = useSimulationStore((state) => state.setToast);

  const currentStep = tourSteps[stepIndex];

  const handleFeedbackSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!feedback.trim()) {
      return;
    }
    setToast({ message: 'Feedback received — thank you!', tone: 'success' });
    setFeedback('');
  };

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-base font-semibold text-slate-800">Guided walkthrough</h2>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="text-xs uppercase tracking-wide text-slate-500">Step {stepIndex + 1} of {tourSteps.length}</p>
        <p className="mt-1 font-semibold text-slate-800">{currentStep.title}</p>
        <p className="mt-1 text-slate-600">{currentStep.detail}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={stepIndex === tourSteps.length - 1}
            onClick={() => setStepIndex((index) => Math.min(tourSteps.length - 1, index + 1))}
            className="rounded-md border border-sky-500 px-3 py-1 text-xs font-medium text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-2 text-sm">
        <label className="block text-sm font-medium text-slate-700" htmlFor="tour-feedback">
          Share quick feedback
        </label>
        <textarea
          id="tour-feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Let us know what else would help your response planning workflows."
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600"
        >
          Submit feedback
        </button>
      </form>
    </section>
  );
};
