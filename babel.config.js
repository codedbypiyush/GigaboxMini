module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4's plugin simply re-exports worklets. Resolve worklets
  // directly so Metro transform workers never hit a broken nested require.
  plugins: [require.resolve('react-native-worklets/plugin')],
};
