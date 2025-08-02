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
  Platform,
  Alert,
} from 'react-native';
import { X, Trash, Plus } from 'lucide-react-native'; // ✅ Updated to use Trash
import colors from '@/constants/colors';
import { Goal, Task } from '@/types';
import { useDigmStore } from '@/hooks/useDigmStore';
import SmartGoalTemplate from './SmartGoalTemplate';

interface EditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSave: (updatedGoal: Goal, updatedTasks: Task[]) => void;
  onDelete?: (goalId: string) => void;
}

export default function EditGoalModal({
  visible,
  onClose,
  goal,
  onSave,
  onDelete,
}: EditGoalModalProps) {
  const { tasks, deleteGoal } = useDigmStore();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);
  const [smartGoalData, setSmartGoalData] = useState({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  });
  const [goalTasks, setGoalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!goal || !visible) return;

    setTitle(goal.title);
    try {
      const date = new Date(goal.dueDate);
      setDueDate(date.toLocaleDateString('en-US'));
    } catch {
      setDueDate(goal.dueDate);
    }

    setSmartGoalData({
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      timeBound: goal.timeBound || '',
    });

    const associatedTasks = tasks.filter(t => t.goalId === goal.id);
    if (associatedTasks.length > 0) {
      setGoalTasks(associatedTasks);
    } else {
      setGoalTasks([
        {
          id: '',
          title: '',
          goalId: goal.id,
          status: 'open',
          isHighImpact: false,
          isCompleted: false,
          xpReward: 5,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [goal, tasks, visible]);

  const handleAddTask = () => {
    setGoalTasks(prev => [
      ...prev,
      {
        id: '',
        title: '',
        goalId: goal?.id || '',
        status: 'open',
        isHighImpact: false,
        isCompleted: false,
        xpReward: 5,
        createdAt: new Date().toISOString(),
      },
    ]);
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
    const task = newTasks[index];
    task.isHighImpact = !task.isHighImpact;
    task.xpReward = task.isHighImpact ? 15 : 5;
    setGoalTasks(newTasks);
  };

  const handleSubmit = () => {
    if (!title.trim() || !goal) return;

    let formattedDueDate = dueDate;
    if (dueDate.includes('/')) {
      try {
        const [month, day, year] = dueDate.split('/');
        const date = new Date(
          parseInt(year.length === 2 ? `20${year}` : year),
          parseInt(month) - 1,
          parseInt(day)
        );
        formattedDueDate = date.toISOString();
      } catch {
        console.warn('Invalid date format');
      }
    }

    const validTasks: Task[] = goalTasks
      .filter(t => t.title.trim())
      .map(task => ({
        ...task,
        id: task.id || `task${Date.now()}-${Math.random().toString(36).slice(2)}`,
        goalId: goal.id,
        createdAt: task.createdAt || new Date().toISOString(),
        completedAt: task.isCompleted ? task.completedAt || new Date().toISOString() : undefined,
      }));

    const updatedGoal: Goal = {
      ...goal,
      title,
      dueDate: formattedDueDate,
      tasks: validTasks.map(t => t.id),
      ...smartGoalData,
    };

    onSave(updatedGoal, validTasks);
    onClose();
  };

  const handleDeleteGoal = () => {
    if (!goal) return;

    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const id = goal.id;
          console.log('Deleting goal:', id);
          if (onDelete) {
            console.log('Using onDelete prop to delete goal');
            onDelete(id);
          } else {
            console.log('Using deleteGoal from store');
            deleteGoal(id);
          }
          onClose();
        },
      },
    ]);
  };

  const getTimeframeLabel = () => {
    switch (goal?.timeframe) {
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit {getTimeframeLabel()} Goal</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.label}>Goal Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter goal title"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Tasks</Text>
            {goalTasks.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={styles.taskInputRow}>
                  <TextInput
                    style={styles.taskInput}
                    value={task.title}
                    onChangeText={(text: string) => handleTaskChange(text, index)}
                    placeholder="Enter task"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity onPress={() => handleRemoveTask(index)}>
                    <Trash color={colors.error} size={20} /> {/* ✅ Fixed icon */}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.highImpactButton,
                    task.isHighImpact && styles.highImpactButtonActive,
                  ]}
                  onPress={() => handleToggleHighImpact(index)}
                >
                  <Text
                    style={[
                      styles.highImpactText,
                      task.isHighImpact && styles.highImpactTextActive,
                    ]}
                  >
                    {task.isHighImpact ? '🔥 High Impact' : 'Mark as High Impact'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
              <Plus color={colors.primary} size={18} />
              <Text style={styles.addTaskText}>Add Another Task</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteButton}>
              <Trash color={colors.error} size={18} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {goal && (
        <SmartGoalTemplate
          visible={smartGoalModalVisible}
          onClose={() => setSmartGoalModalVisible(false)}
          timeframe={goal.timeframe}
          initialGoal={goal}
          onSave={(updatedGoalData, updatedTasksData) => {
            const updatedGoal: Goal = { ...goal, ...updatedGoalData };
            const updatedTasks: Task[] = updatedTasksData.map(t => ({
              ...t,
              id: t.id || `task${Date.now()}-${Math.random().toString(36).slice(2)}`,
              goalId: goal.id,
              createdAt: t.createdAt || new Date().toISOString(),
            }));
            onSave(updatedGoal, updatedTasks);
            setSmartGoalModalVisible(false);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingBottom: 10,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    padding: 16,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
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
    marginRight: 8,
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  highImpactButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highImpactButtonActive: {
    backgroundColor: colors.accent,
  },
  highImpactText: {
    color: colors.accent,
    fontWeight: '500',
  },
  highImpactTextActive: {
    color: '#ffffff',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addTaskText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    marginLeft: 6,
    color: colors.error,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButtonText: {
    marginRight: 12,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
});