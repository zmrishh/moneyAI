import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  StatusBar,
  View,
  Text,
  Animated,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DateRangeSelector, DateRange } from '@/components/ui/DateRangeSelector';
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext';
import { Transaction } from '@/types';
import { format, isToday, isYesterday, startOfDay, isAfter, isBefore } from 'date-fns';

interface GroupedTransactions {
  [date: string]: Transaction[];
}

// Main component wrapped with DateRangeProvider
const TransactionsScreenContent: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDateRangeSelector, setShowDateRangeSelector] = useState(false);
  
  // Cross-fade animation for transactions reload
  const fadeAnim = useState(new Animated.Value(1))[0];
  
  // Anchor ref for popover positioning
  const periodSelectorRef = useRef<View>(null);
  
  // Use centralized date range context
  const { state, setPeriod, setCustomRange, getCurrentRange, setLoading: setDateLoading } = useDateRange();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Generate dummy data
      const dummyTransactions: Transaction[] = [
        { id: '1', amount: 11.45, type: 'expense', category: 'Food', description: 'BLAKE', date: new Date(), userId: '1' },
        { id: '2', amount: 1600, type: 'income', category: 'Income', description: 'Salary', date: new Date(), userId: '1' },
        { id: '3', amount: 9.99, type: 'expense', category: 'Subscriptions', description: 'Netflix', date: new Date(Date.now() - 24 * 60 * 60 * 1000), userId: '1' },
        { id: '4', amount: 45.20, type: 'expense', category: 'Groceries', description: 'Whole Foods', date: new Date(Date.now() - 24 * 60 * 60 * 1000), userId: '1' },
        { id: '5', amount: 500.00, type: 'expense', category: 'Gifts', description: 'Birthday Gift', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '6', amount: 23.50, type: 'expense', category: 'Food', description: 'Starbucks', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '7', amount: 85.30, type: 'expense', category: 'Food', description: 'Dinner Out', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '8', amount: 12.99, type: 'expense', category: 'Subscriptions', description: 'Spotify', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '9', amount: 2059, type: 'income', category: 'Income', description: 'Freelance Work', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '10', amount: 67.80, type: 'expense', category: 'Transportation', description: 'Uber', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '11', amount: 156.45, type: 'expense', category: 'Shopping', description: 'Amazon', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '12', amount: 34.20, type: 'expense', category: 'Food', description: 'Lunch', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '13', amount: 89.99, type: 'expense', category: 'Entertainment', description: 'Movie Tickets', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: '1' },
        { id: '14', amount: 126.00, type: 'expense', category: 'Groceries', description: 'Weekly Groceries', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), userId: '1' },
      ];
      
      setTransactions(dummyTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const groupTransactionsByDate = (transactions: Transaction[]): GroupedTransactions => {
    const grouped: GroupedTransactions = {};
    transactions.forEach(transaction => {
      const dateKey = format(startOfDay(transaction.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'TODAY';
    if (isYesterday(date)) return 'YESTERDAY';
    return format(date, 'EEE, dd MMM').toUpperCase();
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: { emoji: string; color: string } } = {
      'Food': { emoji: '🍔', color: '#FF6B35' },
      'Transportation': { emoji: '🚗', color: '#007AFF' },
      'Shopping': { emoji: '🛍️', color: '#AF52DE' },
      'Entertainment': { emoji: '🎬', color: '#FF2D92' },
      'Income': { emoji: '💰', color: '#34C759' },
      'Subscriptions': { emoji: '🔄', color: '#FF69B4' },
      'Gifts': { emoji: '🎁', color: '#FFB800' },
      'Groceries': { emoji: '🛒', color: '#FF69B4' },
      'BLAKE': { emoji: '🍔', color: '#FF6B35' },
    };
    return icons[category] || { emoji: '💰', color: '#8E8E93' };
  };

  // Unified callbacks for DateRangeSelector
  const handleRangeChange = useCallback((range: DateRange) => {
    setCustomRange(range);
  }, [setCustomRange]);

  const handleApply = useCallback(async (range: DateRange) => {
    setDateLoading(true);
    
    // Cross-fade animation for smooth transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Simulate data reload
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
        setDateLoading(false);
      }, 300);
    });
  }, [setDateLoading, fadeAnim]);

  // Get current date range and filter transactions
  const currentRange = getCurrentRange();
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return isAfter(transactionDate, currentRange.from) || 
           transactionDate.toDateString() === currentRange.from.toDateString() &&
           (isBefore(transactionDate, currentRange.to) || 
            transactionDate.toDateString() === currentRange.to.toDateString());
  });

  const periodIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const periodExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const periodNet = periodIncome - periodExpenses;

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const dates = Object.keys(groupedTransactions).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getPeriodDisplayText = () => {
    if (state.selectedPeriod === 'custom') {
      return `${format(currentRange.from, 'MMM d')} - ${format(currentRange.to, 'MMM d')}`;
    }
    return state.selectedPeriod.charAt(0).toUpperCase() + state.selectedPeriod.slice(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#007AFF" 
          />
        }
      >
        {/* Header with unified period selector */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Pressable 
            ref={periodSelectorRef}
            style={styles.periodSelector} 
            onPress={() => setShowDateRangeSelector(true)}
          >
            <Text style={styles.periodText}>{getPeriodDisplayText()}</Text>
            <IconSymbol name="chevron.down" size={16} color="#8E8E93" />
          </Pressable>
        </View>

        {/* Summary Cards with smooth animations */}
        <View style={styles.summarySection}>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>+426%</Text>
          </View>
          <Text style={styles.mainAmount}>
            ${Math.abs(periodNet).toLocaleString()}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.incomeCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="arrow.up.right" size={16} color="#34C759" />
              <Text style={styles.cardLabel}>Income</Text>
            </View>
            <Text style={styles.cardAmount}>
              ${periodIncome.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.expenseCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="arrow.down.right" size={16} color="#FF3B30" />
              <Text style={styles.cardLabel}>Expenses</Text>
            </View>
            <Text style={styles.cardAmount}>
              ${periodExpenses.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : dates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your date range</Text>
          </View>
        ) : (
          dates.map((dateString) => {
            const dayTransactions = groupedTransactions[dateString];
            const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const dayNet = dayIncome - dayExpenses;

            return (
              <View key={dateString}>
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>{getDateLabel(dateString)}</Text>
                  <Text style={styles.dateTotal}>
                    {dayNet >= 0 ? '' : '-'}${Math.abs(dayNet).toFixed(2)}
                  </Text>
                </View>

                {dayTransactions.map((transaction) => {
                  const categoryInfo = getCategoryIcon(transaction.category);
                  const formattedAmount = `${transaction.amount.toFixed(2)}`;
                  const formattedTime = format(transaction.date, 'h:mm a');
                  
                  return (
                    <Pressable 
                      key={transaction.id} 
                      style={styles.transactionRow}
                    >
                      <View style={styles.transactionLeft}>
                        <View 
                          style={[styles.iconContainer, { backgroundColor: categoryInfo.color }]}
                        >
                          <Text style={styles.iconEmoji}>{categoryInfo.emoji}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionName}>{transaction.description}</Text>
                          <Text style={styles.transactionTime}>{formattedTime}</Text>
                        </View>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? '#34C759' : '#fff' }
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}{formattedAmount}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* Lightweight Popover DateRangeSelector */}
      <DateRangeSelector
        initialRange={currentRange}
        onRangeChange={handleRangeChange}
        onApply={handleApply}
        isVisible={showDateRangeSelector}
        onClose={() => setShowDateRangeSelector(false)}
        maxDate={new Date()}
        isPopover={true}
        anchorRef={periodSelectorRef}
      />
    </View>
  );
};

// Main export with DateRangeProvider wrapper
export default function TransactionsScreen() {
  return (
    <DateRangeProvider>
      <TransactionsScreenContent />
    </DateRangeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
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
    color: '#fff',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  summarySection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  percentageContainer: {
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  mainAmount: {
    fontSize: 48,
    fontWeight: '100',
    color: '#fff',
    letterSpacing: -1,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  expenseCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  cardLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  dateTotal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  transactionTime: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 120,
  },
});