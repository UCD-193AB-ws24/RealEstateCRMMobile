// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'firebase/auth/react-native': require.resolve('firebase/auth'), // 👈 force web version
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
