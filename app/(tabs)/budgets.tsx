import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { dbService } from '@/services/database';

export default function BudgetsScreen() {
  const [totalBudget] = useState(3000);
  const [spent] = useState(2468);

  const budgetCategories = [
    { name: 'Food', budget: 489, spent: 10, icon: '🍔', color: '#FFB3BA' },
    { name: 'Groceries', budget: 320, spent: 115, icon: '🛒', color: '#BFBFFF' },
    { name: 'Subscriptions', budget: 140, spent: 10, icon: '🔄', color: '#B3E5D1' },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount}`;
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const remaining = totalBudget - spent;
  const overallProgress = getProgressPercentage(spent, totalBudget);

  // Circular progress component
  const CircularProgress = ({ percentage, size = 200, strokeWidth = 20 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2C2C2E"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFFFFF"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        {/* Center content */}
        <View style={styles.circleCenter}>
          <Text style={styles.remainingAmount}>{formatCurrency(remaining)}</Text>
          <Text style={styles.remainingLabel}>left this month</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Budgets</Text>
          <Pressable style={styles.newButton}>
            <Text style={styles.newButtonText}>+ new</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <Text style={styles.overallSpentLabel}>OVERALL SPENT: {Math.round(overallProgress)}%</Text>
          <CircularProgress percentage={overallProgress} />
          <View style={styles.budgetRange}>
            <Text style={styles.budgetRangeText}>{formatCurrency(spent)}</Text>
            <Text style={styles.budgetRangeText}>{formatCurrency(totalBudget)}</Text>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.categoriesContainer}>
          {budgetCategories.map((category, index) => {
            const progress = getProgressPercentage(category.spent, category.budget);
            const percentSpent = Math.round(progress);
            
            return (
              <View key={category.name} style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryMeta}>4d left • {percentSpent}% spent</Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categorySpent}>${category.budget}</Text>
                  <Text style={styles.categoryBudget}>under this month</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  newButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
  },

  // Circular Progress
  circularProgressContainer: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 24,
  },
  overallSpentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  circleCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingAmount: {
    fontSize: 48,
    fontWeight: '100',
    color: '#fff',
    marginBottom: 4,
  },
  remainingLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  budgetRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 20,
  },
  budgetRangeText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  categoryMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categorySpent: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  categoryBudget: {
    fontSize: 12,
    color: '#8E8E93',
  },

  bottomSpacer: {
    height: 120,
  },
});