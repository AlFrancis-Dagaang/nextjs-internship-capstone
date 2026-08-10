/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 30, // seconds — restores Next 14-era client router cache for dynamic page segments
    },
  },
}

export default nextConfig