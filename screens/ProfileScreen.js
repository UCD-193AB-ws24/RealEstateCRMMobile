import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    await auth.signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Button title="Logout" onPress={handleLogout} color="crimson" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
