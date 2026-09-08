const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const workletsPluginPath = path.resolve(
  __dirname,
  'node_modules/react-native-worklets/plugin/index.js',
);

const config = {
  resolver: {
    // Redux 5 / RTK ship package "exports" + .cjs/.mjs entrypoints.
    // Enable exports so Metro prefers redux.mjs instead of the broken .cjs main path.
    unstable_enablePackageExports: true,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],
    resolverMainFields: ['react-native', 'browser', 'module', 'main'],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-worklets/plugin') {
        return {
          type: 'sourceFile',
          filePath: workletsPluginPath,
        };
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
