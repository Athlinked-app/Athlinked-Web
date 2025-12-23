import UserTypeSelection from './components/UserTypeSelection';
import PersonalDetailsForm from './components/PersonalDetailsForm';
import ParentDetailsForm from './components/ParentDetailsForm';
import OTPVerification from './components/OTPVerification';

interface SignupFormStepsProps {
  currentStep: number;
  selectedUserType: string;
  formData: any;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoadingOTP?: boolean;
  onFormDataChange: (data: any) => void;
  onUserTypeSelect: (type: string) => void;
  onContinue: () => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

export default function SignupFormSteps({
  currentStep,
  selectedUserType,
  formData,
  showPassword,
  showConfirmPassword,
  isLoadingOTP = false,
  onFormDataChange,
  onUserTypeSelect,
  onContinue,
  onTogglePassword,
  onToggleConfirmPassword,
}: SignupFormStepsProps) {
  // Step 0: Join as - User Type Selection
  if (currentStep === 0) {
    return (
      <UserTypeSelection
        selectedUserType={selectedUserType}
        onUserTypeSelect={onUserTypeSelect}
        onContinue={onContinue}
      />
    );
  }

  // Step 1: Personal Details
  if (selectedUserType && currentStep === 1) {
    return (
      <PersonalDetailsForm
        selectedUserType={selectedUserType}
        formData={formData}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        isLoadingOTP={isLoadingOTP}
        onFormDataChange={onFormDataChange}
        onContinue={onContinue}
        onTogglePassword={onTogglePassword}
        onToggleConfirmPassword={onToggleConfirmPassword}
      />
    );
  }

  // Step 2: Parent Details (Only for Athlete)
  if (selectedUserType === 'athlete' && currentStep === 2) {
    return (
      <ParentDetailsForm
        formData={formData}
        onFormDataChange={onFormDataChange}
        isLoadingOTP={isLoadingOTP}
        onContinue={onContinue}
      />
    );
  }

  // OTP Verification (Last Step)
  if (
    selectedUserType &&
    ((selectedUserType === 'athlete' && currentStep === 3) ||
      (selectedUserType !== 'athlete' && currentStep === 2))
  ) {
    return (
      <OTPVerification
        formData={formData}
        onFormDataChange={onFormDataChange}
        selectedUserType={selectedUserType}
        onContinue={onContinue}
      />
    );
  }

  return null;
}
