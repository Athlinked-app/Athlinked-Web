'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface AthleticAndPerformance {
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

const sports = ['Football', 'Basketball', 'Baseball', 'Swimming', 'Soccer', 'Track & Field', 'Wrestling', 'Tennis', 'Golf', 'Lacrosse', 'Hockey', 'Volleyball'];

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
  const [athleteHandedness, setAthleteHandedness] = useState(existingData?.athleteHandedness || '');
  const [dominantSideOrFoot, setDominantSideOrFoot] = useState(existingData?.dominantSideOrFoot || '');
  const [jerseyNumber, setJerseyNumber] = useState(existingData?.jerseyNumber || '');
  const [trainingHoursPerWeek, setTrainingHoursPerWeek] = useState(existingData?.trainingHoursPerWeek || '');
  const [multiSportAthlete, setMultiSportAthlete] = useState(existingData?.multiSportAthlete || '');
  const [coachVerifiedProfile, setCoachVerifiedProfile] = useState(existingData?.coachVerifiedProfile || '');
  const [hand, setHand] = useState(existingData?.hand || '');
  const [arm, setArm] = useState(existingData?.arm || '');

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
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sportRef.current && !sportRef.current.contains(event.target as Node)) {
        setShowSportDropdown(false);
      }
      if (handednessRef.current && !handednessRef.current.contains(event.target as Node)) {
        setShowHandednessDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleSave = () => {
    // Validate required fields
    if (!height.trim() || !weight.trim() || !sport || !athleteHandedness || 
        !jerseyNumber.trim() || !trainingHoursPerWeek.trim() || !multiSportAthlete || 
        !coachVerifiedProfile || !hand.trim() || !arm.trim()) {
      return; // Don't save if required fields are empty
    }

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
  const isFormValid = height.trim() && weight.trim() && sport && athleteHandedness && 
                      jerseyNumber.trim() && trainingHoursPerWeek.trim() && multiSportAthlete && 
                      coachVerifiedProfile && hand.trim() && arm.trim();

  const DropdownField = ({ 
    label, 
    value, 
    placeholder, 
    options, 
    showDropdown, 
    setShowDropdown, 
    onSelect, 
    ref 
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    onSelect: (value: string) => void;
    ref: React.RefObject<HTMLDivElement | null>;
  }) => (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
          showDropdown ? 'border-[#CB9729] ring-2 ring-[#CB9729]' : 'border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`} />
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option}
                onClick={() => {
                  onSelect(option);
                  setShowDropdown(false);
                }}
                className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
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
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Athletic and Performance Data</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="155"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (Pounds)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="185"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          {/* Select Sport Dropdown */}
          <DropdownField
            label="Select Sport"
            value={sport}
            placeholder="Select Sports"
            options={sportsOptions}
            showDropdown={showSportDropdown}
            setShowDropdown={setShowSportDropdown}
            onSelect={setSport}
            ref={sportRef}
          />

          {/* Athlete Handedness Dropdown */}
          <DropdownField
            label="Athlete Handedness"
            value={athleteHandedness}
            placeholder="Select handedness"
            options={handednessOptions}
            showDropdown={showHandednessDropdown}
            setShowDropdown={setShowHandednessDropdown}
            onSelect={setAthleteHandedness}
            ref={handednessRef}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dominant Side or Foot (Contextual to sport)</label>
            <input
              type="text"
              value={dominantSideOrFoot}
              onChange={(e) => setDominantSideOrFoot(e.target.value)}
              placeholder="Right foot, Left side, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">Enter your dominant side or foot relevant to your sport</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jersey Number</label>
            <input
              type="number"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="23"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Training Hours per Week</label>
            <input
              type="number"
              value={trainingHoursPerWeek}
              onChange={(e) => setTrainingHoursPerWeek(e.target.value)}
              placeholder="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          {/* Multi-Sport Athlete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Multi-Sport Athlete</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="multiSportAthlete"
                  value="Yes"
                  checked={multiSportAthlete === 'Yes'}
                  onChange={(e) => setMultiSportAthlete(e.target.value)}
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
                  onChange={(e) => setMultiSportAthlete(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Coach-Verified Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Coach-Verified Profile</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="coachVerifiedProfile"
                  value="Yes"
                  checked={coachVerifiedProfile === 'Yes'}
                  onChange={(e) => setCoachVerifiedProfile(e.target.value)}
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
                  onChange={(e) => setCoachVerifiedProfile(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hand</label>
            <input
              type="number"
              value={hand}
              onChange={(e) => setHand(e.target.value)}
              placeholder="23"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arm</label>
            <input
              type="number"
              value={arm}
              onChange={(e) => setArm(e.target.value)}
              placeholder="23"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
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

