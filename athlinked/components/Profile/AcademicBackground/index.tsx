'use client';

import { useState } from 'react';
import { Plus, Trash2, FileText, Pencil } from 'lucide-react';
import AcademicBackgroundPopup, {
  type AcademicBackground,
} from '../AcademicBackgroundPopup';

export type { AcademicBackground };

interface AcademicBackgroundProps {
  backgrounds?: AcademicBackground[];
  onBackgroundsChange?: (backgrounds: AcademicBackground[]) => void;
}

export default function AcademicBackgrounds({
  backgrounds = [],
  onBackgroundsChange,
}: AcademicBackgroundProps) {
  const [academicBackgrounds, setAcademicBackgrounds] =
    useState<AcademicBackground[]>(backgrounds);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newBackground: AcademicBackground) => {
    if (editingIndex !== null) {
      // Update existing background
      const updatedBackgrounds = [...academicBackgrounds];
      updatedBackgrounds[editingIndex] = newBackground;
      setAcademicBackgrounds(updatedBackgrounds);
      if (onBackgroundsChange) {
        onBackgroundsChange(updatedBackgrounds);
      }
      setEditingIndex(null);
    } else {
      // Add new background
      const updatedBackgrounds = [...academicBackgrounds, newBackground];
      setAcademicBackgrounds(updatedBackgrounds);
      if (onBackgroundsChange) {
        onBackgroundsChange(updatedBackgrounds);
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
    const updatedBackgrounds = academicBackgrounds.filter(
      (_, i) => i !== index
    );
    setAcademicBackgrounds(updatedBackgrounds);
    if (onBackgroundsChange) {
      onBackgroundsChange(updatedBackgrounds);
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

        {academicBackgrounds.length === 0 ? (
          <p className="text-gray-500 italic">
            No academic background added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {academicBackgrounds.map((bg, index) => (
              <div
                key={index}
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
