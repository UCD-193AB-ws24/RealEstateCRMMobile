import { useState, useEffect } from "react";
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
  Platform
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


const API_URL = `${SERVER_URL}/api/leads`;

const AddPropertyScreen = () => {
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


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      base64: false,
      exif: true,
    });
  
    if (!result.canceled && result.assets.length > 0) {
      const resizedBase64Images = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const resized = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 800 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            return `data:image/jpeg;base64,${resized.base64}`;
          } catch (e) {
            console.error('❌ Image resize failed:', e);
            return null;
          }
        })
      );
  
      const validImages = resizedBase64Images.filter(Boolean);
      setImages((prev) => [...prev, ...validImages]);
  
      if (
        route.params?.from === "home" &&
        result.assets[0]?.exif?.GPSLatitude &&
        result.assets[0]?.exif?.GPSLongitude
      ) {
        const coords = extractDecimalCoords(result.assets[0].exif);
        if (coords) {
          console.log("📍 EXIF-based location:", coords);
          getAddressFromCoords(coords.lat, coords.lng);
        }
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
        const resized = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
  
        const base64Image = `data:image/jpeg;base64,${resized.base64}`;
        setImages((prev) => [...prev, base64Image]);
      } catch (e) {
        console.error('❌ Failed to resize captured image:', e);
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
    const storedUser = await SecureStore.getItemAsync("user");
    console.log(storedUser);
    if (!storedUser) return;

    const { email, id: userId } = JSON.parse(storedUser);

    if (!name || !address || !city || !state || !zip || !owner) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }

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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await response.json();
      console.log(response);
      if (!response.ok) throw new Error(data.error || "Add failed");
      Alert.alert("Success", "Property added successfully!");
      navigation.navigate("Leads", { refresh: true });
    } catch (err) {
      console.error("Error adding property:", err);
      Alert.alert("Error", "Failed to add property.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 0} // tweak if header present
  >
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
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
                setImages(prev => prev.filter((_, i) => i !== idx));
                }}
                style={styles.removeButton}
            >
                <Text style={{ color: "white", fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
            </View>
        ))}
        </ScrollView>

        {[
        { label: "Name", val: name, set: setName },
        { label: "Address", val: address, set: setAddress },
        { label: "City", val: city, set: setCity },
        { label: "State", val: state, set: setState },
        { label: "Zip", val: zip, set: setZip },
        { label: "Owner", val: owner, set: setOwner },
        ].map(({ label, val, set }, idx) => (
        <TextInput
            key={idx}
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

        <TouchableOpacity style={styles.submitButton} onPress={handleAddProperty}>
        <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
    </ScrollView>
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
  imageScroll: { marginVertical: 10 },
  image: { width: 100, height: 100, marginRight: 10, borderRadius: 10 },
  input: { borderColor: "#ccc", borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
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
  
});

export default AddPropertyScreen;
