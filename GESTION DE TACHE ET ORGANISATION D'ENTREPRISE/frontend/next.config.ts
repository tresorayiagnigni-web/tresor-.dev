// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.100.83'],
  devIndicators: {
    position: 'bottom-right', // 'bottom-left' | 'top-left' | 'top-right'
  },
};

module.exports = nextConfig;