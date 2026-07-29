module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json,woff,woff2}'
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^http:\/\/localhost:8000\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60
        }
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    }
  ]
};
