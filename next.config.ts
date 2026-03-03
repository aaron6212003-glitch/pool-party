import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'top-right',
  },
  // Force browsers (especially iOS Safari PWA mode) to always fetch fresh HTML
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
