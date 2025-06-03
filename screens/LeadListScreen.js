import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  Modal
} from 'react-native';
import * as SecureStore from "expo-secure-store";
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { auth } from '../firebase';
import DropDownPicker from 'react-native-dropdown-picker';
import { useGoogleAuth } from '../googleAuth';
import { useTheme } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Dimensions } from 'react-native';
import { GEOCODING_API_KEY } from '@env';
import { SERVER_URL } from '@env';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDataContext } from '../DataContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Permissions from 'expo-permissions';


export default function LeadListScreen() {
  const { updatedLeadId, clearFlags } = useDataContext();

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
  const [sheetModalVisible, setSheetModalVisible] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [lastSheetTitle, setLastSheetTitle] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);


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

  useEffect(() => {
    if (!updatedLeadId) return;
  
    const updateSingleLead = async () => {
      const res = await fetch(`${SERVER_URL}/api/lead/${updatedLeadId}`);
      const updated = await res.json();
      setLeads((prev) => prev.map(l => l.id === updated.id ? updated : l));
      setFilteredLeads((prev) => prev.map(l => l.id === updated.id ? updated : l));
      clearFlags();
    };
  
    updateSingleLead();
  }, [updatedLeadId]);

  useEffect(() => {
    if (isMapView && mapRef.current && !mapInitialized) {
      if (filteredLeads.length > 0 && filteredLeads[0].latitude && filteredLeads[0].longitude) {
        mapRef.current.animateToRegion({
          latitude: filteredLeads[0].latitude,
          longitude: filteredLeads[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } else {
        Location.getCurrentPositionAsync({}).then(location => {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        });
      }
      setMapInitialized(true);
    }
  }, [isMapView, filteredLeads]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const storedUser = await SecureStore.getItemAsync("user");
      const parsedUser = JSON.parse(storedUser);
      const url = `${SERVER_URL}/api/leads/${parsedUser.id}`;
      const response = await fetch(url);
      const data = await response.json();

      const initialLeads = [];
      const seenCities = new Set();

      for (let lead of data) {
        initialLeads.push(lead);
        setLeads([...initialLeads]);
        setFilteredLeads([...initialLeads]);

        if (lead.city) seenCities.add(lead.city);
      }

      setCities(Array.from(seenCities));

      const enriched = await Promise.all(
        initialLeads.map(async (lead) => {
          if (!lead.latitude || !lead.longitude) {
            const coords = await getCoordsFromAddress(`${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`);
            return coords ? { ...lead, latitude: coords.latitude, longitude: coords.longitude } : lead;
          }
          return lead;
        })
      );

      setLeads(enriched);
      setFilteredLeads(enriched);
    } catch (err) {
      console.error("❌ Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };
  
  
  useFocusEffect(
    useCallback(() => {
      if (route.params?.newLead) {
        const newLead = route.params.newLead;
        setLeads(prev => [newLead, ...prev]);
        setFilteredLeads(prev => [newLead, ...prev]);
        navigation.setParams({ newLead: null });
      }
    }, [route.params?.newLead])
  );
  

  useFocusEffect(
    useCallback(() => {
      const loadCachedLeads = async () => {
        const cached = await AsyncStorage.getItem('@cachedLeads');
        if (cached) {
          const cachedLeads = JSON.parse(cached);
          setLeads(cachedLeads);
          setFilteredLeads(cachedLeads);
          setCities([...new Set(cachedLeads.map((l) => l.city).filter(Boolean))]);
          setLoading(false);
        }
      };
  
      loadCachedLeads();
  
      // ✅ Only refetch if no new lead is being passed
      if (!route.params?.newLead) {
        fetchLeads();
      }
    }, [route.params?.newLead])
  );
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) return;

      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const parsedUser = JSON.parse(storedUser);
        const url = `${SERVER_URL}/api/leads/${parsedUser.id}`;
        console.log('url', url);

        const response = await fetch(url);
        console.log('response', response);
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

  
  const handleExportPress = () => {
    exportLeadsToCSV();
  };
  

  
  const exportLeadsToCSV = async () => {
    try {
      if (!filteredLeads.length) {
        Alert.alert("No leads", "There are no leads to export.");
        return;
      }
  
      const header = ['Name', 'Address', 'City', 'State', 'Zip', 'Owner', 'Status'];
      const rows = filteredLeads.map(l => [
        l.name || '',
        l.address || '',
        l.city || '',
        l.state || '',
        l.zip || '',
        l.owner || '',
        l.status || '',
      ]);
  
      const csvContent = [header, ...rows]
        .map(row => row.map(field => `"${(field || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
  
      const fileUri = `${FileSystem.documentDirectory}leads_export_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
  
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exported Leads',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      console.error("CSV export failed:", error);
      Alert.alert("Export Failed", "Could not export leads to CSV.");
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
    onPress={() =>
      navigation.navigate("LeadDetails", {
        lead: item,
        onUpdate: (updatedLead) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
          );
          setFilteredLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
          );
        },
        onDelete: (deletedId) => {
          setLeads((prev) => prev.filter((l) => l.id !== deletedId));
          setFilteredLeads((prev) => prev.filter((l) => l.id !== deletedId));
        },
      })
    }
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

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.background }}>
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
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
        ListFooterComponent={
          loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={{ colors: colors.text }}>Loading leads...</Text>
            </View>
          ) : null
        }
    />
    ) : (
    <>
    {console.log("Markers:", filteredLeads.map(l => ({ lat: l.latitude, lon: l.longitude })))}
        <MapView
            provider="google"
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={region}
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

            <View style={{ position: "absolute", bottom: insets.bottom - 40 }}>
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                          <Text style={{ lineHeight: 20 }}>Status: {item.status}</Text>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#7C3AED',
                              paddingHorizontal: 10,
                              paddingVertical: 4, // reduce vertical padding
                              borderRadius: 6,
                              marginLeft: 8,       // gives a little space from status
                            }}
                            onPress={() =>
                              navigation.navigate("LeadDetails", {
                                lead: item,
                                onUpdate: (updatedLead) => {
                                  setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
                                  setFilteredLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
                                },
                                onDelete: (deletedId) => {
                                  setLeads((prev) => prev.filter((l) => l.id !== deletedId));
                                  setFilteredLeads((prev) => prev.filter((l) => l.id !== deletedId));
                                },
                              })
                            }
                          >
                            <Text style={{ color: '#fff', fontSize: 13 }}>Details</Text>
                          </TouchableOpacity>
                        </View>


                      </View>


                    </View>
                </TouchableOpacity>
                )}
            />
            </View>


    </>
    )}

      <Modal visible={sheetModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12, width: '80%' }}>
            <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Name Your Sheet</Text>

            {/* ✨ Conditional overwrite note */}
            {lastSheetTitle && sheetTitle === lastSheetTitle && (
              <Text style={{ marginBottom: 8, fontStyle: 'italic', color: 'gray' }}>
                Will overwrite: <Text style={{ fontWeight: 'bold' }}>{lastSheetTitle}</Text>
              </Text>
            )}

            <TextInput
              value={sheetTitle}
              onChangeText={setSheetTitle}
              placeholder="Sheet name"
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 16 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setSheetModalVisible(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: 'gray' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!sheetTitle) return Alert.alert("Invalid name", "Sheet name cannot be empty.");
                  setSheetModalVisible(false);
                  const token = await SecureStore.getItemAsync("accessToken");
                  if (token) exportLeads(token, sheetTitle);
                }}
              >
                <Text style={{ color: '#7C3AED', fontWeight: 'bold' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
  
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 6 },
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
    height: 130,
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
