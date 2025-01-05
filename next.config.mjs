/** @type {import('next').NextConfig} */
const nextConfig = {
    // We'll only use these settings when we're ready to deploy
    ...(process.env.NODE_ENV === 'production' ? {
      output: 'export',
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
      assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
    } : {}),
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  };
  
  export default nextConfig;