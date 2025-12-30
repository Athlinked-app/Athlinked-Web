'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import CharacterAndLeadershipPopup, {
  type CharacterAndLeadership,
} from '../CharacterandLeadershipPopup';

export type { CharacterAndLeadership };

interface CharacterAndLeadershipProps {
  characterAndLeadership?: CharacterAndLeadership[];
  onCharacterAndLeadershipChange?: (data: CharacterAndLeadership[]) => void;
  userId?: string | null;
}

export default function CharacterAndLeadershipComponent({
  characterAndLeadership = [],
  onCharacterAndLeadershipChange,
  userId,
}: CharacterAndLeadershipProps) {
  const [characterAndLeadershipList, setCharacterAndLeadershipList] = useState<
    CharacterAndLeadership[]
  >(characterAndLeadership);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync with props when characterAndLeadership changes
  useEffect(() => {
    if (characterAndLeadership && characterAndLeadership.length > 0) {
      setCharacterAndLeadershipList(characterAndLeadership);
    }
  }, [characterAndLeadership]);

  // Fetch character and leadership data when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchCharacterLeadership();
    }
  }, [userId]);

  const fetchCharacterLeadership = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/profile/${userId}/character-leadership`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCharacterAndLeadershipList(data.data);
          if (onCharacterAndLeadershipChange) {
            onCharacterAndLeadershipChange(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching character and leadership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newData: CharacterAndLeadership) => {
    if (editingIndex !== null) {
      // Update existing entry
      const existingData = characterAndLeadershipList[editingIndex];
      if (!userId || !existingData.id) {
        // If no userId or ID, just update local state
        const updatedList = [...characterAndLeadershipList];
        updatedList[editingIndex] = newData;
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/character-leadership/${existingData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...characterAndLeadershipList];
            updatedList[editingIndex] = result.data;
            setCharacterAndLeadershipList(updatedList);
            if (onCharacterAndLeadershipChange) {
              onCharacterAndLeadershipChange(updatedList);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to update character and leadership: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating character and leadership:', error);
        alert('Error updating character and leadership. Please try again.');
      }
    } else {
      // Add new entry
      if (!userId) {
        // If no userId, just update local state
        const updatedList = [...characterAndLeadershipList, newData];
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/${userId}/character-leadership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...characterAndLeadershipList, result.data];
            setCharacterAndLeadershipList(updatedList);
            if (onCharacterAndLeadershipChange) {
              onCharacterAndLeadershipChange(updatedList);
            }
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to save character and leadership: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving character and leadership:', error);
        alert('Error saving character and leadership. Please try again.');
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
      const updatedList = characterAndLeadershipList.filter(
        (_, i) => i !== index
      );
      setCharacterAndLeadershipList(updatedList);
      if (onCharacterAndLeadershipChange) {
        onCharacterAndLeadershipChange(updatedList);
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/profile/character-leadership/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedList = characterAndLeadershipList.filter(
          (_, i) => i !== index
        );
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete character and leadership: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting character and leadership:', error);
      alert('Error deleting character and leadership. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Character and Leadership
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
        ) : characterAndLeadershipList.length === 0 ? (
          <p className="text-gray-500 italic">
            No character and leadership information added yet. Click the +
            button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {characterAndLeadershipList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.teamCaptain && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Team Captain:</span>{' '}
                        {data.teamCaptain}
                      </p>
                    )}
                    {data.leadershipRoles && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Leadership Roles:</span>{' '}
                        {data.leadershipRoles}
                      </p>
                    )}
                    {data.languagesSpoken &&
                      data.languagesSpoken.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Languages Spoken:</span>{' '}
                          {data.languagesSpoken.join(', ')}
                        </p>
                      )}
                    {data.communityService && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Community Service:</span>{' '}
                        {data.communityService}
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
                      onClick={() => handleDelete(data.id, index)}
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

      <CharacterAndLeadershipPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null
            ? characterAndLeadershipList[editingIndex]
            : undefined
        }
      />
    </>
  );
}
