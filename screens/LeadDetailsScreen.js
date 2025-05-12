import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

export default function LeadDetailScreen({ route }) {
  const { lead } = route.params;

  return (
    <ScrollView style={styles.container}>
      {lead.images?.map((img, idx) => (
        <Image key={idx} source={{ uri: img }} style={styles.image} />
      ))}
      <View style={styles.content}>
        <Text style={styles.title}>{lead.address}</Text>
        <Text>City: {lead.city}</Text>
        <Text>State: {lead.state}</Text>
        <Text>Zip: {lead.zip}</Text>
        <Text>Owner: {lead.owner}</Text>
        <Text>Status: {lead.status}</Text>
        {lead.notes ? <Text>Notes: {lead.notes}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 240, marginBottom: 12 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
});
