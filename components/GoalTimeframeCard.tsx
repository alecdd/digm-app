import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Alert } from "react-native";
import { Edit2, Pin, PinOff } from "lucide-react-native";
import colors from "@/constants/colors";
import { Goal } from "@/types";
import { useDigmStore } from "@/hooks/useDigmStore";

interface GoalTimeframeCardProps {
  title: string;
  goals: Goal[];
  onAddGoal: () => void;
}

export default function GoalTimeframeCard({ title, goals, onAddGoal }: GoalTimeframeCardProps) {
  const { updateGoal, pinnedGoalIds, togglePinGoal } = useDigmStore();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditedTitle(goal.title);
    setEditModalVisible(true);
  };
  
  const handleSaveEdit = () => {
    if (editingGoal && editedTitle.trim()) {
      updateGoal({
        ...editingGoal,
        title: editedTitle.trim()
      });
      setEditModalVisible(false);
    } else {
      Alert.alert("Error", "Goal title cannot be empty");
    }
  };
  
  const handleTogglePin = (goalId: string) => {
    togglePinGoal(goalId);
  };
  return (
    <View style={styles.container} testID={`timeframe-${title}`}>
      <Text style={styles.title}>{title}</Text>
      
      {goals.length > 0 ? (
        goals.map((goal) => (
          <View key={goal.id} style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.goalActions}>
                <TouchableOpacity 
                  onPress={() => handleTogglePin(goal.id)}
                  style={styles.actionButton}
                >
                  {pinnedGoalIds.includes(goal.id) ? (
                    <Pin size={16} color={colors.primary} fill={colors.primary} />
                  ) : (
                    <PinOff size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleEditGoal(goal)}
                  style={styles.actionButton}
                >
                  <Edit2 size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.goalProgress}>{goal.progress}%</Text>
              </View>
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
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No goals for this timeframe</Text>
      )}
      
      <TouchableOpacity style={styles.addButton} onPress={onAddGoal}>
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>
      
      {/* Edit Goal Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            <TextInput
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Goal title"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  goalItem: {
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  goalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  goalProgress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  progressContainer: {
    height: 6,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: colors.progressBackground,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.progressBar,
    borderRadius: 3,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 8,
  },
  addButton: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.cardLight,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});