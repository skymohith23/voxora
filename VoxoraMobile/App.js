import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens - Ensure these paths match your folders!
import RegisterScreen from './src/pages/Register'; 
import LoginScreen from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import EmergencyCall from './src/pages/EmergencyCall';
import Profile from './src/pages/Profile';
import EmergencyText from './src/pages/EmergencyText';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      setIsLoading(false);
    };
    checkLogin();
  }, []);

  if (isLoading) return null;

  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName={userToken ? "Dashboard" : "Login"}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Dashboard' }} />
        <Stack.Screen 
          name="EmergencyCall" 
          component={EmergencyCall} 
          options={{ title: 'Emergency Call', unmountOnBlur: true }} 
         />
          <Stack.Screen 
           name="EmergencyText" 
          component={EmergencyText} 
          options={{ title: 'Emergency Message', unmountOnBlur: true }} 
          />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}