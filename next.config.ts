
import type {NextConfig} from 'next';
// @ts-ignore next-pwa is not typed with ES Modules yet
import withPWAInit from 'next-pwa';

const isDevelopment = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDevelopment, // Disable PWA in development for faster HMR
  // buildExcludes: [/middleware-manifest\.json$/], // Example for potential build issues
});

const nextConfig: NextConfig = {
  output: 'standalone', // Essential for optimized Docker builds
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

export default withPWA(nextConfig);
