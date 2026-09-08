/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      }),
    ),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@shopify/flash-list', () => {
  const ReactLocal = require('react');
  const {FlatList} = require('react-native');
  return {
    FlashList: (props: object) =>
      ReactLocal.createElement(FlatList, props),
  };
});

jest.mock('react-native-reanimated', () => {
  const ReactLocal = require('react');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (Component: React.ComponentType) => Component,
      View: ReactLocal.Fragment,
    },
    useSharedValue: (value: number) => ({value}),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    withSequence: (...values: number[]) => values[0],
  };
});

jest.mock('react-native-gesture-handler', () => {
  const ReactLocal = require('react');
  const {View} = require('react-native');
  return {
    GestureHandlerRootView: ({children}: {children: React.ReactNode}) =>
      ReactLocal.createElement(View, {style: {flex: 1}}, children),
  };
});

jest.mock('react-native-reanimated-carousel', () => {
  const ReactLocal = require('react');
  const {View} = require('react-native');
  const Stub = () => ReactLocal.createElement(View);
  return {
    __esModule: true,
    Carousel: Stub,
    default: Stub,
  };
});

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
