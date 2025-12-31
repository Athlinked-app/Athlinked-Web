'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import CompetitionAndClubPopup, {
  type CompetitionAndClub,
} from '../CompetitionandClubPopup';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync with props when clubs change
  useEffect(() => {
    if (clubs && clubs.length > 0) {
      setClubsList(clubs);
    }
  }, [clubs]);

  // Fetch competition clubs when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchCompetitionClubs();
    }
  }, [userId]);

  const fetchCompetitionClubs = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/profile/${userId}/competition-clubs`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setClubsList(data.data);
          if (onClubsChange) {
            onClubsChange(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching competition clubs:', error);
    } finally {
      setLoading(false);
    }
  };

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
        const response = await fetch(
          `http://localhost:3001/api/profile/competition-clubs/${existingClub.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newClub),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedClubs = [...clubsList];
            updatedClubs[editingIndex] = result.data;
            setClubsList(updatedClubs);
            if (onClubsChange) {
              onClubsChange(updatedClubs);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(
            `Failed to update competition club: ${errorData.message || 'Unknown error'}`
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
        const response = await fetch(
          `http://localhost:3001/api/profile/${userId}/competition-clubs`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newClub),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedClubs = [...clubsList, result.data];
            setClubsList(updatedClubs);
            if (onClubsChange) {
              onClubsChange(updatedClubs);
            }
          }
        } else {
          const errorData = await response.json();
          alert(
            `Failed to save competition club: ${errorData.message || 'Unknown error'}`
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
      const response = await fetch(
        `http://localhost:3001/api/profile/competition-clubs/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const updatedClubs = clubsList.filter((_, i) => i !== index);
        setClubsList(updatedClubs);
        if (onClubsChange) {
          onClubsChange(updatedClubs);
        }
      } else {
        const errorData = await response.json();
        alert(
          `Failed to delete competition club: ${errorData.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting competition club:', error);
      alert('Error deleting competition club. Please try again.');
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

        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : clubsList.length === 0 ? (
          <p className="text-gray-500 italic">
            No competition and club information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {clubsList.map((club, index) => (
              <div
                key={club.id || index}
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
                      onClick={() => handleDelete(club.id, index)}
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
