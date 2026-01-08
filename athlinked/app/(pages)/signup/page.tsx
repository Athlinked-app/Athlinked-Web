'use client';

import { useState, useEffect } from 'react';
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
  const [isGoogleUser, setIsGoogleUser] = useState(false);

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

  // Check if this is a Google user (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const googleData = localStorage.getItem('google_temp_data');
      setIsGoogleUser(!!googleData);
    }
  }, [selectedUserType, currentStep]);

  // Define steps for each user type
  // For regular signup (with OTP)
  const athleteSteps = [
    'Join as',
    'Personal Details',
    'Parent Details',
    'Verify Email',
  ];
  const otherStepsRegular = ['Join as', 'Personal Details', 'Verify Email'];

  // For Google signup
  const googleSteps = ['Join as', 'Personal Details'];
  const googleAthleteSteps = [
    'Join as',
    'Personal Details',
    'Parent Details',
    'Verify Email',
  ];

  // Get current steps based on selection and auth method
  let currentSteps;
  if (isGoogleUser) {
    // Google users don't have OTP verification step
    currentSteps =
      selectedUserType === 'athlete' ? googleAthleteSteps : googleSteps;
  } else {
    // Regular users have OTP verification
    currentSteps =
      selectedUserType === 'athlete' ? athleteSteps : otherStepsRegular;
  }

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
    localStorage.setItem(
      'google_temp_data',
      JSON.stringify({
        google_id: userData.user?.google_id,
        profile_picture: userData.user?.profile_picture,
        user_type: userData.user?.user_type,
      })
    );

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
      // For athletes, move to parent details step (step 2)
      if (selectedUserType === 'athlete') {
        // Just advance to parent details, don't call API yet
        if (currentStep < currentSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
        return;
      }

      // For coach/organization, complete profile immediately
      const googleData = JSON.parse(googleDataStr);
      const { google_id, user_type } = googleData;

      try {
        const profileData: any = {
          google_id,
          dob: formData.dateOfBirth, // Add DOB field
        };

        // Add user-type specific data with validation
        if (user_type === 'coach') {
          // Coach doesn't need additional fields for now
          // They can be added later if needed
        } else if (user_type === 'athlete') {
          // Validate athlete-specific fields
          if (!formData.sportsPlayed || !formData.primarySport) {
            alert('Please select sports played and primary sport');
            return;
          }
          profileData.sports_played = formData.sportsPlayed
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          profileData.primary_sport = formData.primarySport;
        } else if (user_type === 'organization') {
          // Validate organization-specific fields
          if (!formData.companyName || !formData.designation) {
            alert('Please fill in company name and designation');
            return;
          }
          profileData.company_name = formData.companyName;
          profileData.designation = formData.designation;
        }

        const response = await fetch(
          'http://localhost:3001/api/auth/google/complete-profile',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          }
        );

        const data = await response.json();

        if (data.success) {
          // Store tokens with consistent naming
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          } else if (data.token) {
            localStorage.setItem('accessToken', data.token);
          }

          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          // Store user data
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userEmail', data.user.email);
          }

          // Clean up temporary Google data
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

    // If on Parent Details step and is Google athlete
    if (currentStep === 2 && isGoogleUser && selectedUserType === 'athlete') {
      const googleData = JSON.parse(googleDataStr);
      const { google_id } = googleData;

      // Validate parent email is different from athlete's email
      if (
        formData.parentEmail &&
        formData.email &&
        formData.parentEmail.toLowerCase().trim() ===
          formData.email.toLowerCase().trim()
      ) {
        alert(
          'Parent email cannot be the same as your email. Please use a different email address.'
        );
        return;
      }

      // Validate required fields
      if (
        !formData.parentName ||
        !formData.parentEmail ||
        !formData.parentDOB
      ) {
        alert('Please fill in all parent details');
        return;
      }

      try {
        const profileData: any = {
          google_id,
          dob: formData.dateOfBirth,
          sports_played: formData.sportsPlayed
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          primary_sport: formData.primarySport,
          parent_name: formData.parentName,
          parent_email: formData.parentEmail,
          parent_dob: formData.parentDOB,
        };

        const response = await fetch(
          'http://localhost:3001/api/auth/google/complete-profile',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          }
        );

        const data = await response.json();

        if (data.success) {
          // Store tokens
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          } else if (data.token) {
            localStorage.setItem('accessToken', data.token);
          }

          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          // Store user data
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userEmail', data.user.email);
          }

          // Clean up temporary Google data
          localStorage.removeItem('google_temp_data');

          // Redirect to home
          router.push('/home');
          return;
        } else {
          alert(data.message || 'Failed to complete profile');
          return;
        }
      } catch (error) {
        console.error('Error completing Google athlete profile:', error);
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
          company_name: formData.companyName || null,
          designation: formData.designation || null,
        };

        // Call backend to send OTP via email
        const response = await fetch('http://localhost:3001/api/signup/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupData),
        });

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
