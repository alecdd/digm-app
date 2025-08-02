import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Task, TaskStatus } from '@/types';
import colors from '@/constants/colors';
import { useDigmStore } from '@/hooks/useDigmStore';

interface DraggableTaskItemProps {
  task: Task;
  onDragStart?: (taskId: string, status: TaskStatus) => void;
  onDragEnd: (taskId: string, dropZone: TaskStatus) => void;
  onDragOver?: (dropZone: TaskStatus) => void;
  disabled?: boolean;
}

export default function DraggableTaskItem({ 
  task, 
  onDragStart,
  onDragEnd,
  onDragOver,
  disabled = false
}: DraggableTaskItemProps) {
  const { goals } = useDigmStore();
  const goalTitle = task.goalId ? goals.find(g => g.id === task.goalId)?.title : null;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  
  // Skip animation on web to avoid crashes
  const isWeb = Platform.OS === 'web';

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      if (disabled) return;
      scale.value = withSpring(1.05);
      zIndex.value = 100;
      
      // Notify parent that drag has started
      if (onDragStart) {
        runOnJS(onDragStart)(task.id, task.status);
      }
    },
    onActive: (event) => {
      if (disabled) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Determine which drop zone the task is over based on position
      let currentDropZone: TaskStatus = task.status;
      
      // More intuitive drag and drop logic
      const horizontalThreshold = 50;
      
      if (event.translationX < -horizontalThreshold) {
        currentDropZone = 'open';
      } else if (event.translationX > horizontalThreshold) {
        currentDropZone = 'done';
      } else if (event.translationY > 50) {
        // Moving down significantly - likely trying to move to next status
        if (task.status === 'open') {
          currentDropZone = 'inProgress';
        } else if (task.status === 'inProgress') {
          currentDropZone = 'done';
        }
      } else if (event.translationY < -50) {
        // Moving up significantly - likely trying to move to previous status
        if (task.status === 'done') {
          currentDropZone = 'inProgress';
        } else if (task.status === 'inProgress') {
          currentDropZone = 'open';
        }
      }
      
      // Notify parent about the current drop zone
      if (onDragOver && currentDropZone !== task.status) {
        runOnJS(onDragOver)(currentDropZone);
      }
    },
    onEnd: (event) => {
      if (disabled) return;
      
      // Determine which drop zone the task was dropped in based on position
      let dropZoneValue: TaskStatus = task.status;
      
      // More intuitive drag and drop logic with stronger bias toward completion
      const horizontalThreshold = 50; // Lower threshold to make dragging easier
      
      if (event.translationX < -horizontalThreshold) {
        // Dragged left - move to open
        dropZoneValue = 'open';
      } else if (event.translationX > horizontalThreshold) {
        // Dragged right - move to done
        dropZoneValue = 'done';
      } else if (event.translationY > 50) {
        // Moving down significantly - likely trying to move to next status
        if (task.status === 'open') {
          dropZoneValue = 'inProgress';
        } else if (task.status === 'inProgress') {
          dropZoneValue = 'done';
        }
      } else if (event.translationY < -50) {
        // Moving up significantly - likely trying to move to previous status
        if (task.status === 'done') {
          dropZoneValue = 'inProgress';
        } else if (task.status === 'inProgress') {
          dropZoneValue = 'open';
        }
      }
      
      // Reset position with spring animation
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 1;
      
      // Notify parent component about the drop
      runOnJS(onDragEnd)(task.id, dropZoneValue);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      zIndex: zIndex.value,
    };
  });

  // For web, use a regular view without animations
  if (isWeb) {
    return (
      <View style={styles.taskContainer} testID={`task-${task.id}`}>
        <View style={styles.dragHandle}>
          <Text style={styles.dragHandleIcon}>⋮⋮</Text>
        </View>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {goalTitle && (
            <Text style={styles.goalLink}>Tied to: {goalTitle}</Text>
          )}
          <View style={styles.taskInfo}>
            <Text style={styles.xpText}>+{task.xpReward} XP</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent} enabled={!disabled}>
      <Animated.View style={[styles.taskContainer, animatedStyle]} testID={`task-${task.id}`}>
        <View style={styles.dragHandle}>
          <Text style={styles.dragHandleIcon}>⋮⋮</Text>
        </View>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {goalTitle && (
            <Text style={styles.goalLink}>Tied to: {goalTitle}</Text>
          )}
          <View style={styles.taskInfo}>
            <Text style={styles.xpText}>+{task.xpReward} XP</Text>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  taskContainer: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%',
    justifyContent: 'center',
  },
  dragHandleIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  goalLink: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  xpText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});