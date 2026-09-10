import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript-aware CJS; Next compiles them in-app so
  // types flow through without a separate build step in dev.
  transpilePackages: ['@mims/contracts'],
  // Railway builds run from the repo root.
  outputFileTracingRoot: process.cwd(),
  eslint: { ignoreDuringBuilds: true },
};

export default config;
