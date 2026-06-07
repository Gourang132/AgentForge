/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['groq-sdk'] },
  images: { domains: ['images.unsplash.com'] }
}
module.exports = nextConfig
