import React, { useCallback, useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  SafeAreaView
} from "react-native";
import { Stack, useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";

// Global variable to store draft data outside of React lifecycle
let globalDraft = {
  content: "",
  accomplishments: "",
  blockers: "",
  gratitude: "",
  valueServed: ""
};

export default function NewJournalEntryScreen() {
  // Temporarily comment out store to test if that's causing the issue
  // const { addJournalEntry } = useDigmStore();
  const router = useRouter();
  
  // Use refs to maintain actual values that won't be reset
  const contentRef = useRef("");
  const accomplishmentsRef = useRef("");
  const blockersRef = useRef("");
  const gratitudeRef = useRef("");
  const valueServedRef = useRef("");
  
  // Use a single state object initialized from global draft
  const [formData, setFormData] = useState(globalDraft);
  
  // Destructure for easier access
  const { content, accomplishments, blockers, gratitude, valueServed } = formData;
  
  // Optimized change handlers - no debug logging to prevent performance issues
  const handleContentChange = useCallback((text: string) => {
    contentRef.current = text; // Store in ref
    globalDraft.content = text; // Store in global draft
    setFormData(prev => ({ ...prev, content: text }));
  }, []);
  
  const handleAccomplishmentsChange = useCallback((text: string) => {
    accomplishmentsRef.current = text; // Store in ref
    globalDraft.accomplishments = text; // Store in global draft
    setFormData(prev => ({ ...prev, accomplishments: text }));
  }, []);
  
  const handleBlockersChange = useCallback((text: string) => {
    blockersRef.current = text; // Store in ref
    globalDraft.blockers = text; // Store in global draft
    setFormData(prev => ({ ...prev, blockers: text }));
  }, []);
  
  const handleGratitudeChange = useCallback((text: string) => {
    gratitudeRef.current = text; // Store in ref
    globalDraft.gratitude = text; // Store in global draft
    setFormData(prev => ({ ...prev, gratitude: text }));
  }, []);
  
  const handleValueServedChange = useCallback((text: string) => {
    valueServedRef.current = text; // Store in ref
    globalDraft.valueServed = text; // Store in global draft
    setFormData(prev => ({ ...prev, valueServed: text }));
  }, []);



  // Restore values from global draft only when component mounts
  useEffect(() => {
    // Only restore if the component has been reset but global draft has data
    if (content === "" && globalDraft.content !== "") {
      console.log("Restoring from global draft on mount");
      setFormData({
        content: globalDraft.content,
        accomplishments: globalDraft.accomplishments,
        blockers: globalDraft.blockers,
        gratitude: globalDraft.gratitude,
        valueServed: globalDraft.valueServed
      });
    }
  }, []); // Only run on mount

  // Removed debug useEffects that were causing re-renders



  const handleSave = useCallback(async () => {
    // Get values from global draft
    const contentToSave = globalDraft.content.trim();
    const accomplishmentsToSave = globalDraft.accomplishments.trim();
    const blockersToSave = globalDraft.blockers.trim();
    const gratitudeToSave = globalDraft.gratitude.trim();
    const valueServedToSave = globalDraft.valueServed.trim();
    
    if (contentToSave) {
      // Temporarily comment out to test if store is causing the issue
      // addJournalEntry({
      //   date: new Date().toISOString(),
      //   content: contentToSave,
      //   accomplishments: accomplishmentsToSave,
      //   blockers: blockersToSave,
      //   gratitude: gratitudeToSave,
      //   valueServed: valueServedToSave,
      // });
      
      console.log("Would save:", { 
        content: contentToSave, 
        accomplishments: accomplishmentsToSave, 
        blockers: blockersToSave, 
        gratitude: gratitudeToSave, 
        valueServed: valueServedToSave 
      });
      
      // Clear the global draft after saving
      globalDraft = {
        content: "",
        accomplishments: "",
        blockers: "",
        gratitude: "",
        valueServed: ""
      };
      
      router.back();
    }
  }, [router]);





  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }} 
      />
      
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>New Journal Entry</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButtonContainer}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>Journal Entry</Text>
          <TextInput
            key="content-input"
            style={styles.contentInput}
            value={content}
            onChangeText={handleContentChange}
            placeholder="Write about your day..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            autoFocus={false}
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={true}
            autoCorrect={false}
            autoCapitalize="sentences"
            onFocus={() => console.log("Content input focused")}
            onBlur={() => console.log("Content input blurred")}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What did I accomplish today?</Text>
          <TextInput
            style={styles.input}
            value={accomplishments}
            onChangeText={handleAccomplishmentsChange}
            placeholder="List your accomplishments..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={true}
            scrollEnabled={true}
            onFocus={() => console.log("Accomplishments input focused")}
            onBlur={() => console.log("Accomplishments input blurred")}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What&apos;s holding me back?</Text>
          <TextInput
            style={styles.input}
            value={blockers}
            onChangeText={handleBlockersChange}
            placeholder="Identify obstacles..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={true}
            scrollEnabled={true}
            onFocus={() => console.log("Blockers input focused")}
            onBlur={() => console.log("Blockers input blurred")}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>What am I grateful for?</Text>
          <TextInput
            style={styles.input}
            value={gratitude}
            onChangeText={handleGratitudeChange}
            placeholder="Express gratitude..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={true}
            scrollEnabled={true}
            onFocus={() => console.log("Gratitude input focused")}
            onBlur={() => console.log("Gratitude input blurred")}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Who did I value or serve today?</Text>
          <TextInput
            style={styles.input}
            value={valueServed}
            onChangeText={handleValueServedChange}
            placeholder="Reflect on your impact..."
            placeholderTextColor={colors.textSecondary}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            enablesReturnKeyAutomatically={true}
            scrollEnabled={true}
            onFocus={() => console.log("Value served input focused")}
            onBlur={() => console.log("Value served input blurred")}
          />
        </View>
        
        <View style={styles.xpNotice}>
          <Text style={styles.xpText}>+10 XP for completing this entry</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    flex: 1,
    paddingBottom: 100,
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