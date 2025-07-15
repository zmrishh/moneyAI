import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Alert,
} from 'react-native';
import SavingsGoals from '@/components/features/SavingsGoals';
import { SavingsGoal } from '@/types';
import { dbService } from '@/services/database';

export default function SavingsDemoScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      await dbService.initialize();
      const savingsGoals = await dbService.getSavingsGoals();
      setGoals(savingsGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (goalData: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await dbService.addSavingsGoal(goalData);
      await loadGoals(); // Reload goals
      Alert.alert('Success', 'Savings goal created successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to create savings goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, amount: number) => {
    try {
      await dbService.updateSavingsGoalAmount(goalId, amount);
      await loadGoals(); // Reload goals
      
      // Check if any milestones were achieved
      const updatedGoal = goals.find(g => g.id === goalId);
      if (updatedGoal) {
        const newAmount = updatedGoal.current_amount + amount;
        const achievedMilestone = updatedGoal.milestones.find(
          m => !m.achieved && newAmount >= m.amount
        );
        
        if (achievedMilestone) {
          Alert.alert(
            '🎉 Milestone Achieved!',
            `Congratulations! You've reached ${achievedMilestone.percentage}% of your ${updatedGoal.title} goal!`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        } else if (newAmount >= updatedGoal.target_amount) {
          Alert.alert(
            '🎯 Goal Completed!',
            `Amazing! You've completed your ${updatedGoal.title} goal!`,
            [{ text: 'Celebrate!', style: 'default' }]
          );
        } else {
          Alert.alert('Success', `Added ₹${amount.toLocaleString('en-IN')} to your ${updatedGoal.title} goal!`);
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update savings goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dbService.deleteSavingsGoal(goalId);
      await loadGoals(); // Reload goals
      Alert.alert('Success', 'Savings goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete savings goal');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading savings goals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals Demo</Text>
        <Text style={styles.headerSubtitle}>
          Create and track your financial goals
        </Text>
      </View>

      <SavingsGoals
        goals={goals}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});