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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  console.log('abc', clientId);

  return (
    <html lang="en">
      <body className={manrope.className}>
        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            {children}
          </GoogleOAuthProvider>
        ) : (
          // Render children without Google provider when client id is not configured
          children
        )}
      </body>
    </html>
  );
}
