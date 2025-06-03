import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingScreen from '../LoadingScreen';

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

describe('LoadingScreen', () => {
  it('exists', () => {
    expect(LoadingScreen).toBeDefined();
  });
}); 