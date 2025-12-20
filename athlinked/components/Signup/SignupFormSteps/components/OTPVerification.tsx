import { useState } from 'react';

interface OTPVerificationProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  generatedOTP?: string;
  selectedUserType?: string;
  onContinue?: () => void;
}

export default function OTPVerification({
  formData,
  onFormDataChange,
  generatedOTP,
  selectedUserType,
  onContinue,
}: OTPVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);

  const handleContinue = async () => {
    // Validate OTP
    if (!formData.otp) {
      setVerificationMessage('Please enter the OTP');
      return;
    }

    if (!generatedOTP) {
      setVerificationMessage('OTP not generated. Please refresh and try again.');
      return;
    }

    // Compare entered OTP with generated OTP
    if (formData.otp !== generatedOTP) {
      setVerificationMessage('Invalid OTP. Please try again.');
      return;
    }

    // OTP is correct - proceed to save user data
    setIsSubmitting(true);
    setVerificationMessage('');

    try {
      // Prepare data for API call
      const apiData = {
        user_type: selectedUserType,
        full_name: formData.fullName,
        dob: formData.dateOfBirth,
        sports_played: formData.sportsPlayed ? [formData.sportsPlayed] : [],
        primary_sport: formData.primarySport || null,
        email: formData.email,
        password: formData.password,
        parent_name: formData.parentName || null,
        parent_email: formData.parentEmail || null,
        parent_dob: formData.parentDOB || null,
      };

      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setVerificationMessage(data.message || 'Welcome! Account created successfully.');
        // Optionally call onContinue to move to next step or redirect
        if (onContinue) {
          onContinue();
        }
      } else {
        // Display validation errors if available
        const errorMessage = data.errors && data.errors.length > 0
          ? data.errors.join(', ')
          : data.message || 'Failed to create account. Please try again.';
        setVerificationMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setVerificationMessage('Cannot connect to server. Please ensure the backend server is running on port 3001.');
      } else {
        setVerificationMessage('Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <div className="space-y-6 mb-6">
        <p className="text-sm text-gray-700 text-center">
          A one time password has been sent to{' '}
          <span className="font-semibold">{formData.email || 'wd@fj.com'}</span>
        </p>

        {!isVerified && (
          <div>
            <input
              type="text"
              placeholder="Enter OTP!"
              value={formData.otp}
              onChange={e =>
                onFormDataChange({ ...formData, otp: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
        )}

        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Resend...
          </button>
        </div>
      </div>

      {/* Display OTP above Continue button */}
      {generatedOTP && (
        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-2 text-center">Your OTP Code:</p>
          <p className="text-3xl font-bold text-yellow-600 tracking-widest text-center">
            {generatedOTP}
          </p>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This code expires in 5 minutes
          </p>
        </div>
      )}

      {/* Verification Message */}
      {verificationMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            isVerified
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <p className="text-sm text-center font-medium">{verificationMessage}</p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={isSubmitting || isVerified}
        className="w-full bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Account...' : isVerified ? 'Account Created!' : 'Continue'}
      </button>

      <div className="text-center text-xs sm:text-sm text-gray-600">
        <span className="text-gray-700">Already have an account? </span>
        <a href="#" className="text-orange-500 font-medium hover:underline">
          Sign in
        </a>
      </div>
    </>
  );
}
