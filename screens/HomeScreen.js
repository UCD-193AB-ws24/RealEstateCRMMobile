import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import { auth } from '../firebase';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { SERVER_URL } from '@env';
import Markdown from 'react-native-markdown-display';

const chatbotUrl = `${SERVER_URL}/api/chat`;

const StatCard = ({ label, value, iconName, bgColor, iconColor, textColor }) => (
  <View style={[styles.statCard, { backgroundColor: textColor.card }]}> 
    <View style={styles.cardHeader}>
      <Text style={[styles.cardLabel, { color: textColor.text }]}>{label}</Text>
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}> 
        <Ionicons name={iconName} size={14} color={iconColor} />
      </View>
    </View>
    <View style={[styles.divider, { backgroundColor: textColor.divider }]} />
    <Text style={[styles.cardValue, { color: textColor.text }]}>{value}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const storedUser = await SecureStore.getItemAsync("user");
      const parsedUser = JSON.parse(storedUser);
      const statsUrl = `${SERVER_URL}/api/stats/${parsedUser.id}`;
      const res = await fetch(statsUrl);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskGemini = async () => {
    if (!question.trim()) return;

    try {
      console.log("Sending question to Gemini:", question);
      const response = await fetch(chatbotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });
      
      const data = await response.json();
      console.log("Received response:", data);
      
      // Add new message pair to chat history
      setChatHistory(prevHistory => [...prevHistory, {
        question: question,
        answer: data.response || "No response received."
      }]);
      
      // Clear input
      setQuestion("");
    } catch (err) {
      console.error("Error details:", err);
      Alert.alert("Error", "Failed to get response from Gemini.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadUserAndStats = async () => {
        const storedUser = await SecureStore.getItemAsync("user");
        console.log(storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await fetchStats();
        }
      };
  
      loadUserAndStats();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}> 
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ color: colors.text, fontSize: 16, marginTop: 10 }}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && <Text style={[styles.welcomeText, { color: colors.text }]}>Hello, {user.name || 'User'}</Text>}

        {stats && (
          <View style={styles.grid}>
            <StatCard label="Total Leads" value={stats.totalLeads} iconName="target-outline" bgColor="#EDE9FE" iconColor="#7C3AED" textColor={colors} />
            <StatCard label="Deals Closed" value={stats.dealsClosed} iconName="hand-left-outline" bgColor="#E0E7FF" iconColor="#4F46E5" textColor={colors} />
            <StatCard label="Properties Contacted" value={stats.propertiesContacted} iconName="call-outline" bgColor="#E0F2FE" iconColor="#0284C7" textColor={colors} />
            <StatCard label="Offers Made" value={stats.offersMade} iconName="business-outline" bgColor="#FEF3C7" iconColor="#D97706" textColor={colors} />
            <StatCard label="Active Listings" value={stats.activeListings} iconName="home-outline" bgColor="#D1FAE5" iconColor="#059669" textColor={colors} />
            <StatCard label="% Deals Closed" value={stats.percentageDealsClosed} iconName="stats-chart-outline" bgColor="#FFE4E6" iconColor="#E11D48" textColor={colors} />
          </View>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddProperty', { from: "home" })}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Gemini Button */}
      <TouchableOpacity
        style={styles.geminiButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/gemini_logo.png')} 
            style={styles.geminiLogo}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ask Gemini</Text>
            
            <ScrollView style={styles.chatContainer}>
              {chatHistory.map((chat, index) => (
                <View key={index}>
                  <View style={styles.userMessage}>
                    <Text style={styles.userMessageText}>{chat.question}</Text>
                  </View>
                  <View style={[styles.botMessage, { backgroundColor: colors.background }]}>
                    <Markdown style={markdownStyles}>
                      {chat.answer}
                    </Markdown>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Type your question here"
                placeholderTextColor={colors.text}
                value={question}
                onChangeText={setQuestion}
                multiline
              />
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={handleAskGemini}
              >
                <Text style={styles.modalButtonText}>Ask</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    marginTop: 32,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  iconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },  
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 20,
    padding: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: "#7C3AED",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-end',
  },
  botMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userMessageText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalButton: {
    backgroundColor: "#7C3AED",
    padding: 10,
    borderRadius: 20,
    width: 60,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    alignSelf: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  geminiButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  geminiLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
});

const markdownStyles = {
  body: {
    fontSize: 14,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: "#7C3AED",
    textDecorationLine: 'underline',
  },
  list_item: {
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  code_inline: {
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
};
