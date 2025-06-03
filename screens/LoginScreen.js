import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as SecureStore from "expo-secure-store";
import { auth } from '../firebase';
import { SERVER_URL } from '@env';
import { useTheme } from '@react-navigation/native';


const API_URL = `${SERVER_URL}/api/users`;
console.log(API_URL);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { colors } = useTheme();


  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
  
      if (!firebaseUser || !firebaseUser.email) {
        Alert.alert("Login Failed", "Invalid Firebase user.");
        return;
      }
  
      const payload = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.email.split("@")[0], // Default fallback
        picture: null, // You can extend this if needed
      };
  
      // 🔁 Send to backend: create or update
      const res = await fetch(`${SERVER_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Backend error: ${errorText}`);
      }
  
      const savedUser = await res.json();
  
      // 💾 Save user data locally
      await SecureStore.setItemAsync("user", JSON.stringify({
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        picture: savedUser.picture,
      }));
  
      // 🔀 Navigate to app
      navigation.replace("AppTabs");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message);
    }
  };
  
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../assets/est8_notextbg.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.title, { color: '#7C3AED' }]}>Login</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.text + '99'}
            style={[styles.input, {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.text + '99'}
            style={[styles.input, {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.link, { color: '#7C3AED' }]}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    height: 48,
    width: '100%',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});