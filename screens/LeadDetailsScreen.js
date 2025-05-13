import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Dimensions, Modal
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '@env';

const API_URL = `${SERVER_URL}/api/leads`;

export default function LeadDetailScreen({ route }) {
  const { lead: initialLead } = route.params;
  const [lead, setLead] = useState(initialLead);
  const [updatedLead, setUpdatedLead] = useState(initialLead);
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusItems, setStatusItems] = useState([
    { label: 'Lead', value: 'Lead' },
    { label: 'Contact', value: 'Contact' },
    { label: 'Offer', value: 'Offer' },
    { label: 'Sale', value: 'Sale' },
  ]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUpdatedLead(prev => ({ ...prev, images: [...prev.images, base64Image] }));
    }
  };
  

  const handleImageRemove = (index) => {
    const newImages = updatedLead.images.filter((_, i) => i !== index);
    setUpdatedLead({ ...updatedLead, images: newImages });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/${updatedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead),
      });

  
      if (!response.ok) throw new Error(await response.text());
  
      const result = await response.json(); // ✅ use updated response
      console.log(result);
      setLead(result);
      setUpdatedLead(result);
      setModalVisible(false); // ✅ close modal
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update lead.');
      console.error("Save error:", err);
    }
  };
  

  const confirmDelete = () => {
    Alert.alert(
      "Delete Lead",
      "Are you sure you want to delete this lead?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete }
      ]
    );
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete");
      Alert.alert("Deleted", "Lead deleted successfully");
      navigation.navigate("Leads", { refresh: true });
    } catch (err) {
      Alert.alert("Error", "Failed to delete lead.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Property Name + Icons */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {updatedLead.name || 'Unnamed Property'}
        </Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <View style={[styles.carouselContainer, { backgroundColor: colors.background }]}>
        <ScrollView horizontal contentContainerStyle={styles.carousel} showsHorizontalScrollIndicator={false}>
        {updatedLead.images?.map((img, i) => (
          <View key={i} style={styles.imageWrapper}>
            <Image source={{ uri: img }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleImageRemove(i)}>
              <Text style={{ color: 'white' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addImage} onPress={handleImagePick}>
          <Text style={styles.addImageText}>＋</Text>
        </TouchableOpacity>
      </ScrollView>
      </View>

      {/* Status + Notes */}
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Status</Text>
        <DropDownPicker
          open={statusOpen}
          value={updatedLead.status}
          items={statusItems}
          setOpen={setStatusOpen}
          setValue={(val) => setUpdatedLead({ ...updatedLead, status: val() })}
          setItems={setStatusItems}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          dropDownContainerStyle={{ backgroundColor: colors.card, borderColor: colors.border }}
          textStyle={{ color: colors.text }}
          placeholderStyle={{ color: colors.text + "99" }}
        />

        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
        <TextInput
          value={updatedLead.notes}
          onChangeText={(text) => setUpdatedLead({ ...updatedLead, notes: text })}
          multiline
          style={[styles.input, styles.notes, {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.card
          }]}
          placeholder="Notes"
          placeholderTextColor={colors.text + "99"}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save Lead</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Fields Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            {["name", "address", "city", "state", "zip", "owner"].map(field => (
              <TextInput
                key={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                placeholderTextColor={colors.text + "99"}
                value={updatedLead[field]}
                onChangeText={(text) => setUpdatedLead({ ...updatedLead, [field]: text })}
                style={[styles.input, {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
              />
            ))}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  carousel: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center'
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  image: {
    width: screenWidth * 0.8,
    height: 200,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addImage: {
    width: screenWidth * 0.8,
    height: 200,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  addImageText: {
    fontSize: 40,
    color: '#7C3AED',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    zIndex: 1,
  },
  notes: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
});
