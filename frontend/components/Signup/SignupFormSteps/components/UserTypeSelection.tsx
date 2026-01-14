import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '../../GoogleSignInButton';

interface UserTypeSelectionProps {
  selectedUserType: string;
  onUserTypeSelect: (type: string) => void;
  onContinue: () => void;
  onGoogleSignIn?: (userData: any) => void;
}

export default function UserTypeSelection({
  selectedUserType,
  onUserTypeSelect,
  onContinue,
  onGoogleSignIn,
}: UserTypeSelectionProps) {
  const router = useRouter();

  const handleGoogleSuccess = async (data: any) => {
    console.log('Google sign-in response:', data);

    // 🔥 NEW: Just store Google data locally, don't call backend yet
    // We'll create the user when they complete all steps
    if (data.needs_user_type) {
      // Pass data to parent with the selected user type
      onGoogleSignIn?.({
        ...data,
        user: {
          google_id: data.google_id,
          email: data.email,
          full_name: data.full_name,
          profile_picture: data.profile_picture,
          email_verified: data.email_verified,
          user_type: selectedUserType,
        },
      });
      return;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
          Join as
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Choose your role to get started
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {/* Athlete Card */}
        <div
          onClick={() => onUserTypeSelect('athlete')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            selectedUserType === 'athlete'
              ? 'border-[#CB9729] bg-[#FFF8E7]'
              : 'border-gray-200 hover:border-[#CB9729] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-6 h-6 text-[#CB9729]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                I'm an Athlete
              </h3>
              <p className="text-sm text-gray-600">
                Showcase your skills, connect with coaches, and grow your sports
                career
              </p>
            </div>
          </div>
        </div>

        {/* Coach Card */}
        <div
          onClick={() => onUserTypeSelect('coach')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            selectedUserType === 'coach'
              ? 'border-[#CB9729] bg-[#FFF8E7]'
              : 'border-gray-200 hover:border-[#CB9729] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-6 h-6 text-[#CB9729]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">I'm a Coach</h3>
              <p className="text-sm text-gray-600">
                Find talented athletes, manage your team, and build your
                coaching network
              </p>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div
          onClick={() => onUserTypeSelect('organization')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            selectedUserType === 'organization'
              ? 'border-[#CB9729] bg-[#FFF8E7]'
              : 'border-gray-200 hover:border-[#CB9729] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-6 h-6 text-[#CB9729]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                I'm an Organization
              </h3>
              <p className="text-sm text-gray-600">
                Connect with athletes and coaches, organize events, and expand
                your reach
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Show Continue button AND Google button when user type is selected */}
      {selectedUserType ? (
        <>
          <button
            onClick={onContinue}
            className="w-full bg-[#CB9729] text-white py-3 rounded-lg font-medium hover:bg-[#B8861F] transition-colors mb-4"
          >
            Continue
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            buttonText="Continue with Google"
          />
        </>
      ) : (
        <p className="text-center text-sm text-gray-500 py-3"></p>
      )}

      <div className="text-center text-xs sm:text-sm text-gray-600 mt-4">
        <span className="text-gray-700">Already have an account? </span>
        <a href="/login" className="text-[#CB9729] font-medium hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
