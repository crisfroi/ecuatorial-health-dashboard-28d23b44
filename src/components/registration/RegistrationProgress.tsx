
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RegistrationProgressProps {
  steps: Step[];
  currentStep: number;
}

export const RegistrationProgress = ({ steps, currentStep }: RegistrationProgressProps) => {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="mb-8">
      <Progress value={progress} className="w-full mb-4" />
      <div className="flex justify-between items-center">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                  step.id <= currentStep
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-center font-medium">{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
