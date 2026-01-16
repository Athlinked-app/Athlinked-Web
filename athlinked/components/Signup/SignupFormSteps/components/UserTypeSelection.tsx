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

    //   NEW: Just store Google data locally, don't call backend yet
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
      <style jsx>{`
        .custom-radio {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          outline: none;
          cursor: pointer;
          position: relative;
          background-color: white;
        }

        .custom-radio:checked {
          border-color: #cb9729;
          background-color: white;
        }

        .custom-radio:checked::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #cb9729;
        }
      `}</style>

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
              <input
                type="radio"
                name="userType"
                checked={selectedUserType === 'athlete'}
                onChange={() => onUserTypeSelect('athlete')}
                className="custom-radio"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Athlete</h3>
              <p className="text-sm text-gray-600">
                Chase your dreams, push your limits, and showcase your talent
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
              <input
                type="radio"
                name="userType"
                checked={selectedUserType === 'coach'}
                onChange={() => onUserTypeSelect('coach')}
                className="custom-radio"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Coach</h3>
              <p className="text-sm text-gray-600">
                Inspire athletes, shape champions, and leave a lasting impact.
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
              <input
                type="radio"
                name="userType"
                checked={selectedUserType === 'organization'}
                onChange={() => onUserTypeSelect('organization')}
                className="custom-radio"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Organization</h3>
              <p className="text-sm text-gray-600">
                Empower teams, discover rising stars, and build a legacy of
                success.
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
