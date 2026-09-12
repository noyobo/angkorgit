import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get git commit hash at build time
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

const isDev = process.env.NODE_ENV !== 'production';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  // CI e2e: a mid-run rebuild with HMR/liveReload off leaves a blank page
  // ("Waiting for process restart…"). Compile once and serve that.
  watch: isDev && !isCi,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@angkorgit/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@angkorgit/design-system': path.resolve(__dirname, '../../packages/design-system/src/index.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['tailwindcss', 'autoprefixer'],
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev && !isCi,
                  },
                },
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    isDev && !isCi && new ReactRefreshRspackPlugin(),
    new rspack.DefinePlugin({
      __GIT_HASH__: JSON.stringify(getGitHash()),
      'process.env.VITE_DEV': JSON.stringify(isDev ? 'true' : 'false'),
      'process.env.TAURI_ENV_PLATFORM': JSON.stringify(process.env.TAURI_ENV_PLATFORM || ''),
      'process.env.TAURI_ENV_ARCH': JSON.stringify(process.env.TAURI_ENV_ARCH || ''),
      'process.env.TAURI_ENV_FAMILY': JSON.stringify(process.env.TAURI_ENV_FAMILY || ''),
      'process.env.TAURI_ENV_DEBUG': JSON.stringify(process.env.TAURI_ENV_DEBUG || ''),
    }),
  ].filter(Boolean),
  devServer: {
    port: 1420,
    hot: isDev && !isCi,
    liveReload: isDev && !isCi,
    historyApiFallback: true,
    client: {
      overlay: isCi ? false : { errors: true, warnings: false },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
  target: 'web',
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'cheap-module-source-map' : false,
});
