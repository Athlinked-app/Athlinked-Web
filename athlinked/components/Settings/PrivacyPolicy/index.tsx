'use client';

import { useRef } from 'react';
import { Download } from 'lucide-react';

export default function PrivacyPolicy() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    try {
      if (!contentRef.current) return;

      // Dynamically import html2canvas and jspdf
      // Using eval to prevent Next.js from analyzing at build time
      let html2canvas: any;
      let jsPDF: any;

      try {
        // @ts-ignore - Dynamic import that may not be available
        html2canvas = (await eval('import("html2canvas")')).default;
      } catch (e: any) {
        if (e?.code === 'MODULE_NOT_FOUND' || e?.message?.includes('Cannot find module')) {
          alert('PDF export feature requires html2canvas package. Please install it: npm install html2canvas');
        } else {
          console.error('Error loading html2canvas:', e);
          alert('Failed to load PDF export library. Please try again.');
        }
        return;
      }

      try {
        // @ts-ignore - Dynamic import that may not be available
        jsPDF = (await eval('import("jspdf")')).default;
      } catch (e: any) {
        if (e?.code === 'MODULE_NOT_FOUND' || e?.message?.includes('Cannot find module')) {
          alert('PDF export feature requires jspdf package. Please install it: npm install jspdf');
        } else {
          console.error('Error loading jspdf:', e);
          alert('Failed to load PDF export library. Please try again.');
        }
        return;
      }

      // Capture the content as canvas
      // Suppress console errors for unsupported CSS color functions during capture
      const originalError = console.error;
      console.error = (...args: any[]) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('unsupported color function')
        ) {
          return; // Ignore lab() color function errors
        }
        originalError.apply(console, args);
      };

      // html2canvas types may be outdated, but these options work at runtime
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      } as any);

      // Restore original console.error
      console.error = originalError;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save('Privacy-Policy.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <div className="h-1 w-20 bg-[#CB9729]"></div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Effective Date:</strong> July 12, 2025</p>
            <p><strong>Last Updated:</strong> October 10, 2025</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors shadow-sm"
        >
          <Download size={18} />
          <span className="text-sm font-medium">Download PDF</span>
        </button>
      </div>

      <div ref={contentRef} className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <p>
            We collect both personal and non-personal information to provide our services effectively. This includes information you submit directly, such as your name, email, age, location, academic performance, athletic stats, and uploaded photos or videos. For underage users, we may collect parent or guardian contact information. Automatically collected data includes your IP address, browser type, operating system, pages visited, and session duration. This helps us improve the platform, protect security, and personalize your experience.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p>
            We use the collected information to create user profiles, facilitate connections between athletes and recruiters, customize user experiences, and send relevant notifications. Your data also helps us analyze usage trends, detect and prevent fraud or misuse, maintain platform security, and comply with legal obligations. We may use anonymized data to improve product design and features.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Who We Share Your Information With</h2>
          <p>
            We share your data with college coaches, recruiters, and authorized users to promote athlete visibility and recruitment. We may also share data with trusted service providers for hosting, analytics, or communication purposes, under strict confidentiality agreements. We do not sell your personal data. Information may be disclosed if required by law, or during business transitions such as mergers or acquisitions.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Children's Privacy</h2>
          <p>
            AthLinked is designed for users aged <strong>14 and older</strong>. Users under 18 must obtain parental or guardian consent before creating an account. We do not knowingly collect data from children under 13. If such data is inadvertently collected, we will promptly delete it upon discovery or notification.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
          <p>
            We apply reasonable safeguards including encryption, secure storage, and restricted access to protect your information. However, no internet transmission is completely secure. Users are responsible for maintaining the confidentiality of their login credentials and monitoring their account activity.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
          <p>
            We use cookies and related technologies to recognize your browser, track session activity, and improve site functionality. You can control cookie behavior through your browser settings. Disabling cookies may affect your experience or prevent access to certain features.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights and Choices</h2>
          <p>
            You may access, update, or delete your account information at any time by logging into your profile or contacting us. You may also withdraw your consent to data processing or request the deletion of your data, subject to applicable legal requirements. Requests can be submitted to <a href="mailto:info@athlinked.com" className="text-[#CB9729] hover:underline">info@athlinked.com</a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Links</h2>
          <p>
            Our website may include links to third-party platforms or tools, such as video hosting services or performance tracking platforms. We are not responsible for the privacy practices or content of those external sites. Please review their privacy policies separately.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Data Retention</h2>
          <p>
            We retain your personal data only as long as your account is active or as needed to fulfill the purposes outlined in this policy. If you request account deletion, we will erase your information, unless retention is required by legal or regulatory obligations.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify users of material updates through email or prominent notices on the website. Please review the policy periodically to stay informed.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
          <p>
            For questions, concerns, or requests regarding this Privacy Policy, please contact us at:
          </p>
          <div className="mt-2 space-y-1">
            <p><strong>Email:</strong> <a href="mailto:info@athlinked.com" className="text-[#CB9729] hover:underline">info@athlinked.com</a></p>
            <p><strong>Website:</strong> <a href="https://www.athlinked.com" target="_blank" rel="noopener noreferrer" className="text-[#CB9729] hover:underline">www.athlinked.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
