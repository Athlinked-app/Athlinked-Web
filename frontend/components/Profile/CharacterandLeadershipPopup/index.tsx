'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface CharacterAndLeadership {
  id?: string;
  teamCaptain: string; // 'Yes' or 'No'
  leadershipRoles: string;
  languagesSpoken: string[]; // Array of selected languages
  communityService: string;
}

interface CharacterAndLeadershipPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CharacterAndLeadership) => void;
  existingData?: CharacterAndLeadership;
}

const leadershipRolesOptions = ['Team lead', 'Mentorship', 'Peer coaching'];
const languages = [
  'English',
  'Spanish',
  'French',
  'Mandarin',
  'Arabic',
  'Other',
];

export default function CharacterAndLeadershipPopup({
  open,
  onClose,
  onSave,
  existingData,
}: CharacterAndLeadershipPopupProps) {
  const [teamCaptain, setTeamCaptain] = useState(
    existingData?.teamCaptain || ''
  );
  const [leadershipRoles, setLeadershipRoles] = useState(
    existingData?.leadershipRoles || ''
  );
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(
    existingData?.languagesSpoken || []
  );
  const [communityService, setCommunityService] = useState(
    existingData?.communityService || ''
  );

  const [showLeadershipRolesDropdown, setShowLeadershipRolesDropdown] =
    useState(false);

  const leadershipRolesRef = useRef<HTMLDivElement>(null);

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setTeamCaptain(existingData.teamCaptain || '');
      setLeadershipRoles(existingData.leadershipRoles || '');
      setLanguagesSpoken(existingData.languagesSpoken || []);
      setCommunityService(existingData.communityService || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setTeamCaptain('');
      setLeadershipRoles('');
      setLanguagesSpoken([]);
      setCommunityService('');
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        leadershipRolesRef.current &&
        !leadershipRolesRef.current.contains(event.target as Node)
      ) {
        setShowLeadershipRolesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleLanguageToggle = (language: string) => {
    setLanguagesSpoken(prev => {
      if (prev.includes(language)) {
        return prev.filter(l => l !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!teamCaptain || !leadershipRoles || !communityService.trim()) {
      return; // Don't save if required fields are empty
    }

    onSave({
      teamCaptain,
      leadershipRoles,
      languagesSpoken,
      communityService,
    });
    // Reset form
    setTeamCaptain('');
    setLeadershipRoles('');
    setLanguagesSpoken([]);
    setCommunityService('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid = teamCaptain && leadershipRoles && communityService.trim();

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
            Character and Leadership
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Team Captain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Team Captain
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teamCaptain"
                  value="Yes"
                  checked={teamCaptain === 'Yes'}
                  onChange={e => setTeamCaptain(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-black">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teamCaptain"
                  value="No"
                  checked={teamCaptain === 'No'}
                  onChange={e => setTeamCaptain(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-black">No</span>
              </label>
            </div>
          </div>

          {/* Leadership Roles or Mentorship */}
          <div className="relative" ref={leadershipRolesRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leadership Roles or Mentorship
            </label>
            <div
              onClick={() =>
                setShowLeadershipRolesDropdown(!showLeadershipRolesDropdown)
              }
              className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
                showLeadershipRolesDropdown
                  ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
                  : 'border-gray-300'
              }`}
            >
              <span
                className={leadershipRoles ? 'text-black' : 'text-gray-500'}
              >
                {leadershipRoles || 'Select mentorship'}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${showLeadershipRolesDropdown ? 'transform rotate-180' : ''}`}
              />
            </div>
            {showLeadershipRolesDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {leadershipRolesOptions.map(role => (
                  <div
                    key={role}
                    onClick={() => {
                      setLeadershipRoles(role);
                      setShowLeadershipRolesDropdown(false);
                    }}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer text-black ${
                      leadershipRoles === role ? 'bg-blue-50' : ''
                    }`}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Languages Spoken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Languages Spoken
            </label>
            <div className="space-y-2">
              {languages.map(language => (
                <label
                  key={language}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={languagesSpoken.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                    className="w-4 h-4 text-[#CB9729] rounded focus:ring-[#CB9729] border-gray-300"
                  />
                  <span className="text-black">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Community Service or Off-Field Contributions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Service or Off-Field Contributions
            </label>
            <textarea
              value={communityService}
              onChange={e => setCommunityService(e.target.value)}
              placeholder="Describe your community service or volunteer work"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black placeholder:text-gray-400 resize-none"
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
