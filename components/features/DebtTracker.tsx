import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Debt, DebtPayment } from '@/types';
import { format, differenceInDays } from 'date-fns';

interface DebtTrackerProps {
  debts: Debt[];
  onAddDebt: (debt: Omit<Debt, 'id' | 'payments' | 'created_date'>) => void;
  onAddPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
  onSettleDebt: (debtId: string) => void;
}

export default function DebtTracker({
  debts,
  onAddDebt,
  onAddPayment,
  onSettleDebt,
}: DebtTrackerProps) {
  const [activeTab, setActiveTab] = useState<'owe' | 'owed'>('owe');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const filteredDebts = debts.filter(debt => debt.type === activeTab && !debt.is_settled);
  const totalOwed = debts.filter(d => d.type === 'owe' && !d.is_settled).reduce((sum, d) => sum + d.amount, 0);
  const totalOwedToMe = debts.filter(d => d.type === 'owed' && !d.is_settled).reduce((sum, d) => sum + d.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysOverdue = (dueDate?: Date) => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(), dueDate);
    return days > 0 ? days : null;
  };

  const handleAddPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPaymentModal(true);
  };

  const handleSettleDebt = (debt: Debt) => {
    Alert.alert(
      'Settle Debt',
      `Mark "${debt.description}" as fully settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settle', 
          onPress: () => onSettleDebt(debt.id)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Money Tracker</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <IconSymbol name="plus" size={20} color="#007AFF" />
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.oweCard]}>
          <Text style={styles.summaryLabel}>I Owe</Text>
          <Text style={[styles.summaryAmount, { color: '#FF6B6B' }]}>
            {formatCurrency(totalOwed)}
          </Text>
          <Text style={styles.summaryCount}>
            {debts.filter(d => d.type === 'owe' && !d.is_settled).length} people
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.owedCard]}>
          <Text style={styles.summaryLabel}>Owed to Me</Text>
          <Text style={[styles.summaryAmount, { color: '#34C759' }]}>
            {formatCurrency(totalOwedToMe)}
          </Text>
          <Text style={styles.summaryCount}>
            {debts.filter(d => d.type === 'owed' && !d.is_settled).length} people
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'owe' && styles.activeTab]}
          onPress={() => setActiveTab('owe')}
        >
          <Text style={[styles.tabText, activeTab === 'owe' && styles.activeTabText]}>
            I Owe ({debts.filter(d => d.type === 'owe' && !d.is_settled).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'owed' && styles.activeTab]}
          onPress={() => setActiveTab('owed')}
        >
          <Text style={[styles.tabText, activeTab === 'owed' && styles.activeTabText]}>
            Owed to Me ({debts.filter(d => d.type === 'owed' && !d.is_settled).length})
          </Text>
        </Pressable>
      </View>

      {/* Debt List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'owe' ? '💸' : '💰'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'owe' ? 'No outstanding debts' : 'No money owed to you'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'owe' 
                ? 'Track money you owe to friends and family'
                : 'Keep track of money others owe you'
              }
            </Text>
          </View>
        ) : (
          filteredDebts.map((debt) => {
            const overdueDays = getDaysOverdue(debt.due_date);
            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = debt.original_amount - totalPaid;

            return (
              <View key={debt.id} style={styles.debtCard}>
                <View style={styles.debtHeader}>
                  <View style={styles.debtInfo}>
                    <Text style={styles.personName}>{debt.person_name}</Text>
                    <Text style={styles.debtDescription}>{debt.description}</Text>
                    {debt.due_date && (
                      <Text style={[
                        styles.dueDate,
                        overdueDays && styles.overdue
                      ]}>
                        {overdueDays 
                          ? `${overdueDays} days overdue`
                          : `Due ${format(debt.due_date, 'MMM dd')}`
                        }
                      </Text>
                    )}
                  </View>
                  <View style={styles.amountInfo}>
                    <Text style={[
                      styles.debtAmount,
                      { color: debt.type === 'owe' ? '#FF6B6B' : '#34C759' }
                    ]}>
                      {formatCurrency(remaining)}
                    </Text>
                    {totalPaid > 0 && (
                      <Text style={styles.paidAmount}>
                        {formatCurrency(totalPaid)} paid
                      </Text>
                    )}
                  </View>
                </View>

                {/* Progress Bar */}
                {totalPaid > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${(totalPaid / debt.original_amount) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round((totalPaid / debt.original_amount) * 100)}% paid
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.debtActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleAddPayment(debt)}
                  >
                    <IconSymbol name="plus.circle" size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Add Payment</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.settleButton]}
                    onPress={() => handleSettleDebt(debt)}
                  >
                    <IconSymbol name="checkmark.circle" size={16} color="#34C759" />
                    <Text style={[styles.actionButtonText, { color: '#34C759' }]}>Settle</Text>
                  </Pressable>
                </View>

                {/* Recent Payments */}
                {debt.payments.length > 0 && (
                  <View style={styles.paymentsSection}>
                    <Text style={styles.paymentsTitle}>Recent Payments</Text>
                    {debt.payments.slice(-2).map((payment) => (
                      <View key={payment.id} style={styles.paymentItem}>
                        <Text style={styles.paymentAmount}>
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Text style={styles.paymentDate}>
                          {format(payment.date, 'MMM dd, yyyy')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Debt Modal */}
      <AddDebtModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddDebt}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        visible={showPaymentModal}
        debt={selectedDebt}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedDebt(null);
        }}
        onAdd={(payment) => {
          if (selectedDebt) {
            onAddPayment(selectedDebt.id, payment);
          }
        }}
      />
    </View>
  );
}

// Add Debt Modal Component
function AddDebtModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (debt: Omit<Debt, 'id' | 'payments' | 'created_date'>) => void;
}) {
  const [formData, setFormData] = useState({
    type: 'owe' as 'owe' | 'owed',
    person_name: '',
    amount: '',
    description: '',
  });

  const handleSubmit = () => {
    if (!formData.person_name || !formData.amount || !formData.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    onAdd({
      type: formData.type,
      person_name: formData.person_name,
      person_contact: undefined,
      amount: parseFloat(formData.amount),
      original_amount: parseFloat(formData.amount),
      description: formData.description,
      is_settled: false,
    });

    setFormData({ type: 'owe', person_name: '', amount: '', description: '' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Add Debt</Text>
          <Pressable onPress={handleSubmit}>
            <Text style={styles.modalSave}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeSelector}>
              <Pressable
                style={[styles.typeOption, formData.type === 'owe' && styles.typeOptionActive]}
                onPress={() => setFormData({ ...formData, type: 'owe' })}
              >
                <Text style={[styles.typeText, formData.type === 'owe' && styles.typeTextActive]}>
                  I Owe
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeOption, formData.type === 'owed' && styles.typeOptionActive]}
                onPress={() => setFormData({ ...formData, type: 'owed' })}
              >
                <Text style={[styles.typeText, formData.type === 'owed' && styles.typeTextActive]}>
                  Owed to Me
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Person</Text>
            <TextInput
              style={styles.formInput}
              value={formData.person_name}
              onChangeText={(text) => setFormData({ ...formData, person_name: text })}
              placeholder="Enter name"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Amount</Text>
            <TextInput
              style={styles.formInput}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="0"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={styles.formInput}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="What's this for?"
              placeholderTextColor="#8E8E93"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Add Payment Modal Component
function AddPaymentModal({ visible, debt, onClose, onAdd }: {
  visible: boolean;
  debt: Debt | null;
  onClose: () => void;
  onAdd: (payment: Omit<DebtPayment, 'id'>) => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    onAdd({
      amount: parseFloat(amount),
      date: new Date(),
      note: note || undefined,
    });

    setAmount('');
    setNote('');
    onClose();
  };

  if (!debt) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Add Payment</Text>
          <Pressable onPress={handleSubmit}>
            <Text style={styles.modalSave}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.debtSummary}>
            <Text style={styles.debtSummaryTitle}>{debt.person_name}</Text>
            <Text style={styles.debtSummaryAmount}>
              Remaining: {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
              }).format(debt.amount)}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Payment Amount</Text>
            <TextInput
              style={styles.formInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Note (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor="#8E8E93"
            />
          </View>
        </View>
      </View>
    </Modal>
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
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  oweCard: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  owedCard: {
    borderWidth: 1,
    borderColor: '#34C759',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
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
  },
  debtCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  debtInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  debtDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  overdue: {
    color: '#FF6B6B',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  paidAmount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  debtActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  settleButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  paymentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 16,
  },
  paymentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
  },
  paymentDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  typeTextActive: {
    color: '#fff',
  },
  debtSummary: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  debtSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  debtSummaryAmount: {
    fontSize: 14,
    color: '#8E8E93',
  },
});