import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '@react-navigation/native';
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform
} from 'react-native';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { colors } = useTheme();

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace('Loading');
    } catch (error) {
      console.log('SIGNUP ERROR:', error);
      Alert.alert('Signup Failed', error.message);
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
          {/* 🔷 Logo */}
          <Image
            source={require('../assets/est8_notextbg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
  
          <Text style={[styles.title, { color: '#7C3AED' }]}>Sign Up</Text>
  
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
  
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
  
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: '#7C3AED' }]}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    height: 48,
    width: '100%',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  signUpButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
