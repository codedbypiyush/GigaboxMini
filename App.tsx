import React, {useEffect} from 'react';
import {StatusBar, View, StyleSheet} from 'react-native';
import BootSplash from 'react-native-bootsplash';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import {OfflineBanner} from './src/components/OfflineBanner';
import {RootNavigator} from './src/navigation/RootNavigator';
import {NetworkProvider} from './src/providers/NetworkProvider';
import {persistor, store} from './src/store';
import {colors} from './src/theme/colors';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NetworkProvider>
            <AppShell />
          </NetworkProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
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
