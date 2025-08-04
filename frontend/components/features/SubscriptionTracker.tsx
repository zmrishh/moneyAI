import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Subscription } from '@/types';
import { format, addDays, differenceInDays } from 'date-fns';

interface SubscriptionTrackerProps {
  subscriptions: Subscription[];
  onAddSubscription: () => void;
  onCancelSubscription: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

export default function SubscriptionTracker({
  subscriptions,
  onAddSubscription,
  onCancelSubscription,
  onMarkPaid,
}: SubscriptionTrackerProps) {
  const [upcomingRenewals, setUpcomingRenewals] = useState<Subscription[]>([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);

  useEffect(() => {
    calculateUpcomingRenewals();
    calculateMonthlySpend();
  }, [subscriptions]);

  const calculateUpcomingRenewals = () => {
    const upcoming = subscriptions
      .filter(sub => sub.is_active)
      .filter(sub => differenceInDays(sub.next_billing_date, new Date()) <= 7)
      .sort((a, b) => a.next_billing_date.getTime() - b.next_billing_date.getTime());
    
    setUpcomingRenewals(upcoming);
  };

  const calculateMonthlySpend = () => {
    const monthly = subscriptions
      .filter(sub => sub.is_active)
      .reduce((total, sub) => {
        let monthlyAmount = sub.amount;
        switch (sub.billing_cycle) {
          case 'weekly':
            monthlyAmount = sub.amount * 4.33;
            break;
          case 'quarterly':
            monthlyAmount = sub.amount / 3;
            break;
          case 'yearly':
            monthlyAmount = sub.amount / 12;
            break;
        }
        return total + monthlyAmount;
      }, 0);
    
    setTotalMonthlySpend(monthly);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBillingCycleIcon = (cycle: string) => {
    switch (cycle) {
      case 'weekly': return '📅';
      case 'monthly': return '🗓️';
      case 'quarterly': return '📊';
      case 'yearly': return '🎯';
      default: return '💳';
    }
  };

  const getDaysUntilRenewal = (date: Date) => {
    const days = differenceInDays(date, new Date());
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Overdue';
    return `${days} days`;
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel ${subscription.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => onCancelSubscription(subscription.id)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Subscriptions</Text>
          <Text style={styles.subtitle}>
            {formatCurrency(totalMonthlySpend)}/month • {subscriptions.filter(s => s.is_active).length} active
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={onAddSubscription}>
          <IconSymbol name="plus" size={20} color="#007AFF" />
        </Pressable>
      </View>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF9500" />
            <Text style={styles.alertTitle}>Upcoming Renewals</Text>
          </View>
          <Text style={styles.alertText}>
            {upcomingRenewals.length} subscription{upcomingRenewals.length > 1 ? 's' : ''} renewing in the next 7 days
          </Text>
        </View>
      )}

      {/* Subscriptions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptySubtitle}>
              Track your recurring payments like Netflix, Spotify, and more
            </Text>
            <Pressable style={styles.emptyButton} onPress={onAddSubscription}>
              <Text style={styles.emptyButtonText}>Add First Subscription</Text>
            </Pressable>
          </View>
        ) : (
          subscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionIcon}>
                    {getBillingCycleIcon(subscription.billing_cycle)}
                  </Text>
                  <View style={styles.subscriptionDetails}>
                    <Text style={styles.subscriptionName}>{subscription.name}</Text>
                    <Text style={styles.subscriptionCategory}>{subscription.category}</Text>
                  </View>
                </View>
                <View style={styles.subscriptionAmount}>
                  <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
                  <Text style={styles.billingCycle}>/{subscription.billing_cycle}</Text>
                </View>
              </View>

              <View style={styles.subscriptionFooter}>
                <View style={styles.renewalInfo}>
                  <Text style={styles.renewalLabel}>Next billing:</Text>
                  <Text style={[
                    styles.renewalDate,
                    differenceInDays(subscription.next_billing_date, new Date()) <= 3 && styles.renewalUrgent
                  ]}>
                    {getDaysUntilRenewal(subscription.next_billing_date)} • {format(subscription.next_billing_date, 'MMM dd')}
                  </Text>
                </View>

                <View style={styles.subscriptionActions}>
                  {differenceInDays(subscription.next_billing_date, new Date()) <= 0 && (
                    <Pressable 
                      style={styles.actionButton}
                      onPress={() => onMarkPaid(subscription.id)}
                    >
                      <Text style={styles.actionButtonText}>Mark Paid</Text>
                    </Pressable>
                  )}
                  <Pressable 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelSubscription(subscription)}
                  >
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                  </Pressable>
                </View>
              </View>

              {!subscription.is_active && (
                <View style={styles.inactiveOverlay}>
                  <Text style={styles.inactiveText}>Cancelled</Text>
                </View>
              )}
            </View>
          ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    backgroundColor: '#2C1B00',
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    color: '#FF9500',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#FFCC80',
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
  subscriptionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subscriptionCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  billingCycle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  renewalInfo: {
    flex: 1,
  },
  renewalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  renewalDate: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  renewalUrgent: {
    color: '#FF6B6B',
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#2C2C2E',
  },
  cancelButtonText: {
    color: '#FF6B6B',
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
});