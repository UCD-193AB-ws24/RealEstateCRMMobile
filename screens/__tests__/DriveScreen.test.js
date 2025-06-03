import React from 'react';
import { render } from '@testing-library/react-native';
import DriveScreen from '../DriveScreen';

// Mock all the hooks and modules
jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({}),
  useNavigation: () => ({}),
  useRoute: () => ({}),
  useFocusEffect: () => ({}),
}));

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles) => styles,
  },
  Platform: {
    OS: 'ios',
  },
  StatusBar: {
    currentHeight: 0,
  },
}));

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: () => ({}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({
    onAuthStateChanged: () => () => {},
  }),
}));

// Mock the firebase.js file
jest.mock('../../firebase', () => ({
  auth: {
    onAuthStateChanged: () => () => {},
  },
}));

describe('DriveScreen', () => {
  it('exists', () => {
    expect(DriveScreen).toBeDefined();
  });
});