'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Pencil } from 'lucide-react';
import AcademicBackgroundPopup, {
  type AcademicBackground,
} from '../AcademicBackgroundPopup';

export type { AcademicBackground };

interface AcademicBackgroundProps {
  backgrounds?: AcademicBackground[];
  onBackgroundsChange?: (backgrounds: AcademicBackground[]) => void;
  userId?: string | null;
}

export default function AcademicBackgrounds({
  backgrounds = [],
  onBackgroundsChange,
  userId,
}: AcademicBackgroundProps) {
  const [academicBackgrounds, setAcademicBackgrounds] =
    useState<AcademicBackground[]>(backgrounds);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync with props when backgrounds change
  useEffect(() => {
    if (backgrounds && backgrounds.length > 0) {
      setAcademicBackgrounds(backgrounds);
    }
  }, [backgrounds]);

  // Fetch academic backgrounds when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchAcademicBackgrounds();
    }
  }, [userId]);

  const fetchAcademicBackgrounds = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/profile/${userId}/academic-backgrounds`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAcademicBackgrounds(data.data);
          if (onBackgroundsChange) {
            onBackgroundsChange(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching academic backgrounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newBackground: AcademicBackground) => {
    if (editingIndex !== null) {
      // Update existing background
      const existingBg = academicBackgrounds[editingIndex];
      if (!userId || !existingBg.id) {
        // If no userId or ID, just update local state
        const updatedBackgrounds = [...academicBackgrounds];
        updatedBackgrounds[editingIndex] = newBackground;
        setAcademicBackgrounds(updatedBackgrounds);
        if (onBackgroundsChange) {
          onBackgroundsChange(updatedBackgrounds);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/academic-backgrounds/${existingBg.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBackground),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedBackgrounds = [...academicBackgrounds];
            updatedBackgrounds[editingIndex] = result.data;
            setAcademicBackgrounds(updatedBackgrounds);
            if (onBackgroundsChange) {
              onBackgroundsChange(updatedBackgrounds);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to update academic background: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating academic background:', error);
        alert('Error updating academic background. Please try again.');
      }
    } else {
      // Add new background
      if (!userId) {
        // If no userId, just update local state
        const updatedBackgrounds = [...academicBackgrounds, newBackground];
        setAcademicBackgrounds(updatedBackgrounds);
        if (onBackgroundsChange) {
          onBackgroundsChange(updatedBackgrounds);
        }
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/profile/${userId}/academic-backgrounds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBackground),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedBackgrounds = [...academicBackgrounds, result.data];
            setAcademicBackgrounds(updatedBackgrounds);
            if (onBackgroundsChange) {
              onBackgroundsChange(updatedBackgrounds);
            }
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to save academic background: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving academic background:', error);
        alert('Error saving academic background. Please try again.');
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
      const updatedBackgrounds = academicBackgrounds.filter(
        (_, i) => i !== index
      );
      setAcademicBackgrounds(updatedBackgrounds);
      if (onBackgroundsChange) {
        onBackgroundsChange(updatedBackgrounds);
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/profile/academic-backgrounds/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedBackgrounds = academicBackgrounds.filter(
          (_, i) => i !== index
        );
        setAcademicBackgrounds(updatedBackgrounds);
        if (onBackgroundsChange) {
          onBackgroundsChange(updatedBackgrounds);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete academic background: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting academic background:', error);
      alert('Error deleting academic background. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Academic Background
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
        ) : academicBackgrounds.length === 0 ? (
          <p className="text-gray-500 italic">
            No academic background added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {academicBackgrounds.map((bg, index) => (
              <div
                key={bg.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bg.school}
                      </h3>
                      {bg.degree && (
                        <span className="text-sm text-gray-600">
                          - {bg.degree}
                        </span>
                      )}
                    </div>
                    {bg.qualification && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Qualification:</span>{' '}
                        {bg.qualification}
                      </p>
                    )}
                    {(bg.startDate || bg.endDate) && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Duration:</span>{' '}
                        {bg.startDate} to {bg.endDate}
                      </p>
                    )}
                    {bg.academicGpa && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">GPA:</span>{' '}
                        {bg.academicGpa}
                      </p>
                    )}
                    {bg.degreePdf && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {typeof bg.degreePdf === 'string'
                            ? bg.degreePdf
                            : bg.degreePdf.name}
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
                      onClick={() => handleDelete(bg.id, index)}
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

      <AcademicBackgroundPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? academicBackgrounds[editingIndex] : undefined
        }
      />
    </>
  );
}
