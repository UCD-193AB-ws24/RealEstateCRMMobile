import React from 'react';
import { View, Button, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useGoogleAuth } from '../googleAuth';
import * as SecureStore from "expo-secure-store";
import { SERVER_URL } from '@env';
import { useTheme } from '@react-navigation/native';

const API_URL = `${SERVER_URL}/api/users`;

export default function LoginScreen({ navigation }) {
  const { accessToken, promptAsync, isRequestReady } = useGoogleAuth();
  const { colors } = useTheme();
  
  const handleGoogleLogin = async () => {
    const result = await promptAsync();
  
    if (result.type !== "success") {
      return Alert.alert("Login canceled");
    }
  
    try {
      // Get user info from SecureStore
      const userJson = await SecureStore.getItemAsync("user");
  
      if (!userJson) {
        return Alert.alert("Missing user info", "User data was not stored.");
      }
  
      const user = JSON.parse(userJson);
      console.log("✅ Loaded user from storage", user);
  
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      };
  
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const savedUser = await res.json();
  
      await SecureStore.setItemAsync("user", JSON.stringify(savedUser));
  
      navigation.replace("AppTabs");
  
    } catch (err) {
      console.error("❌ Failed to load user info or save to backend", err);
      Alert.alert("Login Failed", err.message);
    }
  };
  
  
  
  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Login with Google</Text>
      <Button title="Sign in with Google" onPress={handleGoogleLogin} disabled={!isRequestReady} />
      {/* <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={[styles.link, { color: colors.primary }]}>Don't have an account? Sign up</Text>
      </TouchableOpacity> */}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
  },
});
