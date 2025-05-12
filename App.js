import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';

import HomeScreen from './screens/HomeScreen';
import DriveScreen from './screens/DriveScreen';
import LeadListScreen from './screens/LeadListScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddPropertyScreen from './screens/AddPropertyScreen';
import LeadDetailsScreen from './screens/LeadDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = createNativeStackNavigator();
const LeadsStack = createNativeStackNavigator();

function LeadsStackScreen() {
  return (
    <LeadsStack.Navigator screenOptions={{ headerShown: true }}>
      <LeadsStack.Screen name="LeadList" component={LeadListScreen} options={{ headerShown: false }} />
      <LeadsStack.Screen name="LeadDetails" component={LeadDetailsScreen} options={{ title: "Lead Details", headerBackTitle: "Back", }} />
    </LeadsStack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AddProperty" component={AddPropertyScreen} />
    </HomeStack.Navigator>
  );
}

// 🧭 Tabs inside a reusable function
function AppTabs() {
  return (
    <Tab.Navigator
    initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Drive') iconName = 'car';
          else if (route.name === 'Leads') iconName = 'list';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'dodgerblue',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Drive" component={DriveScreen} />
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Leads" component={LeadsStackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="AppTabs" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
