'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface CompetitionAndClub {
  clubOrTravelTeamName: string;
  teamLevel: string;
  leagueOrOrganizationName?: string;
  tournamentParticipation: string; // 'Yes' or 'No'
}

interface CompetitionAndClubPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CompetitionAndClub) => void;
  existingData?: CompetitionAndClub;
}

const teamLevels = ['Varsity', 'JV', 'Club', 'Academy'];

export default function CompetitionAndClubPopup({
  open,
  onClose,
  onSave,
  existingData,
}: CompetitionAndClubPopupProps) {
  const [clubOrTravelTeamName, setClubOrTravelTeamName] = useState(
    existingData?.clubOrTravelTeamName || ''
  );
  const [teamLevel, setTeamLevel] = useState(existingData?.teamLevel || '');
  const [leagueOrOrganizationName, setLeagueOrOrganizationName] = useState(
    existingData?.leagueOrOrganizationName || ''
  );
  const [tournamentParticipation, setTournamentParticipation] = useState(
    existingData?.tournamentParticipation || ''
  );

  const [showTeamLevelDropdown, setShowTeamLevelDropdown] = useState(false);

  const teamLevelRef = useRef<HTMLDivElement>(null);

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setClubOrTravelTeamName(existingData.clubOrTravelTeamName || '');
      setTeamLevel(existingData.teamLevel || '');
      setLeagueOrOrganizationName(existingData.leagueOrOrganizationName || '');
      setTournamentParticipation(existingData.tournamentParticipation || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setClubOrTravelTeamName('');
      setTeamLevel('');
      setLeagueOrOrganizationName('');
      setTournamentParticipation('');
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        teamLevelRef.current &&
        !teamLevelRef.current.contains(event.target as Node)
      ) {
        setShowTeamLevelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleSave = () => {
    // Validate required fields
    if (
      !clubOrTravelTeamName.trim() ||
      !teamLevel ||
      !tournamentParticipation
    ) {
      return; // Don't save if required fields are empty
    }

    onSave({
      clubOrTravelTeamName,
      teamLevel,
      leagueOrOrganizationName: leagueOrOrganizationName.trim() || undefined,
      tournamentParticipation,
    });
    // Reset form
    setClubOrTravelTeamName('');
    setTeamLevel('');
    setLeagueOrOrganizationName('');
    setTournamentParticipation('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid =
    clubOrTravelTeamName.trim() && teamLevel && tournamentParticipation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Competition and Club Information
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
              Club or Travel Team Name
            </label>
            <input
              type="text"
              value={clubOrTravelTeamName}
              onChange={e => setClubOrTravelTeamName(e.target.value)}
              placeholder="Club or Travel Team Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          {/* Team Level Dropdown */}
          <div className="relative" ref={teamLevelRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Level
            </label>
            <div
              onClick={() => setShowTeamLevelDropdown(!showTeamLevelDropdown)}
              className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
                showTeamLevelDropdown
                  ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
                  : 'border-gray-300'
              }`}
            >
              <span className={teamLevel ? 'text-gray-900' : 'text-gray-500'}>
                {teamLevel || 'Select team level'}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${showTeamLevelDropdown ? 'transform rotate-180' : ''}`}
              />
            </div>
            {showTeamLevelDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {teamLevels.map(level => (
                  <div
                    key={level}
                    onClick={() => {
                      setTeamLevel(level);
                      setShowTeamLevelDropdown(false);
                    }}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                      teamLevel === level ? 'bg-blue-50' : ''
                    }`}
                  >
                    {level}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              League or Organization Name{' '}
              <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={leagueOrOrganizationName}
              onChange={e => setLeagueOrOrganizationName(e.target.value)}
              placeholder="National Youth Sports League"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tournament Participation or Podium Finishes
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tournamentParticipation"
                  value="Yes"
                  checked={tournamentParticipation === 'Yes'}
                  onChange={e => setTournamentParticipation(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tournamentParticipation"
                  value="No"
                  checked={tournamentParticipation === 'No'}
                  onChange={e => setTournamentParticipation(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
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
