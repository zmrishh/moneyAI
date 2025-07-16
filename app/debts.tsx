import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, StatusBar, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import DebtTracker from '@/components/features/DebtTracker';
import { dbService } from '@/services/database';
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
      await dbService.initialize();
      const debtsData = await dbService.getDebts();
      setDebts(debtsData);
    } catch (error) {
      console.error('Error loading debts:', error);
      Alert.alert('Error', 'Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (debt: Omit<Debt, 'id' | 'payments' | 'created_date'>) => {
    try {
      const debtWithDate = {
        ...debt,
        created_date: new Date(),
      };
      await dbService.addDebt(debtWithDate);
      loadDebts();
      Alert.alert('Success', 'Debt added successfully');
    } catch (error) {
      console.error('Error adding debt:', error);
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  const handleAddPayment = async (debtId: string, payment: Omit<DebtPayment, 'id'>) => {
    try {
      await dbService.addDebtPayment(debtId, payment);
      loadDebts();
      Alert.alert('Success', 'Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  const handleSettleDebt = async (debtId: string) => {
    try {
      await dbService.settleDebt(debtId);
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