import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { auth } from '../firebase';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const [userData, setUserData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync("user");
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    })();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    await SecureStore.deleteItemAsync("user");
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {userData?.picture ? (
        <Image source={{ uri: userData.picture }} style={styles.avatar} />
        ) : (
        <View style={styles.iconAvatar}>
            <Ionicons name="person" size={50} color="white" />
        </View>
        )}
      <Text style={[styles.label, { color: colors.text }]}>{userData?.name || 'Anonymous'}</Text>
      <Text style={styles.email}>{userData?.email}</Text>

      <View style={styles.switchRow}>
      <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
        <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: '#7C3AED' }}
            thumbColor={isDark ? '#fff' : '#eee'}
            />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 16, color: '#666', marginBottom: 20 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  label: { fontSize: 18 },
  logoutButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  iconAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  }
});
