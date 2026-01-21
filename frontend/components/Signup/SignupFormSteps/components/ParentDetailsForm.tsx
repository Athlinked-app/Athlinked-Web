import { User, Mail } from 'lucide-react';

interface ParentDetailsFormProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  isLoadingOTP?: boolean;
  onContinue: () => void;
}

export default function ParentDetailsForm({
  formData,
  onFormDataChange,
  isLoadingOTP = false,
  onContinue,
}: ParentDetailsFormProps) {
  // Convert MM/DD/YYYY to YYYY-MM-DD for date input
  const formatDateForInput = (mmddyyyy: string): string => {
    if (!mmddyyyy || mmddyyyy.length !== 10) return '';
    const [month, day, year] = mmddyyyy.split('/');
    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD to MM/DD/YYYY for storage
  const formatDateForStorage = (yyyymmdd: string): string => {
    if (!yyyymmdd) return '';
    const [year, month, day] = yyyymmdd.split('-');
    return `${month}/${day}/${year}`;
  };

  const handleDOBChange = (value: string) => {
    // Value comes in YYYY-MM-DD format from date input
    const formattedDate = formatDateForStorage(value);
    onFormDataChange({ ...formData, parentDOB: formattedDate });
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent / Guardian Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.parentName}
              onChange={e =>
                onFormDataChange({ ...formData, parentName: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.parentEmail}
              onChange={e =>
                onFormDataChange({ ...formData, parentEmail: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of birth
          </label>
          <input
            type="date"
            value={formatDateForInput(formData.parentDOB)}
            onChange={e => handleDOBChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base"
      >
        {isLoadingOTP && (
          <svg
            className="animate-spin h-5 w-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isLoadingOTP ? 'Sending OTP...' : 'Continue'}
      </button>

      <div className="text-center text-xs sm:text-sm text-gray-600">
        <span className="text-gray-700">Already have an account? </span>
        <a href="#" className="text-[#CB9729] font-medium hover:underline">
          Sign in
        </a>
      </div>
    </>
  );
}
