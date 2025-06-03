import React from 'react';
import { render } from '@testing-library/react-native';
import LeadListScreen from '../LeadListScreen';

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

jest.mock('expo-location', () => ({}));
jest.mock('expo-secure-store', () => ({}));

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

describe('LeadListScreen', () => {
  it('exists', () => {
    expect(LeadListScreen).toBeDefined();
  });
}); 