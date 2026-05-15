import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separate build config for the embeddable widget
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react(), tailwindcss()],
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            // Default fallback if env not set, though .env.local should take precedence
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1')
        },
        build: {
            outDir: 'dist-widget',
            emptyOutDir: true,
            lib: {
                entry: path.resolve(__dirname, 'src/widget/index.tsx'),
                name: 'Relvo',
                formats: ['iife'], // Immediately Invoked Function Expression for script tag support
                fileName: () => 'relvo.js',
            },
            rollupOptions: {
                // Ensure we bundle everything including React, as the host site won't have it.
                // Usually, external: ['react', 'react-dom'] is for libraries installed via npm.
                // For an embed widget, we MUST bundle React.
                external: [],
            },
            // Minify for production
            minify: 'esbuild',
        },
    };
});
