import React, { useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Platform, Animated } from "react-native";
import { ChevronDown, ChevronUp, Folder } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import colors from "@/constants/colors";
import DraggableTaskItem from "./DraggableTaskItem";
import { Task, TaskStatus } from "@/types";

interface WorkflowSectionProps {
  tasks: {
    open: Task[];
    inProgress: Task[];
    done: Task[];
  };
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export default function WorkflowSection({ tasks, onMoveTask }: WorkflowSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeDropZone, setActiveDropZone] = useState<TaskStatus | null>(null);
  const openZoneScale = useRef(new Animated.Value(1)).current;
  const inProgressZoneScale = useRef(new Animated.Value(1)).current;
  const doneZoneScale = useRef(new Animated.Value(1)).current;

  const handleDragStart = (taskId: string, status: TaskStatus) => {
    // Highlight all drop zones when dragging starts
    animateDropZones(true);
  };

  const handleDragEnd = (taskId: string, dropZone: TaskStatus) => {
    // Reset drop zone highlights
    animateDropZones(false);
    setActiveDropZone(null);
    
    // Only move if the task is being moved to a different status
    const task = Object.values(tasks).flat().find(t => t.id === taskId);
    if (task && task.status !== dropZone) {
      onMoveTask(taskId, dropZone);
      
      // Show a brief animation for the target drop zone
      highlightDropZone(dropZone);
    }
  };
  
  const handleDragOver = (dropZone: TaskStatus) => {
    setActiveDropZone(dropZone);
  };
  
  const animateDropZones = (activate: boolean) => {
    const config = { toValue: activate ? 1.03 : 1, duration: 200, useNativeDriver: true };
    Animated.parallel([
      Animated.timing(openZoneScale, config),
      Animated.timing(inProgressZoneScale, config),
      Animated.timing(doneZoneScale, config)
    ]).start();
  };
  
  const highlightDropZone = (zone: TaskStatus) => {
    const targetScale = zone === 'open' ? openZoneScale : 
                        zone === 'inProgress' ? inProgressZoneScale : doneZoneScale;
    
    Animated.sequence([
      Animated.timing(targetScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(targetScale, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const renderTaskItem = (task: Task) => (
    <DraggableTaskItem
      key={task.id}
      task={task}
      onDragStart={() => handleDragStart(task.id, task.status)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      disabled={Platform.OS === 'web'} // Disable drag on web to avoid issues
    />
  );

  return (
    <GestureHandlerRootView style={styles.container} testID="workflow-section">
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.titleContainer}>
          <Folder color={colors.primary} size={24} />
          <Text style={styles.title}>📂 Your Workflow</Text>
        </View>
        <Text style={styles.expandText}>
          {isExpanded ? "Close" : "Open"}
        </Text>
        {isExpanded ? (
          <ChevronUp color={colors.text} size={20} />
        ) : (
          <ChevronDown color={colors.text} size={20} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Open</Text>
            <Animated.View 
              style={[
                styles.dropZone, 
                styles.openZone,
                activeDropZone === 'open' && styles.dropZoneActive,
                { transform: [{ scale: openZoneScale }] }
              ]} 
              testID="open-drop-zone"
            >
              {tasks.open.length > 0 ? (
                <ScrollView scrollEnabled={false}>
                  {tasks.open.map(renderTaskItem)}
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>No open tasks</Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ In Progress</Text>
            <Animated.View 
              style={[
                styles.dropZone, 
                styles.inProgressZone,
                activeDropZone === 'inProgress' && styles.dropZoneActive,
                { transform: [{ scale: inProgressZoneScale }] }
              ]} 
              testID="inProgress-drop-zone"
            >
              {tasks.inProgress.length > 0 ? (
                <ScrollView scrollEnabled={false}>
                  {tasks.inProgress.map(renderTaskItem)}
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>No tasks in progress</Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Done</Text>
            <Animated.View 
              style={[
                styles.dropZone, 
                styles.doneZone,
                activeDropZone === 'done' && styles.dropZoneActive,
                { transform: [{ scale: doneZoneScale }] }
              ]} 
              testID="done-drop-zone"
            >
              {tasks.done.length > 0 ? (
                <ScrollView scrollEnabled={false}>
                  {tasks.done.map(renderTaskItem)}
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>No completed tasks</Text>
              )}
            </Animated.View>
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  expandText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  content: {
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  dropZone: {
    minHeight: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    position: "relative",
  },
  openZone: {
    borderColor: colors.warning,
    backgroundColor: "rgba(255, 152, 0, 0.05)",
  },
  inProgressZone: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0, 102, 255, 0.05)",
  },
  doneZone: {
    borderColor: colors.success,
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  dropZoneActive: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: "rgba(0, 102, 255, 0.1)",
    transform: [{ scale: 1.02 }],
  },
});