import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Your existing pattern for Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dp6srnrcv/image/upload/**',
      },
      // --- ADD THIS NEW PATTERN FOR CLERK ---
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        // You can leave port and pathname empty if you want to allow all paths
        // or be more specific if needed. For Clerk, allowing all is fine.
      },
    ],
  },
  // ...any other existing configuration
};

export default nextConfig;