const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig;

// Cloudflare開発環境の初期化
(async () => {
    try {
        const { initOpenNextCloudflareForDev} = await import("@opennextjs/cloudflare");
        initOpenNextCloudflareForDev();
    } catch (error) {
        console.error(error);
    }
})();
