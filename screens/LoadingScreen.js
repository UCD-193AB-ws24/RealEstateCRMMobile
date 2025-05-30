import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

export default function LoadingScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await SecureStore.getItemAsync("user");
        if (user) {
          navigation.replace("AppTabs");
        } else {
          navigation.replace("Login");
        }
      } catch (e) {
        console.error("Error checking auth:", e);
        navigation.replace("Login");
      }
    };

    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
