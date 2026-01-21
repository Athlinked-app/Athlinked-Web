'use client';

import { X, Bookmark } from 'lucide-react';

interface OpportunityItem {
  id: string;
  category: string;
  title: string;
  sport?: string;
  website?: string;
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

interface OpportunityDetailsPopupProps {
  show: boolean;
  opportunity: OpportunityItem | null;
  onClose: () => void;
  onSave?: (opportunityId: string) => void;
  isSaved?: boolean;
}

export default function OpportunityDetailsPopup({
  show,
  opportunity,
  onClose,
  onSave,
  isSaved = false,
}: OpportunityDetailsPopupProps) {
  if (!show || !opportunity) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
              <img
                src={opportunity.image}
                alt={opportunity.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">{opportunity.category}</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {opportunity.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Eligibility */}
            {opportunity.eligibility && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.eligibility}
                </p>
              </div>
            )}

            {/* Must Represent */}
            {opportunity.mustRepresent && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Requirements:
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.mustRepresent}
                </p>
              </div>
            )}

            {/* Dates */}
            {opportunity.dates && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Dates:</h3>
                <p className="text-sm text-gray-600">{opportunity.dates}</p>
              </div>
            )}

            {/* Venue */}
            {opportunity.venue && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Venue:</h3>
                <p className="text-sm text-gray-600">{opportunity.venue}</p>
              </div>
            )}

            {/* Format */}
            {opportunity.format && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Format:</h3>
                <p className="text-sm text-gray-600">{opportunity.format}</p>
              </div>
            )}

            {/* Match Details (for tournaments) */}
            {opportunity.matchDetails && opportunity.matchDetails !== 'N/A' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Match Details:
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.matchDetails}
                </p>
              </div>
            )}

            {/* Registration Deadline */}
            {opportunity.registrationDeadline && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Registration Deadline:
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.registrationDeadline}
                </p>
              </div>
            )}

            {/* Membership Fee */}
            {opportunity.membershipFee && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fee:</h3>
                <p className="text-sm text-gray-600">
                  {opportunity.membershipFee}
                </p>
              </div>
            )}

            {/* Documents Required */}
            {opportunity.documentsRequired && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Documents Required:
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.documentsRequired}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button className="flex-1 bg-[#CB9729] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#B88624] transition-colors">
              Share
            </button>
            {onSave && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSave(opportunity.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  isSaved
                    ? 'bg-[#CB9729] text-white border-[#CB9729]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                />
                <span className="font-medium">
                  {isSaved ? 'Saved' : 'Save'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
