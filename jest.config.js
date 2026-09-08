module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|redux-persist|immer|@shopify/flash-list|@react-native-community/netinfo)/)',
  ],
};
