import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import InteractiveChart from '@/components/ui/InteractiveChart';
import { dbService } from '@/services/database';
import { format, subDays, startOfDay } from 'date-fns';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ChartDataPoint {
  day: string;
  amount: number;
  date: Date;
  transactions: number;
}

export default function HomeScreen() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [pendingBills, setPendingBills] = useState(3);
  const [savingsGoals, setSavingsGoals] = useState(2);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      await dbService.initialize();
      const balance = await dbService.getTotalBalance();
      const recentTransactions = await dbService.getTransactions(50);

      setTotalBalance(balance.balance);
      setTransactions(recentTransactions);

      // Calculate today's spending
      const today = new Date();
      const todayTransactions = recentTransactions.filter(t =>
        t.type === 'expense' &&
        format(t.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      );
      const todayTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
      setTodaySpent(todayTotal);

      // Load bills data for pending count
      try {
        const bills = await dbService.getBills();
        const unpaidBills = bills.filter(bill => !bill.is_paid);
        setPendingBills(unpaidBills.length);
      } catch (billError) {
        console.log('Bills not loaded yet, using default count');
      }

      // Generate weekly spending data for chart
      const weekData = generateWeeklyData(recentTransactions);
      setChartData(weekData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const generateWeeklyData = (transactions: any[]): ChartDataPoint[] => {
    const today = new Date();
    const weekData: ChartDataPoint[] = [];

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);

      // Filter transactions for this day
      const dayTransactions = transactions.filter(t =>
        t.type === 'expense' &&
        format(t.date, 'yyyy-MM-dd') === format(dayStart, 'yyyy-MM-dd')
      );

      const dayAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

      weekData.push({
        day: format(date, 'EEE'),
        amount: dayAmount || (Math.random() * 300 + 50), // Use real data or fallback to mock
        date: dayStart,
        transactions: dayTransactions.length || Math.floor(Math.random() * 5 + 1),
      });
    }

    return weekData;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentDate = () => {
    return format(new Date(), 'MMMM dd, yyyy');
  };

  const handleChartBarPress = (dataPoint: ChartDataPoint) => {
    console.log('Selected day:', dataPoint.day, 'Amount:', dataPoint.amount);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Date */}
        <View style={styles.header}>
          <View style={styles.dateSection}>
            <Text 
              style={styles.appName}
              accessibilityRole="header"
              accessibilityLevel={1}
            >
              MoneyAI
            </Text>
            <Text 
              style={styles.currentDate}
              accessibilityLabel={`Today is ${getCurrentDate()}`}
            >
              {getCurrentDate()}
            </Text>
          </View>
        </View>

        {/* Greeting Section */}
        <View 
          style={styles.greetingSection}
          accessibilityRole="summary"
          accessibilityLabel={`${getGreeting()}, You have ${pendingBills} bills and ${savingsGoals} goals left today`}
        >
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.summaryText}>
            You have <Text style={styles.highlightNumber}>💳 {pendingBills} bills</Text>
          </Text>
          <Text style={styles.summaryText}>
            and <Text style={styles.highlightNumber}>🎯 {savingsGoals} goals</Text> left
          </Text>
          <Text style={styles.summaryText}>today.</Text>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          <View 
            style={styles.statCard}
            accessibilityRole="text"
            accessibilityLabel={`Current Balance: ${formatCurrency(totalBalance)}`}
          >
            <Text style={styles.statValue}>{formatCurrency(totalBalance)}</Text>
            <Text style={styles.statLabel}>Current Balance</Text>
          </View>
          <View 
            style={styles.statCard}
            accessibilityRole="text"
            accessibilityLabel={`Spent Today: ${formatCurrency(todaySpent)}`}
          >
            <Text style={styles.statValue}>{formatCurrency(todaySpent)}</Text>
            <Text style={styles.statLabel}>Spent Today</Text>
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.quickAccessTitle}>Quick Access</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAccessGrid}
          >
            <Pressable 
              style={styles.quickAccessCard}
              onPress={() => router.push('/bills')}
              accessibilityRole="button"
              accessibilityLabel="Bills - Track upcoming payments and bills"
              accessibilityHint="Navigate to bills tracker"
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#FF9500' }]}>
                <IconSymbol name="doc.text.fill" size={24} color="#fff" />
              </View>
              <Text style={styles.quickAccessLabel}>Bills</Text>
              <Text style={styles.quickAccessSubtext}>{pendingBills} pending</Text>
            </Pressable>

            <Pressable 
              style={styles.quickAccessCard}
              onPress={() => router.push('/debts')}
              accessibilityRole="button"
              accessibilityLabel="Debts - Track money owed and IOUs"
              accessibilityHint="Navigate to debt tracker"
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#34C759' }]}>
                <IconSymbol name="person.2.fill" size={24} color="#fff" />
              </View>
              <Text style={styles.quickAccessLabel}>Debts</Text>
              <Text style={styles.quickAccessSubtext}>IOUs & loans</Text>
            </Pressable>

            <Pressable 
              style={styles.quickAccessCard}
              onPress={() => router.push('/subscriptions')}
              accessibilityRole="button"
              accessibilityLabel="Subscriptions - Manage recurring payments"
              accessibilityHint="Navigate to subscription tracker"
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#007AFF' }]}>
                <IconSymbol name="repeat.circle.fill" size={24} color="#fff" />
              </View>
              <Text style={styles.quickAccessLabel}>Subs</Text>
              <Text style={styles.quickAccessSubtext}>Auto-renewing</Text>
            </Pressable>

            <Pressable 
              style={styles.quickAccessCard}
              onPress={() => router.push('/start-aa-journey')}
              accessibilityRole="button"
              accessibilityLabel="Account Aggregator - Secure financial data sharing"
              accessibilityHint="Start Account Aggregator journey"
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#32D74B' }]}>
                <IconSymbol name="link.circle.fill" size={24} color="#fff" />
              </View>
              <Text style={styles.quickAccessLabel}>AA</Text>
              <Text style={styles.quickAccessSubtext}>Link accounts</Text>
            </Pressable>


          </ScrollView>
        </View>

        {/* Spending Chart */}
        <View 
          style={styles.chartSection}
          accessibilityRole="summary"
          accessibilityLabel="Weekly spending chart showing daily expenses for the past 7 days"
        >
          <View style={styles.chartHeader}>
            <Text 
              style={styles.chartTitle}
              accessibilityRole="header"
              accessibilityLevel={2}
            >
              Weekly Spending
            </Text>
            <Text 
              style={styles.chartSubtitle}
              accessibilityHint="Interactive chart - tap any bar to see details for that day"
            >
              Tap any bar to see details
            </Text>
          </View>

          <InteractiveChart
            data={chartData}
            onBarPress={handleChartBarPress}
          />
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text 
              style={styles.summaryTitle}
              accessibilityRole="header"
              accessibilityLevel={2}
            >
              Summary
            </Text>
          </View>

          {/* Summary Cards Grid */}
          <View style={styles.summaryGrid}>
            {/* Top Row */}
            <View style={styles.summaryRow}>
              <View 
                style={styles.summaryCard}
                accessibilityRole="text"
                accessibilityLabel="Total Spent: ₹12,450, average ₹2,100"
              >
                <Text style={styles.cardLabel}>Total Spent</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>₹12,450</Text>
                </View>
                <Text style={styles.cardSubtext}>₹2,100 avg</Text>
              </View>

              <View 
                style={[styles.summaryCard, styles.highlightCard]}
                accessibilityRole="text"
                accessibilityLabel="Monthly Budget: ₹25,000, ₹12,550 left"
              >
                <Text style={styles.cardLabelWhite}>Monthly Budget</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValueWhite}>₹25,000</Text>
                </View>
                <Text style={styles.cardSubtextWhite}>₹12,550 left</Text>
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.summaryRow}>
              <View 
                style={styles.summaryCard}
                accessibilityRole="text"
                accessibilityLabel="Transactions: 47 total, 12 this week"
              >
                <Text style={styles.cardLabel}>Transactions</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>47</Text>
                </View>
                <Text style={styles.cardSubtext}>12 this week</Text>
              </View>

              <View 
                style={styles.summaryCard}
                accessibilityRole="text"
                accessibilityLabel="Top Category: Food, ₹4,200 spent"
              >
                <Text style={styles.cardLabel}>Top Category</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>Food</Text>
                </View>
                <Text style={styles.cardSubtext}>₹4,200</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Preview */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text 
              style={styles.sectionTitle}
              accessibilityRole="header"
              accessibilityLevel={2}
            >
              Recent Activity
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all transactions"
              accessibilityHint="Navigate to full transaction list"
            >
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>

          {transactions.slice(0, 3).map((transaction, index) => {
            const formattedAmount = formatCurrency(Math.abs(transaction.amount));
            const formattedDate = format(transaction.date, 'MMM dd');
            const transactionType = transaction.type === 'income' ? 'Income' : 'Expense';
            const accessibilityLabel = `${transactionType}: ${transaction.description}, ${formattedAmount}, ${transaction.category}, ${formattedDate}`;
            
            return (
              <Pressable 
                key={transaction.id} 
                style={styles.activityItem}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint="Double tap to view transaction details"
              >
                <View 
                  style={styles.activityIcon}
                  accessibilityRole="image"
                  accessibilityLabel={`${transaction.category} category icon`}
                >
                  <Text style={styles.activityEmoji}>
                    {transaction.category === 'Food & Dining' ? '🍕' :
                      transaction.category === 'Transportation' ? '🚗' :
                        transaction.category === 'Shopping' ? '🛍️' : '💰'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{transaction.description}</Text>
                  <Text style={styles.activityDate}>
                    {formattedDate} • {transaction.category}
                  </Text>
                </View>
                <Text style={[
                  styles.activityAmount,
                  { color: transaction.type === 'income' ? '#34C759' : '#FF3B30' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formattedAmount}
                </Text>
              </Pressable>
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
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  currentDate: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 24,
    color: '#8E8E93',
    lineHeight: 24,
  },
  highlightNumber: {
    color: '#fff',
    fontWeight: '600',
  },

  // Quick Access
  quickAccessSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 24,
  },
  quickAccessCard: {
    width: 100,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  quickAccessSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Chart
  chartSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  chartContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chartInfo: {
    alignItems: 'center',
  },
  chartAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  chartDate: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Summary Section
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  summaryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  summaryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  highlightCard: {
    backgroundColor: '#FF3B30',
  },
  cardLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardLabelWhite: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  cardValueWhite: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  cardSubtextWhite: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Recent Activity
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 120,
  },
});