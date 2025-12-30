'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Upload } from 'lucide-react';

export interface AcademicBackground {
  id?: string;
  school: string;
  degree: string;
  qualification: string;
  startDate: string;
  endDate: string;
  degreePdf?: File | string;
  academicGpa?: string;
  satActScore?: string;
  academicHonors?: string;
  collegeEligibilityStatus?: string;
  graduationYear?: string;
  primaryStateRegion?: string;
  preferredCollegeRegions?: string;
  willingnessToRelocate?: string;
  gender?: string;
}

interface AcademicBackgroundPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AcademicBackground) => void;
  existingData?: AcademicBackground;
}

const qualifications = [
  '10th',
  '12th',
  'Graduate',
  'Post-Graduate',
  'Diploma',
  'Certificate',
  'Other',
];
const academicHonorsOptions = ['Yes', 'No'];
const collegeEligibilityOptions = [
  'Eligible',
  'Not Yet Registered',
  'Registered with NCAA',
];
const preferredRegions = [
  'Northeast',
  'Midwest',
  'South',
  'West',
  'National',
  'International',
];
const willingnessOptions = ['Yes', 'No'];
const genderOptions = ['All', 'Male', 'Female', 'Other', 'Prefer not to say'];

// Generate years from 2000 to 2030
const graduationYears = Array.from({ length: 31 }, (_, i) =>
  (2030 - i).toString()
);

export default function AcademicBackgroundPopup({
  open,
  onClose,
  onSave,
  existingData,
}: AcademicBackgroundPopupProps) {
  const [school, setSchool] = useState(existingData?.school || '');
  const [degree, setDegree] = useState(existingData?.degree || '');
  const [qualification, setQualification] = useState(
    existingData?.qualification || ''
  );
  const [startDate, setStartDate] = useState(existingData?.startDate || '');
  const [endDate, setEndDate] = useState(existingData?.endDate || '');
  const [degreePdf, setDegreePdf] = useState<File | null>(null);
  const [degreePdfName, setDegreePdfName] = useState(
    existingData?.degreePdf
      ? typeof existingData.degreePdf === 'string'
        ? existingData.degreePdf
        : existingData.degreePdf.name
      : ''
  );

  // Academic Information
  const [academicGpa, setAcademicGpa] = useState(
    existingData?.academicGpa || ''
  );
  const [satActScore, setSatActScore] = useState(
    existingData?.satActScore || ''
  );
  const [academicHonors, setAcademicHonors] = useState(
    existingData?.academicHonors || ''
  );
  const [collegeEligibilityStatus, setCollegeEligibilityStatus] = useState(
    existingData?.collegeEligibilityStatus || ''
  );

  // Graduation & Availability
  const [graduationYear, setGraduationYear] = useState(
    existingData?.graduationYear || ''
  );
  const [primaryStateRegion, setPrimaryStateRegion] = useState(
    existingData?.primaryStateRegion || ''
  );
  const [preferredCollegeRegions, setPreferredCollegeRegions] = useState(
    existingData?.preferredCollegeRegions || ''
  );
  const [willingnessToRelocate, setWillingnessToRelocate] = useState(
    existingData?.willingnessToRelocate || ''
  );
  const [gender, setGender] = useState(existingData?.gender || '');

  const [showQualificationDropdown, setShowQualificationDropdown] =
    useState(false);
  const [showAcademicHonorsDropdown, setShowAcademicHonorsDropdown] =
    useState(false);
  const [showCollegeEligibilityDropdown, setShowCollegeEligibilityDropdown] =
    useState(false);
  const [showGraduationYearDropdown, setShowGraduationYearDropdown] =
    useState(false);
  const [showPreferredRegionsDropdown, setShowPreferredRegionsDropdown] =
    useState(false);
  const [showWillingnessDropdown, setShowWillingnessDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const [showBasicEducation, setShowBasicEducation] = useState(true);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  const [showGraduationInfo, setShowGraduationInfo] = useState(false);

  const qualificationRef = useRef<HTMLDivElement>(null);
  const academicHonorsRef = useRef<HTMLDivElement>(null);
  const collegeEligibilityRef = useRef<HTMLDivElement>(null);
  const graduationYearRef = useRef<HTMLDivElement>(null);
  const preferredRegionsRef = useRef<HTMLDivElement>(null);
  const willingnessRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setSchool(existingData.school || '');
      setDegree(existingData.degree || '');
      setQualification(existingData.qualification || '');
      setStartDate(existingData.startDate || '');
      setEndDate(existingData.endDate || '');
      setDegreePdfName(
        existingData.degreePdf
          ? typeof existingData.degreePdf === 'string'
            ? existingData.degreePdf
            : existingData.degreePdf.name
          : ''
      );
      setAcademicGpa(existingData.academicGpa || '');
      setSatActScore(existingData.satActScore || '');
      setAcademicHonors(existingData.academicHonors || '');
      setCollegeEligibilityStatus(existingData.collegeEligibilityStatus || '');
      setGraduationYear(existingData.graduationYear || '');
      setPrimaryStateRegion(existingData.primaryStateRegion || '');
      setPreferredCollegeRegions(existingData.preferredCollegeRegions || '');
      setWillingnessToRelocate(existingData.willingnessToRelocate || '');
      setGender(existingData.gender || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setSchool('');
      setDegree('');
      setQualification('');
      setStartDate('');
      setEndDate('');
      setDegreePdf(null);
      setDegreePdfName('');
      setAcademicGpa('');
      setSatActScore('');
      setAcademicHonors('');
      setCollegeEligibilityStatus('');
      setGraduationYear('');
      setPrimaryStateRegion('');
      setPreferredCollegeRegions('');
      setWillingnessToRelocate('');
      setGender('');
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        qualificationRef.current &&
        !qualificationRef.current.contains(event.target as Node)
      ) {
        setShowQualificationDropdown(false);
      }
      if (
        academicHonorsRef.current &&
        !academicHonorsRef.current.contains(event.target as Node)
      ) {
        setShowAcademicHonorsDropdown(false);
      }
      if (
        collegeEligibilityRef.current &&
        !collegeEligibilityRef.current.contains(event.target as Node)
      ) {
        setShowCollegeEligibilityDropdown(false);
      }
      if (
        graduationYearRef.current &&
        !graduationYearRef.current.contains(event.target as Node)
      ) {
        setShowGraduationYearDropdown(false);
      }
      if (
        preferredRegionsRef.current &&
        !preferredRegionsRef.current.contains(event.target as Node)
      ) {
        setShowPreferredRegionsDropdown(false);
      }
      if (
        willingnessRef.current &&
        !willingnessRef.current.contains(event.target as Node)
      ) {
        setShowWillingnessDropdown(false);
      }
      if (
        genderRef.current &&
        !genderRef.current.contains(event.target as Node)
      ) {
        setShowGenderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDegreePdf(file);
      setDegreePdfName(file.name);
    }
  };

  const handleSave = () => {
    onSave({
      school,
      degree,
      qualification,
      startDate,
      endDate,
      degreePdf: degreePdf || existingData?.degreePdf || undefined,
      academicGpa,
      satActScore,
      academicHonors,
      collegeEligibilityStatus,
      graduationYear,
      primaryStateRegion,
      preferredCollegeRegions,
      willingnessToRelocate,
      gender,
    });
    // Reset form
    setSchool('');
    setDegree('');
    setQualification('');
    setStartDate('');
    setEndDate('');
    setDegreePdf(null);
    setDegreePdfName('');
    setAcademicGpa('');
    setSatActScore('');
    setAcademicHonors('');
    setCollegeEligibilityStatus('');
    setGraduationYear('');
    setPrimaryStateRegion('');
    setPreferredCollegeRegions('');
    setWillingnessToRelocate('');
    setGender('');
    onClose();
  };

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
            {existingData ? 'Edit education' : 'Add education'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Basic Education Details - Collapsible */}
          <div>
            <button
              onClick={() => setShowBasicEducation(!showBasicEducation)}
              className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-4"
            >
              <span>Basic Education Details</span>
              {showBasicEducation ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showBasicEducation && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    placeholder="Ex: Stanford University"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
                    placeholder="Degree"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                  />
                </div>

                <DropdownField
                  label="Qualification"
                  value={qualification}
                  placeholder="Choose qualification..."
                  options={qualifications}
                  showDropdown={showQualificationDropdown}
                  setShowDropdown={setShowQualificationDropdown}
                  onSelect={setQualification}
                  ref={qualificationRef}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree PDF
                  </label>
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#CB9729] transition-colors flex items-center justify-center gap-2 text-gray-600"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{degreePdfName || 'Upload Degree'}</span>
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
            )}
          </div>

          {/* Academic Information - Collapsible */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowAcademicInfo(!showAcademicInfo)}
              className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-4"
            >
              <span>Academic Information</span>
              {showAcademicInfo ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showAcademicInfo && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic GPA (0.0-4.0)
                  </label>
                  <input
                    type="text"
                    value={academicGpa}
                    onChange={e => setAcademicGpa(e.target.value)}
                    placeholder="Type here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SAT/ACT Score
                  </label>
                  <input
                    type="text"
                    value={satActScore}
                    onChange={e => setSatActScore(e.target.value)}
                    placeholder="Type here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                  />
                </div>

                <DropdownField
                  label="Academic Honors / AP Coursework"
                  value={academicHonors}
                  placeholder="Choose an option..."
                  options={academicHonorsOptions}
                  showDropdown={showAcademicHonorsDropdown}
                  setShowDropdown={setShowAcademicHonorsDropdown}
                  onSelect={setAcademicHonors}
                  ref={academicHonorsRef}
                />

                <DropdownField
                  label="College Eligibility Status"
                  value={collegeEligibilityStatus}
                  placeholder="Choose an option..."
                  options={collegeEligibilityOptions}
                  showDropdown={showCollegeEligibilityDropdown}
                  setShowDropdown={setShowCollegeEligibilityDropdown}
                  onSelect={setCollegeEligibilityStatus}
                  ref={collegeEligibilityRef}
                />
              </div>
            )}
          </div>

          {/* Graduation & Availability - Collapsible */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowGraduationInfo(!showGraduationInfo)}
              className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-4"
            >
              <span>Graduation & Availability</span>
              {showGraduationInfo ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showGraduationInfo && (
              <div className="space-y-4">
                <DropdownField
                  label="Graduation Year"
                  value={graduationYear}
                  placeholder="Choose an option..."
                  options={graduationYears}
                  showDropdown={showGraduationYearDropdown}
                  setShowDropdown={setShowGraduationYearDropdown}
                  onSelect={setGraduationYear}
                  ref={graduationYearRef}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary State/Region
                  </label>
                  <input
                    type="text"
                    value={primaryStateRegion}
                    onChange={e => setPrimaryStateRegion(e.target.value)}
                    placeholder="Primary State or Region"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                  />
                </div>

                <DropdownField
                  label="Preferred College Regions"
                  value={preferredCollegeRegions}
                  placeholder="Choose an option..."
                  options={preferredRegions}
                  showDropdown={showPreferredRegionsDropdown}
                  setShowDropdown={setShowPreferredRegionsDropdown}
                  onSelect={setPreferredCollegeRegions}
                  ref={preferredRegionsRef}
                />

                <DropdownField
                  label="Willingness to Relocate"
                  value={willingnessToRelocate}
                  placeholder="Choose an option..."
                  options={willingnessOptions}
                  showDropdown={showWillingnessDropdown}
                  setShowDropdown={setShowWillingnessDropdown}
                  onSelect={setWillingnessToRelocate}
                  ref={willingnessRef}
                />

                <DropdownField
                  label="Gender"
                  value={gender}
                  placeholder="Choose an option..."
                  options={genderOptions}
                  showDropdown={showGenderDropdown}
                  setShowDropdown={setShowGenderDropdown}
                  onSelect={setGender}
                  ref={genderRef}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
