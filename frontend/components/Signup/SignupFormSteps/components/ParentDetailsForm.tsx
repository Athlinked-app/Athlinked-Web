import { User, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [errors, setErrors] = useState({ parentName: '', parentEmail: '' });

  const validateEmailFormat = (email: string) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  // Debounced server-side check to prevent using an athlete email as parent email
  useEffect(() => {
    const value = formData.parentEmail?.trim();
    if (!value) {
      setErrors(prev => ({ ...prev, parentEmail: '' }));
      return;
    }

    const clientErr = validateEmailFormat(value);
    if (clientErr) {
      setErrors(prev => ({ ...prev, parentEmail: clientErr }));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await apiGet(`/signup/user/${encodeURIComponent(value)}`);
        if (cancelled) return;
        if (data && data.user) {
          // If email belongs to an athlete, block it from being used as parent email
          if (data.user.user_type === 'athlete') {
            setErrors(prev => ({ ...prev, parentEmail: 'This email is registered as an athlete and cannot be used as a parent email' }));
            return;
          }
          // If it's a parent already, inform user
          if (data.user.user_type === 'parent') {
            setErrors(prev => ({ ...prev, parentEmail: 'This email is already registered as a parent' }));
            return;
          }
          // For other user types (coach/org), treat as already registered
          setErrors(prev => ({ ...prev, parentEmail: 'This email is already registered' }));
        }
      } catch (err: any) {
        if (err.status === 404) {
          // Not found - clear server error
          setErrors(prev => ({ ...prev, parentEmail: '' }));
        } else {
          console.error('Error checking parent email:', err);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.parentEmail]);

  const handleContinue = () => {
    const nameErr = formData.parentName && formData.parentName.trim().length > 0 ? '' : 'Parent name is required';
    const emailErr = errors.parentEmail || validateEmailFormat(formData.parentEmail || '');

    setErrors({ parentName: nameErr, parentEmail: emailErr });

    if (nameErr || emailErr) return;

    onContinue();
  };

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
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${errors.parentName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.parentName && (
            <p className="mt-1 text-xs text-red-600">{errors.parentName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.parentEmail}
              onChange={e =>
                onFormDataChange({ ...formData, parentEmail: e.target.value })
              }
              className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${errors.parentEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.parentEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.parentEmail}</p>
          )}
        </div>
      </div>

      <button
        onClick={handleContinue}
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
