'use client';

import { useState } from 'react';
import SignupHero from '@/components/Signup/SignupHero';
import ProgressStepper from '@/components/Signup/ProgressStepper';
import SignupFormSteps from '@/components/Signup/SignupFormSteps';

export default function SignupPage() {
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    sportsPlayed: '',
    primarySport: '',
    email: '',
    password: '',
    confirmPassword: '',
    parentName: '',
    parentEmail: '',
    parentDOB: '',
    companyName: '',
    designation: '',
    otp: '',
  });

  // Define steps for each user type
  const athleteSteps = [
    'Join as',
    'Personal Details',
    'Parent Details',
    'Verify Email',
  ];
  const otherSteps = ['Join as', 'Personal Details', 'Verify Email'];

  // Get current steps based on selection
  const currentSteps =
    selectedUserType === 'athlete' ? athleteSteps : otherSteps;

  const handleContinue = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Hero Image */}
      <SignupHero />

      {/* Right Side - Sign Up Form */}
      <div className="w-full md:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12 my-6 md:my-0">
          {/* Logo - Shows on all screen sizes */}
          <div className="flex items-center mb-6 sm:mb-8">
            <img
              src="/assets/Signup/logo.png"
              alt="ATHLINKED"
              className="h-8 sm:h-10 w-auto"
            />
          </div>

          {/* Progress Stepper */}
          {selectedUserType && (
            <ProgressStepper steps={currentSteps} currentStep={currentStep} />
          )}

          {/* Form Steps */}
          <SignupFormSteps
            currentStep={currentStep}
            selectedUserType={selectedUserType}
            formData={formData}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            onFormDataChange={setFormData}
            onUserTypeSelect={setSelectedUserType}
            onContinue={handleContinue}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleConfirmPassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          />
        </div>
      </div>
    </div>
  );
}
