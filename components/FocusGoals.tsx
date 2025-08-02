import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ChevronRight, Pin, PinOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useDigmStore, useFocusGoals } from '@/hooks/useDigmStore';

interface FocusGoalsProps {
  onSeeAllPress?: () => void;
}

export default function FocusGoals({ onSeeAllPress }: FocusGoalsProps) {
  const router = useRouter();
  const focusGoals = useFocusGoals();
  const { pinnedGoalIds, togglePinGoal } = useDigmStore();

  const handleSeeAll = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      // Navigate to profile screen which shows all goals
      router.push('/(tabs)/profile');
    }
  };

  const handleTogglePin = (goalId: string) => {
    togglePinGoal(goalId);
  };

  if (focusGoals.length === 0) {
    return (
      <View style={styles.container} testID="focus-goals">
        <View style={styles.header}>
          <Text style={styles.title}>🔥 Focus Goals</Text>
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All Goals</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No goals yet. Add your first goal!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="focus-goals">
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Focus Goals</Text>
        <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All Goals</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {focusGoals.map((goal) => (
        <View key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <TouchableOpacity 
              onPress={() => handleTogglePin(goal.id)}
              style={styles.pinButton}
            >
              {pinnedGoalIds.includes(goal.id) ? (
                <Pin size={16} color={colors.primary} fill={colors.primary} />
              ) : (
                <PinOff size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${goal.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{goal.progress}%</Text>
          </View>

          <View style={styles.goalStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goal.completedTasks}/{goal.totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goal.earnedXP}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{new Date(goal.dueDate).toLocaleDateString()}</Text>
              <Text style={styles.statLabel}>Due Date</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  pinButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.progressBackground,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
    textAlign: 'right',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});