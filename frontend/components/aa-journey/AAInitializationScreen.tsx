import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AAInitializationScreen() {
  const { consentHandleId } = useLocalSearchParams<{ consentHandleId: string }>();
  const { state, initializeSDK } = useAAJourney();
  const { theme } = useTheme();

  useEffect(() => {
    if (consentHandleId && !state.isInitialized) {
      initializeSDK(consentHandleId);
    }
  }, [consentHandleId, state.isInitialized, initializeSDK]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Setting Up</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.loadingCard}>
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color="#32D74B" />
          </View>
          
          <Text style={styles.title}>Initializing Connection</Text>
          <Text style={styles.subtitle}>
            Setting up secure connection to your financial institutions...
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>Connecting securely</Text>
          </View>
        </View>

        {state.error && (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorMessage}>{state.error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#32D74B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});