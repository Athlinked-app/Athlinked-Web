'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Briefcase, GraduationCap, Trophy, Bookmark, Share2 } from 'lucide-react';
import SaveModal from '@/components/Save/SaveModal';

interface OpportunityItem {
  id: string;
  category: string;
  title: string;
  image: string;
  link?: string;
  type: 'tryouts' | 'scholarship' | 'tournament';
  date?: string;
  location?: string;
  eligibility?: string;
  mustRepresent?: string;
  dates?: string;
  venue?: string;
  format?: string;
  matchDetails?: string;
  registrationDeadline?: string;
  membershipFee?: string;
  documentsRequired?: string;
}

interface MySaveOpportunityProps {
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  viewedUserId?: string | null;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function MySaveOpportunity({
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: MySaveOpportunityProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<OpportunityItem[]>([]);
  const [savedOpportunitiesStatus, setSavedOpportunitiesStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');
  const [saveAlertOpportunityId, setSaveAlertOpportunityId] = useState<
    string | null
  >(null);

  // Get saved opportunities from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedOpportunitiesData = JSON.parse(
      localStorage.getItem('athlinked_saved_opportunities_data') || '[]'
    );
    setSavedOpportunities(savedOpportunitiesData);
    
    // Check saved status
    const savedOpportunityIds = JSON.parse(
      localStorage.getItem('athlinked_saved_opportunities') || '[]'
    );
    const savedMap: { [key: string]: boolean } = {};
    savedOpportunitiesData.forEach((opp: OpportunityItem) => {
      savedMap[opp.id] = savedOpportunityIds.includes(opp.id);
    });
    setSavedOpportunitiesStatus(savedMap);
  }, []);

  // Filter posts: events are now shown in Post tab, not here
  // This component now only shows opportunities (tryouts, scholarships, tournaments)

  const getIconForType = (type: string) => {
    switch (type) {
      case 'scholarship':
        return <GraduationCap className="w-12 h-12 text-white opacity-80" />;
      case 'tournament':
        return <Trophy className="w-12 h-12 text-white opacity-80" />;
      case 'tryouts':
        return <Briefcase className="w-12 h-12 text-white opacity-80" />;
      default:
        return <Briefcase className="w-12 h-12 text-white opacity-80" />;
    }
  };

  const handleSaveOpportunity = (opportunityId: string) => {
    const savedOpportunityIds = JSON.parse(
      localStorage.getItem('athlinked_saved_opportunities') || '[]'
    );

    let isNowSaved: boolean;
    if (savedOpportunityIds.includes(opportunityId)) {
      // Unsave
      const updatedSavedOpportunities = savedOpportunityIds.filter(
        (id: string) => id !== opportunityId
      );
      localStorage.setItem(
        'athlinked_saved_opportunities',
        JSON.stringify(updatedSavedOpportunities)
      );
      // Also remove from saved data
      const savedOpportunitiesData = JSON.parse(
        localStorage.getItem('athlinked_saved_opportunities_data') || '[]'
      );
      const updatedSavedData = savedOpportunitiesData.filter(
        (opp: OpportunityItem) => opp.id !== opportunityId
      );
      localStorage.setItem(
        'athlinked_saved_opportunities_data',
        JSON.stringify(updatedSavedData)
      );
      setSavedOpportunities(updatedSavedData);
      isNowSaved = false;
      setSaveAlertMessage('This opportunity is unsaved');
    } else {
      // Save - store the full opportunity object
      const opportunity = savedOpportunities.find(opp => opp.id === opportunityId);
      if (opportunity) {
        const savedOpportunitiesData = JSON.parse(
          localStorage.getItem('athlinked_saved_opportunities_data') || '[]'
        );
        // Check if already exists to avoid duplicates
        if (!savedOpportunitiesData.find((opp: OpportunityItem) => opp.id === opportunityId)) {
          savedOpportunitiesData.push(opportunity);
          localStorage.setItem(
            'athlinked_saved_opportunities_data',
            JSON.stringify(savedOpportunitiesData)
          );
        }
      }
      const updatedSavedOpportunities = [...savedOpportunityIds, opportunityId];
      localStorage.setItem(
        'athlinked_saved_opportunities',
        JSON.stringify(updatedSavedOpportunities)
      );
      isNowSaved = true;
      setSaveAlertMessage('This opportunity is saved');
    }

    // Update saved state
    setSavedOpportunitiesStatus(prev => ({
      ...prev,
      [opportunityId]: isNowSaved,
    }));

    // Show alert
    setSaveAlertOpportunityId(opportunityId);
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
      setSaveAlertOpportunityId(null);
    }, 2000);
  };

  const handleShareOpportunity = () => {
    // TODO: Implement share functionality
    console.log('Share opportunity:', selectedOpportunity);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading saved opportunities...
      </div>
    );
  }

  if (savedOpportunities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved opportunities found.
      </div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Render saved opportunities */}
        {savedOpportunities.map(opportunity => (
          <div
            key={opportunity.id}
            onClick={() => setSelectedOpportunity(opportunity)}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
          >
            <div className="relative w-full h-full">
              <Image
                src={opportunity.image}
                alt={opportunity.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                {getIconForType(opportunity.type)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white font-medium line-clamp-2">
                  {opportunity.title}
                </p>
                <p className="text-xs text-white/80">{opportunity.category}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Opportunity Detail Popup */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedOpportunity(null)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Saved Opportunity Details</h2>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              {/* Header with Icon and Title */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                  <img
                    src={selectedOpportunity.image}
                    alt={selectedOpportunity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{selectedOpportunity.category}</p>
                  <h3 className="text-base font-semibold text-gray-900">
                    {selectedOpportunity.title}
                  </h3>
                </div>
              </div>

              {/* Share and Save Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleShareOpportunity}
                  className="flex-1 bg-[#CB9729] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B88624] transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => {
                    if (selectedOpportunity) {
                      handleSaveOpportunity(selectedOpportunity.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    selectedOpportunity && savedOpportunitiesStatus[selectedOpportunity.id]
                      ? 'bg-[#CB9729] text-white border-[#CB9729]'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      selectedOpportunity && savedOpportunitiesStatus[selectedOpportunity.id]
                        ? 'fill-current'
                        : ''
                    }`}
                  />
                  <span className="font-medium">
                    {selectedOpportunity && savedOpportunitiesStatus[selectedOpportunity.id]
                      ? 'Saved'
                      : 'Save'}
                  </span>
                </button>
              </div>

              {/* Details Content */}
              <div className="space-y-6">
                {selectedOpportunity.eligibility && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Eligibility:
                    </h3>
                    <p className="text-sm text-gray-600">{selectedOpportunity.eligibility}</p>
                  </div>
                )}

                {(selectedOpportunity.dates || selectedOpportunity.venue) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Date & Venue:
                    </h3>
                    {selectedOpportunity.dates && (
                      <p className="text-sm text-gray-600">{selectedOpportunity.dates}</p>
                    )}
                    {selectedOpportunity.venue && (
                      <p className="text-sm text-gray-600">{selectedOpportunity.venue}</p>
                    )}
                  </div>
                )}

                {selectedOpportunity.mustRepresent && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Must Represent:
                    </h3>
                    <p className="text-sm text-gray-600">{selectedOpportunity.mustRepresent}</p>
                  </div>
                )}

                {selectedOpportunity.format && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Format:</h3>
                    <p className="text-sm text-gray-600">{selectedOpportunity.format}</p>
                  </div>
                )}

                {selectedOpportunity.registrationDeadline && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Registration Deadline:
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedOpportunity.registrationDeadline}
                    </p>
                  </div>
                )}

                {selectedOpportunity.membershipFee && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Membership Fee:
                    </h3>
                    <p className="text-sm text-gray-600">{selectedOpportunity.membershipFee}</p>
                  </div>
                )}

                {selectedOpportunity.documentsRequired && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Documents Required:
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedOpportunity.documentsRequired}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Alert Modal */}
      {saveAlertOpportunityId && (
        <SaveModal
          postId={saveAlertOpportunityId}
          showAlert={showSaveAlert}
          alertMessage={saveAlertMessage}
          isSaved={savedOpportunitiesStatus[saveAlertOpportunityId] || false}
        />
      )}
    </>
  );
}

