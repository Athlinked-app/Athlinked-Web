'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface AthleticAndPerformance {
  id?: string;
  height: string;
  weight: string;
  sport: string;
  athleteHandedness: string;
  dominantSideOrFoot: string;
  jerseyNumber: string;
  trainingHoursPerWeek: string;
  multiSportAthlete: string; // 'Yes' or 'No'
  coachVerifiedProfile: string; // 'Yes' or 'No'
  hand: string;
  arm: string;
}

interface AthleticAndPerformancePopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AthleticAndPerformance) => void;
  existingData?: AthleticAndPerformance;
  sportsPlayed?: string; // Comma-separated string of sports
}

const handednessOptions = ['Right', 'Left', 'Ambidextrous'];

// Validation limits
const HEIGHT_CM_MIN = 50;
const HEIGHT_CM_MAX = 250;
const WEIGHT_LBS_MIN = 50;
const WEIGHT_LBS_MAX = 500;
const JERSEY_NUMBER_MIN = 0;
const JERSEY_NUMBER_MAX = 100;
const TRAINING_HOURS_MIN = 0;
const TRAINING_HOURS_MAX = 168;
const HAND_MIN = 0;
const HAND_MAX = 100;
const ARM_MIN = 0;
const ARM_MAX = 100;
const DOMINANT_SIDE_MAX_LENGTH = 50;

// Only letters and spaces for Dominant Side / Foot
const DOMINANT_SIDE_ALPHA_REGEX = /^[a-zA-Z\s]*$/;

// Decimal: optional digits, optional decimal point, up to 3 digits after decimal (e.g. 175.123)
const DECIMAL_UP_TO_3_REGEX = /^\d*\.?\d{0,3}$/;

const sports = [
  'Football',
  'Basketball',
  'Baseball',
  'Swimming',
  'Soccer',
  'Track & Field',
  'Wrestling',
  'Tennis',
  'Golf',
  'Lacrosse',
  'Hockey',
  'Volleyball',
];

export default function AthleticAndPerformancePopup({
  open,
  onClose,
  onSave,
  existingData,
  sportsPlayed = '',
}: AthleticAndPerformancePopupProps) {
  const [height, setHeight] = useState(existingData?.height || '');
  const [weight, setWeight] = useState(existingData?.weight || '');
  const [sport, setSport] = useState(existingData?.sport || '');
  const [athleteHandedness, setAthleteHandedness] = useState(
    existingData?.athleteHandedness || ''
  );
  const [dominantSideOrFoot, setDominantSideOrFoot] = useState(
    existingData?.dominantSideOrFoot || ''
  );
  const [jerseyNumber, setJerseyNumber] = useState(
    existingData?.jerseyNumber || ''
  );
  const [trainingHoursPerWeek, setTrainingHoursPerWeek] = useState(
    existingData?.trainingHoursPerWeek || ''
  );
  const [multiSportAthlete, setMultiSportAthlete] = useState(
    existingData?.multiSportAthlete || ''
  );
  const [coachVerifiedProfile, setCoachVerifiedProfile] = useState(
    existingData?.coachVerifiedProfile || ''
  );
  const [hand, setHand] = useState(existingData?.hand || '');
  const [arm, setArm] = useState(existingData?.arm || '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showHandednessDropdown, setShowHandednessDropdown] = useState(false);

  const sportRef = useRef<HTMLDivElement>(null);
  const handednessRef = useRef<HTMLDivElement>(null);

  // Use static sports list for dropdown
  const sportsOptions = sports;

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setHeight(existingData.height || '');
      setWeight(existingData.weight || '');
      setSport(existingData.sport || '');
      setAthleteHandedness(existingData.athleteHandedness || '');
      setDominantSideOrFoot(existingData.dominantSideOrFoot || '');
      setJerseyNumber(existingData.jerseyNumber || '');
      setTrainingHoursPerWeek(existingData.trainingHoursPerWeek || '');
      setMultiSportAthlete(existingData.multiSportAthlete || '');
      setCoachVerifiedProfile(existingData.coachVerifiedProfile || '');
      setHand(existingData.hand || '');
      setArm(existingData.arm || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setHeight('');
      setWeight('');
      setSport('');
      setAthleteHandedness('');
      setDominantSideOrFoot('');
      setJerseyNumber('');
      setTrainingHoursPerWeek('');
      setMultiSportAthlete('');
      setCoachVerifiedProfile('');
      setHand('');
      setArm('');
      setFieldErrors({});
    }
  }, [open, existingData]);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  // Validate all fields and return true if valid
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const heightNum = height.trim() ? Number(height) : NaN;
    if (!height.trim()) {
      errors.height = 'Height is required';
    } else if (
      Number.isNaN(heightNum) ||
      heightNum < HEIGHT_CM_MIN ||
      heightNum > HEIGHT_CM_MAX
    ) {
      errors.height = `Height must be between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm (up to 3 decimal places)`;
    } else if (!DECIMAL_UP_TO_3_REGEX.test(height.trim())) {
      errors.height = 'Height can have up to 3 decimal places';
    }

    const weightNum = weight.trim() ? Number(weight) : NaN;
    if (!weight.trim()) {
      errors.weight = 'Weight is required';
    } else if (
      Number.isNaN(weightNum) ||
      weightNum < WEIGHT_LBS_MIN ||
      weightNum > WEIGHT_LBS_MAX
    ) {
      errors.weight = `Weight must be between ${WEIGHT_LBS_MIN} and ${WEIGHT_LBS_MAX} lbs (up to 3 decimal places)`;
    } else if (!DECIMAL_UP_TO_3_REGEX.test(weight.trim())) {
      errors.weight = 'Weight can have up to 3 decimal places';
    }

    if (!sport) errors.sport = 'Please select a sport';
    if (!athleteHandedness)
      errors.athleteHandedness = 'Please select handedness';

    if (
      dominantSideOrFoot.trim() &&
      !DOMINANT_SIDE_ALPHA_REGEX.test(dominantSideOrFoot)
    ) {
      errors.dominantSideOrFoot =
        'Dominant Side or Foot can only contain letters and spaces';
    } else if (dominantSideOrFoot.length > DOMINANT_SIDE_MAX_LENGTH) {
      errors.dominantSideOrFoot = `Maximum ${DOMINANT_SIDE_MAX_LENGTH} characters`;
    }

    const jerseyNum = jerseyNumber.trim() ? Number(jerseyNumber) : NaN;
    if (!jerseyNumber.trim()) {
      errors.jerseyNumber = 'Jersey number is required';
    } else if (
      Number.isNaN(jerseyNum) ||
      jerseyNum < JERSEY_NUMBER_MIN ||
      jerseyNum > JERSEY_NUMBER_MAX
    ) {
      errors.jerseyNumber = `Jersey number must be between ${JERSEY_NUMBER_MIN} and ${JERSEY_NUMBER_MAX}`;
    }

    const trainingNum = trainingHoursPerWeek.trim()
      ? Number(trainingHoursPerWeek)
      : NaN;
    if (!trainingHoursPerWeek.trim()) {
      errors.trainingHoursPerWeek = 'Training hours per week is required';
    } else if (
      Number.isNaN(trainingNum) ||
      trainingNum < TRAINING_HOURS_MIN ||
      trainingNum > TRAINING_HOURS_MAX
    ) {
      errors.trainingHoursPerWeek = `Training hours must be between ${TRAINING_HOURS_MIN} and ${TRAINING_HOURS_MAX} per week`;
    }

    if (!multiSportAthlete)
      errors.multiSportAthlete = 'Please select an option';
    if (!coachVerifiedProfile)
      errors.coachVerifiedProfile = 'Please select an option';

    const handNum = hand.trim() ? Number(hand) : NaN;
    if (!hand.trim()) {
      errors.hand = 'Hand value is required';
    } else if (
      Number.isNaN(handNum) ||
      handNum < HAND_MIN ||
      handNum > HAND_MAX
    ) {
      errors.hand = `Hand must be between ${HAND_MIN} and ${HAND_MAX}`;
    }

    const armNum = arm.trim() ? Number(arm) : NaN;
    if (!arm.trim()) {
      errors.arm = 'Arm value is required';
    } else if (Number.isNaN(armNum) || armNum < ARM_MIN || armNum > ARM_MAX) {
      errors.arm = `Arm must be between ${ARM_MIN} and ${ARM_MAX}`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sportRef.current &&
        !sportRef.current.contains(event.target as Node)
      ) {
        setShowSportDropdown(false);
      }
      if (
        handednessRef.current &&
        !handednessRef.current.contains(event.target as Node)
      ) {
        setShowHandednessDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleSave = () => {
    if (!validateForm()) return;

    onSave({
      height,
      weight,
      sport,
      athleteHandedness,
      dominantSideOrFoot,
      jerseyNumber,
      trainingHoursPerWeek,
      multiSportAthlete,
      coachVerifiedProfile,
      hand,
      arm,
    });
    // Reset form
    setHeight('');
    setWeight('');
    setSport('');
    setAthleteHandedness('');
    setDominantSideOrFoot('');
    setJerseyNumber('');
    setTrainingHoursPerWeek('');
    setMultiSportAthlete('');
    setCoachVerifiedProfile('');
    setHand('');
    setArm('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid =
    height.trim() &&
    weight.trim() &&
    sport &&
    athleteHandedness &&
    jerseyNumber.trim() &&
    trainingHoursPerWeek.trim() &&
    multiSportAthlete &&
    coachVerifiedProfile &&
    hand.trim() &&
    arm.trim();

  const DropdownField = ({
    label,
    value,
    placeholder,
    options,
    showDropdown,
    setShowDropdown,
    onSelect,
    dropdownRef,
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    onSelect: (value: string) => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
  }) => (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
          showDropdown
            ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
            : 'border-gray-300'
        }`}
      >
        <span className={value ? 'text-black' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map(option => (
              <div
                key={option}
                onClick={() => {
                  onSelect(option);
                  setShowDropdown(false);
                }}
                className={`px-4 py-2 hover:bg-gray-50 cursor-pointer text-black ${
                  value === option ? 'bg-blue-50' : ''
                }`}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl m-7 lg:m-0 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Athletic and Performance Data
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={height}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || DECIMAL_UP_TO_3_REGEX.test(v)) {
                  setHeight(v);
                  clearFieldError('height');
                }
              }}
              onBlur={() => {
                if (height.trim()) {
                  const n = Number(height);
                  if (
                    Number.isNaN(n) ||
                    n < HEIGHT_CM_MIN ||
                    n > HEIGHT_CM_MAX
                  ) {
                    setFieldError(
                      'height',
                      `Height must be between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm (up to 3 decimal places)`
                    );
                  }
                }
              }}
              placeholder={`${HEIGHT_CM_MIN}-${HEIGHT_CM_MAX} cm (e.g. 175.5)`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.height ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.height && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.height}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (Pounds)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || DECIMAL_UP_TO_3_REGEX.test(v)) {
                  setWeight(v);
                  clearFieldError('weight');
                }
              }}
              onBlur={() => {
                if (weight.trim()) {
                  const n = Number(weight);
                  if (
                    Number.isNaN(n) ||
                    n < WEIGHT_LBS_MIN ||
                    n > WEIGHT_LBS_MAX
                  ) {
                    setFieldError(
                      'weight',
                      `Weight must be between ${WEIGHT_LBS_MIN} and ${WEIGHT_LBS_MAX} lbs (up to 3 decimal places)`
                    );
                  }
                }
              }}
              placeholder={`${WEIGHT_LBS_MIN}-${WEIGHT_LBS_MAX} lbs (e.g. 185.25)`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.weight ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.weight && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.weight}</p>
            )}
          </div>

          {/* Select Sport Dropdown */}
          <div>
            <DropdownField
              label="Select Sport"
              value={sport}
              placeholder="Select Sports"
              options={sportsOptions}
              showDropdown={showSportDropdown}
              setShowDropdown={show => {
                setShowSportDropdown(show);
                if (show) clearFieldError('sport');
              }}
              onSelect={v => {
                setSport(v);
                clearFieldError('sport');
              }}
              dropdownRef={sportRef}
            />
            {fieldErrors.sport && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.sport}</p>
            )}
          </div>

          {/* Athlete Handedness Dropdown */}
          <div>
            <DropdownField
              label="Athlete Handedness"
              value={athleteHandedness}
              placeholder="Select handedness"
              options={handednessOptions}
              showDropdown={showHandednessDropdown}
              setShowDropdown={show => {
                setShowHandednessDropdown(show);
                if (show) clearFieldError('athleteHandedness');
              }}
              onSelect={v => {
                setAthleteHandedness(v);
                clearFieldError('athleteHandedness');
              }}
              dropdownRef={handednessRef}
            />
            {fieldErrors.athleteHandedness && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.athleteHandedness}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dominant Side or Foot (Contextual to sport)
            </label>
            <input
              type="text"
              value={dominantSideOrFoot}
              onChange={e => {
                const v = e.target.value;
                if (
                  DOMINANT_SIDE_ALPHA_REGEX.test(v) &&
                  v.length <= DOMINANT_SIDE_MAX_LENGTH
                ) {
                  setDominantSideOrFoot(v);
                  clearFieldError('dominantSideOrFoot');
                }
              }}
              placeholder="Right foot, Left side "
              maxLength={DOMINANT_SIDE_MAX_LENGTH}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.dominantSideOrFoot ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.dominantSideOrFoot && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.dominantSideOrFoot}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Letters and spaces only, max {DOMINANT_SIDE_MAX_LENGTH} characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jersey Number
            </label>
            <input
              type="number"
              min={JERSEY_NUMBER_MIN}
              max={JERSEY_NUMBER_MAX}
              value={jerseyNumber}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) {
                  setJerseyNumber(v);
                  clearFieldError('jerseyNumber');
                }
              }}
              placeholder={`${JERSEY_NUMBER_MIN}-${JERSEY_NUMBER_MAX}`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.jerseyNumber ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.jerseyNumber && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.jerseyNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Hours per Week
            </label>
            <input
              type="number"
              min={TRAINING_HOURS_MIN}
              max={TRAINING_HOURS_MAX}
              value={trainingHoursPerWeek}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) {
                  setTrainingHoursPerWeek(v);
                  clearFieldError('trainingHoursPerWeek');
                }
              }}
              placeholder={`${TRAINING_HOURS_MIN}-${TRAINING_HOURS_MAX} hours`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.trainingHoursPerWeek ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.trainingHoursPerWeek && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.trainingHoursPerWeek}
              </p>
            )}
          </div>

          {/* Multi-Sport Athlete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Multi-Sport Athlete
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="multiSportAthlete"
                  value="Yes"
                  checked={multiSportAthlete === 'Yes'}
                  onChange={e => {
                    setMultiSportAthlete(e.target.value);
                    clearFieldError('multiSportAthlete');
                  }}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="multiSportAthlete"
                  value="No"
                  checked={multiSportAthlete === 'No'}
                  onChange={e => {
                    setMultiSportAthlete(e.target.value);
                    clearFieldError('multiSportAthlete');
                  }}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
            {fieldErrors.multiSportAthlete && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.multiSportAthlete}
              </p>
            )}
          </div>

          {/* Coach-Verified Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Coach-Verified Profile
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="coachVerifiedProfile"
                  value="Yes"
                  checked={coachVerifiedProfile === 'Yes'}
                  onChange={e => {
                    setCoachVerifiedProfile(e.target.value);
                    clearFieldError('coachVerifiedProfile');
                  }}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="coachVerifiedProfile"
                  value="No"
                  checked={coachVerifiedProfile === 'No'}
                  onChange={e => {
                    setCoachVerifiedProfile(e.target.value);
                    clearFieldError('coachVerifiedProfile');
                  }}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
            {fieldErrors.coachVerifiedProfile && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.coachVerifiedProfile}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hand
            </label>
            <input
              type="number"
              min={HAND_MIN}
              max={HAND_MAX}
              value={hand}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) {
                  setHand(v);
                  clearFieldError('hand');
                }
              }}
              placeholder={`${HAND_MIN}-${HAND_MAX}`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.hand ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.hand && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.hand}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arm
            </label>
            <input
              type="number"
              min={ARM_MIN}
              max={ARM_MAX}
              value={arm}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) {
                  setArm(v);
                  clearFieldError('arm');
                }
              }}
              placeholder={`${ARM_MIN}-${ARM_MAX}`}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 ${fieldErrors.arm ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.arm && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.arm}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
              isFormValid
                ? 'bg-[#CB9729] text-white hover:bg-[#b78322] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
