import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { X, Check, HelpCircle } from '@/lib/icons';
import colors from '@/constants/colors';
import { Goal } from '@/types';
import { useDigmStore } from '@/hooks/useDigmStore';

interface SmartGoalTemplateProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'progress' | 'tasks'>, tasks: {
    title: string;
    status: 'open';
    isHighImpact: boolean;
    isCompleted: boolean;
    xpReward: number;
  }[]) => void;
  timeframe: Goal['timeframe'];
  initialGoal?: Goal;
}

export default function SmartGoalTemplate({
  visible,
  onClose,
  onSave,
  timeframe,
  initialGoal
}: SmartGoalTemplateProps) {
  const { tasks: allTasks } = useDigmStore();
  const [title, setTitle] = useState(initialGoal?.title || '');
  const [specific, setSpecific] = useState('');
  const [measurable, setMeasurable] = useState('');
  const [achievable, setAchievable] = useState('');
  const [relevant, setRelevant] = useState('');
  const [timeBound, setTimeBound] = useState('');
  const [dueDate, setDueDate] = useState(initialGoal?.dueDate || '');
  const [tasks, setTasks] = useState<{
    title: string;
    isHighImpact: boolean;
  }[]>([{ title: '', isHighImpact: false }]);
  
  // Load existing tasks when editing a goal
  useEffect(() => {
    if (initialGoal) {
      // If we're editing an existing goal, load its tasks
      const existingTasks = allTasks
        .filter(task => task.goalId === initialGoal.id)
        .map(task => ({
          title: task.title,
          isHighImpact: task.isHighImpact
        }));
      
      if (existingTasks.length > 0) {
        setTasks(existingTasks);
      }
    }
  }, [initialGoal, allTasks]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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

  const toggleTooltip = (tooltipName: string) => {
    if (activeTooltip === tooltipName) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(tooltipName);
    }
  };

  const generateGoalTitle = () => {
    if (!specific || !measurable) {
      Alert.alert('Missing Information', 'Please fill in at least the Specific and Measurable fields to generate a goal title.');
      return;
    }

    const generatedTitle = `${specific} ${measurable}`;
    setTitle(generatedTitle);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please provide a goal title.');
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

    onSave(
      {
        title,
        dueDate: formattedDueDate,
        timeframe,
      },
      validTasks
    );

    // Reset form
    setTitle('');
    setSpecific('');
    setMeasurable('');
    setAchievable('');
    setRelevant('');
    setTimeBound('');
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
            <Text style={styles.headerTitle}>
              {initialGoal ? 'Edit' : 'Create'} {getTimeframeLabel()} SMART Goal
            </Text>
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

            <View style={styles.smartContainer}>
              <Text style={styles.smartTitle}>SMART Goal Framework</Text>
              <Text style={styles.smartSubtitle}>Fill in each section to create a well-defined goal</Text>

              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={styles.smartLabel}>S - Specific</Text>
                  <TouchableOpacity onPress={() => toggleTooltip('specific')}>
                    <HelpCircle size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {activeTooltip === 'specific' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>What exactly do you want to accomplish? Be clear and precise.</Text>
                  </View>
                )}
                <TextInput
                  style={styles.smartInput}
                  value={specific}
                  onChangeText={setSpecific}
                  placeholder="What exactly do you want to accomplish?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={styles.smartLabel}>M - Measurable</Text>
                  <TouchableOpacity onPress={() => toggleTooltip('measurable')}>
                    <HelpCircle size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {activeTooltip === 'measurable' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>How will you track progress and measure success?</Text>
                  </View>
                )}
                <TextInput
                  style={styles.smartInput}
                  value={measurable}
                  onChangeText={setMeasurable}
                  placeholder="How will you measure success?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={styles.smartLabel}>A - Achievable</Text>
                  <TouchableOpacity onPress={() => toggleTooltip('achievable')}>
                    <HelpCircle size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {activeTooltip === 'achievable' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>Is this goal realistic given your resources and constraints?</Text>
                  </View>
                )}
                <TextInput
                  style={styles.smartInput}
                  value={achievable}
                  onChangeText={setAchievable}
                  placeholder="Is this goal realistic and achievable?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={styles.smartLabel}>R - Relevant</Text>
                  <TouchableOpacity onPress={() => toggleTooltip('relevant')}>
                    <HelpCircle size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {activeTooltip === 'relevant' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>Why is this goal important to you? How does it align with your vision?</Text>
                  </View>
                )}
                <TextInput
                  style={styles.smartInput}
                  value={relevant}
                  onChangeText={setRelevant}
                  placeholder="Why is this goal important to you?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={styles.smartLabel}>T - Time-bound</Text>
                  <TouchableOpacity onPress={() => toggleTooltip('timebound')}>
                    <HelpCircle size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {activeTooltip === 'timebound' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>When do you want to achieve this goal? Set a deadline.</Text>
                  </View>
                )}
                <TextInput
                  style={styles.smartInput}
                  value={timeBound}
                  onChangeText={setTimeBound}
                  placeholder="When do you want to achieve this goal?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.generateButton} onPress={generateGoalTitle}>
                <Text style={styles.generateButtonText}>Generate Goal Title</Text>
              </TouchableOpacity>
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
                      onChangeText={(text: string) => handleTaskChange(text, index)}
                      //onChangeText={(text) => handleTaskChange(text, index)}
                      placeholder="Enter task"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity 
                      onPress={() => handleRemoveTask(index)}
                      style={styles.removeButton}
                    >
                      <X color={colors.error} size={20} />
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
                <Text style={styles.addTaskText}>+ Add Another Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                <Check size={16} color={colors.text} /> {initialGoal ? 'Save Changes' : 'Create Goal'}
              </Text>
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
    maxHeight: '90%',
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
  smartContainer: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  smartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  smartSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  smartSection: {
    marginBottom: 16,
  },
  smartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  smartInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tooltip: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tooltipText: {
    color: colors.text,
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  generateButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 8,
  },
  addTaskText: {
    color: colors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});