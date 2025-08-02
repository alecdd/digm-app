import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, GestureResponderEvent } from "react-native";
import Edit from 'lucide-react-native/dist/esm/icons/edit';
import Pin from 'lucide-react-native/dist/esm/icons/pin';
import PinOff from 'lucide-react-native/dist/esm/icons/pin-off';
import Eye from 'lucide-react-native/dist/esm/icons/eye';
import colors from "@/constants/colors";
import { Goal } from "@/types";
import { useDigmStore } from "@/hooks/useDigmStore";
import SmartGoalTemplate from "./SmartGoalTemplate";
import GoalDetailModal from "./GoalDetailModal";

interface GoalTimeframeCardProps {
  title: string;
  goals: Goal[];
  onAddGoal: () => void;
}

export default function GoalTimeframeCard({ title, goals, onAddGoal }: GoalTimeframeCardProps) {
  const { updateGoal, pinnedGoalIds, togglePinGoal, addGoal } = useDigmStore();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setSmartGoalModalVisible(true);
  };
  
  const handleViewGoal = (goal: Goal) => {
    setViewingGoal(goal);
    setDetailModalVisible(true);
  };
  
  const handleSaveGoal = (goalData: Omit<Goal, "id" | "progress" | "tasks">, tasks: any[]) => {
    if (editingGoal) {
      // Update existing goal
      updateGoal({
        ...editingGoal,
        title: goalData.title,
        dueDate: goalData.dueDate,
        timeframe: goalData.timeframe
      });
      
      // We don't handle tasks here as they're managed separately in the store
    } else {
      // Add new goal
      addGoal(goalData, tasks);
    }
    setSmartGoalModalVisible(false);
    setEditingGoal(null);
  };
  
  const handleTogglePin = (goalId: string) => {
    togglePinGoal(goalId);
  };

  const getTimeframeFromTitle = (): Goal["timeframe"] => {
    switch (title) {
      case "10-Year Vision": return "10year";
      case "5-Year Goals": return "5year";
      case "1-Year Goals": return "1year";
      case "3-Month Goals": return "3month";
      case "1-Month Goals": return "1month";
      case "1-Week Goals": return "1week";
      default: return "1week";
    }
  };
  
  return (
    <View style={styles.container} testID={`timeframe-${title}`}>
      <Text style={styles.title}>{title}</Text>
      
      {goals.length > 0 ? (
        goals.map((goal) => (
          <TouchableOpacity 
            key={goal.id} 
            style={styles.goalItem}
            onPress={() => handleViewGoal(goal)}
            activeOpacity={0.7}
          >
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.goalActions}>
                <TouchableOpacity 
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    handleTogglePin(goal.id);
                  }}
                  style={styles.actionButton}
                >
                  {pinnedGoalIds.includes(goal.id) ? (
                    <Pin size={16} color={colors.primary} fill={colors.primary} />
                  ) : (
                    <PinOff size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    handleEditGoal(goal);
                  }}
                  style={styles.actionButton}
                >
                  <Edit size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    handleViewGoal(goal);
                  }}
                  style={styles.actionButton}
                >
                  <Eye size={16} color={colors.textSecondary} />
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
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No goals for this timeframe</Text>
      )}
      
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
          setEditingGoal(null);
          setSmartGoalModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>
      
      {/* SMART Goal Template Modal */}
      <SmartGoalTemplate
        visible={smartGoalModalVisible}
        onClose={() => {
          setSmartGoalModalVisible(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        timeframe={editingGoal?.timeframe || getTimeframeFromTitle()}
        initialGoal={editingGoal || undefined}
      />
      
      {/* Goal Detail Modal */}
      <GoalDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setViewingGoal(null);
        }}
        goal={viewingGoal}
        onEdit={() => {
          setDetailModalVisible(false);
          if (viewingGoal) {
            handleEditGoal(viewingGoal);
          }
        }}
      />
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