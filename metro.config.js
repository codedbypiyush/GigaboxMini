const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Redux 5 / RTK ship package "exports" + .cjs/.mjs entrypoints.
    // Enable exports so Metro prefers redux.mjs instead of the broken .cjs main path.
    unstable_enablePackageExports: true,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],
    resolverMainFields: ['react-native', 'browser', 'module', 'main'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
