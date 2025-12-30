import {
  User,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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

interface Sport {
  id: string;
  name: string;
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
  const [sports, setSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(
    formData.sportsPlayed
      ? formData.sportsPlayed
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  );
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const sportsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUserType === 'athlete') {
      fetchSports();
    }
  }, [selectedUserType]);

  // Sync selectedSports with formData when it changes externally
  useEffect(() => {
    if (formData.sportsPlayed) {
      const sportsArray = formData.sportsPlayed
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      setSelectedSports(sportsArray);
    } else {
      setSelectedSports([]);
    }
  }, [formData.sportsPlayed]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sportsDropdownRef.current &&
        !sportsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSportsDropdown(false);
      }
    };

    if (showSportsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSportsDropdown]);

  const fetchSports = async () => {
    setLoadingSports(true);
    try {
      const response = await fetch(
        'http://localhost:3001/api/sports'
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sports) {
          setSports(data.sports);
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoadingSports(false);
    }
  };

  const handleSportToggle = (sportName: string) => {
    const newSelectedSports = selectedSports.includes(sportName)
      ? selectedSports.filter(s => s !== sportName)
      : [...selectedSports, sportName];

    setSelectedSports(newSelectedSports);
    const sportsString = newSelectedSports.join(', ');

    // Update primary sport: keep it if it's still in the selected list, otherwise set to first selected or empty
    let newPrimarySport = formData.primarySport;
    if (
      formData.primarySport &&
      !newSelectedSports.includes(formData.primarySport)
    ) {
      // Primary sport was deselected, reset to first available or empty
      newPrimarySport =
        newSelectedSports.length > 0 ? newSelectedSports[0] : '';
    } else if (!formData.primarySport && newSelectedSports.length > 0) {
      // No primary sport set yet, auto-set to first selected
      newPrimarySport = newSelectedSports[0];
    }

    onFormDataChange({
      ...formData,
      sportsPlayed: sportsString,
      primarySport: newPrimarySport,
    });
  };
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
            <div className="relative" ref={sportsDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports played (Select all that apply)
              </label>
              {loadingSports ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading sports...
                </div>
              ) : (
                <>
                  <div
                    onClick={() => setShowSportsDropdown(!showSportsDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-gray-900 cursor-pointer flex items-center justify-between"
                  >
                    <span
                      className={
                        selectedSports.length > 0
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    >
                      {selectedSports.length > 0
                        ? `${selectedSports.length} sport${selectedSports.length > 1 ? 's' : ''} selected`
                        : 'Select sports'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showSportsDropdown ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {showSportsDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {sports.map(sport => (
                          <label
                            key={sport.id}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSports.includes(sport.name)}
                              onChange={() => handleSportToggle(sport.name)}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {sport.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSports.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      Selected: {selectedSports.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary sport
              </label>
              {loadingSports ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading sports...
                </div>
              ) : (
                <select
                  value={formData.primarySport}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      primarySport: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white text-gray-900"
                  disabled={selectedSports.length === 0}
                >
                  <option value="">Select primary sport</option>
                  {selectedSports.length > 0 ? (
                    selectedSports.map(sportName => (
                      <option key={sportName} value={sportName}>
                        {sportName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Please select sports played first
                    </option>
                  )}
                </select>
              )}
              {selectedSports.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Select sports played first to choose a primary sport
                </p>
              )}
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
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base"
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
