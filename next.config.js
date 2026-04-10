/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'formidable']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pdf-parse from trying to load test files
      config.externals = [...(config.externals || []), 'canvas', 'jsdom']
    }
    return config
  }
}

module.exports = nextConfig
