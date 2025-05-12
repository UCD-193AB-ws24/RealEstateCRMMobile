import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import * as SecureStore from "expo-secure-store";
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import DropDownPicker from 'react-native-dropdown-picker';
import { signInWithGoogleAsync } from '../googleAuth';
import { useTheme } from '@react-navigation/native';

const SERVER_URL = 'http://34.31.159.135:5002';

export default function LeadListScreen() {
  const { colors } = useTheme();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [cities, setCities] = useState([]);
  const [statuses, setStatuses] = useState(['Lead', 'Contact', 'Offer', 'Sale']);
  const [cityOpen, setCityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) return;

      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const parsedUser = JSON.parse(storedUser);
        const url = `${SERVER_URL}/api/leads/${parsedUser.id}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch leads');

        const data = await response.json();
        setLeads(data);
        setFilteredLeads(data);
        setCities([...new Set(data.map(l => l.city).filter(Boolean))]);
      } catch (err) {
        console.error('❌ Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = leads.filter(lead =>
      (!selectedCity || lead.city === selectedCity) &&
      (!selectedStatus || lead.status === selectedStatus) &&
      (lead.address?.toLowerCase().includes(lowerQuery) || lead.name?.toLowerCase().includes(lowerQuery))
    );
    setFilteredLeads(filtered);
  }, [searchQuery, selectedCity, selectedStatus, leads]);

  const handleExportPress = async () => {
    let token = await SecureStore.getItemAsync("accessToken");
  
    if (!token) {
        console.log("token not found");
      try {
        token = await signInWithGoogleAsync(); // triggers Google login
        console.log(token);
      } catch (err) {
        Alert.alert("Login failed", "Could not get access token");
        return;
      }
    }
  
    // now you have the access token, continue export
    exportLeads(token);
  };

  const exportLeads = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) return Alert.alert("No token", "Please login again.");

    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: { title: "Leads Export" } })
      });
      const sheet = await response.json();

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [
            ['Name', 'Address', 'City', 'State', 'Zip', 'Owner', 'Status'],
            ...filteredLeads.map(l => [
              l.name || '',
              l.address,
              l.city,
              l.state,
              l.zip,
              l.owner || '',
              l.status,
            ])
          ]
        })
      });

      Alert.alert("Exported", "Leads exported to Google Sheets.");
    } catch (e) {
      console.error("Export failed", e);
      Alert.alert("Export failed", "Something went wrong.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
    style={[styles.card, { backgroundColor: colors.card }]}
    onPress={() => navigation.navigate("LeadDetails", { lead: item })}
    >
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.cardContent}>
      <Text style={[styles.address, { color: colors.text }]}>{item.city}</Text>
        <Text style={[styles.meta, { color: colors.text }]}>{`Owner: ${item.owner}`}</Text>
        <Text style={[styles.meta, { color: colors.text }]}>{`Status: ${item.status}`}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text>Loading leads...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        {/* Filters Section */}
        <View style={[styles.headerWrapper, { backgroundColor: colors.background }, { zIndex: cityOpen || statusOpen ? 9999 : 1 }]}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search leads..."
              placeholderTextColor={colors.text}
              style={[styles.searchInput, {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.exportButton} onPress={handleExportPress}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
  
          <View style={styles.filters}>
            <View style={{ flex: 1, marginRight: 5 }}>
            <DropDownPicker
                open={cityOpen}
                value={selectedCity}
                items={[{ label: 'All Cities', value: null }, ...cities.map(c => ({ label: c, value: c }))]}
                setOpen={setCityOpen}
                setValue={setSelectedCity}
                setItems={() => {}}
                placeholder="Filter by City"
                style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                textStyle={{ color: colors.text }}
                dropDownContainerStyle={{ backgroundColor: colors.card, borderColor: colors.border }}
                placeholderStyle={{ color: colors.text }}
                />
            </View>
  
            <View style={{ flex: 1, marginLeft: 5 }}>
            <DropDownPicker
                open={statusOpen}
                value={selectedStatus}
                items={[{ label: 'All Statuses', value: null }, ...statuses.map(s => ({ label: s, value: s }))]}
                setOpen={setStatusOpen}
                setValue={setSelectedStatus}
                setItems={() => {}}
                placeholder="Filter by Status"
                style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                textStyle={{ color: colors.text }}
                dropDownContainerStyle={{ backgroundColor: colors.card, borderColor: colors.border }}
                placeholderStyle={{ color: colors.text }}
                />
            </View>
          </View>
        </View>
  
        {/* List Section */}
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
  
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  headerWrapper: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    zIndex: 9999,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    elevation: 5,
    zIndex: 9999,
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 12,
  },
  address: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: '#4B5563',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
  },
  exportButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    zIndex: 2000,
  },
  dropdown: {
    flex: 1,
    zIndex: 2000,
  },
});
