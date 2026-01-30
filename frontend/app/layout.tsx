import type { Metadata } from 'next';
import { Geist, Geist_Mono, Manrope } from 'next/font/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';
import AuthProvider from '@/components/Auth/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const manrope = Manrope({ subsets: ['latin'] });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AthLinked - Connect with Athletes',
  description:
    'Sports networking platform for athletes, coaches, and businesses',
  icons: {
    // Use the app logo as the browser tab icon
    icon: [{ url: new URL('./logo.jpg', import.meta.url), type: 'image/jpeg' }],
  },
};

function GoogleOAuthWrapper({ children }: { children: React.ReactNode }) {
  'use client';
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Only render provider if clientId exists
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en">
      <body className={manrope.className}>
        <GoogleOAuthWrapper>{children}</GoogleOAuthWrapper>
      </body>
    </html>
  );
}
