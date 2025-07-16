import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function BudgetsScreen() {
  const [totalBudget] = useState(3000);
  const [spent] = useState(2468);

  const budgetCategories = [
    { 
      name: 'Food', 
      budget: 500, 
      spent: 11, 
      icon: '🍔', 
      color: '#FF6B35',
      percentSpent: 2,
      remaining: 489,
      daysLeft: 4
    },
    { 
      name: 'Groceries', 
      budget: 320, 
      spent: 115, 
      icon: '🛒', 
      color: '#C77DFF',
      percentSpent: 36,
      remaining: 320,
      daysLeft: 4
    },
    { 
      name: 'Subscriptions', 
      budget: 140, 
      spent: 10, 
      icon: '🔄', 
      color: '#FF69B4',
      percentSpent: 7,
      remaining: 140,
      daysLeft: 4
    },
  ];

  const remaining = totalBudget - spent;
  const overallProgress = Math.round((spent / totalBudget) * 100);

  // Semi-circular progress component
  const SemiCircularProgress = ({ percentage, size = 240, strokeWidth = 20 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const halfCircumference = circumference / 2;
    const progressStroke = (percentage / 100) * halfCircumference;

    return (
      <View style={{ width: size, height: size / 2 + 60, position: 'relative' }}>
        <Svg width={size} height={size / 2 + 10}>
          {/* Background semi-circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3A3A3A"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${halfCircumference} ${halfCircumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(180 ${size / 2} ${size / 2})`}
          />
          {/* Progress semi-circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#666666"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${progressStroke} ${halfCircumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(180 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {/* Center content */}
        <View style={styles.semiCircleCenter}>
          <Text style={styles.remainingAmount}>${remaining.toLocaleString()}</Text>
          <Text style={styles.remainingLabel}>left this month</Text>
        </View>
        {/* Budget range values positioned at arc ends */}
        <View style={styles.budgetRangePositioned}>
          <Text style={styles.budgetRangeTextLeft}>{spent.toLocaleString()}</Text>
          <Text style={styles.budgetRangeTextRight}>{totalBudget.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
        <Pressable style={styles.newButton}>
          <Text style={styles.newButtonText}>+ new</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Semi-Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <Text style={styles.overallSpentLabel}>OVERALL SPENT: {overallProgress}%</Text>
          <SemiCircularProgress percentage={overallProgress} />
        </View>

        {/* Budget Categories */}
        <View style={styles.categoriesContainer}>
          {/* First Row - Food and Groceries */}
          <View style={styles.categoryRow}>
            {/* Food Card */}
            <View style={styles.categoryCardSmall}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Text style={styles.categoryEmoji}>{budgetCategories[0].icon}</Text>
                  <Text style={styles.categoryName}>{budgetCategories[0].name}</Text>
                </View>
              </View>
              <Text style={styles.categoryDaysLeft}>{budgetCategories[0].daysLeft} days left</Text>
              <Text style={styles.categoryPercentLabel}>{budgetCategories[0].percentSpent}% SPENT</Text>
              <Text style={styles.categoryAmount}>${budgetCategories[0].remaining}</Text>
              <Text style={styles.categorySubtext}>left this month</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: budgetCategories[0].color,
                      width: `${budgetCategories[0].percentSpent}%`
                    }
                  ]} 
                />
              </View>
            </View>
            
            {/* Groceries Card */}
            <View style={styles.categoryCardSmall}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Text style={styles.categoryEmoji}>{budgetCategories[1].icon}</Text>
                  <Text style={styles.categoryName}>{budgetCategories[1].name}</Text>
                </View>
              </View>
              <Text style={styles.categoryDaysLeft}>{budgetCategories[1].daysLeft} days left</Text>
              <Text style={styles.categoryPercentLabel}>{budgetCategories[1].percentSpent}% SPENT</Text>
              <Text style={styles.categoryAmount}>${budgetCategories[1].remaining}</Text>
              <Text style={styles.categorySubtext}>left this month</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: budgetCategories[1].color,
                      width: `${budgetCategories[1].percentSpent}%`
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          
          {/* Subscriptions Card (Full Width) */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <Text style={styles.categoryEmoji}>{budgetCategories[2].icon}</Text>
                <Text style={styles.categoryName}>{budgetCategories[2].name}</Text>
              </View>
            </View>
            <Text style={styles.categoryDaysLeft}>{budgetCategories[2].daysLeft} days left</Text>
            <Text style={styles.categoryPercentLabel}>{budgetCategories[2].percentSpent}% SPENT</Text>
            <Text style={styles.categoryAmount}>${budgetCategories[2].remaining}</Text>
            <Text style={styles.categorySubtext}>left this month</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: budgetCategories[2].color,
                    width: `${budgetCategories[2].percentSpent}%`
                  }
                ]} 
              />
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newButton: {
    backgroundColor: 'transparent',
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },

  // Circular Progress
  circularProgressContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  overallSpentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 20,
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
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  remainingLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  budgetRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  budgetRangeText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  categoryCardSmall: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  semiCircleCenter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  budgetRangePositioned: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  budgetRangeTextLeft: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  budgetRangeTextRight: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryDaysLeft: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  categoryPercentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryAmount: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  bottomSpacer: {
    height: 120,
  },
});