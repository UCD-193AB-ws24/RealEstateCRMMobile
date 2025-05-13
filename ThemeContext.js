// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Prevents theme flicker on startup

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme');
        if (saved === 'dark') setIsDark(true);
      } catch (err) {
        console.warn('Could not load theme from storage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const theme = isDark ? DarkTheme : DefaultTheme;

  // Prevent rendering the app before theme loads
  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
