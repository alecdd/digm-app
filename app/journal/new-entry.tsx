import React, { useCallback, useState } from "react";
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import { Stack, useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";

export default function NewJournalEntryScreen() {
  const { addJournalEntry } = useDigmStore();
  const router = useRouter();
  
  const [content, setContent] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [blockers, setBlockers] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [valueServed, setValueServed] = useState("");

  const handleSave = useCallback(() => {
    if (content.trim()) {
      addJournalEntry({
        date: new Date().toISOString(),
        content,
        accomplishments,
        blockers,
        gratitude,
        valueServed,
      });
      
      router.back();
    }
  }, [content, accomplishments, blockers, gratitude, valueServed, addJournalEntry, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      enabled
    >
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>New Journal Entry</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButtonContainer}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Journal Entry</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write about your day..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            autoFocus={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What did I accomplish today?</Text>
          <TextInput
            style={styles.input}
            value={accomplishments}
            onChangeText={setAccomplishments}
            placeholder="List your accomplishments..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What&apos;s holding me back?</Text>
          <TextInput
            style={styles.input}
            value={blockers}
            onChangeText={setBlockers}
            placeholder="Identify obstacles..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What am I grateful for?</Text>
          <TextInput
            style={styles.input}
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="Express gratitude..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Who did I value or serve today?</Text>
          <TextInput
            style={styles.input}
            value={valueServed}
            onChangeText={setValueServed}
            placeholder="Reflect on your impact..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.xpNotice}>
          <Text style={styles.xpText}>+10 XP for completing this entry</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saveButtonContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  contentInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 150,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 80,
  },
  xpNotice: {
    padding: 16,
    alignItems: "center",
  },
  xpText: {
    color: colors.xpColor,
    fontSize: 16,
    fontWeight: "bold",
  },
});