/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
    ]
  },
  allowedDevOrigins: ["127.0.0.1", "be88-34-122-40-36.ngrok-free.app"],
  images: {
    loader: 'custom',
    loaderFile: './lib/tmdb-image-loader.ts',
    deviceSizes: [360, 640, 780, 1080, 1280, 1920],
    imageSizes: [48, 92, 154, 185, 300, 342, 500],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
}

export default nextConfig
