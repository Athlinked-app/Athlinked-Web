interface UserTypeSelectionProps {
  selectedUserType: string;
  onUserTypeSelect: (type: string) => void;
  onContinue: () => void;
}

export default function UserTypeSelection({
  selectedUserType,
  onUserTypeSelect,
  onContinue,
}: UserTypeSelectionProps) {
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
        className="w-full bg-[#CB9729] hover:bg-[#d4a846] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 sm:mb-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}
