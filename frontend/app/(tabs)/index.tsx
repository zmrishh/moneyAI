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
import { apiService } from '@/services/api';
import { authService } from '@/services/auth';
import { format, subDays, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

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
  const [pendingBills, setPendingBills] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Enhanced real-time data states
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetLeft, setBudgetLeft] = useState(0);
  const [transactionsThisWeek, setTransactionsThisWeek] = useState(0);
  const [topCategory, setTopCategory] = useState({ name: 'Food', amount: 0, percentage: 0 });
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    loadFinancialData();
  }, []);

  // Refresh data when user navigates to this tab
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Home tab focused - refreshing data...');
      loadFinancialData();
    }, [])
  );

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('User not authenticated, redirecting to walkthrough');
        router.replace('/walkthrough');
        return;
      }

      console.log('🔄 Loading financial data with timezone-aware calculations...');
      // Load enhanced dashboard data with real-time calculations
      const dashboardData = await apiService.getDashboardData();
      
      // All data comes from database - no offline fallbacks
      setIsOfflineMode(false);
      
      // Log timezone information if available
      if (dashboardData.timezone_info) {
        console.log('🕒 Timezone info:', {
          timezone: dashboardData.timezone_info.timezone,
          localTime: dashboardData.timezone_info.current_time,
          utcTime: dashboardData.timezone_info.utc_time
        });
      }
      
      // Set real-time financial data
      setTotalBalance(dashboardData.balance || 0);
      setTodaySpent(dashboardData.todaySpent || 0);
      setMonthlySpent(dashboardData.monthlySpent || 0);
      setDailyAverage(dashboardData.dailyAverage || 0);
      
      // Set user info with real full_name from users table
      setUser(dashboardData.userInfo || { full_name: 'User' });
      
      // Set budget data with real calculations
      setMonthlyBudget(dashboardData.totalBudget || 0);
      setBudgetLeft(dashboardData.budgetRemaining || 0);
      
      // Set top category with proper categorization
      setTopCategory({
        name: dashboardData.topCategory?.name || 'Food',
        amount: dashboardData.topCategory?.amount || 0,
        percentage: dashboardData.topCategory?.percentage || 0
      });
      
      // Ensure transactions is an array
      const transactionsList = Array.isArray(dashboardData.transactions) ? dashboardData.transactions : [];
      setTransactions(transactionsList);
      
      // Set counts from real data
      setPendingBills(dashboardData.pendingBills || 0);
      setSavingsGoals(dashboardData.savingsGoals || 0);
      setTransactionsThisWeek(dashboardData.thisWeekTransactions || 0);

      // Generate chart data for current week (last 7 days including today)
      const chartDates = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

      const chartData = chartDates.map(date => {
        const dayTransactions = transactionsList.filter((t: any) => {
          if (!t.date && !t.created_at) return false;
          const transactionDate = new Date(t.date || t.created_at);
          return transactionDate.toDateString() === date.toDateString();
        });
        
        const expenses = dayTransactions
          .filter((t: any) => (t.transaction_type || t.type) === 'expense')
          .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

        return {
          day: format(date, 'EEE'),
          amount: expenses,
          date: date,
          transactions: dayTransactions.length
        };
      });

      setChartData(chartData);

    } catch (error) {
      console.error('❌ Error loading financial data:', error);
      // Set offline mode on network errors so user knows there's an issue
      setIsOfflineMode(true);
      
      // Log detailed error for debugging
      console.error('💥 Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRefresh = async () => {
    console.log('🔄 Force refreshing all financial data...');
    
    // Reset all states to ensure clean refresh
    setLoading(true);
    setTotalBalance(0);
    setTodaySpent(0);
    setMonthlySpent(0);
    setDailyAverage(0);
    setMonthlyBudget(0);
    setBudgetLeft(0);
    setTransactionsThisWeek(0);
    setIsOfflineMode(false);
    
    // Force reload all data
    await loadFinancialData();
  };

  const handleConnectionTest = async () => {
    console.log('🔍 Testing connection manually...');
    const result = await apiService.testConnection();
    
    if (result.success) {
      console.log('✅ Connection test successful');
      // Try to refresh data
      await handleRefresh();
    } else {
      console.error('❌ Connection test failed:', result.message);
      console.error('🔧 Troubleshooting steps:', result.troubleshooting);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading your financial data...</Text>
      </View>
    );
  }

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
            <Pressable onPress={handleRefresh} style={styles.refreshButton}>
              <Text style={styles.currentDate}>
                {getCurrentDate()}
              </Text>
              <IconSymbol name="arrow.clockwise" size={16} color="#8E8E93" />
            </Pressable>
          </View>
        </View>

        {/* Offline Mode Banner */}
        {isOfflineMode && (
          <View style={styles.offlineBanner}>
            <IconSymbol name="wifi.slash" size={16} color="#FF9F40" />
            <Text style={styles.offlineText}>
              Server disconnected. Check network connection.
            </Text>
            <View style={styles.bannerButtons}>
              <Pressable onPress={handleConnectionTest} style={styles.testButton}>
                <Text style={styles.testText}>Test</Text>
              </Pressable>
              <Pressable onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Greeting Section */}
        <View 
          style={styles.greetingSection}
          accessibilityRole="summary"
          accessibilityLabel={`${getGreeting()}, ${user?.full_name || 'You have'} ${pendingBills} bills and ${savingsGoals} goals left today`}
        >
          <Text style={styles.greetingText}>
            {getGreeting()}, {user?.full_name ? user.full_name.split(' ')[0] : 'User'}
          </Text>
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
                accessibilityLabel={`This Month: ${formatCurrency(monthlySpent)}`}
              >
                <Text style={styles.cardLabel}>This Month</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>{formatCurrency(monthlySpent)}</Text>
                </View>
                <Text style={styles.cardSubtext}>
                  {formatCurrency(dailyAverage)} daily avg
                </Text>
              </View>

              <View 
                style={[styles.summaryCard, styles.highlightCard]}
                accessibilityRole="text"
                accessibilityLabel={`Monthly Budget: ${formatCurrency(monthlyBudget)}, ${formatCurrency(budgetLeft)} left`}
              >
                <Text style={styles.cardLabelWhite}>Monthly Budget</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValueWhite}>{formatCurrency(monthlyBudget)}</Text>
                </View>
                <Text style={styles.cardSubtextWhite}>{formatCurrency(budgetLeft)} left</Text>
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.summaryRow}>
              <View 
                style={styles.summaryCard}
                accessibilityRole="text"
                accessibilityLabel={`Transactions: ${transactions.length} total, ${transactionsThisWeek} this week`}
              >
                <Text style={styles.cardLabel}>Transactions</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>{transactions.length}</Text>
                </View>
                <Text style={styles.cardSubtext}>{transactionsThisWeek} this week</Text>
              </View>

              <View 
                style={styles.summaryCard}
                accessibilityRole="text"
                accessibilityLabel={`Top Category: ${topCategory.name}, ${formatCurrency(topCategory.amount)} spent`}
              >
                <Text style={styles.cardLabel}>Top Category</Text>
                <View style={styles.cardValueContainer}>
                  <IconSymbol name="arrow.up" size={16} color="#fff" />
                  <Text style={styles.cardValue}>{topCategory.name}</Text>
                </View>
                <Text style={styles.cardSubtext}>{formatCurrency(topCategory.amount)}</Text>
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
            const transactionDate = new Date(transaction.date || transaction.created_at);
            const formattedDate = format(transactionDate, 'MMM dd');
            const transactionType = (transaction.transaction_type || transaction.type) === 'income' ? 'Income' : 'Expense';
            const category = transaction.category_name || transaction.category || 'Other';
            const accessibilityLabel = `${transactionType}: ${transaction.description}, ${formattedAmount}, ${category}, ${formattedDate}`;
            
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
                    {category === 'Food & Dining' ? '🍕' :
                      category === 'Transportation' ? '🚗' :
                        category === 'Shopping' ? '🛍️' :
                        category === 'Entertainment' ? '🎬' :
                        category === 'Bills & Utilities' ? '⚡' :
                        category === 'Healthcare' ? '🏥' :
                        category === 'Subscriptions' ? '📱' :
                        category === 'Income' ? '💰' : '💰'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{transaction.description}</Text>
                  <Text style={styles.activityDate}>
                    {formattedDate} • {category}
                  </Text>
                </View>
                <Text style={[
                  styles.activityAmount,
                  { color: (transaction.transaction_type || transaction.type) === 'income' ? '#34C759' : '#FF3B30' }
                ]}>
                  {(transaction.transaction_type || transaction.type) === 'income' ? '+' : '-'}
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1810',
    borderColor: '#FF9F40',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9F40',
    fontWeight: '500',
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testText: {
    fontSize: 12,
    color: '#FF9F40',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#FF9F40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
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
  
  // Loading
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});