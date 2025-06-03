import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, StyleSheet, TouchableOpacity, Image, Alert, Linking, ScrollView
} from 'react-native';
import { auth } from '../firebase';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useThemeContext } from '../ThemeContext';
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


const WEB_URL = 'https://real-estate-crm-web-bice.vercel.app/';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync("user");
      if (stored) setUserData(JSON.parse(stored));
    })();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    await SecureStore.deleteItemAsync("user");
    navigation.replace('Login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently remove your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await auth.currentUser.delete();
              await SecureStore.deleteItemAsync("user");
              navigation.replace("Login");
            } catch (err) {
              Alert.alert("Error", "You may need to reauthenticate before deleting.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
    {userData?.picture ? (
        <Image source={{ uri: userData.picture }} style={styles.avatar} />
        ) : (
        <View style={styles.iconAvatar}>
            <Ionicons name="person" size={50} color="white" />
        </View>
        )}
      <Text style={[styles.name, { color: colors.text }]}>{userData?.name || 'Anonymous'}</Text>
      <Text style={[styles.email, { color: colors.text + '99' }]}>{userData?.email}</Text>

      {/* 🔷 App Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.aboutText, { color: colors.text + '99' }]}>
          Welcome to est8 – your mobile companion for managing property leads on the go. You can also access and manage your data through the web version.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(WEB_URL)}>
          <Text style={[styles.link, { color: '#7C3AED' }]}>Open Web Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* 🔧 Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: '#7C3AED' }}
            thumbColor={isDark ? '#fff' : '#eee'}
          />
        </View>
      </View>

      {/* 🔓 Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </View>

      <Image
            source={require('../assets/est8_notextbg.png')}
            style={styles.logo}
            resizeMode="contain"
          />

    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  iconAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 2 },
  email: { fontSize: 15, marginBottom: 20 },
  section: {
    width: '100%',
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: { fontSize: 16 },
  link: { fontSize: 16, fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteText: {
    marginTop: 16,
    color: 'red',
    textAlign: 'center',
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
});
