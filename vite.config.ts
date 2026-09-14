import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' so the build works under any GitHub Pages sub-path.
export default defineConfig({ base: './', plugins: [svelte()] });
