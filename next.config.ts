import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default nextConfig;