const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Packages that use native APIs or import.meta and break on web
const nativeOnlyPackages = [
  '@sentry/react-native',
  'expo-screen-capture',
  'expo-haptics',
  'expo-local-authentication',
  'expo-secure-store',
  'react-native-mmkv',
  'expo-file-system/legacy',
];

// On web, resolve native-only packages to an empty module
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && nativeOnlyPackages.some((pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/'))) {
    return {
      filePath: require.resolve('./src/lib/__web-empty-module.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
