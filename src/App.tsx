import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import BootSplash from 'react-native-bootsplash';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import {RootNavigator} from './navigation/RootNavigator';
import {persistor, store} from './store';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppShell />
      </PersistGate>
    </Provider>
  );
}

function AppShell() {
  useEffect(() => {
    BootSplash.hide({fade: true});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
