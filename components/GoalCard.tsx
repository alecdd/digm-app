import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import colors from "@/constants/colors";
import { Goal } from "@/types";
import GoalDetailModal from "./GoalDetailModal";

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  // Format date to MM/DD/YY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        testID={`goal-card-${goal.id}`}
        onPress={() => setDetailModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={styles.date}>{formatDate(goal.dueDate)}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${goal.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{goal.progress}%</Text>
        </View>
      </TouchableOpacity>
      
      <GoalDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        goal={goal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBackground: {
    height: 8,
    backgroundColor: colors.progressBackground,
    borderRadius: 4,
    flex: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.progressBar,
    borderRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    width: 40,
    textAlign: "right",
  },
});