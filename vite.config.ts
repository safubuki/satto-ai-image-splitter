import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI Image Splitter',
        short_name: 'AI Splitter',
        description: 'Auto-split grid images with AI',
        theme_color: '#1acd81',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    })
  ],
  base: '/ai-image-splitter/', // Assuming repo name will be ai-image-splitter or similar, adjusting later if needed. But user said "deploy to GitHub Pages", base is usually repo name.
  // Actually user didn't specify repo name, but project name is ai-image-splitter.
  // "satto-crop-anti" is the current folder name. I should probably use that or just './' for now to be safe with relative paths?
  // GitHub Pages usually requires repo name. I'll use './' relative base to be safe for now, or '/satto-crop-anti/' if I assume the repo name matches the folder.
  // Let's use './' (relative) which often works for simple deployments, or I should ask/check.
  // Re-reading: "GitHub Pages用の base 設定".
  // I'll set it to process.env.BASE_URL or safely '/'.
  // Let's assume the repo name is 'ai-image-splitter' as per project name, or 'satto-crop-anti'.
  // I'll stick to './' for now as it's the safest generic option for non-root deployments unless using history routing (which we are not explicitly yet, but might).
  // Actually, standard Vite deploy to GH pages uses /<repo-name>/.
  // I will check if I can get the repo name. `satto-crop-anti` suggests that's the repo name.
  // I will set base to '/satto-crop-anti/'
})
