import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAAJourney } from '../../contexts/AAJourneyContext';

export default function AAErrorScreen() {
  const { state, resetJourney, setError } = useAAJourney();
  const router = useRouter();

  const handleRetry = () => {
    setError(null);
    // Reset to initialization step to retry
    resetJourney();
  };

  const handleGoBack = async () => {
    await resetJourney();
    router.replace('/(tabs)');
  };

  const getErrorDetails = () => {
    const errorMessage = state.error || 'An unexpected error occurred';
    
    // Categorize errors for better user experience
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        icon: '📡',
        title: 'Connection Error',
        description: 'Unable to connect to the Account Aggregator service. Please check your internet connection and try again.',
        canRetry: true
      };
    } else if (errorMessage.includes('authentication') || errorMessage.includes('login')) {
      return {
        icon: '🔐',
        title: 'Authentication Error',
        description: 'There was an issue with your login credentials. Please verify your details and try again.',
        canRetry: true
      };
    } else if (errorMessage.includes('consent') || errorMessage.includes('permission')) {
      return {
        icon: '📋',
        title: 'Consent Error',
        description: 'There was an issue processing your consent request. Please try again or contact support.',
        canRetry: true
      };
    } else if (errorMessage.includes('timeout')) {
      return {
        icon: '⏱️',
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again with a stable internet connection.',
        canRetry: true
      };
    } else {
      return {
        icon: '⚠️',
        title: 'Something Went Wrong',
        description: errorMessage,
        canRetry: true
      };
    }
  };

  const { icon, title, description, canRetry } = getErrorDetails();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.icon}>{icon}</ThemedText>
        </View>
        
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>

        <View style={styles.errorDetails}>
          <ThemedText style={styles.errorTitle}>Error Details:</ThemedText>
          <ThemedText style={styles.errorMessage}>{state.error}</ThemedText>
        </View>

        <View style={styles.troubleshootingSection}>
          <ThemedText style={styles.troubleshootingTitle}>Troubleshooting Tips:</ThemedText>
          <ThemedText style={styles.troubleshootingText}>
            • Check your internet connection
          </ThemedText>
          <ThemedText style={styles.troubleshootingText}>
            • Ensure you have the latest version of the app
          </ThemedText>
          <ThemedText style={styles.troubleshootingText}>
            • Try again after a few minutes
          </ThemedText>
          <ThemedText style={styles.troubleshootingText}>
            • Contact support if the issue persists
          </ThemedText>
        </View>

        <View style={styles.actionContainer}>
          {canRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <ThemedText style={styles.retryButtonText}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.backButton, !canRetry && styles.singleButton]}
            onPress={handleGoBack}
          >
            <ThemedText style={styles.backButtonText}>
              Return to MoneyAI
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.supportSection}>
          <ThemedText style={styles.supportText}>
            Need help? Contact our support team
          </ThemedText>
          <ThemedText style={styles.supportEmail}>
            support@moneyai.com
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    color: '#dc3545',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  errorDetails: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#dc3545',
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'monospace',
  },
  troubleshootingSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 30,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  troubleshootingText: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 30,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginLeft: 10,
  },
  singleButton: {
    marginLeft: 0,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportSection: {
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 5,
  },
  supportEmail: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});