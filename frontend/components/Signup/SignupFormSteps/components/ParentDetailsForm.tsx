import { User, Mail } from 'lucide-react';
import { useState } from 'react';
import { apiGet } from '@/utils/api';

interface ParentDetailsFormProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  isLoadingOTP?: boolean;
  isCompletingGoogleSignup?: boolean;
  onContinue: () => void;
}

export default function ParentDetailsForm({
  formData,
  onFormDataChange,
  isLoadingOTP = false,
  isCompletingGoogleSignup = false,
  onContinue,
}: ParentDetailsFormProps) {
  const [parentEmailError, setParentEmailError] = useState<string>('');
  return (
    <>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent / Guardian Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.parentName}
              onChange={e =>
                onFormDataChange({ ...formData, parentName: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.parentEmail}
              onChange={e => {
                onFormDataChange({ ...formData, parentEmail: e.target.value });
                setParentEmailError(''); // Clear error on change
              }}
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${
                parentEmailError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {parentEmailError && (
            <p className="mt-1 text-xs text-red-600">{parentEmailError}</p>
          )}
        </div>
      </div>

      <button
        onClick={async () => {
          // Validate parent email before proceeding
          const email = formData.parentEmail?.trim();
          if (!email) {
            setParentEmailError('Parent email is required');
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            setParentEmailError('Please enter a valid email address');
            return;
          }

          // Check if parent email is already registered as athlete
          try {
            const data = await apiGet(`/signup/user/${encodeURIComponent(email)}`);
            if (data && data.user) {
              if (data.user.user_type === 'athlete') {
                setParentEmailError('This email is registered as an athlete and cannot be used as a parent email');
                return;
              }
              if (data.user.user_type === 'parent') {
                setParentEmailError('This email is already registered as a parent');
                return;
              }
              setParentEmailError('This email is already registered');
              return;
            }
          } catch (err: any) {
            if (err.status !== 404) {
              console.error('Error validating parent email:', err);
              setParentEmailError('Unable to validate email. Please try again.');
              return;
            }
            // 404 means email not found, which is good
          }

          // Email is valid, proceed to next step
          setParentEmailError('');
          onContinue();
        }}
        disabled={isLoadingOTP || isCompletingGoogleSignup}
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {(isLoadingOTP || isCompletingGoogleSignup) && (
          <svg
            className="animate-spin h-5 w-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        <span>
          {isCompletingGoogleSignup
            ? 'Creating Account...'
            : isLoadingOTP
              ? 'Sending OTP...'
              : 'Continue'}
        </span>
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
