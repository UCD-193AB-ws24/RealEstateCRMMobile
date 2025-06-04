import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import { auth } from '../firebase';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDataContext } from '../DataContext';


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
  const { statsChanged, clearFlags } = useDataContext();

  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };
  


  const fetchStats = async () => {
    try {
      setLoading(true);
      const storedUser = await SecureStore.getItemAsync("user");
      const parsedUser = JSON.parse(storedUser);
      const statsUrl = `${SERVER_URL}/api/stats/${parsedUser.id}`;
      const res = await fetch(statsUrl);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`❌ Fetch failed: ${res.status}\n${text}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
  const loadStats = async () => {
    const storedUser = await SecureStore.getItemAsync("user");
    console.log("🔒 Stored user:", storedUser);

    if (!storedUser) {
      console.warn("⚠️ No user in SecureStore.");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const statsUrl = `${SERVER_URL}/api/stats/${parsedUser.id}`;
    console.log("🌐 Fetching stats from", statsUrl);

    try {
      const res = await fetch(statsUrl);
      console.log("📥 Response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`❌ Failed: ${res.status}\n${text}`);
      }

      const data = await res.json();
      console.log("📊 Stats fetched:", data);
      setStats(data);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
      clearFlags();
    }
  };

  loadStats();
}, []);


  useEffect(() => {
    // ⚠️ TEMPORARY: Clear storage on mount to prevent SQLITE_FULL crash
    AsyncStorage.clear()
      .then(() => console.log("✅ AsyncStorage cleared on HomeScreen"))
      .catch((err) => console.error("❌ Failed to clear AsyncStorage:", err));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (statsChanged) {
        fetchStats();
        clearFlags(); // don't forget to reset the flag!
      }
    }, [statsChanged])
  );
  

  // useFocusEffect(
  //   useCallback(() => {
  //     const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
  //       if (firebaseUser) {
  //         setUser(firebaseUser);
  //       }
  
  //       await fetchStats();
  //     });
  
  //     return unsubscribe;
  //   }, [])
  // );
  
  

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7C3AED"]} // Android spinner color
            tintColor="#7C3AED"  // iOS spinner color
          />
        }
      >
      {user && <Text style={[styles.welcomeText, { color: colors.text }]}>Hello, {user.name || 'User'}</Text>}


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
          onPress={() => navigation.navigate('AddProperty', { from: "home" })}
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
    flexShrink: 1, // prevent overflow
  },
  iconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
