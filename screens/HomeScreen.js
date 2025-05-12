import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import { auth } from '../firebase';
import { useTheme } from '@react-navigation/native';

const SERVER_URL = "http://34.31.159.135:5002";

const StatCard = ({ label, value, iconName, bgColor, iconColor, textColor }) => (
  <View style={[styles.statCard, { backgroundColor: textColor.card }]}> 
    <View style={styles.cardHeader}>
      <Text style={[styles.cardLabel, { color: textColor.text }]}>{label}</Text>
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}> 
        <Ionicons name={iconName} size={14} color={iconColor} />
      </View>
    </View>
    <View style={[styles.divider, { backgroundColor: textColor.divider }]} />
    <Text style={[styles.cardValue, { color: textColor.text }]}>{value}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const parsedUser = JSON.parse(storedUser);
        const statsUrl = `${SERVER_URL}/api/stats/${parsedUser.id}`;

        const res = await fetch(statsUrl);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}> 
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ color: colors.text, fontSize: 16, marginTop: 10 }}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && <Text style={[styles.welcomeText, { color: colors.text }]}>Hello, {user.displayName || 'User'}</Text>}

        {stats && (
          <View style={styles.grid}>
            <StatCard label="Total Leads" value={stats.totalLeads} iconName="target-outline" bgColor="#EDE9FE" iconColor="#7C3AED" textColor={colors} />
            <StatCard label="Deals Closed" value={stats.dealsClosed} iconName="hand-left-outline" bgColor="#E0E7FF" iconColor="#4F46E5" textColor={colors} />
            <StatCard label="Properties Contacted" value={stats.propertiesContacted} iconName="call-outline" bgColor="#E0F2FE" iconColor="#0284C7" textColor={colors} />
            <StatCard label="Offers Made" value={stats.offersMade} iconName="business-outline" bgColor="#FEF3C7" iconColor="#D97706" textColor={colors} />
            <StatCard label="Active Listings" value={stats.activeListings} iconName="home-outline" bgColor="#D1FAE5" iconColor="#059669" textColor={colors} />
            <StatCard label="% Deals Closed" value={stats.percentageDealsClosed} iconName="stats-chart-outline" bgColor="#FFE4E6" iconColor="#E11D48" textColor={colors} />
          </View>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    marginTop: 32,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
});
