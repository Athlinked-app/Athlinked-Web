'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import CompetitionAndClubPopup, {
  type CompetitionAndClub,
} from '../CompetitionandClubPopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { CompetitionAndClub };

interface CompetitionAndClubProps {
  clubs?: CompetitionAndClub[];
  onClubsChange?: (clubs: CompetitionAndClub[]) => void;
  userId?: string | null;
}

export default function CompetitionAndClub({
  clubs = [],
  onClubsChange,
  userId,
}: CompetitionAndClubProps) {
  const [clubsList, setClubsList] = useState<CompetitionAndClub[]>(clubs);
  const [showPopup, setShowPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Check if viewing own profile (client-side only to avoid hydration issues)
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setIsOwnProfile(userId === currentUserId);
  }, [userId]);

  // Sync with props when clubs change
  useEffect(() => {
    if (clubs && clubs.length > 0) {
      setClubsList(clubs);
    }
  }, [clubs]);

  // OPTIMIZED: Data is now passed as props from parent (fetchProfileComplete)
  // No need to fetch here - parent component handles all data fetching
  // This component only manages add/edit/delete operations

  const handleAdd = async (newClub: CompetitionAndClub) => {
    if (editingIndex !== null) {
      // Update existing club
      const existingClub = clubsList[editingIndex];
      if (!userId || !existingClub.id) {
        // If no userId or ID, just update local state
        const updatedClubs = [...clubsList];
        updatedClubs[editingIndex] = newClub;
        setClubsList(updatedClubs);
        if (onClubsChange) {
          onClubsChange(updatedClubs);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const result = await apiPut<{
          success: boolean;
          data?: CompetitionAndClub;
          message?: string;
        }>(`/profile/competition-clubs/${existingClub.id}`, newClub);

        if (result.success && result.data) {
          const updatedClubs = [...clubsList];
          updatedClubs[editingIndex] = result.data;
          setClubsList(updatedClubs);
          if (onClubsChange) {
            onClubsChange(updatedClubs);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update competition club: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating competition club:', error);
        alert('Error updating competition club. Please try again.');
      }
    } else {
      // Add new club
      if (!userId) {
        // If no userId, just update local state
        const updatedClubs = [...clubsList, newClub];
        setClubsList(updatedClubs);
        if (onClubsChange) {
          onClubsChange(updatedClubs);
        }
        return;
      }

      try {
        const result = await apiPost<{
          success: boolean;
          data?: CompetitionAndClub;
          message?: string;
        }>(`/profile/${userId}/competition-clubs`, newClub);

        if (result.success && result.data) {
          const updatedClubs = [...clubsList, result.data];
          setClubsList(updatedClubs);
          if (onClubsChange) {
            onClubsChange(updatedClubs);
          }
        } else {
          alert(
            `Failed to save competition club: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving competition club:', error);
        alert('Error saving competition club. Please try again.');
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

  const handleView = (index: number) => {
    setViewingIndex(index);
    setShowViewPopup(true);
  };

  const handleCloseView = () => {
    setShowViewPopup(false);
    setViewingIndex(null);
  };

  const handleDelete = async (id: string | undefined, index: number) => {
    if (!id) {
      // If no ID, just update local state
      const updatedClubs = clubsList.filter((_, i) => i !== index);
      setClubsList(updatedClubs);
      if (onClubsChange) {
        onClubsChange(updatedClubs);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/competition-clubs/${id}`);

      if (result.success) {
        const updatedClubs = clubsList.filter((_, i) => i !== index);
        setClubsList(updatedClubs);
        if (onClubsChange) {
          onClubsChange(updatedClubs);
        }
      } else {
        alert(
          `Failed to delete competition club: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting competition club:', error);
      alert('Error deleting competition club. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-1 md:px-3 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Competition and Club Information
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (clubsList.length > 0) {
                  setEditingIndex(0);
                } else {
                  setEditingIndex(null);
                }
                setShowPopup(true);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 italic text-base">Loading...</p>
        ) : clubsList.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            No competition and club information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {clubsList.map((club, index) => (
              <div
                key={club.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm text-gray-600">
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
                  {isOwnProfile && (
                    <div
                      className="flex items-center gap-2 ml-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(club.id, index)}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
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

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewCompetitionAndClubPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={clubsList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewCompetitionAndClubPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: CompetitionAndClub;
}) {
  if (!open) return null;

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
            Competition and Club Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {data.clubOrTravelTeamName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club or Travel Team Name
              </label>
              <p className="text-gray-900">{data.clubOrTravelTeamName}</p>
            </div>
          )}

          {data.teamLevel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Level
              </label>
              <p className="text-gray-900">{data.teamLevel}</p>
            </div>
          )}

          {data.leagueOrOrganizationName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                League/Organization Name
              </label>
              <p className="text-gray-900">{data.leagueOrOrganizationName}</p>
            </div>
          )}

          {data.tournamentParticipation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tournament Participation
              </label>
              <p className="text-gray-900">{data.tournamentParticipation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
