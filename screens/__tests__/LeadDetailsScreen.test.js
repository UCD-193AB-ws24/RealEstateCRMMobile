import React from 'react';
import { render } from '@testing-library/react-native';
import LeadDetailsScreen from '../LeadDetailsScreen';

// Mock all the hooks and modules
jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({}),
  useNavigation: () => ({}),
  useRoute: () => ({
    params: {
      lead: {
        id: '1',
        name: 'Test Lead',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
      },
    },
  }),
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
  Dimensions: {
    get: () => ({
      width: 375,
      height: 812,
    }),
  },
}));

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
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

describe('LeadDetailsScreen', () => {
  it('exists', () => {
    expect(LeadDetailsScreen).toBeDefined();
  });
}); 