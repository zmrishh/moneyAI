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
import { Bill } from '@/types';
import { format, differenceInDays, addMonths, isToday, isTomorrow } from 'date-fns';

interface BillTrackerProps {
  bills: Bill[];
  onAddBill: () => void;
  onMarkPaid: (billId: string) => void;
  onToggleAutoPay: (billId: string) => void;
}

export default function BillTracker({
  bills,
  onAddBill,
  onMarkPaid,
  onToggleAutoPay,
}: BillTrackerProps) {
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [overdueBills, setOverdueBills] = useState<Bill[]>([]);
  const [totalMonthlyBills, setTotalMonthlyBills] = useState(0);

  useEffect(() => {
    categorizeAndCalculateBills();
  }, [bills]);

  const categorizeAndCalculateBills = () => {
    const today = new Date();
    const upcoming: Bill[] = [];
    const overdue: Bill[] = [];
    let monthlyTotal = 0;

    bills.forEach(bill => {
      if (!bill.is_paid) {
        const daysUntilDue = differenceInDays(bill.due_date, today);
        
        if (daysUntilDue < 0) {
          overdue.push(bill);
        } else if (daysUntilDue <= 7) {
          upcoming.push(bill);
        }
      }

      // Calculate monthly total for recurring bills
      if (bill.is_recurring) {
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
        <View>
          <Text style={styles.title}>Bills & Payments</Text>
          <Text style={styles.subtitle}>
            {formatCurrency(totalMonthlyBills)}/month recurring
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={onAddBill}>
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
            <Pressable style={styles.emptyButton} onPress={onAddBill}>
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
              <Text style={styles.sectionTitle}>All Bills ({bills.length})</Text>
              {bills
                .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
                .map(renderBillCard)}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
});