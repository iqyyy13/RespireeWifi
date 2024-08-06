/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';

import {QueryClient, QueryClientProvider} from 'react-query';
import WiFiStack from './src/containers/patient/routes/Routes';
import FlashMessage from 'react-native-flash-message';
import {NetworkProvider} from 'react-native-offline';

import {Provider} from 'react-redux';
import {checkAndroidPostNotificationPermissions} from './src/defaults/utils';
import {NavigationContainer} from '@react-navigation/native';
declare const global: {HermesInternal: null | {}};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  //useEffect(() => {
  //  checkAndroidPostNotificationPermissions();
  //}, []);

  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <WiFiStack />
      </QueryClientProvider>
    </NetworkProvider>
  );
};

export default App;
