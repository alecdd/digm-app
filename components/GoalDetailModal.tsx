import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {
  X,
  CheckCircle,
  Calendar,
  Target,
  Edit,
  Trash2,
} from '@/lib/icons';
import colors from '@/constants/colors';
import { Goal } from '@/types';
import { useDigmStore } from '@/hooks/useDigmStore';
import EditGoalModal from './EditGoalModal';
import SmartGoalTemplate from './SmartGoalTemplate';

interface GoalDetailModalProps {
  visible: boolean;
  onClose: () => void;
  goal?: Goal;
}

export default function GoalDetailModal({
  visible,
  onClose,
  goal,
}: GoalDetailModalProps) {
  const {
    tasks,
    updateGoal,
    updateTask,
    addTask,
    deleteGoal,
  } = useDigmStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);

  if (!goal) return null;

  const goalTasks = tasks.filter((task) => task.goalId === goal.id);
  const completedTasks = goalTasks.filter((task) => task.status === 'done');
  const pendingTasks = goalTasks.filter((task) => task.status !== 'done');

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('GoalDetailModal - Deleting goal:', goal.id);
            deleteGoal(goal.id);
            setTimeout(() => {
              console.log('Deletion complete, closing modal...');
              onClose();
            }, 50);
          },
        },
      ]
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeframeLabel = () => {
    const map: { [key: string]: string } = {
      '10year': '10-Year Vision',
      '5year': '5-Year Goal',
      '1year': '1-Year Goal',
      '3month': '3-Month Goal',
      '1month': '1-Month Goal',
      '1week': '1-Week Goal',
    };
    return map[goal.timeframe] || 'Goal';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{goal.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Target size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>{getTimeframeLabel()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Calendar size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>
                    Due: {formatDate(goal.dueDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {goal.progress}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[styles.progressBar, { width: `${goal.progress}%` }]}
                  />
                </View>
                <Text style={styles.progressStats}>
                  {completedTasks.length} of {goalTasks.length} tasks completed
                </Text>
              </View>
            </View>

            {/* Tasks */}
            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>Tasks</Text>

              {pendingTasks.length > 0 && (
                <View style={styles.taskGroup}>
                  <Text style={styles.taskGroupTitle}>Pending</Text>
                  {pendingTasks.map((task) => (
                    <View key={task.id} style={styles.taskItem}>
                      <View style={styles.taskStatus} />
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.isHighImpact && (
                        <View style={styles.highImpactBadge}>
                          <Text style={styles.highImpactText}>🔥 High Impact</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {completedTasks.length > 0 && (
                <View style={styles.taskGroup}>
                  <Text style={styles.taskGroupTitle}>Completed</Text>
                  {completedTasks.map((task) => (
                    <View key={task.id} style={styles.taskItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.taskTitle, styles.completedTaskTitle]}>
                        {task.title}
                      </Text>
                      {task.isHighImpact && (
                        <View style={styles.highImpactBadge}>
                          <Text style={styles.highImpactText}>🔥 High Impact</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {goalTasks.length === 0 && (
                <Text style={styles.emptyText}>No tasks associated with this goal</Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={20} color={colors.error} />
              <Text style={styles.deleteButtonText}>Delete Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Edit size={20} color={colors.text} />
              <Text style={styles.editButtonText}>Edit Goal</Text>
            </TouchableOpacity>
          </View>

          {/* Modals */}
          <EditGoalModal
            visible={editModalVisible}
            onClose={() => setEditModalVisible(false)}
            goal={goal}
            onSave={(updatedGoal, updatedTasks) => {
              updateGoal(updatedGoal);
              updatedTasks.forEach(updateTask);
              setEditModalVisible(false);
            }}
            onDelete={(goalId) => {
              deleteGoal(goalId);
              onClose();
            }}
          />

          {goal && (
            <SmartGoalTemplate
              visible={smartGoalModalVisible}
              onClose={() => setSmartGoalModalVisible(false)}
              timeframe={goal.timeframe}
              initialGoal={goal}
              onSave={(goalData, tasksData) => {
                updateGoal({ ...goal, ...goalData });
                tasksData.forEach(task => {
                  const existing = tasks.find(t => t.title === task.title);
                  existing
                    ? updateTask({ ...existing, ...task })
                    : addTask({ ...task, goalId: goal.id });
                });
                setSmartGoalModalVisible(false);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 16,
    maxHeight: '70%',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    marginLeft: 8,
    color: colors.text,
    fontSize: 14,
  },
  progressContainer: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.progressBar,
    borderRadius: 4,
  },
  progressStats: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  tasksSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  taskGroup: {
    marginBottom: 16,
  },
  taskGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskStatus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  taskTitle: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  highImpactBadge: {
    backgroundColor: colors.flame,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highImpactText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 12,
  },
  editButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});