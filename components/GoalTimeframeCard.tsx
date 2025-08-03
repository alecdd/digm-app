import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Edit, Pin, PinOff, Eye } from 'lucide-react-native';
import colors from "@/constants/colors";
import { Goal } from "@/types";
import { useDigmStore } from "@/hooks/useDigmStore";
import SmartGoalTemplate from "./SmartGoalTemplate";
import GoalDetailModal from "./GoalDetailModal";
import EditGoalModal from "./EditGoalModal";

interface GoalTimeframeCardProps {
  title: string;
  goals: Goal[];
  onAddGoal: () => void;
}

export default function GoalTimeframeCard({ title, goals, onAddGoal }: GoalTimeframeCardProps) {
  const { updateGoal, pinnedGoalIds, togglePinGoal, addGoal, updateTask, deleteGoal } = useDigmStore();
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [viewingGoal, setViewingGoal] = useState<Goal | undefined>(undefined);
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditModalVisible(true);
  };

  const handleViewGoal = (goal: Goal) => {
    setViewingGoal(goal);
    setDetailModalVisible(true);
  };

  const handleSaveGoal = (goalData: Omit<Goal, "id" | "progress" | "tasks">, tasks: any[]) => {
    if (editingGoal) {
      updateGoal({
        ...editingGoal,
        title: goalData.title,
        dueDate: goalData.dueDate,
        timeframe: goalData.timeframe
      });
    } else {
      addGoal(goalData, tasks);
    }
    setSmartGoalModalVisible(false);
    setEditingGoal(undefined);
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
                  <Edit size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewGoal(goal)}
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
          setEditingGoal(undefined);
          setSmartGoalModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>

      <SmartGoalTemplate
        visible={smartGoalModalVisible}
        onClose={() => {
          setSmartGoalModalVisible(false);
          setEditingGoal(undefined);
        }}
        onSave={handleSaveGoal}
        timeframe={getTimeframeFromTitle()}
        initialGoal={undefined}
      />

      {editingGoal && (
        <EditGoalModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setEditingGoal(undefined);
          }}
          goal={editingGoal}
          onSave={(updatedGoal, updatedTasks) => {
            updateGoal(updatedGoal);
            updatedTasks.forEach(task => {
              updateTask(task);
            });
            setEditModalVisible(false);
            setEditingGoal(undefined);
          }}
          onDelete={(goalId) => {
            console.log('GoalTimeframeCard - Deleting goal with ID:', goalId);
            deleteGoal(goalId);
            setTimeout(() => {
              console.log('GoalTimeframeCard - Forcing save after deletion');
            }, 100);
            setEditModalVisible(false);
            setEditingGoal(undefined);
          }}
        />
      )}

      <GoalDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setViewingGoal(undefined);
        }}
        goal={viewingGoal ?? null}
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
});
