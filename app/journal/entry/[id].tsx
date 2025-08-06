import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";

export default function JournalEntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journalEntries } = useDigmStore();
  
  const entry = journalEntries.find(entry => entry.id === id);
  
  if (!entry) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Journal entry not found</Text>
      </View>
    );
  }
  
  // Format date to show full date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Journal Entry</Text>
      </View>
      
      <ScrollView style={styles.scrollView} testID={`journal-detail-${id}`}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>+{entry.xpEarned} XP</Text>
        </View>
      </View>
      
      <View style={styles.contentSection}>
        <Text style={styles.content}>{entry.content}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accomplishments</Text>
        <Text style={styles.sectionContent}>{entry.accomplishments || "None recorded"}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blockers</Text>
        <Text style={styles.sectionContent}>{entry.blockers || "None recorded"}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gratitude</Text>
        <Text style={styles.sectionContent}>{entry.gratitude || "None recorded"}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Value Served</Text>
        <Text style={styles.sectionContent}>{entry.valueServed || "None recorded"}</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    color: colors.text,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  date: {
    fontSize: 16,
    color: colors.text,
  },
  xpContainer: {
    backgroundColor: colors.xpColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  contentSection: {
    padding: 16,
    backgroundColor: colors.background,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  section: {
    padding: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
});