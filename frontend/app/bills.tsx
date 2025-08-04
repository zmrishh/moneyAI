import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, StatusBar, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import BillTracker from '@/components/features/BillTracker';
import { dbService } from '@/services/database';
import { Bill } from '@/types';

export default function BillsScreen() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      await dbService.initialize();
      const billsData = await dbService.getBills();
      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills:', error);
      Alert.alert('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = () => {
    // For now, add a sample bill
    const sampleBill: Omit<Bill, 'id'> = {
      name: 'Electricity Bill',
      amount: 2500,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      category: 'Bills & Utilities',
      is_recurring: true,
      recurrence_pattern: 'monthly',
      is_paid: false,
      auto_pay: false,
    };

    dbService.addBill(sampleBill)
      .then(() => {
        loadBills();
        Alert.alert('Success', 'Bill added successfully');
      })
      .catch((error) => {
        console.error('Error adding bill:', error);
        Alert.alert('Error', 'Failed to add bill');
      });
  };

  const handleMarkPaid = async (billId: string) => {
    try {
      await dbService.markBillPaid(billId);
      loadBills();
      Alert.alert('Success', 'Bill marked as paid');
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      Alert.alert('Error', 'Failed to mark bill as paid');
    }
  };

  const handleToggleAutoPay = async (billId: string) => {
    try {
      await dbService.toggleBillAutoPay(billId);
      loadBills();
    } catch (error) {
      console.error('Error toggling auto-pay:', error);
      Alert.alert('Error', 'Failed to toggle auto-pay');
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
            <Text style={styles.headerTitle}>Bills</Text>
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
          <Text style={styles.headerTitle}>Bills</Text>
          <View style={styles.headerRight} />
        </View>

        <BillTracker
          bills={bills}
          onAddBill={handleAddBill}
          onMarkPaid={handleMarkPaid}
          onToggleAutoPay={handleToggleAutoPay}
          onRefreshBills={loadBills}
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