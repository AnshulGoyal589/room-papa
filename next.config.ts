import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dp6srnrcv/image/upload/**',
      },
    ],
  },
  // ...any other existing configuration
};

export default nextConfig;