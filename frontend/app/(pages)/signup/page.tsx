'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import SignupHero from '@/components/Signup/SignupHero';
import ProgressStepper from '@/components/Signup/ProgressStepper';
import SignupFormSteps from '@/components/Signup/SignupFormSteps';
import { isAuthenticated } from '@/utils/auth';

// Separate the component that uses useSearchParams
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isCompletingGoogleSignup, setIsCompletingGoogleSignup] =
    useState(false);
  const [signupError, setSignupError] = useState<string>('');
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/home');
    }
  }, [router]);

  // Clear stale Google data ONLY if NOT coming from login redirect
  useEffect(() => {
    const fromLogin = searchParams.get('from') === 'login';

    if (!fromLogin) {
      // User navigated directly to signup page - clear any old Google data
      localStorage.removeItem('google_temp_data');
    }
    // If fromLogin is true, keep the google_temp_data for the flow
  }, [searchParams]);

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
      if (googleData) {
        setIsGoogleUser(true);

        // Auto-fill email and name from Google data
        try {
          const data = JSON.parse(googleData);
          setFormData(prev => ({
            ...prev,
            fullName: data.full_name || '',
            email: data.email || '',
          }));
        } catch (e) {
          console.error('Error parsing Google data:', e);
        }
      }
    }
  }, []);

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
  const googleAthleteSteps = ['Join as', 'Personal Details', 'Parent Details'];

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

  // Handle going back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // GOOGLE SIGN-IN HANDLER - UPDATED
  const handleGoogleSignIn = (userData: any) => {
    console.log('Google sign-in data received:', userData);

    // Pre-fill form with Google data
    setFormData(prev => ({
      ...prev,
      fullName: userData.user?.full_name || '',
      email: userData.user?.email || '',
    }));

    // Store Google data temporarily (we'll use it later to CREATE user in database)
    localStorage.setItem(
      'google_temp_data',
      JSON.stringify({
        google_id: userData.user?.google_id,
        email: userData.user?.email,
        full_name: userData.user?.full_name,
        profile_picture: userData.user?.profile_picture,
        email_verified: userData.user?.email_verified,
        user_type: userData.user?.user_type,
      })
    );

    // IMPORTANT: Set isGoogleUser to true
    setIsGoogleUser(true);

    // Set the user type
    setSelectedUserType(userData.user?.user_type || '');

    // Move to Personal Details step (step 1)
    setCurrentStep(1);
  };

  const handleContinue = async () => {
    // Check if this is a Google user completing their profile
    const googleDataStr = localStorage.getItem('google_temp_data');
    const isGoogleUser = !!googleDataStr;

    //   NEW: For Google users, only create in database on LAST step
    if (isGoogleUser) {
      // For coach/org: Last step is Personal Details (step 1)
      // For athlete: Last step is Parent Details (step 2)
      const isLastStep =
        (selectedUserType !== 'athlete' && currentStep === 1) ||
        (selectedUserType === 'athlete' && currentStep === 2);

      if (!isLastStep) {
        // Not last step, just move forward
        if (currentStep < currentSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
        return;
      }

      // LAST STEP: Create user in database with ALL data
      // LAST STEP: Create user in database with ALL data
      const googleData = JSON.parse(googleDataStr);

      setIsCompletingGoogleSignup(true); // ADD THIS LINE

      try {
        const profileData: any = {
          google_id: googleData.google_id,
          email: googleData.email,
          full_name: googleData.full_name,
          profile_picture: googleData.profile_picture,
          email_verified: googleData.email_verified,
          user_type: googleData.user_type,
          dob: formData.dateOfBirth,
        };

        // Add user-type specific data
        if (googleData.user_type === 'athlete') {
          if (!formData.sportsPlayed || !formData.primarySport) {
            alert('Please select sports played and primary sport');
            return;
          }
          profileData.sports_played = formData.sportsPlayed
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          profileData.primary_sport = formData.primarySport;
          profileData.parent_name = formData.parentName;
          profileData.parent_email = formData.parentEmail;
          profileData.parent_dob = formData.parentDOB;
        } else if (googleData.user_type === 'coach') {
          // Coach doesn't need additional fields
        } else if (googleData.user_type === 'organization') {
          if (!formData.companyName || !formData.designation) {
            alert('Please fill in company name and designation');
            return;
          }
          profileData.company_name = formData.companyName;
          profileData.designation = formData.designation;
        }

        const { apiRequestUnauthenticated } = await import('@/utils/api');
        const response = await apiRequestUnauthenticated(
          '/auth/google/complete-signup-full',
          {
            method: 'POST',
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
          alert(data.message || 'Failed to complete signup');
          return;
        }
      } catch (error) {
        console.error('Error completing Google signup:', error);
        alert('Failed to complete signup. Please try again.');
        setIsCompletingGoogleSignup(false); // ADD THIS LINE
        return;
      }
    }

    // NORMAL SIGNUP FLOW (non-Google users)
    // If moving to OTP step, call backend to send OTP via email
    if (
      (selectedUserType === 'athlete' && currentStep === 2) ||
      (selectedUserType !== 'athlete' && currentStep === 1)
    ) {
      // Validate email/username for non-athletes or parent email for athletes
      if (!formData.email || !formData.email.trim()) {
        alert('Email or username is required');
        return;
      }

      // For athletes on parent details step, validate parent email
      if (selectedUserType === 'athlete' && !formData.parentEmail) {
        alert('Parent email is required');
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
        const { apiRequestUnauthenticated } = await import('@/utils/api');
        const response = await apiRequestUnauthenticated('/signup/start', {
          method: 'POST',
          body: JSON.stringify(signupData),
        });

        const data = await response.json();

        console.log('Signup response:', {
          status: response.status,
          ok: response.ok,
          data: data,
        });

        if (!response.ok || !data.success) {
          const errorMsg =
            data.message || 'Failed to send OTP. Please try again.';
          console.log('Setting signup error:', errorMsg);
          setSignupError(errorMsg);
          setIsLoadingOTP(false);
          return;
        }

        // OTP sent successfully, clear error and proceed to next step
        console.log('Signup successful, proceeding to next step');
        setSignupError('');
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
      // For athletes on Personal Details (step 1), just advance to Parent Details
      // For non-athletes on other steps, just advance
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
          <div className="flex items-center mb-6 sm:mb-8">
            <Link href="/" className="cursor-pointer">
              <img
                src="/assets/Signup/logo.png"
                alt="ATHLINKED"
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>

          {/* Back Button - Show only when not on first step */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-full hover:bg-[#B8861F] mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

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
            isGoogleUser={isGoogleUser}
            isCompletingGoogleSignup={isCompletingGoogleSignup}
            signupError={signupError}
            onFormDataChange={setFormData}
            onUserTypeSelect={setSelectedUserType}
            onContinue={handleContinue}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleConfirmPassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            onClearError={() => setSignupError('')}
            onGoogleSignIn={handleGoogleSignIn}
          />
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
