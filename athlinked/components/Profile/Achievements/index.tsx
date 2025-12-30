'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Pencil } from 'lucide-react';
import AchievementsPopup, { type Achievement } from '../AchievementsPopup';

export type { Achievement };

interface AchievementsProps {
  achievements?: Achievement[];
  onAchievementsChange?: (achievements: Achievement[]) => void;
  userId?: string | null;
}

export default function Achievements({
  achievements = [],
  onAchievementsChange,
  userId,
}: AchievementsProps) {
  const [achievementsList, setAchievementsList] =
    useState<Achievement[]>(achievements);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync with props when achievements change
  useEffect(() => {
    if (achievements && achievements.length > 0) {
      setAchievementsList(achievements);
    }
  }, [achievements]);

  // Fetch achievements when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId]);

  const fetchAchievements = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/profile/${userId}/achievements`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAchievementsList(data.data);
          if (onAchievementsChange) {
            onAchievementsChange(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newAchievement: Achievement) => {
    if (editingIndex !== null) {
      // Update existing achievement
      const existingAchievement = achievementsList[editingIndex];
      if (!userId || !existingAchievement.id) {
        // If no userId or ID, just update local state
        const updatedAchievements = [...achievementsList];
        updatedAchievements[editingIndex] = newAchievement;
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/achievements/${existingAchievement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAchievement),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedAchievements = [...achievementsList];
            updatedAchievements[editingIndex] = result.data;
            setAchievementsList(updatedAchievements);
            if (onAchievementsChange) {
              onAchievementsChange(updatedAchievements);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to update achievement: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating achievement:', error);
        alert('Error updating achievement. Please try again.');
      }
    } else {
      // Add new achievement
      if (!userId) {
        // If no userId, just update local state
        const updatedAchievements = [...achievementsList, newAchievement];
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/${userId}/achievements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAchievement),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedAchievements = [...achievementsList, result.data];
            setAchievementsList(updatedAchievements);
            if (onAchievementsChange) {
              onAchievementsChange(updatedAchievements);
            }
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to save achievement: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving achievement:', error);
        alert('Error saving achievement. Please try again.');
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
      const updatedAchievements = achievementsList.filter((_, i) => i !== index);
      setAchievementsList(updatedAchievements);
      if (onAchievementsChange) {
        onAchievementsChange(updatedAchievements);
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/profile/achievements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedAchievements = achievementsList.filter((_, i) => i !== index);
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete achievement: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting achievement:', error);
      alert('Error deleting achievement. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
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
        ) : achievementsList.length === 0 ? (
          <p className="text-gray-500 italic">
            No achievements added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {achievementsList.map((achievement, index) => (
              <div
                key={achievement.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {achievement.title}
                      </h3>
                      {achievement.organization && (
                        <span className="text-sm text-gray-600">
                          - {achievement.organization}
                        </span>
                      )}
                    </div>
                    {achievement.sport && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Sport:</span>{' '}
                        {achievement.sport}
                      </p>
                    )}
                    {achievement.achievementType && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Type:</span>{' '}
                        {achievement.achievementType}
                      </p>
                    )}
                    {achievement.level && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Level:</span>{' '}
                        {achievement.level}
                      </p>
                    )}
                    {achievement.dateAwarded && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date Awarded:</span>{' '}
                        {achievement.dateAwarded}
                      </p>
                    )}
                    {achievement.location && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Location:</span>{' '}
                        {achievement.location}
                      </p>
                    )}
                    {achievement.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Description:</span>{' '}
                        {achievement.description}
                      </p>
                    )}
                    {achievement.mediaPdf && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {typeof achievement.mediaPdf === 'string'
                            ? achievement.mediaPdf
                            : achievement.mediaPdf.name}
                        </span>
                      </div>
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
                      onClick={() => handleDelete(achievement.id, index)}
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

      <AchievementsPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? achievementsList[editingIndex] : undefined
        }
      />
    </>
  );
}
