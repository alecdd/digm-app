import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { X, CheckCircle, Calendar, Target, Trash2, Edit } from '@/lib/icons';
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
  goal
}: GoalDetailModalProps) {
  const { tasks, updateGoal, updateTask, addTask, deleteGoal } = useDigmStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);

  if (!goal) return null;

  const goalTasks = tasks.filter(task => task.goalId === goal.id);
  const completedTasks = goalTasks.filter(task => task.status === 'done');
  const pendingTasks = goalTasks.filter(task => task.status !== 'done');
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getTimeframeLabel = () => {
    switch (goal.timeframe) {
      case '10year': return '10-Year Vision';
      case '5year': return '5-Year Goal';
      case '1year': return '1-Year Goal';
      case '3month': return '3-Month Goal';
      case '1month': return '1-Month Goal';
      case '1week': return '1-Week Goal';
      default: return 'Goal';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{goal.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Target size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>{getTimeframeLabel()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Calendar size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Due: {formatDate(goal.dueDate)}</Text>
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progress</Text>
                  <Text style={styles.progressPercentage}>{goal.progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${goal.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressStats}>
                  {completedTasks.length} of {goalTasks.length} tasks completed
                </Text>
              </View>
            </View>

            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              
              {pendingTasks.length > 0 && (
                <View style={styles.taskGroup}>
                  <Text style={styles.taskGroupTitle}>Pending</Text>
                  {pendingTasks.map(task => (
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
                  {completedTasks.map(task => (
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

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => {
                Alert.alert(
                  'Delete Goal',
                  'Are you sure you want to delete this goal? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        if (goal) {
                          // Delete the goal from the store
                          deleteGoal(goal.id);
                          onClose();
                        }
                      } 
                    },
                  ]
                );
              }}
            >
              <Trash2 color={colors.error} size={20} />
              <Text style={styles.deleteButtonText}>Delete Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => {
                // If the goal has SMART fields, use the SmartGoalTemplate
                if (goal?.specific || goal?.measurable || goal?.achievable || goal?.relevant || goal?.timeBound) {
                  setSmartGoalModalVisible(true);
                } else {
                  setEditModalVisible(true);
                }
              }}
            >
              <Edit color={colors.text} size={20} />
              <Text style={styles.editButtonText}>Edit Goal</Text>
            </TouchableOpacity>
          </View>
          
          <EditGoalModal
            visible={editModalVisible}
            onClose={() => setEditModalVisible(false)}
            goal={goal}
            onSave={(updatedGoal, updatedTasks) => {
              // Update the goal
              updateGoal(updatedGoal);
              
              // Update or add tasks
              updatedTasks.forEach(task => {
                updateTask(task);
              });
              
              // Close the edit modal
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
              onSave={(updatedGoalData, updatedTasksData) => {
                // Create updated goal object with existing ID and progress
                const updatedGoal: Goal = {
                  ...goal,
                  ...updatedGoalData,
                };
                
                // Update the goal
                updateGoal(updatedGoal);
                
                // Get existing tasks for this goal
                const existingTasks = tasks.filter(task => task.goalId === goal.id);
                // Get existing tasks for reference
                
                // Create or update tasks
                updatedTasksData.forEach(taskData => {
                  // Find if this task already exists (by title match)
                  const existingTask = existingTasks.find(t => t.title === taskData.title);
                  
                  if (existingTask) {
                    // Update existing task
                    updateTask({
                      ...existingTask,
                      isHighImpact: taskData.isHighImpact,
                      xpReward: taskData.xpReward
                    });
                  } else {
                    // Add new task
                    const newTask = {
                      ...taskData,
                      goalId: goal.id,
                    };
                    const addedTask = addTask(newTask);
                    
                    // Update goal's tasks array
                    updateGoal({
                      ...updatedGoal,
                      tasks: [...updatedGoal.tasks, addedTask.id]
                    });
                  }
                });
                
                // Close the modal
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