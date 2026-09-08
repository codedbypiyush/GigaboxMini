import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';

import {CartScreen} from '../screens/CartScreen';
import {CatalogScreen} from '../screens/CatalogScreen';
import {ProductDetailsScreen} from '../screens/ProductDetailsScreen';
import {TrackingScreen} from '../screens/TrackingScreen';
import {useNetwork} from '../providers/NetworkProvider';
import {colors} from '../theme/colors';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const {isOffline} = useNetwork();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Catalog"
        screenOptions={{
          headerStyle: {backgroundColor: colors.headerBackground},
          headerTintColor: colors.textOnDark,
          headerTitleStyle: {fontWeight: '600'},
          contentStyle: {backgroundColor: colors.background},
          // Offline banner already consumes the top safe area.
          ...(isOffline ? {statusBarTranslucent: false, headerStatusBarHeight: 0} : null),
        }}>
        <Stack.Screen
          name="Catalog"
          component={CatalogScreen}
          options={{title: 'Gigabox Mini'}}
        />
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={{title: 'Product'}}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{title: 'Cart'}}
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{title: 'Order Tracking'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
