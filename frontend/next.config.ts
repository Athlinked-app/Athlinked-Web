// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   /* config options here */
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'images.unsplash.com',
//         port: '',
//         pathname: '/**',
//       },
//     ],
//   },
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // AWS S3 bucket domains
      {
        protocol: 'https',
        hostname: 'athlinked-storage-23453.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'athlinked-storage-23453.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
      // Generic S3 pattern for any region
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
