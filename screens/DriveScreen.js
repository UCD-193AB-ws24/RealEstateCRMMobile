import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function DriveScreen() {
  const [location, setLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const handleDropPin = async () => {
    if (!location) return;

    setMarker({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Navigate after dropping the pin
    setTimeout(() => {
        navigation.navigate('Home', {
            screen: 'AddProperty',
            params: {
            from: "drive",
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
            },
          });
    }, 1000); // delay slightly for pin animation
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
        provider="google"
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {marker && (
            <Marker
              coordinate={marker}
              title="New Property"
              description="Tap to add details"
              pinColor="purple"
            />
          )}
        </MapView>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleDropPin}>
        <Ionicons name="location-sharp" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 50,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
