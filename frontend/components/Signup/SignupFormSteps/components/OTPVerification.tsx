'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/config';

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
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

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
      // Determine the email to use for OTP verification
      // If username was used (no @ in email field), use parent_email instead
      const isUsername = formData.email && !formData.email.includes('@');
      const emailForVerification = isUsername
        ? formData.parentEmail
        : formData.email;

      if (!emailForVerification) {
        setVerificationMessage(
          'Email or parent email is required for verification'
        );
        setIsSubmitting(false);
        return;
      }

      // Call backend to verify OTP and create user
      const response = await fetch(`${API_BASE_URL}/api/signup/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailForVerification,
          otp: formData.otp,
        }),
      });

      // Check if response is ok and is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        setVerificationMessage(
          `Server error (Status: ${response.status}). Please check if the backend server is running.`
        );
        setIsSubmitting(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setVerificationMessage(
          'Failed to parse server response. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        setIsVerified(true);
        setVerificationMessage(
          data.message || 'Welcome! Account created successfully.'
        );

        // Store access and refresh tokens
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        // Backward compatibility: also store as 'token' if only token is provided
        if (data.token && !data.accessToken) {
          localStorage.setItem('accessToken', data.token);
        }

        // Store user identifier in localStorage (for backward compatibility during migration)
        // Store email if available, otherwise store username
        if (data.user?.email) {
          localStorage.setItem('userEmail', data.user.email);
        } else if (data.user?.username) {
          // For username-based signups, store username with a prefix so we can identify it
          localStorage.setItem('userEmail', `username:${data.user.username}`);
        } else {
          // Fallback to email used for verification
          localStorage.setItem('userEmail', emailForVerification);
        }

        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/home');
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

  const handleResendOTP = async () => {
    setIsResending(true);
    setResendMessage('');
    setVerificationMessage('');

    try {
      // Prepare signup data for OTP request (same as initial signup)
      const sportsArray = formData.sportsPlayed
        ? formData.sportsPlayed
            .split(',')
            .map((s: string) => s.trim())
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

      // Call backend to resend OTP
      const { apiRequestUnauthenticated } = await import('@/utils/api');
      const response = await apiRequestUnauthenticated('/signup/start', {
        method: 'POST',
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('OTP has been resent successfully!');
        // Clear the OTP input field
        onFormDataChange({ ...formData, otp: '' });
        // Clear success message after 3 seconds
        setTimeout(() => {
          setResendMessage('');
        }, 3000);
      } else {
        setResendMessage(
          data.message || 'Failed to resend OTP. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setResendMessage('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="space-y-6 mb-6">
        <p className="text-sm text-gray-700 text-center">
          A one time password has been sent to{' '}
          <span className="font-semibold">
            {formData.email && !formData.email.includes('@')
              ? formData.parentEmail || 'parent email'
              : formData.email || 'your email'}
          </span>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-lg tracking-widest text-gray-900"
              maxLength={6}
            />
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending || isVerified}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
        {resendMessage && (
          <div
            className={`mt-2 p-2 rounded-lg text-sm text-center ${
              resendMessage.includes('successfully')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {resendMessage}
          </div>
        )}
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
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? 'Creating Account...'
          : isVerified
            ? 'Account Created!'
            : 'Continue'}
      </button>

      <div className="text-center text-xs sm:text-sm text-gray-600">
        <span className="text-gray-700">Already have an account? </span>
        <a href="/login" className="text-[#CB9729] font-medium hover:underline">
          Sign in
        </a>
      </div>
    </>
  );
}
