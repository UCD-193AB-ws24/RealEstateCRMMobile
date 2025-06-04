import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@react-navigation/native';
import { GEOCODING_API_KEY } from '@env';
import { SERVER_URL } from '@env';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDataContext } from '../DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';



const API_URL = `${SERVER_URL}/api/leads`;

const AddPropertyScreen = () => {
  const { updateStats } = useDataContext();

    const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { from, location } = route.params || {};
const latitude = location?.latitude;
const longitude = location?.longitude;

  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
const [stateItems, setStateItems] = useState([
  { label: 'Alabama (AL)', value: 'AL' },
  { label: 'Alaska (AK)', value: 'AK' },
  { label: 'Arizona (AZ)', value: 'AZ' },
  { label: 'Arkansas (AR)', value: 'AR' },
  { label: 'California (CA)', value: 'CA' },
  { label: 'Colorado (CO)', value: 'CO' },
  { label: 'Connecticut (CT)', value: 'CT' },
  { label: 'Delaware (DE)', value: 'DE' },
  { label: 'Florida (FL)', value: 'FL' },
  { label: 'Georgia (GA)', value: 'GA' },
  { label: 'Hawaii (HI)', value: 'HI' },
  { label: 'Idaho (ID)', value: 'ID' },
  { label: 'Illinois (IL)', value: 'IL' },
  { label: 'Indiana (IN)', value: 'IN' },
  { label: 'Iowa (IA)', value: 'IA' },
  { label: 'Kansas (KS)', value: 'KS' },
  { label: 'Kentucky (KY)', value: 'KY' },
  { label: 'Louisiana (LA)', value: 'LA' },
  { label: 'Maine (ME)', value: 'ME' },
  { label: 'Maryland (MD)', value: 'MD' },
  { label: 'Massachusetts (MA)', value: 'MA' },
  { label: 'Michigan (MI)', value: 'MI' },
  { label: 'Minnesota (MN)', value: 'MN' },
  { label: 'Mississippi (MS)', value: 'MS' },
  { label: 'Missouri (MO)', value: 'MO' },
  { label: 'Montana (MT)', value: 'MT' },
  { label: 'Nebraska (NE)', value: 'NE' },
  { label: 'Nevada (NV)', value: 'NV' },
  { label: 'New Hampshire (NH)', value: 'NH' },
  { label: 'New Jersey (NJ)', value: 'NJ' },
  { label: 'New Mexico (NM)', value: 'NM' },
  { label: 'New York (NY)', value: 'NY' },
  { label: 'North Carolina (NC)', value: 'NC' },
  { label: 'North Dakota (ND)', value: 'ND' },
  { label: 'Ohio (OH)', value: 'OH' },
  { label: 'Oklahoma (OK)', value: 'OK' },
  { label: 'Oregon (OR)', value: 'OR' },
  { label: 'Pennsylvania (PA)', value: 'PA' },
  { label: 'Rhode Island (RI)', value: 'RI' },
  { label: 'South Carolina (SC)', value: 'SC' },
  { label: 'South Dakota (SD)', value: 'SD' },
  { label: 'Tennessee (TN)', value: 'TN' },
  { label: 'Texas (TX)', value: 'TX' },
  { label: 'Utah (UT)', value: 'UT' },
  { label: 'Vermont (VT)', value: 'VT' },
  { label: 'Virginia (VA)', value: 'VA' },
  { label: 'Washington (WA)', value: 'WA' },
  { label: 'West Virginia (WV)', value: 'WV' },
  { label: 'Wisconsin (WI)', value: 'WI' },
  { label: 'Wyoming (WY)', value: 'WY' },
]);
const [rawAssets, setRawAssets] = useState([]);
const scrollRef = useRef();


  useEffect(() => {
    console.log("Route params on load:", route.params);
  }, []);

  useEffect(() => {
  const initFromParams = async () => {
    const { from, location } = route.params || {};

    if (from === "drive" && location?.latitude && location?.longitude) {
      console.log("📍 Using location from drive route params");
      getAddressFromCoords(location.latitude, location.longitude);
    }

    // fallback to current location if from drive but no coords provided
    if (from === "drive" && (!location || !location.latitude || !location.longitude)) {
      console.log("📍 Fallback: fetching current location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
      }
    }
  };


  initFromParams();
}, [route.params]);

useEffect(() => {
  if (images.length > 0) {
    // Give it a tick so layout updates first
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100); // 100ms delay ensures layout is updated
  }
}, [images]);


const extractDecimalCoords = (exif) => {
    let lat = exif.GPSLatitude;
    let lng = exif.GPSLongitude;
  
    if (typeof lat === "number" && typeof lng === "number") {
      if (exif.GPSLatitudeRef === "S") lat = -lat;
      if (exif.GPSLongitudeRef === "W") lng = -lng;
      return { lat, lng };
    }
  
    return null;
  };

  const validateInputs = () => {
    const newErrors = {};
  
    if (!address.trim()) newErrors.address = "Address is required.";
    if (!city.trim()) newErrors.city = "City is required.";
    if (!state.trim()) {
      newErrors.state = "State is required.";
    } else if (!/^[A-Z]{2}$/.test(state.trim().toUpperCase())) {
      newErrors.state = "Use 2-letter state code (e.g., CA)";
    }
  
    if (!zip.trim()) {
      newErrors.zip = "Zip code is required.";
    } else if (!/^\d{5}$/.test(zip.trim())) {
      newErrors.zip = "Zip must be 5 digits.";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      base64: false,
      exif: true, // to try and extract GPS from metadata
    });
  
    if (!result.canceled && result.assets.length > 0) {
      const validImages = [];
      const rawSelected = [];
  
      for (const asset of result.assets) {
        rawSelected.push(asset); // Save original with EXIF
        let usedCoords = false;
  
        // 1️⃣ Try EXIF GPS metadata
        if (
          asset.exif?.GPSLatitude &&
          asset.exif?.GPSLongitude &&
          !address // only autofill if address isn't already set
        ) {
          const coords = extractDecimalCoords(asset.exif);
          if (coords) {
            console.log("📍 Extracted EXIF coords:", coords);
            await getAddressFromCoords(coords.lat, coords.lng);
            usedCoords = true;
          }
        }
  
        // 2️⃣ Fallback to current location if EXIF missing
        if (!usedCoords && !address) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            console.log("📍 Fallback current location:", loc.coords);
            await getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
          }
        }
  
        // 3️⃣ Resize and convert image
        try {
          const resized = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          validImages.push(`data:image/jpeg;base64,${resized.base64}`);
        } catch (e) {
          console.error("❌ Image resize failed:", e);
        }

        setRawAssets((prev) => [...prev, ...rawSelected]);

      }
  
      if (validImages.length > 0) {
        setImages((prev) => [...prev, ...validImages]);
      }

    }
  };
  
  

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Camera permission is needed to take pictures.");
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      base64: false,
    });
  
    if (!result.canceled && result.assets[0]?.uri) {
      try {
        // 💡 Fetch current GPS location immediately
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          if (location && location.coords && !address) {
            console.log("📍 Current location used:", location.coords);
            getAddressFromCoords(location.coords.latitude, location.coords.longitude);
          }
        }
  
        const resized = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
  
        const base64Image = `data:image/jpeg;base64,${resized.base64}`;
        setImages((prev) => [...prev, base64Image]);
      } catch (e) {
        console.error("❌ Failed to process photo:", e);
        Alert.alert("Error", "Failed to process photo.");
      }
    }
  };
  
  

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GEOCODING_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        const result = data.results[0];
        const components = result.address_components;

        const getComponent = (type) => {
          const comp = components.find((c) => c.types.includes(type));
          return comp ? comp.long_name : "";
        };

        setAddress(`${getComponent("street_number")} ${getComponent("route")}`);
        setCity(getComponent("locality") || getComponent("sublocality"));
        setState(getComponent("administrative_area_level_1"));
        setZip(getComponent("postal_code"));
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleAddProperty = async () => {
    if (!validateInputs()) {
      Alert.alert("Invalid input", "Please correct the highlighted errors.");
      return;
    }
  
    const storedUser = await SecureStore.getItemAsync("user");
    if (!storedUser) return;
  
    const { email, id: userId } = JSON.parse(storedUser);
  
    const newLead = {
      name,
      address,
      city,
      state,
      zip,
      owner,
      images,
      notes,
      email,
      userId,
    };
  
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Add failed");
  
      Alert.alert("Success", "Property added successfully!");
      updateStats();
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "AppTabs",
            state: {
              index: 2,
              routes: [
                { name: "Drive" },
                { name: "Home" },
                {
                  name: "Leads",
                  params: { newLead: data },
                },
                { name: "Profile" }
              ]
            }
          }
        ]
      });
  
    } catch (err) {
      console.error("Error adding property:", err);
      Alert.alert("Error", "Failed to add property.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.container,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 16) + 10
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
            <Text style={[styles.title, { color: colors.text }]}>Add New Property</Text>
  
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity style={[styles.imageButton, { flex: 1, marginRight: 5 }]} onPress={takePicture}>
                <Text style={styles.imageButtonText}>Take a Picture</Text>
              </TouchableOpacity>
  
              <TouchableOpacity style={[styles.imageButton, { flex: 1, marginLeft: 5 }]} onPress={pickImage}>
                <Text style={styles.imageButtonText}>Select from Gallery</Text>
              </TouchableOpacity>
            </View>
  
            <ScrollView horizontal style={styles.imageScroll}>
              {images.map((imgUri, idx) => (
                <View key={idx} style={{ position: "relative", marginRight: 10 }}>
                  <Image source={{ uri: imgUri }} style={styles.image} />
                  <TouchableOpacity
                    onPress={() => {
                      const updatedImages = images.filter((_, i) => i !== idx);
                      const updatedRawAssets = rawAssets.filter((_, i) => i !== idx);
                      setImages(updatedImages);
                      setRawAssets(updatedRawAssets);
                    
                      if (updatedImages.length === 0 && from !== "drive") {
                        setAddress("");
                        setCity("");
                        setState("");
                        setZip("");
                      } else if (from !== "drive") {
                        // Try to extract coords from the new first image
                        const first = updatedRawAssets[0];
                        const coords = extractDecimalCoords(first?.exif || {});
                        if (coords) getAddressFromCoords(coords.lat, coords.lng);
                        else {
                          // fallback to current location if needed
                          const fetchLocation = async () => {
                            const { status } = await Location.requestForegroundPermissionsAsync();
                            if (status === "granted") {
                              const loc = await Location.getCurrentPositionAsync({});
                              getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
                            }
                          };
                          fetchLocation();
                        }
                      }
                    }}
                    
                    style={styles.removeButton}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
  
            {[
              { label: "Property Name", val: name, set: setName, key: "name" },
              { label: "Address", val: address, set: setAddress, key: "address" },
              { label: "City", val: city, set: setCity, key: "city" },
            ].map(({ label, val, set, key }, idx) => (
              <View key={idx}>
                <TextInput
                  placeholder={label}
                  placeholderTextColor='#9CA3AF'
                  style={[styles.input, {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                  }]}
                  value={val}
                  onChangeText={set}
                />
                {errors[key] && (
                  <Text style={{ color: 'red', marginTop: 4, marginLeft: 2 }}>
                    {errors[key]}
                  </Text>
                )}
              </View>
            ))}

            {/* ✅ State Dropdown goes here outside the map */}
            <View style={{ zIndex: 1000, marginTop: 10 }}>
            <DropDownPicker
              open={open}
              value={state}
              items={stateItems}
              setOpen={setOpen}
              setValue={setState}
              setItems={setStateItems}
              searchable={true}
              placeholder="Select a state..."
              placeholderStyle={{ color: '#9CA3AF' }} // 👈 This line sets the placeholder color
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
              textStyle={{ color: colors.text }}
              dropDownContainerStyle={{ backgroundColor: colors.card }}
            />
              {errors.state && (
                <Text style={{ color: 'red', marginTop: 4 }}>{errors.state}</Text>
              )}
            </View>

            {[
              { label: "Zip", val: zip, set: setZip, key: "zip" },
              { label: "Owner", val: owner, set: setOwner, key: "owner" },
            ].map(({ label, val, set, key }, idx) => (
              <View key={idx}>
                <TextInput
                  placeholder={label}
                  placeholderTextColor='#9CA3AF'
                  style={[styles.input, {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                  }]}
                  value={val}
                  onChangeText={set}
                />
                {errors[key] && (
                  <Text style={{ color: 'red', marginTop: 4, marginLeft: 2 }}>
                    {errors[key]}
                  </Text>
                )}
              </View>
            ))}


  
            <TextInput
              placeholder="Notes"
              placeholderTextColor='#9CA3AF'
              multiline
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, {
                height: 80,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
              }]}
            />
  
            <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
            onPress={handleAddProperty}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  imageButton: { backgroundColor: "#7C3AED", padding: 12, borderRadius: 8, marginBottom: 10, alignItems: "center" },
  imageButtonText: { color: "white", fontWeight: "bold" },
  submitButton: { backgroundColor: "#7C3AED", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  submitText: { color: "white", fontSize: 16, fontWeight: "bold" },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  imageScroll: {
    marginVertical: 10,
    paddingVertical: 6,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 6,
  },
  
  
  
});

export default AddPropertyScreen;
