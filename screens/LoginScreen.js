import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as SecureStore from "expo-secure-store";
import { auth } from '../firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      // await SecureStore.setItemAsync("user", JSON.stringify({
      //   email: firebaseUser.email,
      //   id: firebaseUser.uid, // or user.id, depending on your structure
      // }));
  
      const payload = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.email.split("@")[0], // Fallback if no name
        picture: null,
      };
  
      // ✅ Sync with your backend
      const res = await fetch("http://34.31.159.135:5002/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const savedUser = await res.json();
  
      // Save everything including name and picture
      await SecureStore.setItemAsync("user", JSON.stringify({
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        picture: savedUser.picture,
      }));

      console.log(savedUser.name);
      console.log(savedUser.picture);
      console.log(savedUser.email);
      console.log(savedUser.id);
  
      navigation.replace("AppTabs");
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    color: 'blue',
    textAlign: 'center',
  },
});
