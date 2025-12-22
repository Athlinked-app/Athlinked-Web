'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OTPVerificationProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  selectedUserType?: string;
  onContinue?: () => void;
}

export default function OTPVerification({
  formData,
  onFormDataChange,
  selectedUserType,
  onContinue,
}: OTPVerificationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);

  const handleContinue = async () => {
    // Validate OTP
    if (!formData.otp) {
      setVerificationMessage('Please enter the OTP');
      return;
    }

    // Verify OTP with backend
    setIsSubmitting(true);
    setVerificationMessage('');

    try {
      // Call backend to verify OTP and create user
      const response = await fetch(
        'http://localhost:3001/api/signup/verify-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setVerificationMessage(
          data.message || 'Welcome! Account created successfully.'
        );

        // Store user email in localStorage for stats page
        if (data.user?.email) {
          localStorage.setItem('userEmail', data.user.email);
        }

        // Redirect to stats page after a short delay
        setTimeout(() => {
          router.push('/stats');
        }, 1000);
      } else {
        // Display error message from backend
        const errorMessage =
          data.message || 'Failed to verify OTP. Please try again.';
        setVerificationMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setVerificationMessage(
          'Cannot connect to server. Please ensure the backend server is running on port 3001.'
        );
      } else {
        setVerificationMessage('Failed to verify OTP. Please try again.');
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

      {/* Verification Message */}
      {verificationMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            isVerified
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <p className="text-sm text-center font-medium">
            {verificationMessage}
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={isSubmitting || isVerified}
        className="w-full bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? 'Creating Account...'
          : isVerified
            ? 'Account Created!'
            : 'Continue'}
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
