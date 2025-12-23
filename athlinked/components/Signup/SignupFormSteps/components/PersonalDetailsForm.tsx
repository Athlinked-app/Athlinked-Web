import {
  User,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
} from 'lucide-react';

interface PersonalDetailsFormProps {
  selectedUserType: string;
  formData: any;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoadingOTP?: boolean;
  onFormDataChange: (data: any) => void;
  onContinue: () => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

export default function PersonalDetailsForm({
  selectedUserType,
  formData,
  showPassword,
  showConfirmPassword,
  isLoadingOTP = false,
  onFormDataChange,
  onContinue,
  onTogglePassword,
  onToggleConfirmPassword,
}: PersonalDetailsFormProps) {
  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.fullName}
              onChange={e =>
                onFormDataChange({ ...formData, fullName: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of birth (MM/DD/YYYY)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="MM/DD/YYYY"
              value={formData.dateOfBirth}
              onChange={e =>
                onFormDataChange({ ...formData, dateOfBirth: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Sports Played - Only for Athlete */}
        {selectedUserType === 'athlete' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports played
              </label>
              <select
                value={formData.sportsPlayed}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    sportsPlayed: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white text-gray-900"
              >
                <option value="">Select sport</option>
                <option value="basketball">Basketball</option>
                <option value="soccer">Soccer</option>
                <option value="tennis">Tennis</option>
                <option value="swimming">Swimming</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary sport
              </label>
              <select
                value={formData.primarySport}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    primarySport: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white text-gray-900"
              >
                <option value="">Select primary sport</option>
                <option value="basketball">Basketball</option>
                <option value="soccer">Soccer</option>
                <option value="tennis">Tennis</option>
                <option value="swimming">Swimming</option>
              </select>
            </div>
          </>
        )}

        {/* Company Name and Designation - Only for Organization */}
        {selectedUserType === 'organization' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      companyName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                />
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      designation: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                />
                <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </>
        )}

        {/* Email/Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email/Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.email}
              onChange={e =>
                onFormDataChange({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
              placeholder="Enter email or username (min 6 characters)"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {formData.email &&
            !formData.email.includes('@') &&
            formData.email.length < 6 && (
              <p className="mt-1 text-xs text-red-600">
                Username must be at least 6 characters
              </p>
            )}
        </div>

        {/* Create Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Create Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e =>
                onFormDataChange({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password*
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={e =>
                onFormDataChange({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={isLoadingOTP}
        className="w-full bg-[#CB9729] hover:bg-[#d4a846] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoadingOTP && (
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
        {isLoadingOTP ? 'Sending OTP...' : 'Continue'}
      </button>

      <div className="text-center text-xs sm:text-sm text-gray-600">
        <span className="text-gray-700">Already have an account? </span>
        <a href="#" className="text-[#CB9729] font-medium hover:underline">
          Sign in
        </a>
      </div>
    </>
  );
}
