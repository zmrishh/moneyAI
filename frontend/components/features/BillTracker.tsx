import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Switch,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Bill } from '@/types';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

interface BillTrackerProps {
  bills: Bill[];
  onAddBill: (billData: any) => void;
  onMarkPaid: (billId: string, actualAmount?: number, notes?: string) => void;
  onToggleAutoPay: (billId: string, autoPay: boolean) => void;
  onRefreshBills: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function BillTracker({
  bills,
  onAddBill,
  onMarkPaid,
  onToggleAutoPay,
  onRefreshBills,
}: BillTrackerProps) {
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [overdueBills, setOverdueBills] = useState<Bill[]>([]);
  const [totalMonthlyBills, setTotalMonthlyBills] = useState(0);

  // Form state
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'INR',
    category: 'Utilities',
    dueDate: new Date(),
    isRecurring: false,
    recurrencePattern: 'monthly',
    autoPay: false,
    notes: '',
  });

  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Animation for sliding drawer
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [drawerHeight, setDrawerHeight] = useState(screenHeight * 0.6);

  // Pan responder for pull-to-resize
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: () => {
      // Close any open dropdowns when starting to drag
      setShowCurrencyDropdown(false);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newHeight = Math.max(
        screenHeight * 0.4, // Minimum height
        Math.min(
          screenHeight * 0.9, // Maximum height
          drawerHeight - gestureState.dy
        )
      );
      setDrawerHeight(newHeight);
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Snap to nearest size based on velocity and position
      const velocity = gestureState.vy;
      let targetHeight;

      if (velocity > 0.5) {
        // Fast downward swipe - go to smaller size
        targetHeight = drawerHeight < screenHeight * 0.7 ? screenHeight * 0.4 : screenHeight * 0.6;
      } else if (velocity < -0.5) {
        // Fast upward swipe - go to larger size
        targetHeight = drawerHeight > screenHeight * 0.5 ? screenHeight * 0.9 : screenHeight * 0.6;
      } else {
        // Slow movement - snap to nearest
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

  useEffect(() => {
    categorizeAndCalculateBills();
  }, [bills]);

  const getUniqueBills = () => {
    const uniqueBills = new Map<string, Bill>();
    
    bills.forEach(bill => {
      const billKey = `${bill.name}_${bill.amount}_${bill.category}`;
      
      if (bill.is_recurring) {
        // For recurring bills, prefer the next unpaid bill
        if (!uniqueBills.has(billKey) || 
            (!bill.is_paid && uniqueBills.get(billKey)?.is_paid) ||
            (!bill.is_paid && !uniqueBills.get(billKey)?.is_paid && bill.due_date > uniqueBills.get(billKey)!.due_date)) {
          uniqueBills.set(billKey, bill);
        }
      } else {
        // For non-recurring bills, show all
        uniqueBills.set(`${billKey}_${bill.id}`, bill);
      }
    });
    
    return Array.from(uniqueBills.values());
  };

  const categorizeAndCalculateBills = () => {
    const today = new Date();
    const upcoming: Bill[] = [];
    const overdue: Bill[] = [];
    let monthlyTotal = 0;

    // Group recurring bills by name to avoid counting duplicates
    const recurringBills = new Map<string, Bill>();

    bills.forEach(bill => {
      if (!bill.is_paid) {
        const daysUntilDue = differenceInDays(bill.due_date, today);

        if (daysUntilDue < 0) {
          overdue.push(bill);
        } else if (daysUntilDue <= 7) {
          upcoming.push(bill);
        }
      }

      // Calculate monthly total for recurring bills (avoid duplicates)
      if (bill.is_recurring) {
        const billKey = `${bill.name}_${bill.amount}_${bill.recurrence_pattern}`;
        
        // Only count each recurring bill once (prefer unpaid over paid)
        if (!recurringBills.has(billKey) || (!bill.is_paid && recurringBills.get(billKey)?.is_paid)) {
          recurringBills.set(billKey, bill);
        }
      }
    });

    // Calculate monthly total from unique recurring bills
    recurringBills.forEach(bill => {
      switch (bill.recurrence_pattern) {
        case 'monthly':
          monthlyTotal += bill.amount;
          break;
        case 'quarterly':
          monthlyTotal += bill.amount / 3;
          break;
        case 'yearly':
          monthlyTotal += bill.amount / 12;
          break;
      }
    });

    setUpcomingBills(upcoming.sort((a, b) => a.due_date.getTime() - b.due_date.getTime()));
    setOverdueBills(overdue.sort((a, b) => b.due_date.getTime() - a.due_date.getTime()));
    setTotalMonthlyBills(monthlyTotal);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBillIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Utilities': '⚡',
      'Rent': '🏠',
      'Internet': '📶',
      'Phone': '📱',
      'Insurance': '🛡️',
      'Credit Card': '💳',
      'Loan': '🏦',
      'Subscription': '📺',
      'Other': '📄',
    };
    return icons[category] || '📄';
  };

  const getDueDateStatus = (dueDate: Date, isPaid: boolean) => {
    if (isPaid) return { text: 'Paid', color: '#34C759', urgent: false };

    const today = new Date();
    const daysUntil = differenceInDays(dueDate, today);

    if (daysUntil < 0) {
      return {
        text: `${Math.abs(daysUntil)} days overdue`,
        color: '#FF3B30',
        urgent: true
      };
    } else if (isToday(dueDate)) {
      return { text: 'Due today', color: '#FF9500', urgent: true };
    } else if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', color: '#FF9500', urgent: true };
    } else if (daysUntil <= 7) {
      return { text: `Due in ${daysUntil} days`, color: '#FFCC00', urgent: false };
    } else {
      return { text: format(dueDate, 'MMM dd'), color: '#8E8E93', urgent: false };
    }
  };

  const handleMarkPaid = (bill: Bill) => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${bill.name}" as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => onMarkPaid(bill.id)
        }
      ]
    );
  };

  // Form handling functions
  const openAddBillModal = () => {
    setShowAddBillModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeAddBillModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddBillModal(false);
      resetForm();
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'INR',
      category: 'Utilities',
      dueDate: new Date(),
      isRecurring: false,
      recurrencePattern: 'monthly',
      autoPay: false,
      notes: '',
    });
    setDrawerHeight(screenHeight * 0.6);
    setShowCurrencyDropdown(false);
    setShowDatePicker(false);
  };

  // Date picker handlers
  const getDateOptions = () => {
    const today = new Date();
    const options = [];

    try {
      // Add common date options
      options.push({ label: 'Today', date: new Date(today) });

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      options.push({ label: 'Tomorrow', date: tomorrow });

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      options.push({ label: 'Next Week', date: nextWeek });

      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      options.push({ label: 'Next Month', date: nextMonth });

      // Add specific dates for this month and next month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      // Add remaining days of current month
      for (let i = today.getDate() + 1; i <= Math.min(today.getDate() + 10, endOfMonth); i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        options.push({
          label: `${i}${getOrdinalSuffix(i)} of this month`,
          date: date
        });
      }

      // Add first few days of next month
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + 1, i);
        options.push({
          label: `${i}${getOrdinalSuffix(i)} of next month`,
          date: date
        });
      }

      console.log('Generated date options:', options);
      return options;
    } catch (error) {
      console.error('Error generating date options:', error);
      // Fallback options
      return [
        { label: 'Today', date: new Date() },
        { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      ];
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Currency options
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === formData.currency) || currencies[0];
  };

  const handleSubmitBill = async () => {
    if (!formData.name.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in bill name and amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      // Create bill object with API-compatible field names
      const newBill = {
        name: formData.name.trim(),
        amount: amount,
        category: formData.category,
        due_date: formData.dueDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.isRecurring ? formData.recurrencePattern : null,
        auto_pay: formData.autoPay,
        notes: formData.notes.trim() || null,
        reminder_days: 3, // Default reminder days
      };

      console.log('New bill to create:', newBill);

      // Use the onAddBill prop instead of direct database access
      onAddBill(newBill);

      // Close modal first to prevent state update conflicts
      closeAddBillModal();

    } catch (error) {
      console.error('Error adding bill:', error);
      Alert.alert('Error', 'Failed to add bill. Please try again.');
    }
  };

  const categories = [
    'Utilities', 'Rent', 'Internet', 'Phone', 'Insurance',
    'Credit Card', 'Loan', 'Subscription', 'Other'
  ];

  const renderBillCard = (bill: Bill) => {
    const dueDateStatus = getDueDateStatus(bill.due_date, bill.is_paid);

    return (
      <View key={bill.id} style={[
        styles.billCard,
        dueDateStatus.urgent && !bill.is_paid && styles.urgentBill
      ]}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billIcon}>{getBillIcon(bill.category)}</Text>
            <View style={styles.billDetails}>
              <Text style={styles.billName}>{bill.name}</Text>
              <Text style={styles.billCategory}>{bill.category}</Text>
              {bill.is_recurring && (
                <View style={styles.recurringBadge}>
                  <IconSymbol name="repeat" size={12} color="#007AFF" />
                  <Text style={styles.recurringText}>
                    {bill.recurrence_pattern}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.billAmount}>
            <Text style={styles.amount}>{formatCurrency(bill.amount)}</Text>
            {bill.late_fee && bill.late_fee > 0 && (
              <Text style={styles.lateFee}>+{formatCurrency(bill.late_fee)} late fee</Text>
            )}
          </View>
        </View>

        <View style={styles.billFooter}>
          <Text style={[styles.dueDate, { color: dueDateStatus.color }]}>
            {dueDateStatus.text}
          </Text>

          <View style={styles.billActions}>
            {bill.auto_pay && (
              <View style={styles.autoPayBadge}>
                <IconSymbol name="creditcard" size={12} color="#34C759" />
                <Text style={styles.autoPayText}>Auto-pay</Text>
              </View>
            )}

            {!bill.is_paid && (
              <Pressable
                style={styles.payButton}
                onPress={() => handleMarkPaid(bill)}
              >
                <Text style={styles.payButtonText}>Mark Paid</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Bills & Payments</Text>
          <Text style={styles.subtitle}>
            {formatCurrency(totalMonthlyBills)}/month recurring
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={openAddBillModal}>
          <IconSymbol name="plus" size={20} color="#007AFF" />
        </Pressable>
      </View>

      {/* Alert Cards */}
      {overdueBills.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF3B30" />
            <Text style={styles.alertTitle}>Overdue Bills</Text>
          </View>
          <Text style={styles.alertText}>
            {overdueBills.length} bill{overdueBills.length > 1 ? 's are' : ' is'} overdue
          </Text>
        </View>
      )}

      {upcomingBills.length > 0 && (
        <View style={[styles.alertCard, styles.warningCard]}>
          <View style={styles.alertHeader}>
            <IconSymbol name="clock.fill" size={20} color="#FF9500" />
            <Text style={[styles.alertTitle, { color: '#FF9500' }]}>Due Soon</Text>
          </View>
          <Text style={[styles.alertText, { color: '#FFCC80' }]}>
            {upcomingBills.length} bill{upcomingBills.length > 1 ? 's' : ''} due in the next 7 days
          </Text>
        </View>
      )}

      {/* Bills List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No bills tracked</Text>
            <Text style={styles.emptySubtitle}>
              Add your recurring bills to never miss a payment
            </Text>
            <Pressable style={styles.emptyButton} onPress={openAddBillModal}>
              <Text style={styles.emptyButtonText}>Add First Bill</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Overdue Bills */}
            {overdueBills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overdue ({overdueBills.length})</Text>
                {overdueBills.map(renderBillCard)}
              </View>
            )}

            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Due Soon ({upcomingBills.length})</Text>
                {upcomingBills.map(renderBillCard)}
              </View>
            )}

            {/* All Bills */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Bills ({getUniqueBills().length})</Text>
              {getUniqueBills()
                .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
                .map(renderBillCard)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Bill Modal - Sliding Drawer */}
      <Modal
        visible={showAddBillModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeAddBillModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeAddBillModal} />
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
                <Text style={styles.modalTitle}>Add New Bill</Text>
                <Pressable style={styles.closeButton} onPress={closeAddBillModal}>
                  <IconSymbol name="xmark" size={20} color="#8E8E93" />
                </Pressable>
              </View>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Bill Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bill Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Electricity Bill"
                  placeholderTextColor="#8E8E93"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              {/* Amount with Currency Dropdown */}
              <View style={[styles.formGroup, { position: 'relative', zIndex: showCurrencyDropdown ? 1000 : 1 }]}>
                <Text style={styles.formLabel}>Amount *</Text>
                <View style={styles.amountInputContainer}>
                  {/* Currency Dropdown */}
                  <Pressable
                    style={styles.currencyDropdown}
                    onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  >
                    <Text style={styles.currencySymbol}>{getCurrentCurrency().symbol}</Text>
                    <Text style={styles.currencyCode}>{getCurrentCurrency().code}</Text>
                    <IconSymbol name="chevron.down" size={16} color="#8E8E93" />
                  </Pressable>

                  {/* Amount Input */}
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E93"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    keyboardType="decimal-pad"
                    onFocus={() => setShowCurrencyDropdown(false)}
                  />
                </View>

                {/* Currency Dropdown Options */}
                {showCurrencyDropdown && (
                  <View style={styles.currencyOptions}>
                    <ScrollView style={styles.currencyOptionsScroll} nestedScrollEnabled={true}>
                      {currencies.map((currency) => (
                        <Pressable
                          key={currency.code}
                          style={[
                            styles.currencyOption,
                            formData.currency === currency.code && styles.currencyOptionSelected
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, currency: currency.code });
                            setShowCurrencyDropdown(false);
                          }}
                        >
                          <Text style={styles.currencyOptionSymbol}>{currency.symbol}</Text>
                          <View style={styles.currencyOptionInfo}>
                            <Text style={styles.currencyOptionCode}>{currency.code}</Text>
                            <Text style={styles.currencyOptionName}>{currency.name}</Text>
                          </View>
                          {formData.currency === currency.code && (
                            <IconSymbol name="checkmark" size={16} color="#007AFF" />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryChip,
                        formData.category === category && styles.categoryChipSelected
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text style={styles.categoryIcon}>{getBillIcon(category)}</Text>
                      <Text style={[
                        styles.categoryText,
                        formData.category === category && styles.categoryTextSelected
                      ]}>
                        {category}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date</Text>
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => {
                    console.log('Date picker button pressed');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.datePickerText}>
                    {format(formData.dueDate, 'MMM dd, yyyy')}
                  </Text>
                  <IconSymbol name="calendar" size={20} color="#8E8E93" />
                </Pressable>

                {/* Native DateTimePicker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      console.log('Date changed:', selectedDate);
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setFormData({ ...formData, dueDate: selectedDate });
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              {/* Recurring Bill Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.formLabel}>Recurring Bill</Text>
                    <Text style={styles.formSubtext}>Bill repeats automatically</Text>
                  </View>
                  <Switch
                    value={formData.isRecurring}
                    onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
                    trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Recurrence Pattern (only if recurring) */}
              {formData.isRecurring && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Recurrence</Text>
                  <View style={styles.recurrenceOptions}>
                    {['monthly', 'quarterly', 'yearly'].map((pattern) => (
                      <Pressable
                        key={pattern}
                        style={[
                          styles.recurrenceOption,
                          formData.recurrencePattern === pattern && styles.recurrenceOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, recurrencePattern: pattern })}
                      >
                        <Text style={[
                          styles.recurrenceText,
                          formData.recurrencePattern === pattern && styles.recurrenceTextSelected
                        ]}>
                          {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Auto Pay Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.formLabel}>Auto Pay</Text>
                    <Text style={styles.formSubtext}>Automatically pay this bill</Text>
                  </View>
                  <Switch
                    value={formData.autoPay}
                    onValueChange={(value) => setFormData({ ...formData, autoPay: value })}
                    trackColor={{ false: '#3A3A3C', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add any additional notes..."
                  placeholderTextColor="#8E8E93"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <Pressable style={styles.submitButton} onPress={handleSubmitBill}>
                <Text style={styles.submitButtonText}>Add Bill</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    backgroundColor: '#2C0A0A',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  warningCard: {
    backgroundColor: '#2C1B00',
    borderColor: '#FF9500',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#FFB3B3',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  billCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  urgentBill: {
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  billCategory: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 11,
    color: '#007AFF',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  lateFee: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 2,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  billActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoPayText: {
    fontSize: 11,
    color: '#34C759',
    marginLeft: 4,
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  formSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Amount Input with Currency Dropdown
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#3A3A3C',
    minWidth: 80,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  currencyCode: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  currencyOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
  },
  currencyOptionsScroll: {
    maxHeight: 200,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  currencyOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  currencyOptionSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  currencyOptionInfo: {
    flex: 1,
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currencyOptionName: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
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

  // Date Picker Styles
  datePickerButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Recurrence Options
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  recurrenceOption: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  recurrenceOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recurrenceText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  recurrenceTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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

  // Custom Date Picker Modal Styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dateModalContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateModalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateOptionsContainer: {
    maxHeight: 300,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  dateOptionLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateOptionDate: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Custom Date Input Styles
  customDateSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  customDateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  customDateInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  customDateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
});