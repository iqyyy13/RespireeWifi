import React, {useEffect, useMemo, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {AuthParamList} from './AuthParamList';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import Home from '../wifi/Home';
import WiFi from '../wifi/WiFi';
import WiFi_setup from '../wifi/WiFi_setup';
import {NavigationContainer} from '@react-navigation/native';

const Stack = createStackNavigator<AuthParamList>();

const WiFiStack = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            header: () => null,
            headerShown: false,
            cardStyle: {backgroundColor: '#FAFAFF'},
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="WiFi" component={WiFi} />
          <Stack.Screen name="WiFi_setup" component={WiFi_setup} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default WiFiStack;
