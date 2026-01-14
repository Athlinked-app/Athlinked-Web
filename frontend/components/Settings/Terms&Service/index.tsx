'use client';

export default function TermsAndService() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms & Service
        </h1>
        <div className="h-1 w-20 bg-[#CB9729]"></div>
      </div>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Summary</h2>
          <p>
            Welcome to <strong>Athlinked</strong>, a professional networking
            platform designed to help athletes, coaches, and sports
            organizations connect, collaborate, and grow. By accessing or using
            our app, you agree to comply with these Terms of Service. If you do
            not agree, you may not use Athlinked. You must provide accurate
            details, maintain your account security, and use the platform
            responsibly. Misuse, false information, or violation of these terms
            may lead to account suspension or termination. Athlinked aims to
            build a safe and trustworthy community where professionals in sports
            can network with confidence.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Terms</h2>
          <div className="space-y-4">
            <p>
              You must be at least <strong>13 years old</strong> to create an
              account on Athlinked. If you are under 18, parental or guardian
              consent is required. You are solely responsible for any activity
              under your account and must ensure that your login credentials
              remain secure. Any unauthorized use of your account should be
              reported immediately.
            </p>

            <p>
              By posting content such as images, achievements, or career
              updates, you retain ownership but grant Athlinked a limited right
              to display and share your content within the platform to enhance
              visibility and networking. You must not post offensive, harmful,
              or copyrighted content without permission, nor engage in any
              activity that disrupts or exploits the service.
            </p>

            <p>
              Athlinked is provided <strong>"as is,"</strong> and we are not
              liable for any loss, damage, or disputes that may arise from your
              use of the app or your interactions with other users. We may
              modify or update these Terms at any time, and continued use of
              Athlinked after such updates means you accept the revised terms.
              For any concerns or questions, please reach out to our support
              team at{' '}
              <a
                href="mailto:support@athlinked.com"
                className="text-[#CB9729] hover:underline"
              >
                support@athlinked.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
