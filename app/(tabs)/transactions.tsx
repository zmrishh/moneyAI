import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  StatusBar,
  View,
  Text,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { dbService } from '@/services/database';
import { Transaction } from '@/types';
import { format, isToday, isYesterday, startOfDay, startOfWeek, endOfWeek } from 'date-fns';

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      await dbService.initialize();
      const data = await dbService.getTransactions(100);
      setTransactions(data);
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
      'Food & Dining': { emoji: '🍔', color: '#FF9500' },
      'Transportation': { emoji: '🚗', color: '#007AFF' },
      'Shopping': { emoji: '🛍️', color: '#AF52DE' },
      'Entertainment': { emoji: '🎬', color: '#FF2D92' },
      'Bills & Utilities': { emoji: '💡', color: '#FFCC00' },
      'Healthcare': { emoji: '🏥', color: '#FF3B30' },
      'Income': { emoji: '💰', color: '#30D158' },
      'Investments': { emoji: '📈', color: '#30D158' },
      'Subscriptions': { emoji: '🔄', color: '#FF69B4' },
      'Gifts': { emoji: '🎁', color: '#FF9500' },
    };
    return icons[category] || { emoji: '💰', color: theme.colors.neutral[500] };
  };

  const groupedTransactions = groupTransactionsByDate(transactions);
  const dates = Object.keys(groupedTransactions).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate weekly totals
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const weeklyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= weekStart && transactionDate <= weekEnd;
  });

  const weeklyIncome = weeklyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpenses = weeklyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const weeklyNet = weeklyIncome - weeklyExpenses;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary[500]} 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton}>
            <IconSymbol name="magnifyingglass" size={24} color={theme.colors.text.secondary} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <IconSymbol name="line.3.horizontal.decrease" size={24} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        {/* Net Total Section */}
        <View style={styles.netTotalSection}>
          <Text style={styles.netTotalLabel}>Net total this week</Text>
          <Text style={styles.netTotalAmount}>
            {weeklyNet >= 0 ? '+' : '-'}${Math.abs(weeklyNet).toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
          <View style={styles.breakdown}>
            <Text style={styles.incomeText}>
              +{weeklyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.expenseText}>
              -{weeklyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Your transactions will appear here</Text>
          </View>
        ) : (
          dates.map((dateString) => {
            const dayTransactions = groupedTransactions[dateString];
            const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const dayNet = dayIncome - dayExpenses;

            return (
              <View key={dateString}>
                {/* Date Header */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>{getDateLabel(dateString)}</Text>
                  <Text style={styles.dateTotal}>
                    {dayNet >= 0 ? '+' : ''}${dayNet.toLocaleString('en-US', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </View>

                {/* Transaction Items */}
                {dayTransactions.map((transaction) => {
                  const categoryInfo = getCategoryIcon(transaction.category);
                  return (
                    <Pressable key={transaction.id} style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color }]}>
                          <Text style={styles.iconEmoji}>{categoryInfo.emoji}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionName}>{transaction.description}</Text>
                          <Text style={styles.transactionTime}>
                            {format(transaction.date, 'h:mm a')}
                          </Text>
                        </View>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        { 
                          color: transaction.type === 'income' 
                            ? theme.colors.success[500] 
                            : theme.colors.text.primary 
                        }
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24, // Match other tabs
    paddingBottom: 24,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
  },

  // Net Total Section
  netTotalSection: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  netTotalLabel: {
    fontSize: 16,
    color: '#8E8E93', // Match other tabs
    marginBottom: 8,
    fontWeight: '400',
  },
  netTotalAmount: {
    fontSize: 48,
    fontWeight: '100', // Ultra light like inspiration
    color: '#fff', // Match other tabs
    marginBottom: 16,
    letterSpacing: -1,
  },
  breakdown: {
    flexDirection: 'row',
    gap: 20,
  },
  incomeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#30D158', // iOS green
  },
  expenseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF453A', // iOS red
  },

  // Date Sections
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
    color: '#8E8E93', // Match other tabs
    letterSpacing: 0.5,
  },
  dateTotal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93', // Match other tabs
  },

  // Transaction Rows
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E', // Card background
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
    borderRadius: 10, // Slightly smaller radius like inspiration
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
    color: '#fff', // Match other tabs
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  transactionTime: {
    fontSize: 15,
    color: '#8E8E93', // Match other tabs
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Loading & Empty States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93', // Match other tabs
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff', // Match other tabs
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93', // Match other tabs
    textAlign: 'center',
  },

  bottomSpace: {
    height: 120,
  },
});