'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import CompetitionAndClubPopup, {
  type CompetitionAndClub,
} from '../CompetitionandClubPopup';

export type { CompetitionAndClub };

interface CompetitionAndClubProps {
  clubs?: CompetitionAndClub[];
  onClubsChange?: (clubs: CompetitionAndClub[]) => void;
}

export default function CompetitionAndClub({
  clubs = [],
  onClubsChange,
}: CompetitionAndClubProps) {
  const [clubsList, setClubsList] = useState<CompetitionAndClub[]>(clubs);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newClub: CompetitionAndClub) => {
    if (editingIndex !== null) {
      // Update existing club
      const updatedClubs = [...clubsList];
      updatedClubs[editingIndex] = newClub;
      setClubsList(updatedClubs);
      if (onClubsChange) {
        onClubsChange(updatedClubs);
      }
      setEditingIndex(null);
    } else {
      // Add new club
      const updatedClubs = [...clubsList, newClub];
      setClubsList(updatedClubs);
      if (onClubsChange) {
        onClubsChange(updatedClubs);
      }
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedClubs = clubsList.filter((_, i) => i !== index);
    setClubsList(updatedClubs);
    if (onClubsChange) {
      onClubsChange(updatedClubs);
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Competition and Club Information
          </h2>
          <button
            onClick={() => {
              setEditingIndex(null);
              setShowPopup(true);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {clubsList.length === 0 ? (
          <p className="text-gray-500 italic">
            No competition and club information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {clubsList.map((club, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {club.clubOrTravelTeamName}
                      </h3>
                      {club.teamLevel && (
                        <span className="text-sm text-gray-600">
                          - {club.teamLevel}
                        </span>
                      )}
                    </div>
                    {club.leagueOrOrganizationName && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          League/Organization:
                        </span>{' '}
                        {club.leagueOrOrganizationName}
                      </p>
                    )}
                    {club.tournamentParticipation && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Tournament Participation:
                        </span>{' '}
                        {club.tournamentParticipation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CompetitionAndClubPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? clubsList[editingIndex] : undefined
        }
      />
    </>
  );
}
