/** @type {import('next').NextConfig} */
const nextConfig = {
    // We'll only use these settings when we're ready to deploy
    ...(process.env.NODE_ENV === 'production' ? {
      output: 'export',
      basePath: '/weekly-message-generator',
      assetPrefix: '/weekly-message-generator',
    } : {}),
    images: {
      unoptimized: true,
    },
  };
  
  export default nextConfig;