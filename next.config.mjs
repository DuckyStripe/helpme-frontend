/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/L/:path*',
        destination: '/l/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
