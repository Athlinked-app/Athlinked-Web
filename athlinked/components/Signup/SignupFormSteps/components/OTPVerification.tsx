interface OTPVerificationProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

export default function OTPVerification({
  formData,
  onFormDataChange,
}: OTPVerificationProps) {
  return (
    <>
      <div className="space-y-6 mb-6">
        <p className="text-sm text-gray-700 text-center">
          A one time password has been sent to{' '}
          <span className="font-semibold">{formData.email || 'wd@fj.com'}</span>
        </p>

        <div>
          <input
            type="text"
            placeholder="Enter OTP!"
            value={formData.otp}
            onChange={e =>
              onFormDataChange({ ...formData, otp: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>

        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Resend...
          </button>
        </div>
      </div>

      <button className="w-full bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base">
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
