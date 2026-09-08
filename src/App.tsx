import React, {useEffect} from 'react';
import {StatusBar, View, StyleSheet} from 'react-native';
import BootSplash from 'react-native-bootsplash';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import {OfflineBanner} from './components/OfflineBanner';
import {RootNavigator} from './navigation/RootNavigator';
import {NetworkProvider} from './providers/NetworkProvider';
import {persistor, store} from './store';
import {colors} from './theme/colors';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NetworkProvider>
          <AppShell />
        </NetworkProvider>
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
      <View style={styles.root}>
        <OfflineBanner />
        <View style={styles.navigator}>
          <RootNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navigator: {
    flex: 1,
  },
});

export default App;
