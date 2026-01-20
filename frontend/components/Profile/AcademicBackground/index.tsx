'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Pencil, X } from 'lucide-react';
import AcademicBackgroundPopup, {
  type AcademicBackground,
} from '../AcademicBackgroundPopup';
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
  apiRequest,
} from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

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

  // Sync with props when backgrounds change
  useEffect(() => {
    if (backgrounds && backgrounds.length > 0) {
      setAcademicBackgrounds(backgrounds);
    }
  }, [backgrounds]);

  // OPTIMIZED: Data is now passed as props from parent (fetchProfileComplete)
  // No need to fetch here - parent component handles all data fetching
  // This component only manages add/edit/delete operations

  const handleAdd = async (newBackground: AcademicBackground) => {
    // Check if there's a PDF file to upload
    const hasPdfFile = newBackground.degreePdf instanceof File;

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
        let result;
        if (hasPdfFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append('degreePdf', newBackground.degreePdf as File);
          // Add other fields as JSON string or individual fields
          Object.keys(newBackground).forEach(key => {
            if (key !== 'degreePdf' && key !== 'id') {
              const value = (newBackground as any)[key];
              if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          });

          // Use apiRequest directly for PUT with FormData
          const response = await apiRequest(
            `/profile/academic-backgrounds/${existingBg.id}`,
            {
              method: 'PUT',
              body: formData,
            }
          );
          result = await response.json();
        } else {
          result = await apiPut<{
            success: boolean;
            data?: AcademicBackground;
            message?: string;
          }>(`/profile/academic-backgrounds/${existingBg.id}`, newBackground);
        }

        if (result.success && result.data) {
          const updatedBackgrounds = [...academicBackgrounds];
          updatedBackgrounds[editingIndex] = result.data;
          setAcademicBackgrounds(updatedBackgrounds);
          if (onBackgroundsChange) {
            onBackgroundsChange(updatedBackgrounds);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update academic background: ${result.message || 'Unknown error'}`
          );
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
        let result;
        if (hasPdfFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append('degreePdf', newBackground.degreePdf as File);
          // Add other fields
          Object.keys(newBackground).forEach(key => {
            if (key !== 'degreePdf' && key !== 'id') {
              const value = (newBackground as any)[key];
              if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          });

          result = await apiUpload<{
            success: boolean;
            data?: AcademicBackground;
            message?: string;
          }>(`/profile/${userId}/academic-backgrounds`, formData);
        } else {
          result = await apiPost<{
            success: boolean;
            data?: AcademicBackground;
            message?: string;
          }>(`/profile/${userId}/academic-backgrounds`, newBackground);
        }

        if (result.success && result.data) {
          const updatedBackgrounds = [...academicBackgrounds, result.data];
          setAcademicBackgrounds(updatedBackgrounds);
          if (onBackgroundsChange) {
            onBackgroundsChange(updatedBackgrounds);
          }
        } else {
          alert(
            `Failed to save academic background: ${result.message || 'Unknown error'}`
          );
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
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/academic-backgrounds/${id}`);

      if (result.success) {
        const updatedBackgrounds = academicBackgrounds.filter(
          (_, i) => i !== index
        );
        setAcademicBackgrounds(updatedBackgrounds);
        if (onBackgroundsChange) {
          onBackgroundsChange(updatedBackgrounds);
        }
      } else {
        alert(
          `Failed to delete academic background: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting academic background:', error);
      alert('Error deleting academic background. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Academic Background
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (academicBackgrounds.length > 0) {
                  setEditingIndex(0);
                } else {
                  setEditingIndex(null);
                }
                setShowPopup(true);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-900" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 italic text-base">Loading...</p>
        ) : academicBackgrounds.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            No academic background added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {academicBackgrounds.map((bg, index) => (
              <div
                key={bg.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-800 uppercase">
                      <h3 className="text-sm text-gray-600">{bg.school}</h3>
                      {bg.degree && (
                        <span className="text-sm text-gray-600">
                          - {bg.degree}
                        </span>
                      )}
                    </div>

                    {/* Basic Education Details */}
                    <div className="mb-3 space-y-1">
                      {bg.qualification && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Qualification:</span>{' '}
                          {bg.qualification}
                        </p>
                      )}
                      {(bg.startDate || bg.endDate) && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span>{' '}
                          {bg.startDate || 'N/A'} to {bg.endDate || 'N/A'}
                        </p>
                      )}
                      {bg.degreePdf && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Degree PDF:</span>{' '}
                            {typeof bg.degreePdf === 'string'
                              ? bg.degreePdf
                              : bg.degreePdf.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Academic Information */}
                    {(bg.academicGpa ||
                      bg.satActScore ||
                      bg.academicHonors ||
                      bg.collegeEligibilityStatus) && (
                      <div className="mb-3 pt-3   space-y-1">
                        <p className="text-xs font-semibold text-gray-800 uppercase mb-2">
                          Academic Information
                        </p>
                        {bg.academicGpa && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">GPA:</span>{' '}
                            {bg.academicGpa}
                          </p>
                        )}
                        {bg.satActScore && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">SAT/ACT Score:</span>{' '}
                            {bg.satActScore}
                          </p>
                        )}
                        {bg.academicHonors && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Academic Honors / AP Coursework:
                            </span>{' '}
                            {bg.academicHonors}
                          </p>
                        )}
                        {bg.collegeEligibilityStatus && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              College Eligibility Status:
                            </span>{' '}
                            {bg.collegeEligibilityStatus}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Graduation & Availability */}
                    {(bg.graduationYear ||
                      bg.primaryStateRegion ||
                      bg.preferredCollegeRegions ||
                      bg.willingnessToRelocate ||
                      bg.gender) && (
                      <div className="pt-3  space-y-1">
                        <p className="text-xs font-semibold text-gray-800 uppercase mb-2">
                          Graduation & Availability
                        </p>
                        {bg.graduationYear && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Graduation Year:
                            </span>{' '}
                            {bg.graduationYear}
                          </p>
                        )}
                        {bg.primaryStateRegion && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Primary State/Region:
                            </span>{' '}
                            {bg.primaryStateRegion}
                          </p>
                        )}
                        {bg.preferredCollegeRegions && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Preferred College Regions:
                            </span>{' '}
                            {bg.preferredCollegeRegions}
                          </p>
                        )}
                        {bg.willingnessToRelocate && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Willingness to Relocate:
                            </span>{' '}
                            {bg.willingnessToRelocate}
                          </p>
                        )}
                        {bg.gender && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Gender:</span>{' '}
                            {bg.gender}
                          </p>
                        )}
                      </div>
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
                        onClick={() => handleDelete(bg.id, index)}
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

      <AcademicBackgroundPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? academicBackgrounds[editingIndex] : undefined
        }
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewAcademicBackgroundPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={academicBackgrounds[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewAcademicBackgroundPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: AcademicBackground;
}) {
  if (!open) return null;

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
            Academic Background Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Basic Education Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Education Details
            </h3>
            <div className="space-y-4">
              {data.school && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School
                  </label>
                  <p className="text-gray-900">{data.school}</p>
                </div>
              )}

              {data.degree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree
                  </label>
                  <p className="text-gray-900">{data.degree}</p>
                </div>
              )}

              {data.qualification && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <p className="text-gray-900">{data.qualification}</p>
                </div>
              )}

              {(data.startDate || data.endDate) && (
                <div className="grid grid-cols-2 gap-4">
                  {data.startDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <p className="text-gray-900">{data.startDate}</p>
                    </div>
                  )}
                  {data.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <p className="text-gray-900">{data.endDate}</p>
                    </div>
                  )}
                </div>
              )}

              {data.degreePdf && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree PDF
                  </label>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <p className="text-gray-900">
                      {typeof data.degreePdf === 'string'
                        ? data.degreePdf
                        : data.degreePdf.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Academic Information */}
          {(data.academicGpa ||
            data.satActScore ||
            data.academicHonors ||
            data.collegeEligibilityStatus) && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Academic Information
              </h3>
              <div className="space-y-4">
                {data.academicGpa && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic GPA (0.0-4.0)
                    </label>
                    <p className="text-gray-900">{data.academicGpa}</p>
                  </div>
                )}

                {data.satActScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SAT/ACT Score
                    </label>
                    <p className="text-gray-900">{data.satActScore}</p>
                  </div>
                )}

                {data.academicHonors && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Honors / AP Coursework
                    </label>
                    <p className="text-gray-900">{data.academicHonors}</p>
                  </div>
                )}

                {data.collegeEligibilityStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Eligibility Status
                    </label>
                    <p className="text-gray-900">
                      {data.collegeEligibilityStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Graduation & Availability */}
          {(data.graduationYear ||
            data.primaryStateRegion ||
            data.preferredCollegeRegions ||
            data.willingnessToRelocate ||
            data.gender) && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Graduation & Availability
              </h3>
              <div className="space-y-4">
                {data.graduationYear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year
                    </label>
                    <p className="text-gray-900">{data.graduationYear}</p>
                  </div>
                )}

                {data.primaryStateRegion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary State/Region
                    </label>
                    <p className="text-gray-900">{data.primaryStateRegion}</p>
                  </div>
                )}

                {data.preferredCollegeRegions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred College Regions
                    </label>
                    <p className="text-gray-900">
                      {data.preferredCollegeRegions}
                    </p>
                  </div>
                )}

                {data.willingnessToRelocate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Willingness to Relocate
                    </label>
                    <p className="text-gray-900">
                      {data.willingnessToRelocate}
                    </p>
                  </div>
                )}

                {data.gender && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <p className="text-gray-900">{data.gender}</p>
                  </div>
                )}
              </div>
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
