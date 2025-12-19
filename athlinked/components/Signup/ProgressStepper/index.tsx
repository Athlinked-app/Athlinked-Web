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
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center flex-1">
            {/* Step Label */}
            <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center px-1">
              {step}
            </div>

            {/* Step Indicator with Line */}
            <div className="flex items-center w-full">
              {/* Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-yellow-500' : 'bg-gray-200'
                }`}
              >
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                    index <= currentStep ? 'bg-white' : 'bg-gray-400'
                  }`}
                />
              </div>

              {/* Connecting Line (except for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    index < currentStep ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
