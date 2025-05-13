import React, { useEffect, useState, useRef } from 'react';
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
  Switch,
} from 'react-native';
import * as SecureStore from "expo-secure-store";
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { auth } from '../firebase';
import DropDownPicker from 'react-native-dropdown-picker';
import { signInWithGoogleAsync } from '../googleAuth';
import { useTheme } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Dimensions } from 'react-native';
import { GEOCODING_API_KEY } from '@env';
import { SERVER_URL } from '@env';


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
  const [isMapView, setIsMapView] = useState(false);
    const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
    });

  const route = useRoute();
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn("Permission denied for location");
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const storedUser = await SecureStore.getItemAsync("user");
      const parsedUser = JSON.parse(storedUser);
      const url = `${SERVER_URL}/api/leads/${parsedUser.id}`;
  
      const response = await fetch(url);
      const data = await response.json();
  
      // Enrich leads with missing coordinates
      const enriched = await Promise.all(
        data.map(async (lead) => {
          if (!lead.latitude || !lead.longitude) {
            const fullAddress = `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`;
            const coords = await getCoordsFromAddress(fullAddress);
            return coords ? { ...lead, latitude: coords.latitude, longitude: coords.longitude } : lead;
          }
          return lead;
        })
      );
  
      setLeads(enriched);
      setFilteredLeads(enriched);
      setCities([...new Set(enriched.map((l) => l.city).filter(Boolean))]);
    } catch (err) {
      console.error("❌ Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };
  

  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [])
  );

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

      const res = fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
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
      console.log(res);

      Alert.alert("Exported", "Leads exported to Google Sheets.");
    } catch (e) {
      console.error("Export failed", e);
      Alert.alert("Export failed", "Something went wrong.");
    }
  };

  const getCoordsFromAddress = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GEOCODING_API_KEY}`
      );
      const data = await response.json();
  
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else {
        console.warn("Geocoding failed:", data.status, address);
        return null;
      }
    } catch (error) {
      console.error("Google Geocoding error:", error);
      return null;
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
      <Text style={[styles.address, { color: colors.text }]}>{item.name}</Text>
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

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Text style={{ marginRight: 8, color: colors.text }}>{isMapView ? "Map" : "List"}</Text>
            <Switch
                value={isMapView}
                onValueChange={() => setIsMapView(!isMapView)}
                trackColor={{ false: "#d1d5db", true: "#c4b5fd" }}
                thumbColor={isMapView ? "#7C3AED" : "#f4f3f4"}
            />
            </View>

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
  
        {!isMapView ? (
    <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
    />
    ) : (
    <>
    {console.log("Markers:", filteredLeads.map(l => ({ lat: l.latitude, lon: l.longitude })))}
        <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={region}
            provider="google"
            showsUserLocation={true}
            >
            {filteredLeads.map((lead) =>
                lead.latitude && lead.longitude ? (
                <Marker
                    key={lead.id}
                    coordinate={{ latitude: lead.latitude, longitude: lead.longitude }}
                    title={lead.name || lead.address}
                    description={`${lead.city}, ${lead.state}`}
                    pinColor="#7C3AED"
                />
                ) : null
            )}
            </MapView>

            <View style={{ position: "absolute", bottom: 0, paddingBottom: 20 }}>
            <FlatList
                data={filteredLeads}
                horizontal
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                paddingHorizontal: 10,
                paddingBottom: 20,
                }}
                renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => {
                    if (mapRef.current && item.latitude && item.longitude) {
                        mapRef.current.animateToRegion({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                        }, 1000);
                    }
                    }}
                >
                    <View style={[styles.card, { width: 250, marginRight: 10 }]}>
                    {item.images?.[0] ? (
                        <Image
                        source={{ uri: item.images[0] }}
                        style={{ height: 120, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                        />
                    ) : (
                        <View style={{ height: 120, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }}>
                        <Text>No Image</Text>
                        </View>
                    )}
                    <View style={{ padding: 10 }}>
                        <Text style={{ fontWeight: 'bold' }}>{item.name || item.address}</Text>
                        <Text>{item.city}</Text>
                        <Text>Status: {item.status}</Text>
                    </View>
                    </View>
                </TouchableOpacity>
                )}
            />
            </View>


    </>
    )}

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
    paddingHorizontal: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    zIndex: 9999,
    height: 120,
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
