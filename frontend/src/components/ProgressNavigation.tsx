import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProgressNavigationProps {
  subView: 'dashboard' | 'selection' | 'form' | 'review';
  currentSectionIdx?: number;
  totalSections?: number;
  onNavigate?: (step: 'dashboard' | 'selection' | 'form' | 'review') => void;
  compact?: boolean;
}

export const ProgressNavigation: React.FC<ProgressNavigationProps> = ({
  subView,
  currentSectionIdx = 0,
  totalSections = 1,
  onNavigate,
  compact = false,
}) => {
  const { t } = useLanguage();

  // Determine active step index (0 = Start, 1 = Profile, 2 = Details, 3 = Docs, 4 = Readiness)
  let activeStepIdx = 0;
  if (subView === 'selection') activeStepIdx = 1;
  else if (subView === 'form') {
    if (currentSectionIdx === 0) activeStepIdx = 1;
    else if (currentSectionIdx >= totalSections - 1) activeStepIdx = 3;
    else activeStepIdx = 2;
  } else if (subView === 'review') activeStepIdx = 4;

  const steps = [
    { id: 'dashboard' as const, num: '1', label: t('nav.start', 'Start') },
    { id: 'selection' as const, num: '2', label: t('nav.profile', 'Profile') },
    { id: 'form' as const, num: '3', label: t('nav.details', 'Details') },
    { id: 'review' as const, num: '4', label: t('nav.docs', 'Docs') },
    { id: 'review' as const, num: '5', label: t('nav.readiness', 'Readiness') },
  ];

  // Calculate filled progress percentage (0% to 100%)
  const fillPercentage = (activeStepIdx / (steps.length - 1)) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3 font-hyperlegible w-full max-w-xs">
        <div className="relative flex-1 h-2.5 rounded-full bg-[#E6E2D9] dark:bg-[#2D3D58] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#34456B] to-[#D99020] transition-all duration-300 rounded-full"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[var(--ink-primary)] shrink-0">
          Step {activeStepIdx + 1}/5
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-3">
      {/* Visual Equal-Interval Progress Bar Container */}
      <div className="relative w-full max-w-2xl mx-auto px-4">
        {/* Track Line Background */}
        <div className="absolute top-4 left-6 right-6 h-2 rounded-full bg-[#E6E2D9] dark:bg-[#2D3D58] z-0">
          {/* Active Filled Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-[#34456B] via-[#4A5D87] to-[#D99020] transition-all duration-300 rounded-full"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>

        {/* Step Nodes at Equal Intervals */}
        <div className="relative z-10 flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const isFuture = idx > activeStepIdx;

            return (
              <button
                key={`${step.num}-${step.label}`}
                type="button"
                disabled={isFuture}
                onClick={() => {
                  if (!isFuture && onNavigate) {
                    onNavigate(step.id);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 group focus-visible:outline-none transition-all ${
                  isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                }`}
                title={isFuture ? `Complete current section to unlock Step ${step.num}` : `Go to Step ${step.num}: ${step.label}`}
              >
                {/* Step Circle Node on top of Progress Bar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-hyperlegible text-sm font-bold transition-all duration-200 shadow-md ${
                    isCompleted
                      ? 'bg-[#52745C] text-white'
                      : isCurrent
                      ? 'bg-[#34456B] text-white ring-4 ring-[#D99020]/40 shadow-lg scale-110'
                      : 'bg-white dark:bg-[#1E2B42] text-[#7B8494] border-2 border-[#E6E2D9] dark:border-[#2D3D58]'
                  }`}
                >
                  {isCompleted ? <Check size={18} className="text-white" /> : <span className="leading-none">{step.num}</span>}
                </div>

                {/* Step Label Underneath Node */}
                <span
                  className={`font-hyperlegible text-xs transition-colors ${
                    isCurrent
                      ? 'text-[#34456B] dark:text-[#91A4D6] font-bold'
                      : isCompleted
                      ? 'text-[#52745C] dark:text-[#7BAA86] font-semibold'
                      : 'text-[#7B8494]'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
