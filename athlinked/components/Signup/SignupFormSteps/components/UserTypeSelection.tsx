import { useState } from 'react';
import GoogleSignInButton from '../../GoogleSignInButton';

interface UserTypeSelectionProps {
  selectedUserType: string;
  onUserTypeSelect: (type: string) => void;
  onContinue: () => void;
  onGoogleSignIn?: (userData: any) => void; // NEW
}

export default function UserTypeSelection({
  selectedUserType,
  onUserTypeSelect,
  onContinue,
  onGoogleSignIn, // NEW
}: UserTypeSelectionProps) {
  // NEW - Google Sign-In state
  const [showGoogleUserTypeModal, setShowGoogleUserTypeModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);

  // NEW - Handle Google Sign-In success
  const handleGoogleSuccess = (userData: any) => {
    console.log('Google sign-in response:', userData);
    
    if (userData.needs_user_type) {
      setGoogleUserData(userData);
      setShowGoogleUserTypeModal(true);
    } else {
      onGoogleSignIn?.(userData);
    }
  };

  // NEW - Handle user type selection for Google users
  const handleGoogleUserTypeSubmit = async (userType: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/google/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_id: googleUserData.google_id,
          user_type: userType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowGoogleUserTypeModal(false);
        onGoogleSignIn?.(data);
      } else {
        alert(data.message || 'Failed to complete signup');
      }
    } catch (error) {
      console.error('Error completing Google signup:', error);
      alert('Failed to complete signup. Please try again.');
    }
  };

  return (
    <>
      {!selectedUserType && (
        <>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Let's Get Started!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Join AthLinked for free and start showcasing your talent today!
          </p>
        </>
      )}

      {/* NEW - Google Sign-In Button (only show when no user type selected and clientId is configured) */}
      {!selectedUserType && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <>
          <div className="mb-6">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(error) => console.error('Google sign-in error:', error)}
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <label
          className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-colors ${
            selectedUserType === 'athlete'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="userType"
            value="athlete"
            checked={selectedUserType === 'athlete'}
            onChange={e => onUserTypeSelect(e.target.value)}
            className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 focus:ring-yellow-500"
          />
          <div>
            <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Athlete
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Chase your dreams, push your limits, and showcase your talent
            </div>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-colors ${
            selectedUserType === 'coach'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="userType"
            value="coach"
            checked={selectedUserType === 'coach'}
            onChange={e => onUserTypeSelect(e.target.value)}
            className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 focus:ring-yellow-500"
          />
          <div>
            <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Coach/Recruiter
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Inspire athletes, shape champions, and leave a lasting impact.
            </div>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-colors ${
            selectedUserType === 'organization'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="userType"
            value="organization"
            checked={selectedUserType === 'organization'}
            onChange={e => onUserTypeSelect(e.target.value)}
            className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 focus:ring-yellow-500"
          />
          <div>
            <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Organization
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Empower teams, discover rising stars, and build a legacy of
              success.
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={onContinue}
        disabled={!selectedUserType}
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 sm:mb-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>

      {!selectedUserType && (
        <>
          <div className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Or
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-600">
            <span className="text-gray-700">Already have an account? </span>
            <a href="#" className="text-[#CB9729] font-medium hover:underline">
              Sign in
            </a>
          </div>
        </>
      )}

      {/* NEW - Google User Type Selection Modal */}
      {showGoogleUserTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Welcome to AthLinked!</h3>
            <p className="text-gray-600 mb-6">
              Please select your account type to get started
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleGoogleUserTypeSubmit('athlete')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 text-left transition-all"
              >
                <div className="font-semibold text-gray-900">Athlete</div>
                <div className="text-sm text-gray-600 mt-1">
                  Chase your dreams, push your limits, and showcase your talent
                </div>
              </button>
              
              <button
                onClick={() => handleGoogleUserTypeSubmit('coach')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 text-left transition-all"
              >
                <div className="font-semibold text-gray-900">Coach/Recruiter</div>
                <div className="text-sm text-gray-600 mt-1">
                  Inspire athletes, shape champions, and leave a lasting impact
                </div>
              </button>
              
              <button
                onClick={() => handleGoogleUserTypeSubmit('organization')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 text-left transition-all"
              >
                <div className="font-semibold text-gray-900">Organization</div>
                <div className="text-sm text-gray-600 mt-1">
                  Empower teams, discover rising stars, and build a legacy of success
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowGoogleUserTypeModal(false)}
              className="w-full text-gray-600 text-sm hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}