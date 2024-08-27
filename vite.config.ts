import { defineConfig } from 'vite'
import dotenv from 'dotenv';
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const { NODE_ENV } = process.env;

dotenv.config({ path: `.env.${NODE_ENV}` });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: process.env.VITE_PORT || 3000,
  },
  plugins: [react(), tsconfigPaths()],
})
