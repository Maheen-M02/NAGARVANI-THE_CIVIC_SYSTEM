import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import Toast from './src/components/Toast';
import { useApp } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import FileComplaintScreen from './src/screens/FileComplaintScreen';
import TrackComplaintScreen from './src/screens/TrackComplaintScreen';
import ComplaintSuccessScreen from './src/screens/ComplaintSuccessScreen';
import ComplaintDetailsScreen from './src/screens/ComplaintDetailsScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const { notif } = useApp();

  return (
    <>
      <StatusBar style="light" backgroundColor="#1E2845" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="FileComplaint" component={FileComplaintScreen} />
          <Stack.Screen name="TrackComplaint" component={TrackComplaintScreen} />
          <Stack.Screen name="ComplaintSuccess" component={ComplaintSuccessScreen} />
          <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      
      {notif && (
        <Toast
          message={notif.msg}
          type={notif.type}
          visible={!!notif}
        />
      )}
    </>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;