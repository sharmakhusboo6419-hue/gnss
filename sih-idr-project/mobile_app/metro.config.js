const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Add static binary asset extensions
config.resolver.assetExts.push('onnx', 'wasm');

// 2. Redirect onnxruntime-web imports to the web-safe build to prevent dynamic import syntax errors
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'onnxruntime-web': path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.min.js'),
};

module.exports = config;
