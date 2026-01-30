import { User, Mail, Eye, EyeOff, Building2, Briefcase } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PersonalDetailsFormProps {
  selectedUserType: string;
  formData: any;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoadingOTP?: boolean;
  isGoogleUser?: boolean;
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
  isGoogleUser = false,
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

  // Validation error states
  const [errors, setErrors] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

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
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        sports?: any[];
      }>('/sports');
      if (data.success && data.sports) {
        setSports(data.sports);
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

  // Convert MM/DD/YYYY to YYYY-MM-DD for date input
  const formatDateForInput = (mmddyyyy: string): string => {
    if (!mmddyyyy || mmddyyyy.length !== 10) return '';
    const [month, day, year] = mmddyyyy.split('/');
    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD to MM/DD/YYYY for storage
  const formatDateForStorage = (yyyymmdd: string): string => {
    if (!yyyymmdd) return '';
    const [year, month, day] = yyyymmdd.split('-');
    return `${month}/${day}/${year}`;
  };

  // Validation functions
  const validateName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Name is required';
    }
    if (trimmed.length < 4) {
      return 'Name must be at least 4 characters';
    }
    if (trimmed.length > 20) {
      return 'Name must be no more than 20 characters';
    }
    return '';
  };

  const validateDOB = (dob: string): string => {
    if (!dob) {
      return 'Date of birth is required';
    }

    // Check format MM/DD/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dob)) {
      return 'Date must be in MM/DD/YYYY format';
    }

    const [, month, day, year] = dob.match(dateRegex) || [];
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    // Validate month and day ranges
    if (monthNum < 1 || monthNum > 12) {
      return 'Invalid month. Must be between 01 and 12';
    }
    if (dayNum < 1 || dayNum > 31) {
      return 'Invalid day. Must be between 01 and 31';
    }

    // Create date object and validate
    const birthDate = new Date(yearNum, monthNum - 1, dayNum);
    if (
      birthDate.getFullYear() !== yearNum ||
      birthDate.getMonth() !== monthNum - 1 ||
      birthDate.getDate() !== dayNum
    ) {
      return 'Invalid date';
    }

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - yearNum;
    const monthDiff = today.getMonth() - (monthNum - 1);
    const dayDiff = today.getDate() - dayNum;

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    // UPDATED: Check age range (12-21) ONLY for athlete user type
    if (selectedUserType === 'athlete') {
      if (age < 12) {
        return 'Age must be at least 12 years';
      }
      if (age > 21) {
        return 'Age must be no more than 21 years';
      }
    }

    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email) {
      return 'Email or username is required';
    }

    // If it contains @, validate as email
    if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address';
      }
    } else {
      // Validate as username
      if (email.trim().length < 6) {
        return 'Username must be at least 6 characters';
      }
    }

    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password.length > 12) {
      return 'Password must be no more than 12 characters';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const missingRequirements = [];
    if (!hasUpperCase) missingRequirements.push('1 uppercase letter');
    if (!hasLowerCase) missingRequirements.push('1 lowercase letter');
    if (!hasNumber) missingRequirements.push('1 number');
    if (!hasSpecialChar) missingRequirements.push('1 special character');

    if (missingRequirements.length > 0) {
      return `Password must contain: ${missingRequirements.join(', ')}`;
    }

    return '';
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ): string => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Handle field changes with validation
  const handleNameChange = (value: string) => {
    onFormDataChange({ ...formData, fullName: value });
    if (value) {
      setErrors(prev => ({ ...prev, fullName: validateName(value) }));
    } else {
      setErrors(prev => ({ ...prev, fullName: '' }));
    }
  };

  const handleDOBChange = (value: string) => {
    // Value comes in YYYY-MM-DD format from date input
    const formattedDate = formatDateForStorage(value);
    onFormDataChange({ ...formData, dateOfBirth: formattedDate });
    if (formattedDate.length === 10) {
      setErrors(prev => ({ ...prev, dateOfBirth: validateDOB(formattedDate) }));
    } else {
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const handleEmailChange = (value: string) => {
    onFormDataChange({ ...formData, email: value });
    if (value) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    onFormDataChange({ ...formData, password: value });
    if (value) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
      // Re-validate confirm password if it exists
      if (formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: validateConfirmPassword(
            formData.confirmPassword,
            value
          ),
        }));
      }
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    onFormDataChange({ ...formData, confirmPassword: value });
    if (value) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, formData.password),
      }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  // Validate all fields before continuing
  const handleContinueClick = () => {
    // Only validate name if not a Google user
    const nameError = isGoogleUser ? '' : validateName(formData.fullName);
    const dobError = validateDOB(formData.dateOfBirth);
    const emailError = isGoogleUser ? '' : validateEmail(formData.email);

    // Only validate passwords for non-Google users
    const passwordError = isGoogleUser
      ? ''
      : validatePassword(formData.password);
    const confirmPasswordError = isGoogleUser
      ? ''
      : validateConfirmPassword(formData.confirmPassword, formData.password);

    setErrors({
      fullName: nameError,
      dateOfBirth: dobError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    if (
      nameError ||
      dobError ||
      emailError ||
      passwordError ||
      confirmPasswordError
    ) {
      return;
    }

    onContinue();
  };

  return (
    <>
      <style jsx global>{`
        input[type='date']::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }

        input[type='date']::-webkit-datetime-edit-text {
          color: #111827;
          padding: 0 2px;
        }

        input[type='date']::-webkit-datetime-edit-month-field,
        input[type='date']::-webkit-datetime-edit-day-field,
        input[type='date']::-webkit-datetime-edit-year-field {
          color: #111827;
          background-color: transparent !important;
        }

        input[type='date']::-webkit-datetime-edit-month-field:focus,
        input[type='date']::-webkit-datetime-edit-day-field:focus,
        input[type='date']::-webkit-datetime-edit-year-field:focus {
          background-color: transparent !important;
          outline: none !important;
          color: #111827 !important;
        }

        input[type='date']::selection,
        input[type='date']::-moz-selection {
          background-color: transparent !important;
          color: inherit !important;
        }

        input[type='date']::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
      `}</style>
      <div className="space-y-4 mb-6">
        {/* Full Name - HIDE for Google users */}
        {!isGoogleUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={e => handleNameChange(e.target.value)}
                className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${
                  errors.fullName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>
        )}

        {/* Date of Birth - WITH CALENDAR PICKER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of birth
          </label>
          <input
            type="date"
            value={formatDateForInput(formData.dateOfBirth)}
            onChange={e => handleDOBChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 bg-white ${
              errors.dateOfBirth
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
          )}
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

        {/* Email - HIDE for Google users */}
        {!isGoogleUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email/Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.email}
                onChange={e => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Enter email or username (min 6 characters)"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
        )}

        {/* Password fields - Only show for non-Google users */}
        {!isGoogleUser && (
          <>
            {/* Create Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
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
                  onChange={e => handleConfirmPasswordChange(e.target.value)}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
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
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleContinueClick}
        disabled={isLoadingOTP}
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70"
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
        <span>{isLoadingOTP ? 'Sending OTP...' : 'Continue'}</span>
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
