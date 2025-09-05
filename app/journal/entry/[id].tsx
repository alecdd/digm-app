import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";
import { ChevronRight, Edit as EditIcon, Check as CheckIcon, Trash as TrashIcon } from "@/lib/icons";

export default function JournalEntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { journalEntries, deleteJournalEntry, updateJournalEntry } = useDigmStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [accomplishments, setAccomplishments] = React.useState("");
  const [blockers, setBlockers] = React.useState("");
  const [gratitude, setGratitude] = React.useState("");
  const [valueServed, setValueServed] = React.useState("");
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  
  const entry = journalEntries.find(entry => entry.id === id);
  
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

  // Seed local editable fields when entry loads or id changes
  React.useEffect(() => {
    if (entry) {
      setContent(entry.content ?? "");
      setAccomplishments(entry.accomplishments ?? "");
      setBlockers(entry.blockers ?? "");
      setGratitude(entry.gratitude ?? "");
      setValueServed(entry.valueServed ?? "");
    }
  }, [id, entry?.content, entry?.accomplishments, entry?.blockers, entry?.gratitude, entry?.valueServed]);

  // Keep lower inputs visible above the keyboard
  React.useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e: any) => {
      setKeyboardHeight(e?.endCoordinates?.height ?? 300);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToEndOnFocus = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
      <View style={styles.headerSection}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={20} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Journal Entry</Text>
        {isEditing ? (
          <TouchableOpacity
            onPress={async () => {
              if (!entry) return;
              await updateJournalEntry(entry.id, {
                content,
                accomplishments,
                blockers,
                gratitude,
                valueServed,
              });
              setIsEditing(false);
            }}
            style={styles.editBtn}
          >
            <CheckIcon size={18} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
            <EditIcon size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 24 + keyboardHeight }}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        testID={`journal-detail-${id}`}
      >
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      {entry ? (
        <>
          <View style={styles.header}>
            <Text style={styles.date}>{formatDate(entry.date)}</Text>
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>+{entry.xpEarned} XP</Text>
            </View>
          </View>
          <View style={styles.contentSection}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                multiline
                editable
                placeholder="Write your thoughts..."
                placeholderTextColor={colors.textSecondary}
                onFocus={scrollToEndOnFocus}
              />
            ) : (
              <Text style={styles.content}>{content || ""}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accomplishments</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={accomplishments}
                onChangeText={setAccomplishments}
                multiline
                placeholder="What did you accomplish today?"
                placeholderTextColor={colors.textSecondary}
                onFocus={scrollToEndOnFocus}
              />
            ) : (
              <Text style={styles.sectionContent}>{accomplishments || "None recorded"}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blockers</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={blockers}
                onChangeText={setBlockers}
                multiline
                placeholder="What got in your way?"
                placeholderTextColor={colors.textSecondary}
                onFocus={scrollToEndOnFocus}
              />
            ) : (
              <Text style={styles.sectionContent}>{blockers || "None recorded"}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gratitude</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={gratitude}
                onChangeText={setGratitude}
                multiline
                placeholder="What are you grateful for?"
                placeholderTextColor={colors.textSecondary}
                onFocus={scrollToEndOnFocus}
              />
            ) : (
              <Text style={styles.sectionContent}>{gratitude || "None recorded"}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Value Served</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={valueServed}
                onChangeText={setValueServed}
                multiline
                placeholder="How did you create value?"
                placeholderTextColor={colors.textSecondary}
                onFocus={scrollToEndOnFocus}
              />
            ) : (
              <Text style={styles.sectionContent}>{valueServed || "None recorded"}</Text>
            )}
          </View>
          <View style={[styles.section, { alignItems: 'flex-end' }]}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete entry', 'Are you sure you want to delete this journal entry?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      await deleteJournalEntry(entry.id);
                    } finally {
                      router.back();
                    }
                  } }
                ]);
              }}
              style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <TrashIcon size={16} color={colors.text} />
              <Text style={{ color: colors.text }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Journal entry not found</Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 6 },
  editBtn: { padding: 6 },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
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
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.card,
  },
});