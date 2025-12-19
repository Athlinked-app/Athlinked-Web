import { User, Mail, Calendar } from 'lucide-react';

interface ParentDetailsFormProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  onContinue: () => void;
}

export default function ParentDetailsForm({
  formData,
  onFormDataChange,
  onContinue,
}: ParentDetailsFormProps) {
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
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of birth (MM/DD/YYYY)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="MM/DD/YYYY"
              value={formData.parentDOB}
              onChange={e =>
                onFormDataChange({ ...formData, parentDOB: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base"
      >
        Continue
      </button>

      <div className="text-center text-xs sm:text-sm text-gray-600">
        <span className="text-gray-700">Already have an account? </span>
        <a href="#" className="text-orange-500 font-medium hover:underline">
          Sign in
        </a>
      </div>
    </>
  );
}
