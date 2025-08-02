import React, { useCallback, useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import { Stack } from "expo-router";
import { Edit2 } from "lucide-react-native";
import colors from "@/constants/colors";
import { useDigmStore } from "@/hooks/useDigmStore";
import GoalTimeframeCard from "@/components/GoalTimeframeCard";
import SmartGoalTemplate from "@/components/SmartGoalTemplate";
import GoalCompletionEffect from "@/components/GoalCompletionEffect";
import { Goal } from "@/types";

export default function ProfileScreen() {
  const { userProfile, goals, updateVision, addGoal, completedGoal, clearCompletedGoal } = useDigmStore();
  const [isEditingVision, setIsEditingVision] = useState(false);
  const [visionText, setVisionText] = useState(userProfile.vision);
  const [smartGoalModalVisible, setSmartGoalModalVisible] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Goal["timeframe"]>("1week");

  const handleSaveVision = useCallback(() => {
    if (visionText.trim()) {
      updateVision(visionText);
      setIsEditingVision(false);
    }
  }, [visionText, updateVision]);

  const handleAddGoalPress = useCallback((timeframe: Goal["timeframe"]) => {
    setSelectedTimeframe(timeframe);
    setSmartGoalModalVisible(true);
  }, []);
  
  const handleAddGoal = useCallback((goalData: Omit<Goal, "id" | "progress" | "tasks">, tasks: any[]) => {
    addGoal(goalData, tasks);
  }, [addGoal]);

  // Group goals by timeframe
  const goalsByTimeframe = {
    "10-Year Vision": goals.filter(goal => goal.timeframe === "10year"),
    "5-Year Goals": goals.filter(goal => goal.timeframe === "5year"),
    "1-Year Goals": goals.filter(goal => goal.timeframe === "1year"),
    "3-Month Goals": goals.filter(goal => goal.timeframe === "3month"),
    "1-Month Goals": goals.filter(goal => goal.timeframe === "1month"),
    "1-Week Goals": goals.filter(goal => goal.timeframe === "1week"),
  };

  return (
    <ScrollView style={styles.container} testID="profile-screen">
      <Stack.Screen options={{ title: "Vision & Goals" }} />
      
      <View style={styles.visionContainer}>
        <View style={styles.visionHeader}>
          <Text style={styles.visionTitle}>Vision Statement</Text>
          {!isEditingVision && (
            <TouchableOpacity 
              onPress={() => setIsEditingVision(true)}
              style={styles.editButton}
            >
              <Edit2 color={colors.text} size={16} />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingVision ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.visionInput}
              value={visionText}
              onChangeText={setVisionText}
              multiline
              maxLength={200}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveVision}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.visionText}>{userProfile.vision}</Text>
        )}
      </View>
      
      <View style={styles.goalsContainer}>
        <GoalTimeframeCard
          title="10-Year Vision"
          goals={goalsByTimeframe["10-Year Vision"]}
          onAddGoal={() => handleAddGoalPress("10year")}
        />
        
        <GoalTimeframeCard
          title="5-Year Goals"
          goals={goalsByTimeframe["5-Year Goals"]}
          onAddGoal={() => handleAddGoalPress("5year")}
        />
        
        <GoalTimeframeCard
          title="1-Year Goals"
          goals={goalsByTimeframe["1-Year Goals"]}
          onAddGoal={() => handleAddGoalPress("1year")}
        />
        
        <GoalTimeframeCard
          title="3-Month Goals"
          goals={goalsByTimeframe["3-Month Goals"]}
          onAddGoal={() => handleAddGoalPress("3month")}
        />
        
        <GoalTimeframeCard
          title="1-Month Goals"
          goals={goalsByTimeframe["1-Month Goals"]}
          onAddGoal={() => handleAddGoalPress("1month")}
        />
        
        <GoalTimeframeCard
          title="1-Week Goals"
          goals={goalsByTimeframe["1-Week Goals"]}
          onAddGoal={() => handleAddGoalPress("1week")}
        />
      </View>
      
      {/* SMART Goal Template Modal */}
      <SmartGoalTemplate
        visible={smartGoalModalVisible}
        onClose={() => setSmartGoalModalVisible(false)}
        onSave={handleAddGoal}
        timeframe={selectedTimeframe}
      />
      
      {/* Goal Completion Effect */}
      {completedGoal && (
        <GoalCompletionEffect
          visible={!!completedGoal}
          goalTitle={completedGoal.title}
          onAnimationEnd={clearCompletedGoal}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  visionContainer: {
    padding: 16,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
  },
  visionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  visionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  visionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  editContainer: {
    marginBottom: 8,
  },
  visionInput: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  goalsContainer: {
    padding: 16,
  },
});