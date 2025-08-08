import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, StatusBar, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import DebtTracker from '@/components/features/DebtTracker';
import { apiService } from '@/services/api';
import { Debt, DebtPayment } from '@/types';

export default function DebtsScreen() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const debtsData = await apiService.getDebts();
      setDebts(debtsData);
    } catch (error) {
      console.error('Error loading debts:', error);
      Alert.alert('Error', 'Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (debtData: any) => {
    try {
      const debt = {
        debt_type: debtData.debt_type,
        person_name: debtData.person_name,
        amount: parseFloat(debtData.amount),
        description: debtData.description,
        created_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        due_date: debtData.due_date || null,
        person_contact: debtData.person_contact || null,
      };
      
      await apiService.createDebt(debt);
      loadDebts();
      Alert.alert('Success', 'Debt added successfully');
    } catch (error) {
      console.error('Error adding debt:', error);
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  const handleAddPayment = async (debtId: string, paymentData: any) => {
    try {
      const payment = {
        amount: parseFloat(paymentData.amount),
        date: paymentData.date || new Date().toISOString(),
        note: paymentData.note || null,
      };
      
      await apiService.addDebtPayment(debtId, payment);
      loadDebts();
      Alert.alert('Success', 'Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  const handleSettleDebt = async (debtId: string, note?: string) => {
    try {
      await apiService.settleDebt(debtId, note);
      loadDebts();
      Alert.alert('Success', 'Debt settled successfully');
    } catch (error) {
      console.error('Error settling debt:', error);
      Alert.alert('Error', 'Failed to settle debt');
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
          
          {/* Custom Header - Always Show */}
          <View style={styles.header}>
            <Pressable 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="#007AFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Debts</Text>
            <View style={styles.headerRight} />
          </View>
          
          {/* Loading Content */}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Debts</Text>
          <View style={styles.headerRight} />
        </View>

        <DebtTracker
          debts={debts}
          onAddDebt={handleAddDebt}
          onAddPayment={handleAddPayment}
          onSettleDebt={handleSettleDebt}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  
  // Custom Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});