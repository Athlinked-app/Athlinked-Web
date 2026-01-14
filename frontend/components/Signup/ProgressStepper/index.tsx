import React from 'react';
interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
}

export default function ProgressStepper({
  steps,
  currentStep,
}: ProgressStepperProps) {
  return (
    <div className="mb-8">
      {/* Labels Row */}
      <div className="flex items-start justify-between mb-2">
        {steps.map((step, index) => (
          <div key={`label-${index}`} className="flex-1 text-center px-1">
            <div className="text-xs sm:text-sm font-medium text-gray-700 min-h-[32px] flex items-center justify-center">
              {step}
            </div>
          </div>
        ))}
      </div>

      {/* Circles and Lines Row */}
      {/* Circles and Lines Row */}
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={`step-${index}`}>
            {/* Circle Container */}
            <div
              className="flex items-center justify-center"
              style={{ width: index === steps.length - 1 ? 'auto' : 'auto' }}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-[#CB9729]' : 'bg-gray-200'
                }`}
              >
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                    index <= currentStep ? 'bg-white' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Connecting Line (except for last step) */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  index < currentStep ? 'bg-[#CB9729]' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
