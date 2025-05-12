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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "http://34.31.159.135:5002";
const API_URL = `${SERVER_URL}/api/leads`;

const AddPropertyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { latitude, longitude } = route.params || {};

  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (latitude && longitude) {
      getAddressFromCoords(latitude, longitude);
    }
  }, [latitude, longitude]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      base64: true,
    });
    if (!result.canceled) {
      const base64Images = result.assets.map((asset) => `data:image/jpeg;base64,${asset.base64}`);
      setImages((prev) => [...prev, ...base64Images]);
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const apiKey = "AIzaSyDNfQXHXoIeFVA0eSTtFJcsz1oRNc6Pe_Y";
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
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
      if (!response.ok) throw new Error(data.error || "Add failed");
      Alert.alert("Success", "Property added successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error adding property:", err);
      Alert.alert("Error", "Failed to add property.");
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add New Property</Text>

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Select Images</Text>
        </TouchableOpacity>

        <ScrollView horizontal style={styles.imageScroll}>
          {images.map((imgUri, idx) => (
            <Image key={idx} source={{ uri: imgUri }} style={styles.image} />
          ))}
        </ScrollView>

        {[{
          label: "Name", val: name, set: setName,
        }, {
          label: "Address", val: address, set: setAddress,
        }, {
          label: "City", val: city, set: setCity,
        }, {
          label: "State", val: state, set: setState,
        }, {
          label: "Zip", val: zip, set: setZip,
        }, {
          label: "Owner", val: owner, set: setOwner,
        }].map(({ label, val, set }, idx) => (
          <TextInput
            key={idx}
            placeholder={label}
            style={styles.input}
            value={val}
            onChangeText={set}
          />
        ))}

        <TextInput
          placeholder="Notes"
          multiline
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { height: 80 }]}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleAddProperty}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
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
  submitButton: { backgroundColor: "#10B981", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  submitText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default AddPropertyScreen;
