import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // There are package-lock.json files in parent directories (Documents/Live Coding
  // and the user home dir), so Next cannot infer the workspace root on its own and
  // warns about it. Pin the root to this project directory.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // pdf-parse ships native @napi-rs/canvas binaries and a pdfjs worker that must be
  // resolved from node_modules at runtime. Keeping it external stops Turbopack from
  // trying to bundle (and failing on) those files.
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
