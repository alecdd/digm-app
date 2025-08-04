import React, { useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";
import JournalEntryCard from "@/components/JournalEntryCard";
import GoalCompletionEffect from "@/components/GoalCompletionEffect";

export default function JournalScreen() {
  const { journalEntries, completedGoal, clearCompletedGoal } = useDigmStore();
  const router = useRouter();

  const handleNewEntry = useCallback(() => {
    router.push("/journal/new-entry");
  }, [router]);

  const handleEntryPress = useCallback((entryId: string) => {
    router.push(`/journal/entry/${entryId}`);
  }, [router]);

  return (
    <View style={styles.container} testID="journal-screen">
      <Stack.Screen options={{ title: "📓 DIGMSHIFT Journal" }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.newEntryButton} 
          onPress={handleNewEntry}
        >
          <Plus color={colors.text} size={20} />
          <Text style={styles.newEntryText}>New Entry</Text>
        </TouchableOpacity>
      </View>
      
      {journalEntries.length > 0 ? (
        <FlatList
          data={journalEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JournalEntryCard
              entry={item}
              onPress={() => handleEntryPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No journal entries yet. Start reflecting on your day!
          </Text>
        </View>
      )}
      
      {/* Goal Completion Effect */}
      {completedGoal && (
        <GoalCompletionEffect
          visible={!!completedGoal}
          goalTitle={completedGoal.title}
          onAnimationEnd={clearCompletedGoal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newEntryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  newEntryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});