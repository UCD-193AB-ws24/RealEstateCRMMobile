// Mock TurboModuleRegistry before any React Native imports
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(() => ({
    getConstants: jest.fn(() => ({})),
  })),
  getEnforcing: jest.fn(() => ({
    addItem: jest.fn(),
    reload: jest.fn(),
  })),
}));

// Mock NativeDeviceInfo
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  getConstants: jest.fn(() => ({
    Dimensions: {
      window: {
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1,
      },
      screen: {
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1,
      },
    },
    isIPhoneX_deprecated: false,
  })),
}));

// Mock react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock StyleSheet
  RN.StyleSheet = {
    create: jest.fn(styles => styles),
    compose: jest.fn((style1, style2) => ({ ...style1, ...style2 })),
    flatten: jest.fn(style => style),
    hairlineWidth: 1,
    absoluteFill: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  };

  // Mock Platform
  RN.Platform = {
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
    Version: 1,
  };

  // Mock Dimensions
  RN.Dimensions = {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  // Mock StatusBar
  RN.StatusBar = {
    currentHeight: 44,
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
  };

  // Mock NativeModules
  RN.NativeModules = {
    StatusBarManager: {
      getHeight: jest.fn(() => 44),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      getConstants: jest.fn(() => ({
        HEIGHT: 44,
        DEFAULT_BACKGROUND_COLOR: '#000000',
      })),
    },
    PlatformConstants: {
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      osVersion: '1.0',
      systemName: 'ios',
      getConstants: jest.fn(() => ({
        forceTouchAvailable: false,
        interfaceIdiom: 'phone',
        osVersion: '1.0',
        systemName: 'ios',
      })),
    },
    DeviceInfo: {
      getConstants: jest.fn(() => ({
        Dimensions: {
          window: {
            width: 375,
            height: 812,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 375,
            height: 812,
            scale: 2,
            fontScale: 1,
          },
        },
        isIPhoneX_deprecated: false,
      })),
    },
  };

  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  dismissBrowser: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'https://auth.expo.io/@your-username/your-app-slug'),
  useAuthRequest: jest.fn(() => [
    { type: 'success', params: { access_token: 'mock-token' } },
    jest.fn(),
    jest.fn(),
  ]),
  ResponseType: {
    Code: 'code',
    Token: 'token',
  },
  Prompt: {
    Login: 'login',
    SelectAccount: 'select_account',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(JSON.stringify({ id: 'test-user-id' }))),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  })),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
  };
});

// Mock react-native-dropdown-picker
jest.mock('react-native-dropdown-picker', () => {
  const { View } = require('react-native');
  return View;
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
    useTheme: () => ({
      colors: {
        background: '#fff',
        text: '#000',
        card: '#fff',
        border: '#ccc',
      },
    }),
    useFocusEffect: jest.fn((callback) => callback()),
  };
});

// Mock Firebase
const mockAuth = {
  onAuthStateChanged: jest.fn((callback) => {
    callback({ uid: 'test-user-id' });
    return jest.fn();
  }),
};

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'test-app',
    options: {},
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  initializeAuth: jest.fn(() => mockAuth),
  getReactNativePersistence: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-user-id' });
    return jest.fn();
  }),
}));

// Mock environment variables
jest.mock('@env', () => ({
  SERVER_URL: 'http://localhost:3000',
  GEOCODING_API_KEY: 'test-key',
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
  FIREBASE_PROJECT_ID: 'test-project-id',
  FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
  FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
  FIREBASE_APP_ID: 'test-app-id',
  CLIENT_ID: 'test-client-id',
  REDIRECT_URI: 'https://auth.expo.io/@your-username/your-app-slug',
})); 