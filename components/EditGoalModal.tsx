import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Goal, Task } from '@/types';
import { useDigmStore } from '@/hooks/useDigmStore';

interface EditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSave: (updatedGoal: Goal, updatedTasks: Task[]) => void;
}

export default function EditGoalModal({ 
  visible, 
  onClose, 
  goal,
  onSave
}: EditGoalModalProps) {
  const { tasks } = useDigmStore();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [goalTasks, setGoalTasks] = useState<{
    id?: string;
    title: string;
    isHighImpact: boolean;
    status: 'open' | 'inProgress' | 'done';
    isCompleted: boolean;
    xpReward: number;
  }[]>([]);

  // Load goal data when modal opens
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      
      // Format date for display
      try {
        const date = new Date(goal.dueDate);
        setDueDate(date.toLocaleDateString('en-US'));
      } catch {
        setDueDate(goal.dueDate);
      }
      
      // Load tasks associated with this goal
      const associatedTasks = tasks.filter(task => task.goalId === goal.id);
      
      if (associatedTasks.length > 0) {
        setGoalTasks(associatedTasks.map(task => ({
          id: task.id,
          title: task.title,
          isHighImpact: task.isHighImpact,
          status: task.status,
          isCompleted: task.isCompleted,
          xpReward: task.xpReward
        })));
      } else {
        setGoalTasks([{ title: '', isHighImpact: false, status: 'open', isCompleted: false, xpReward: 5 }]);
      }
    }
  }, [goal, tasks, visible]);

  const handleAddTask = () => {
    setGoalTasks([...goalTasks, { title: '', isHighImpact: false, status: 'open', isCompleted: false, xpReward: 5 }]);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = [...goalTasks];
    newTasks.splice(index, 1);
    setGoalTasks(newTasks);
  };

  const handleTaskChange = (text: string, index: number) => {
    const newTasks = [...goalTasks];
    newTasks[index].title = text;
    setGoalTasks(newTasks);
  };

  const handleToggleHighImpact = (index: number) => {
    const newTasks = [...goalTasks];
    newTasks[index].isHighImpact = !newTasks[index].isHighImpact;
    newTasks[index].xpReward = newTasks[index].isHighImpact ? 15 : 5;
    setGoalTasks(newTasks);
  };

  const handleSubmit = () => {
    if (!title.trim() || !goal) {
      return;
    }

    // Format due date if needed
    let formattedDueDate = dueDate;
    if (dueDate.includes('/')) {
      // Convert MM/DD/YYYY to ISO format
      try {
        const parts = dueDate.split('/');
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
        const date = new Date(year, month, day);
        formattedDueDate = date.toISOString();
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    // Filter out empty tasks
    const validTasks = goalTasks
      .filter(task => task.title.trim())
      .map(task => ({
        ...task,
        id: task.id || `task${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        goalId: goal.id,
        createdAt: new Date().toISOString(),
      }));

    // Create updated goal object
    const updatedGoal: Goal = {
      ...goal,
      title,
      dueDate: formattedDueDate,
      tasks: validTasks.map(task => task.id || ''),
    };

    // Convert task objects to proper Task type
    const updatedTasks = validTasks.map(task => ({
      id: task.id || '',
      title: task.title,
      status: task.status,
      isHighImpact: task.isHighImpact,
      isCompleted: task.isCompleted,
      goalId: goal.id,
      xpReward: task.xpReward,
      createdAt: task.id ? tasks.find(t => t.id === task.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      completedAt: task.isCompleted ? tasks.find(t => t.id === task.id)?.completedAt || new Date().toISOString() : undefined,
    }));

    onSave(updatedGoal, updatedTasks);
    onClose();
  };

  const getTimeframeLabel = () => {
    if (!goal) return '';
    
    switch (goal.timeframe) {
      case '10year': return '10-Year';
      case '5year': return '5-Year';
      case '1year': return '1-Year';
      case '3month': return '3-Month';
      case '1month': return '1-Month';
      case '1week': return '1-Week';
      default: return '';
    }
  };

  if (!goal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit {getTimeframeLabel()} Goal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Goal Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter goal title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tasks</Text>
              <Text style={styles.helperText}>
                Edit existing tasks or add new ones to help achieve this goal.
              </Text>

              {goalTasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.taskInputRow}>
                    <TextInput
                      style={styles.taskInput}
                      value={task.title}
                      onChangeText={(text) => handleTaskChange(text, index)}
                      placeholder="Enter task"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity 
                      onPress={() => handleRemoveTask(index)}
                      style={styles.removeButton}
                    >
                      <Trash2 color={colors.error} size={20} />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.highImpactButton, 
                      task.isHighImpact && styles.highImpactButtonActive
                    ]}
                    onPress={() => handleToggleHighImpact(index)}
                  >
                    <Text style={[
                      styles.highImpactText,
                      task.isHighImpact && styles.highImpactTextActive
                    ]}>
                      {task.isHighImpact ? '🔥 High Impact' : 'Mark as High Impact'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
                <Plus color={colors.primary} size={20} />
                <Text style={styles.addTaskText}>Add Another Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 16,
    maxHeight: '70%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  taskItem: {
    marginBottom: 12,
  },
  taskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  highImpactButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.flame,
    alignSelf: 'flex-start',
  },
  highImpactButtonActive: {
    backgroundColor: colors.flame,
  },
  highImpactText: {
    color: colors.flame,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  highImpactTextActive: {
    color: colors.text,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  addTaskText: {
    color: colors.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});