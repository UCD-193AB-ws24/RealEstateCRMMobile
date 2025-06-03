import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';

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
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
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

describe('ProfileScreen', () => {
  it('exists', () => {
    expect(ProfileScreen).toBeDefined();
  });
}); 