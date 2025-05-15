import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};


// Note: To fully enable PWA, you'd typically wrap with a PWA plugin like `next-pwa`
// For example:
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development' // Disable PWA in dev mode
// });
// module.exports = withPWA(nextConfig);
// This requires `npm install next-pwa`
// For now, manifest.json and basic setup is provided. Full PWA requires service worker.

export default nextConfig;
