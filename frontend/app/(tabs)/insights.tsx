import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  StatusBar,
  View,
  Text,
  Pressable,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { apiService } from '@/services/api';
import { authService } from '@/services/auth';
import { router } from 'expo-router';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

export default function InsightsScreen() {
  const [insights, setInsights] = useState({
    thisMonth: 0,
    lastMonth: 0,
    avgDaily: 0,
    topCategory: { name: 'Food', amount: 0 },
    daysLeft: 0,
    canSpend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      if (!authService.isAuthenticated()) {
        console.log('User not authenticated, redirecting to walkthrough');
        router.replace('/walkthrough');
        return;
      }

      // Load real-time insights data from enhanced analytics endpoint
      const insightsData = await apiService.getMoneyInsights();
      
      setInsights({
        thisMonth: insightsData.this_month?.amount || 0,
        lastMonth: 0, // Would be calculated from comparison in backend
        avgDaily: insightsData.daily_average?.amount || 0,
        topCategory: {
          name: insightsData.top_category?.category || 'Food',
          amount: insightsData.top_category?.amount || 0
        },
        daysLeft: insightsData.month_info?.days_left || 0,
        canSpend: insightsData.budget_advice?.daily_allowance || 0,
      });
    } catch (error) {
      console.error('Error loading insights:', error);
      // Set default values on error
      setInsights({
        thisMonth: 0,
        lastMonth: 0,
        avgDaily: 0,
        topCategory: { name: 'Food', amount: 0 },
        daysLeft: 0,
        canSpend: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const getSpendingTrend = () => {
    const diff = insights.thisMonth - insights.lastMonth;
    const percentage = insights.lastMonth > 0 ? Math.abs((diff / insights.lastMonth) * 100) : 0;
    
    if (Math.abs(diff) < 100) return { text: 'About the same as last month', color: '#8E8E93', icon: '➡️' };
    if (diff > 0) return { text: `${Math.round(percentage)}% more than last month`, color: '#FF3B30', icon: '📈' };
    return { text: `${Math.round(percentage)}% less than last month`, color: '#30D158', icon: '📉' };
  };

  const getSpendingAdvice = () => {
    if (insights.canSpend > insights.avgDaily * 1.5) {
      return { text: "You're doing great! You can spend a bit more.", color: '#30D158', icon: '😊' };
    } else if (insights.canSpend > insights.avgDaily * 0.8) {
      return { text: "You're on track. Keep it up!", color: '#FFD60A', icon: '👍' };
    } else {
      return { text: "Try to spend less to stay on budget.", color: '#FF3B30', icon: '⚠️' };
    }
  };

  const trend = getSpendingTrend();
  const advice = getSpendingAdvice();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text 
            style={styles.title}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Your Money Insights
          </Text>
          <Text 
            style={styles.subtitle}
            accessibilityRole="text"
          >
            Simple insights about your spending
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading insights...</Text>
          </View>
        ) : (
          <>

        {/* This Month Card */}
        <View 
          style={styles.mainCard}
          accessibilityRole="summary"
          accessibilityLabel={`This month's spending: ${formatCurrency(insights.thisMonth)}. ${trend.text}`}
        >
          <Text style={styles.cardTitle}>This Month</Text>
          <Text style={styles.bigAmount}>{formatCurrency(insights.thisMonth)}</Text>
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{trend.icon}</Text>
            <Text style={[styles.trendText, { color: trend.color }]}>{trend.text}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View 
            style={styles.statCard}
            accessibilityRole="text"
            accessibilityLabel={`Daily Average: ${formatCurrency(insights.avgDaily)}`}
          >
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>{formatCurrency(insights.avgDaily)}</Text>
            <Text style={styles.statLabel}>Daily Average</Text>
          </View>
          <View 
            style={styles.statCard}
            accessibilityRole="text"
            accessibilityLabel={`Top category: ${insights.topCategory.name}, ${formatCurrency(insights.topCategory.amount)} spent`}
          >
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{formatCurrency(insights.topCategory.amount)}</Text>
            <Text style={styles.statLabel}>Top: {insights.topCategory.name}</Text>
          </View>
        </View>

        {/* Budget Advice */}
        <View 
          style={styles.adviceCard}
          accessibilityRole="alert"
          accessibilityLabel={`Budget Advice: ${advice.text} You can spend ${formatCurrency(insights.canSpend)} per day for the next ${insights.daysLeft} days`}
        >
          <View style={styles.adviceHeader}>
            <Text style={styles.adviceEmoji}>{advice.icon}</Text>
            <Text 
              style={styles.adviceTitle}
              accessibilityRole="header"
              accessibilityLevel={3}
            >
              Budget Advice
            </Text>
          </View>
          <Text style={[styles.adviceText, { color: advice.color }]}>{advice.text}</Text>
          <Text style={styles.adviceDetail}>
            You can spend {formatCurrency(insights.canSpend)} per day for the next {insights.daysLeft} days
          </Text>
        </View>

        {/* Simple Actions */}
        <View style={styles.actionsContainer}>
          <Text 
            style={styles.actionsTitle}
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Quick Actions
          </Text>
          
          <Pressable 
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="See where your money goes - Category breakdown"
            accessibilityHint="View detailed spending breakdown by category"
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>See where your money goes</Text>
              <Text style={styles.actionSubtitle}>Category breakdown</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Set a monthly budget - Stay on track"
            accessibilityHint="Create and manage your monthly spending budget"
          >
            <Text style={styles.actionEmoji}>🎯</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Set a monthly budget</Text>
              <Text style={styles.actionSubtitle}>Stay on track</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Get saving tips - Personalized advice"
            accessibilityHint="View personalized tips to save money based on your spending patterns"
          >
            <Text style={styles.actionEmoji}>💡</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Get saving tips</Text>
              <Text style={styles.actionSubtitle}>Personalized advice</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
        </>
        )}
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },

  // Main Card
  mainCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  bigAmount: {
    fontSize: 48,
    fontWeight: '100',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIcon: {
    fontSize: 20,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Advice Card
  adviceCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  adviceEmoji: {
    fontSize: 20,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  adviceText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  adviceDetail: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 24,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },

  bottomSpacer: {
    height: 120,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});