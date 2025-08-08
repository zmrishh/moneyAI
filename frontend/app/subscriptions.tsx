import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, StatusBar, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import SubscriptionTracker from '@/components/features/SubscriptionTracker';
import { apiService } from '@/services/api';
import { Subscription } from '@/types';

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const subscriptionsData = await apiService.getSubscriptions();
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = (subscriptionData: any) => {
    // Format the data for the API
    const subscription = {
      name: subscriptionData.name,
      amount: parseFloat(subscriptionData.amount),
      billing_cycle: subscriptionData.billing_cycle,
      next_billing_date: subscriptionData.next_billing_date,
      category: subscriptionData.category,
      is_active: true,
      auto_renew: true,
    };

    apiService.createSubscription(subscription)
      .then(() => {
        loadSubscriptions();
        Alert.alert('Success', 'Subscription added successfully');
      })
      .catch((error) => {
        console.error('Error adding subscription:', error);
        Alert.alert('Error', 'Failed to add subscription');
      });
  };

  const handleCancelSubscription = async (id: string) => {
    try {
      await apiService.cancelSubscription(id);
      loadSubscriptions();
      Alert.alert('Success', 'Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await apiService.renewSubscription(id);
      loadSubscriptions();
      Alert.alert('Success', 'Subscription payment recorded');
    } catch (error) {
      console.error('Error marking subscription as paid:', error);
      Alert.alert('Error', 'Failed to record payment');
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
            <Text style={styles.headerTitle}>Subscriptions</Text>
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
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <View style={styles.headerRight} />
        </View>

        <SubscriptionTracker
          subscriptions={subscriptions}
          onAddSubscription={handleAddSubscription}
          onCancelSubscription={handleCancelSubscription}
          onMarkPaid={handleMarkPaid}
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