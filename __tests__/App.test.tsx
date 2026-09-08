/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();

  return {
    createMMKV: () => ({
      set: (key: string, value: string | number | boolean) => {
        store.set(key, String(value));
      },
      getString: (key: string) => store.get(key),
      remove: (key: string) => {
        store.delete(key);
      },
    }),
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const ReactLocal = require('react');
  return {
    NavigationContainer: ({children}: {children: React.ReactNode}) =>
      ReactLocal.createElement(ReactLocal.Fragment, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactLocal = require('react');
  const Screen = ({children}: {children?: React.ReactNode}) =>
    children ?? null;
  const Navigator = ({children}: {children: React.ReactNode}) =>
    ReactLocal.createElement(ReactLocal.Fragment, null, children);

  return {
    createNativeStackNavigator: () => ({
      Navigator,
      Screen,
    }),
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
