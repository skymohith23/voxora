import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmergencyCall from "./pages/EmergencyCall";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);
      setIsLoading(false);
    };
    checkLogin();
  }, []);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={userToken ? "Dashboard" : "Login"}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: "Voxora Dashboard" }} />
        <Stack.Screen name="EmergencyCall" component={EmergencyCall} options={{ title: "Emergency Call" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}