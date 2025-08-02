import React, { useState } from 'react';
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
import { Goal } from '@/types';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'tasks'>, tasks: {
    title: string;
    status: 'open';
    isHighImpact: boolean;
    isCompleted: boolean;
    xpReward: number;
  }[]) => void;
  timeframe: Goal['timeframe'];
}

export default function AddGoalModal({ 
  visible, 
  onClose, 
  onAddGoal,
  timeframe 
}: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<{
    title: string;
    isHighImpact: boolean;
  }[]>([{ title: '', isHighImpact: false }]);

  const handleAddTask = () => {
    setTasks([...tasks, { title: '', isHighImpact: false }]);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  const handleTaskChange = (text: string, index: number) => {
    const newTasks = [...tasks];
    newTasks[index].title = text;
    setTasks(newTasks);
  };

  const handleToggleHighImpact = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].isHighImpact = !newTasks[index].isHighImpact;
    setTasks(newTasks);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      // Show error or validation message
      return;
    }

    // Format due date if not provided
    const formattedDueDate = dueDate.trim() || new Date().toISOString();

    // Filter out empty tasks
    const validTasks = tasks
      .filter(task => task.title.trim())
      .map(task => ({
        title: task.title,
        status: 'open' as const,
        isHighImpact: task.isHighImpact,
        isCompleted: false,
        xpReward: task.isHighImpact ? 15 : 5,
      }));

    onAddGoal(
      {
        title,
        dueDate: formattedDueDate,
        timeframe,
      },
      validTasks
    );

    // Reset form
    setTitle('');
    setDueDate('');
    setTasks([{ title: '', isHighImpact: false }]);
    onClose();
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '10year': return '10-Year';
      case '5year': return '5-Year';
      case '1year': return '1-Year';
      case '3month': return '3-Month';
      case '1month': return '1-Month';
      case '1week': return '1-Week';
      default: return '';
    }
  };

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
            <Text style={styles.headerTitle}>Add {getTimeframeLabel()} Goal</Text>
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
              <Text style={styles.label}>Due Date (optional)</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tasks to Achieve This Goal</Text>
              <Text style={styles.helperText}>
                Add tasks that will help you achieve this goal. They&apos;ll be added to your backlog.
              </Text>

              {tasks.map((task, index) => (
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
              <Text style={styles.submitButtonText}>Create Goal</Text>
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
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontWeight: '600',
  },
});