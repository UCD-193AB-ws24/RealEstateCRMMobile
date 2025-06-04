import React, { useState, useRoute } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Dimensions, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '@env';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDataContext } from '../DataContext';



const API_URL = `${SERVER_URL}/api/leads`;

export default function LeadDetailScreen({ route }) {
  const { lead: initialLead, onUpdate } = route.params || {};

  const { updateStats } = useDataContext();


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
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [stateOpen, setStateOpen] = useState(false);
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



  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: false,
      allowsEditing: false,
      quality: 1,
    });
  
    if (!result.canceled && result.assets?.[0]?.uri) {
      const originalUri = result.assets[0].uri;
  
      try {
        const resized = await ImageManipulator.manipulateAsync(
          originalUri,
          [{ resize: { width: 800 } }], // resize to 800px wide
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
  
        const base64Image = `data:image/jpeg;base64,${resized.base64}`;
        setUpdatedLead(prev => ({ ...prev, images: [...(prev.images || []), base64Image] }));
      } catch (e) {
        console.error('❌ Error resizing image:', e);
        Alert.alert("Image Error", "Could not process the image.");
      }
    }
  };
  
  

  const handleImageRemove = (index) => {
    const newImages = updatedLead.images.filter((_, i) => i !== index);
    setUpdatedLead({ ...updatedLead, images: newImages });
  };

  const validateFields = () => {
    const newErrors = {};
    const { address, city, state, zip } = updatedLead;
  
    if (!address?.trim()) newErrors.address = "Address is required.";
    if (!city?.trim()) newErrors.city = "City is required.";
  
    if (!state?.trim()) {
      newErrors.state = "State is required.";
    } else if (!/^[A-Z]{2}$/.test(state.trim().toUpperCase())) {
      newErrors.state = "Use 2-letter state code (e.g., CA)";
    }
  
    if (!zip?.trim()) {
      newErrors.zip = "Zip code is required.";
    } else if (!/^\d{5}$/.test(zip.trim())) {
      newErrors.zip = "Zip must be 5 digits.";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSave = () => {
    if (!validateFields()) return;
    setModalVisible(false);
  }
  

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert("Invalid input", "Please fix the errors in the form.");
      return;
    }

    const hasChanges = JSON.stringify(lead) !== JSON.stringify(updatedLead);
    if (!hasChanges) {
      navigation.goBack(); // No changes, just go back
      return;
    }
  
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/${updatedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead),
      });
  
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
  
      const result = await response.json();
      setLead(result);
      setUpdatedLead(result);
      setModalVisible(false);
  
      if (onUpdate) onUpdate(result);
  
      navigation.goBack();
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert('Error', 'Failed to update lead.');
    } finally {
      setIsSaving(false);
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
        method: "DELETE",
      });
  
      if (!response.ok) throw new Error("Failed to delete");
  
      Alert.alert("Deleted", "Lead deleted successfully");
  
      // 🔁 Inform parent screen of deletion
      if (route.params?.onDelete) {
        route.params.onDelete(lead.id);
      }
  
      // 🔁 Trigger stat refresh
      updateStats();  // this will cause HomeScreen to fetch updated stats
  
      navigation.goBack();
  
    } catch (err) {
      Alert.alert("Error", "Failed to delete lead.");
    }
  };

  

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={100} // adjust this based on your header height
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
      {/* Property Name + Icons */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {updatedLead.name || updatedLead.address || 'Unnamed Property'}
        </Text>


        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <View style={[styles.carouselContainer, { backgroundColor: colors.background }]}>
        <ScrollView horizontal contentContainerStyle={styles.carousel} showsHorizontalScrollIndicator={false}>
        {(updatedLead.images?.length > 0 ? updatedLead.images : [null]).map((img, i) => (
          <View key={i} style={styles.imageWrapper}>
            {img ? (
              <>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleImageRemove(i)}>
                  <Text style={{ color: 'white' }}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.image, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 16, color: '#9CA3AF' }}>No Image</Text>
              </View>
            )}
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

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveText}>Save Lead</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Fields Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        <ScrollView
          style={{ maxHeight: '%' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {["name", "address", "city", "zip", "owner"].map((field) => (
            <View key={field}>
              <TextInput
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                placeholderTextColor={colors.text + "99"}
                value={updatedLead[field]}
                onChangeText={(text) =>
                  setUpdatedLead({ ...updatedLead, [field]: text })
                }
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
              />
              {errors[field] && (
                <Text
                  style={{
                    color: "red",
                    marginTop: -10,
                    marginBottom: 10,
                    fontSize: 12,
                  }}
                >
                  {errors[field]}
                </Text>
              )}
            </View>
          ))}

          <View style={{ zIndex: 1000 }}>
            <DropDownPicker
              open={stateOpen}
              value={updatedLead.state}
              items={stateItems}
              setOpen={setStateOpen}
              setValue={(val) =>
                setUpdatedLead({ ...updatedLead, state: val() })
              }
              setItems={setStateItems}
              searchable
              placeholder="Select a state..."
              placeholderStyle={{ color: colors.text + "99" }}
              style={{
                borderColor: colors.border,
                backgroundColor: colors.card,
                marginBottom: 10,
              }}
              dropDownContainerStyle={{
                backgroundColor: colors.card,
                zIndex: 9999,
              }}
              textStyle={{ color: colors.text }}
            />
            {errors.state && (
              <Text
                style={{ color: "red", marginBottom: 10, fontSize: 12 }}
              >
                {errors.state}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={handleModalSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
  },
  
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  
});
