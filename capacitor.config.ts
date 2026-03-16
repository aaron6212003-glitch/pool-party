import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poolparty.app', // You can change this bundle ID if needed
  appName: 'Pool Party',
  webDir: 'out', // Default for Next.js exports
  server: {
    // For the initial App Store wrapper, we point directly to the Vercel app.
    // This allows Server Actions and API routes to work without a full server rewrite.
    url: 'https://percoco-pool.vercel.app',
    cleartext: true
  }
};

export default config;
