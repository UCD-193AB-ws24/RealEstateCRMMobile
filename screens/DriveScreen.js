import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function DriveScreen() {
  const [location, setLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();


  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
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
      <View style={[styles.infoBox, { top: insets.top - 30 }]}>
        <Ionicons name="car-outline" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
        <Text style={styles.infoText}>
          This screen is for field use — drive around and drop pins to save property leads.
        </Text>
      </View>


      {location && (
        
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    paddingHorizontal: 15,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  infoText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  
});
