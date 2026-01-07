'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupHero from '@/components/Signup/SignupHero';
import ProgressStepper from '@/components/Signup/ProgressStepper';
import SignupFormSteps from '@/components/Signup/SignupFormSteps';

export default function SignupPage() {
  const router = useRouter();
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);

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

  // GOOGLE SIGN-IN HANDLER - UPDATED
  const handleGoogleSignIn = (userData: any) => {
    console.log('Google sign-in data received:', userData);

    // Pre-fill form with Google data
    setFormData(prev => ({
      ...prev,
      fullName: userData.user?.full_name || '',
      email: userData.user?.email || '',
    }));

    // Store Google data temporarily (we'll use it later)
    localStorage.setItem('google_temp_data', JSON.stringify({
      google_id: userData.user?.google_id,
      profile_picture: userData.user?.profile_picture,
      user_type: userData.user?.user_type,
    }));

    // Set the user type
    setSelectedUserType(userData.user?.user_type || '');

    // Move to Personal Details step (step 1)
    setCurrentStep(1);
  };

  const handleContinue = async () => {
    // Check if this is a Google user completing their profile
    const googleDataStr = localStorage.getItem('google_temp_data');
    const isGoogleUser = !!googleDataStr;

    // Determine OTP step based on user type
    const otpStep = selectedUserType === 'athlete' ? 3 : 2;

    // If on Personal Details step and is Google user
    if (currentStep === 1 && isGoogleUser) {
      const googleData = JSON.parse(googleDataStr);
      const { google_id, user_type } = googleData;

      try {
        const profileData: any = {
          google_id,
        };

        // Add user-type specific data
        if (user_type === 'coach') {
          if (!formData.sportsPlayed || !formData.primarySport) {
            alert('Please fill in all required fields');
            return;
          }
          profileData.sports_played = formData.sportsPlayed
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          profileData.primary_sport = formData.primarySport;
        } else if (user_type === 'organization') {
          if (!formData.companyName || !formData.designation) {
            alert('Please fill in all required fields');
            return;
          }
          profileData.company_name = formData.companyName;
          profileData.designation = formData.designation;
        }

        const response = await fetch(
          'https://qd9ngjg1-3001.inc1.devtunnels.ms/api/auth/google/complete-profile',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          }
        );

        const data = await response.json();

        if (data.success) {
          // Store token
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.removeItem('google_temp_data');

          // Redirect to home
          router.push('/home');
          return;
        } else {
          alert(data.message || 'Failed to complete profile');
          return;
        }
      } catch (error) {
        console.error('Error completing Google profile:', error);
        alert('Failed to complete profile. Please try again.');
        return;
      }
    }

    // NORMAL SIGNUP FLOW (non-Google users)
    // If moving to OTP step, call backend to send OTP via email
    if (
      (selectedUserType === 'athlete' && currentStep === 2) ||
      (selectedUserType !== 'athlete' && currentStep === 1)
    ) {
      // Validate email/username
      if (!formData.email || !formData.email.trim()) {
        alert('Email or username is required');
        return;
      }

      // If it's not an email (doesn't contain @), validate username length
      if (!formData.email.includes('@') && formData.email.trim().length < 6) {
        alert('Username must be at least 6 characters long');
        return;
      }

      setIsLoadingOTP(true);
      try {
        // Parse sports_played string into array
        const sportsArray = formData.sportsPlayed
          ? formData.sportsPlayed
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [];

        const signupData = {
          email: formData.email,
          user_type: selectedUserType,
          full_name: formData.fullName,
          dob: formData.dateOfBirth,
          sports_played: sportsArray,
          primary_sport:
            formData.primarySport ||
            (sportsArray.length > 0 ? sportsArray[0] : null),
          password: formData.password,
          parent_name: formData.parentName || null,
          parent_email: formData.parentEmail || null,
          parent_dob: formData.parentDOB || null,
        };

        // Call backend to send OTP via email
        const response = await fetch(
          'https://qd9ngjg1-3001.inc1.devtunnels.ms/api/signup/start',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData),
          }
        );

        const data = await response.json();

        if (!data.success) {
          alert(data.message || 'Failed to send OTP. Please try again.');
          setIsLoadingOTP(false);
          return;
        }

        // OTP sent successfully, proceed to OTP verification step
        if (currentStep < currentSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
        setIsLoadingOTP(false);
      } catch (error) {
        console.error('Error sending OTP:', error);
        alert(
          'Failed to send OTP. Please ensure the backend server is running.'
        );
        setIsLoadingOTP(false);
        return;
      }
    } else {
      // Not moving to OTP step, just advance
      if (currentStep < currentSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Hero Image */}
      <SignupHero />

      {/* Right Side - Sign Up Form */}
      <div className="w-full md:w-1/2 xl:w-3/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
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
            isLoadingOTP={isLoadingOTP}
            onFormDataChange={setFormData}
            onUserTypeSelect={setSelectedUserType}
            onContinue={handleContinue}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleConfirmPassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            onGoogleSignIn={handleGoogleSignIn}
          />
        </div>
      </div>
    </div>
  );
}