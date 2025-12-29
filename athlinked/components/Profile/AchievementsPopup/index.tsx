'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Upload } from 'lucide-react';

export interface Achievement {
  title: string;
  organization: string;
  dateAwarded: string;
  sport: string;
  positionEvent: string;
  achievementType: string;
  level: string;
  location: string;
  description: string;
  mediaPdf?: File | string;
}

interface AchievementsPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Achievement) => void;
  existingData?: Achievement;
}

const sports = [
  'Football',
  'Basketball',
  'Baseball',
  'Swimming',
  'Soccer',
  'Track & Field',
  'Wrestling',
  'Tennis',
  'Golf',
  'Lacrosse',
  'Hockey',
  'Volleyball',
];
const achievementTypes = ['Individual', 'Team', 'TalentType', 'Record'];
const levels = ['School', 'District', 'State', 'National', 'International'];

export default function AchievementsPopup({
  open,
  onClose,
  onSave,
  existingData,
}: AchievementsPopupProps) {
  const [title, setTitle] = useState(existingData?.title || '');
  const [organization, setOrganization] = useState(
    existingData?.organization || ''
  );
  const [dateAwarded, setDateAwarded] = useState(
    existingData?.dateAwarded || ''
  );
  const [sport, setSport] = useState(existingData?.sport || '');
  const [positionEvent, setPositionEvent] = useState(
    existingData?.positionEvent || ''
  );
  const [achievementType, setAchievementType] = useState(
    existingData?.achievementType || ''
  );
  const [level, setLevel] = useState(existingData?.level || '');
  const [location, setLocation] = useState(existingData?.location || '');
  const [description, setDescription] = useState(
    existingData?.description || ''
  );
  const [mediaPdf, setMediaPdf] = useState<File | null>(null);
  const [mediaPdfName, setMediaPdfName] = useState(
    existingData?.mediaPdf
      ? typeof existingData.mediaPdf === 'string'
        ? existingData.mediaPdf
        : existingData.mediaPdf.name
      : ''
  );

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showAchievementTypeDropdown, setShowAchievementTypeDropdown] =
    useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  const sportRef = useRef<HTMLDivElement>(null);
  const achievementTypeRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setTitle(existingData.title || '');
      setOrganization(existingData.organization || '');
      setDateAwarded(existingData.dateAwarded || '');
      setSport(existingData.sport || '');
      setPositionEvent(existingData.positionEvent || '');
      setAchievementType(existingData.achievementType || '');
      setLevel(existingData.level || '');
      setLocation(existingData.location || '');
      setDescription(existingData.description || '');
      setMediaPdfName(
        existingData.mediaPdf
          ? typeof existingData.mediaPdf === 'string'
            ? existingData.mediaPdf
            : existingData.mediaPdf.name
          : ''
      );
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setTitle('');
      setOrganization('');
      setDateAwarded('');
      setSport('');
      setPositionEvent('');
      setAchievementType('');
      setLevel('');
      setLocation('');
      setDescription('');
      setMediaPdf(null);
      setMediaPdfName('');
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sportRef.current &&
        !sportRef.current.contains(event.target as Node)
      ) {
        setShowSportDropdown(false);
      }
      if (
        achievementTypeRef.current &&
        !achievementTypeRef.current.contains(event.target as Node)
      ) {
        setShowAchievementTypeDropdown(false);
      }
      if (
        levelRef.current &&
        !levelRef.current.contains(event.target as Node)
      ) {
        setShowLevelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaPdf(file);
      setMediaPdfName(file.name);
    }
  };

  const handleSave = () => {
    // Validate all required fields
    if (
      !title.trim() ||
      !organization.trim() ||
      !dateAwarded ||
      !sport ||
      !positionEvent.trim() ||
      !achievementType ||
      !level ||
      !location.trim() ||
      !description.trim()
    ) {
      return; // Don't save if any field is empty
    }

    onSave({
      title,
      organization,
      dateAwarded,
      sport,
      positionEvent,
      achievementType,
      level,
      location,
      description,
      mediaPdf: mediaPdf || existingData?.mediaPdf || undefined,
    });
    // Reset form
    setTitle('');
    setOrganization('');
    setDateAwarded('');
    setSport('');
    setPositionEvent('');
    setAchievementType('');
    setLevel('');
    setLocation('');
    setDescription('');
    setMediaPdf(null);
    setMediaPdfName('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid =
    title.trim() &&
    organization.trim() &&
    dateAwarded &&
    sport &&
    positionEvent.trim() &&
    achievementType &&
    level &&
    location.trim() &&
    description.trim();

  const DropdownField = ({
    label,
    value,
    placeholder,
    options,
    showDropdown,
    setShowDropdown,
    onSelect,
    ref,
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    onSelect: (value: string) => void;
    ref: React.RefObject<HTMLDivElement | null>;
  }) => (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
          showDropdown
            ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
            : 'border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option}
              onClick={() => {
                onSelect(option);
                setShowDropdown(false);
              }}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
            {existingData ? 'Edit Achievement' : 'Add Achievements'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="Ex: Stanford University"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Awarded
            </label>
            <input
              type="date"
              value={dateAwarded}
              onChange={e => setDateAwarded(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <DropdownField
            label="Sport"
            value={sport}
            placeholder="Sport"
            options={sports}
            showDropdown={showSportDropdown}
            setShowDropdown={setShowSportDropdown}
            onSelect={setSport}
            ref={sportRef}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position / Event
            </label>
            <input
              type="text"
              value={positionEvent}
              onChange={e => setPositionEvent(e.target.value)}
              placeholder="Position / Event"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <DropdownField
            label="Achievements Type"
            value={achievementType}
            placeholder="Achievements type"
            options={achievementTypes}
            showDropdown={showAchievementTypeDropdown}
            setShowDropdown={setShowAchievementTypeDropdown}
            onSelect={setAchievementType}
            ref={achievementTypeRef}
          />

          <DropdownField
            label="Level"
            value={level}
            placeholder="Level"
            options={levels}
            showDropdown={showLevelDropdown}
            setShowDropdown={setShowLevelDropdown}
            onSelect={setLevel}
            ref={levelRef}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Upload (PDF only)
            </label>
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#CB9729] transition-colors flex items-center justify-center gap-2 text-gray-600"
            >
              <Upload className="w-5 h-5" />
              <span>{mediaPdfName || 'Upload Degree'}</span>
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
              isFormValid
                ? 'bg-[#CB9729] text-white hover:bg-[#b78322] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
