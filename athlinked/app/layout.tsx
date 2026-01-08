// 'use client';

// import type { Metadata } from 'next';
// import { Geist, Geist_Mono, Manrope } from 'next/font/google';
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import './globals.css';
// import { useEffect } from 'react';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const manrope = Manrope({ subsets: ['latin'] });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

// // Move metadata outside since we're using 'use client'
// // export const metadata: Metadata = {
// //   title: 'AthLinked - Connect with Athletes',
// //   description: 'Sports networking platform for athletes, coaches, and businesses',
// // };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

//   useEffect(() => {
//     console.log('=== LAYOUT DEBUG ===');
//     console.log('Client ID from env:', clientId);
//     console.log('Client ID exists:', !!clientId);
//     console.log('Client ID length:', clientId?.length);
//     console.log('First 30 chars:', clientId?.substring(0, 30));
//     console.log('Is empty string:', clientId === '');
//   }, [clientId]);

//   return (
//     <html lang="en">
//       <head>
//         <title>AthLinked - Connect with Athletes</title>
//         <meta name="description" content="Sports networking platform for athletes, coaches, and businesses" />
//       </head>
//       <body className={manrope.className}>
//         {clientId ? (
//           <GoogleOAuthProvider clientId={clientId}>
//             {children}
//           </GoogleOAuthProvider>
//         ) : (
//           <div style={{ padding: '20px', color: 'red' }}>
//             <h1>Error: Google Client ID not found!</h1>
//             <p>Please check your .env.local file</p>
//           </div>
//         )}
//       </body>
//     </html>
//   );
// }

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
