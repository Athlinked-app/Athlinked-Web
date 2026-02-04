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
  isGoogleUser?: boolean;
  isCompletingGoogleSignup?: boolean;
  signupError?: string;
  onFormDataChange: (data: any) => void;
  onUserTypeSelect: (type: string) => void;
  onContinue: () => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onClearError?: () => void;
  onGoogleSignIn?: (userData: any) => void;
}

export default function SignupFormSteps({
  currentStep,
  selectedUserType,
  formData,
  showPassword,
  showConfirmPassword,
  isLoadingOTP = false,
  isGoogleUser = false,
  isCompletingGoogleSignup = false,
  signupError = '',
  onFormDataChange,
  onUserTypeSelect,
  onContinue,
  onTogglePassword,
  onToggleConfirmPassword,
  onClearError,
  onGoogleSignIn,
}: SignupFormStepsProps) {
  // Step 0: Join as - User Type Selection
  if (currentStep === 0) {
    return (
      <UserTypeSelection
        selectedUserType={selectedUserType}
        onUserTypeSelect={onUserTypeSelect}
        onContinue={onContinue}
        onGoogleSignIn={onGoogleSignIn}
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
        isGoogleUser={isGoogleUser}
        signupError={signupError}
        onFormDataChange={onFormDataChange}
        onContinue={onContinue}
        onTogglePassword={onTogglePassword}
        onToggleConfirmPassword={onToggleConfirmPassword}
        onClearError={onClearError}
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
        isCompletingGoogleSignup={isCompletingGoogleSignup}
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
