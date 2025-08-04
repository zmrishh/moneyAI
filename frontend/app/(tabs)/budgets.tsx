import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { height: screenHeight } = Dimensions.get('window');

export default function BudgetsScreen() {
  // Dynamic budget state
  const [budgetCategories, setBudgetCategories] = useState([
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
  ]);
  
  // Budget creation state
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    category: 'Food',
    period: 'monthly',
    color: '#FF6B35',
    icon: '🍔',
  });
  
  // Animation for sliding drawer
  const slideAnim = useState(new Animated.Value(screenHeight))[0];
  const [drawerHeight, setDrawerHeight] = useState(screenHeight * 0.6);
  
  // Pan responder for pull-to-resize
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      const newHeight = Math.max(
        screenHeight * 0.4,
        Math.min(
          screenHeight * 0.9,
          drawerHeight - gestureState.dy
        )
      );
      setDrawerHeight(newHeight);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const velocity = gestureState.vy;
      let targetHeight;
      
      if (velocity > 0.5) {
        targetHeight = drawerHeight < screenHeight * 0.7 ? screenHeight * 0.4 : screenHeight * 0.6;
      } else if (velocity < -0.5) {
        targetHeight = drawerHeight > screenHeight * 0.5 ? screenHeight * 0.9 : screenHeight * 0.6;
      } else {
        if (drawerHeight < screenHeight * 0.5) {
          targetHeight = screenHeight * 0.4;
        } else if (drawerHeight < screenHeight * 0.75) {
          targetHeight = screenHeight * 0.6;
        } else {
          targetHeight = screenHeight * 0.9;
        }
      }
      
      setDrawerHeight(targetHeight);
    },
  });

  // Calculate totals from dynamic budget categories
  const totalBudget = budgetCategories.reduce((sum, category) => sum + category.budget, 0);
  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
  const remaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Form handling functions
  const openAddBudgetModal = () => {
    setShowAddBudgetModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeAddBudgetModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddBudgetModal(false);
      resetForm();
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      category: 'Food',
      period: 'monthly',
      color: '#FF6B35',
      icon: '🍔',
    });
    setDrawerHeight(screenHeight * 0.6);
  };

  const handleSubmitBudget = () => {
    if (!formData.name.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in budget name and amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Create budget object
    const newBudget = {
      name: formData.name.trim(),
      budget: amount,
      spent: 0,
      icon: formData.icon,
      color: formData.color,
      percentSpent: 0,
      remaining: amount,
      daysLeft: 30, // Default to 30 days
      period: formData.period,
    };

    // Add the new budget to the existing budgets list
    setBudgetCategories([...budgetCategories, newBudget]);
    
    console.log('New budget created:', newBudget);
    closeAddBudgetModal();
    Alert.alert('Success', 'Budget created successfully!');
  };

  // Budget categories and colors
  const budgetCategories_options = [
    { name: 'Food', icon: '🍔', color: '#FF6B35' },
    { name: 'Groceries', icon: '🛒', color: '#C77DFF' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Entertainment', icon: '🎬', color: '#45B7D1' },
    { name: 'Shopping', icon: '🛍️', color: '#96CEB4' },
    { name: 'Health', icon: '🏥', color: '#FFEAA7' },
    { name: 'Education', icon: '📚', color: '#DDA0DD' },
    { name: 'Travel', icon: '✈️', color: '#74B9FF' },
    { name: 'Subscriptions', icon: '🔄', color: '#FF69B4' },
    { name: 'Other', icon: '💰', color: '#A0A0A0' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === formData.currency) || currencies[0];
  };

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
          <Text style={styles.budgetRangeTextLeft}>{totalSpent.toLocaleString()}</Text>
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
        <Pressable style={styles.newButton} onPress={openAddBudgetModal}>
          <Text style={styles.newButtonText}>+ new</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Semi-Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <Text style={styles.overallSpentLabel}>OVERALL SPENT: {overallProgress}%</Text>
          <SemiCircularProgress percentage={overallProgress} />
        </View>

        {/* Budget Categories - Fixed 2-Column Layout */}
        <View style={styles.categoriesContainer}>
          {(() => {
            const rows = [];
            for (let i = 0; i < budgetCategories.length; i += 2) {
              const firstCategory = budgetCategories[i];
              const secondCategory = budgetCategories[i + 1];
              const hasSecondItem = !!secondCategory;
              const isOddTotal = budgetCategories.length % 2 === 1;
              const isLastRow = i + 2 >= budgetCategories.length;
              const shouldFirstSpanFull = !hasSecondItem && isOddTotal;
              
              rows.push(
                <View key={`row-${i}`} style={styles.categoryRow}>
                  {/* First item in row */}
                  <View 
                    key={`${firstCategory.name}-${i}`} 
                    style={shouldFirstSpanFull ? styles.categoryCard : styles.categoryCardSmall}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryTitleRow}>
                        <Text style={styles.categoryEmoji}>{firstCategory.icon}</Text>
                        <Text style={styles.categoryName}>{firstCategory.name}</Text>
                      </View>
                    </View>
                    <Text style={styles.categoryDaysLeft}>{firstCategory.daysLeft} days left</Text>
                    <Text style={styles.categoryPercentLabel}>
                      {firstCategory.budget > 0 ? Math.round((firstCategory.spent / firstCategory.budget) * 100) : 0}% SPENT
                    </Text>
                    <Text style={styles.categoryAmount}>
                      ${(firstCategory.budget - firstCategory.spent).toLocaleString()}
                    </Text>
                    <Text style={styles.categorySubtext}>left this month</Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            backgroundColor: firstCategory.color,
                            width: `${Math.min(firstCategory.budget > 0 ? Math.round((firstCategory.spent / firstCategory.budget) * 100) : 0, 100)}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  {/* Second item in row (if exists) */}
                  {hasSecondItem && (
                    <View 
                      key={`${secondCategory.name}-${i + 1}`} 
                      style={styles.categoryCardSmall}
                    >
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryTitleRow}>
                          <Text style={styles.categoryEmoji}>{secondCategory.icon}</Text>
                          <Text style={styles.categoryName}>{secondCategory.name}</Text>
                        </View>
                      </View>
                      <Text style={styles.categoryDaysLeft}>{secondCategory.daysLeft} days left</Text>
                      <Text style={styles.categoryPercentLabel}>
                        {secondCategory.budget > 0 ? Math.round((secondCategory.spent / secondCategory.budget) * 100) : 0}% SPENT
                      </Text>
                      <Text style={styles.categoryAmount}>
                        ${(secondCategory.budget - secondCategory.spent).toLocaleString()}
                      </Text>
                      <Text style={styles.categorySubtext}>left this month</Text>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { 
                              backgroundColor: secondCategory.color,
                              width: `${Math.min(secondCategory.budget > 0 ? Math.round((secondCategory.spent / secondCategory.budget) * 100) : 0, 100)}%`
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            }
            return rows;
          })()}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Budget Modal - Sliding Drawer */}
      <Modal
        visible={showAddBudgetModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeAddBudgetModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeAddBudgetModal} />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                height: drawerHeight,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Modal Header with Pan Responder */}
            <View style={styles.modalHeader} {...panResponder.panHandlers}>
              <View style={styles.pullHandleArea}>
                <View style={styles.modalHandle} />
              </View>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Create New Budget</Text>
                <Pressable style={styles.closeButton} onPress={closeAddBudgetModal}>
                  <IconSymbol name="xmark" size={20} color="#8E8E93" />
                </Pressable>
              </View>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Budget Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Budget Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Monthly Food Budget"
                  placeholderTextColor="#8E8E93"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>

              {/* Amount with Currency */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Budget Amount *</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>{getCurrentCurrency().symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E93"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({...formData, amount: text})}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Currency Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                  {currencies.map((currency) => (
                    <Pressable
                      key={currency.code}
                      style={[
                        styles.currencyChip,
                        formData.currency === currency.code && styles.currencyChipSelected
                      ]}
                      onPress={() => setFormData({...formData, currency: currency.code})}
                    >
                      <Text style={styles.currencyChipSymbol}>{currency.symbol}</Text>
                      <Text style={[
                        styles.currencyChipText,
                        formData.currency === currency.code && styles.currencyChipTextSelected
                      ]}>
                        {currency.code}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {budgetCategories_options.map((category) => (
                    <Pressable
                      key={category.name}
                      style={[
                        styles.categoryChip,
                        formData.category === category.name && styles.categoryChipSelected
                      ]}
                      onPress={() => setFormData({
                        ...formData, 
                        category: category.name,
                        icon: category.icon,
                        color: category.color
                      })}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryText,
                        formData.category === category.name && styles.categoryTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Budget Period */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Budget Period</Text>
                <View style={styles.periodOptions}>
                  {['weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
                    <Pressable
                      key={period}
                      style={[
                        styles.periodOption,
                        formData.period === period && styles.periodOptionSelected
                      ]}
                      onPress={() => setFormData({...formData, period})}
                    >
                      <Text style={[
                        styles.periodText,
                        formData.period === period && styles.periodTextSelected
                      ]}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Color Preview */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Budget Color</Text>
                <View style={styles.colorPreview}>
                  <View style={[styles.colorCircle, { backgroundColor: formData.color }]} />
                  <Text style={styles.colorText}>
                    {formData.icon} {formData.category} - {getCurrentCurrency().symbol}{formData.amount || '0.00'}
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable style={styles.submitButton} onPress={handleSubmitBudget}>
                <Text style={styles.submitButtonText}>Create Budget</Text>
              </Pressable>

              <View style={styles.formSpacer} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
    gap: 16,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
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
    flex: 1,
    flexWrap: 'wrap',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.4,
  },
  modalHeader: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  pullHandleArea: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#8E8E93',
    borderRadius: 2,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Styles
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },

  // Currency Selection
  currencyScroll: {
    marginTop: 8,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  currencyChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyChipSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  currencyChipText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  currencyChipTextSelected: {
    color: '#FFFFFF',
  },

  // Category Selection
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Period Options
  periodOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  periodOption: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  periodOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  periodTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Color Preview
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formSpacer: {
    height: 40,
  },
});