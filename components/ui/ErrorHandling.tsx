import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ThemedButton } from './ThemedComponents';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from './LoadingStates';

export interface ErrorInfo {
  message: string;
  code?: string | number;
  details?: any;
  timestamp?: Date;
}

export interface UserFeedback {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actions?: Array<{
    label: string;
    onPress: () => void;
    style?: 'primary' | 'secondary' | 'destructive';
  }>;
  autoRetry?: boolean;
  retryDelay?: number;
  dismissible?: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface ErrorMessageProps {
  error: ErrorInfo | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
  compact?: boolean;
}

export function ErrorMessage({ error, onRetry, onDismiss, style, compact = false }: ErrorMessageProps) {
  const { theme } = useTheme();
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <ThemedView style={[styles.errorContainer, { backgroundColor: theme.colors.error[50] }, style]}>
      <View style={styles.errorContent}>
        <ThemedText
          variant={compact ? 'sm' : 'base'}
          color="error"
          weight="semibold"
          style={styles.errorMessage}
        >
          {errorMessage}
        </ThemedText>
        
        <View style={styles.errorActions}>
          {onRetry && (
            <ThemedButton
              size="sm"
              onPress={onRetry}
              style={[styles.errorButton, { backgroundColor: theme.colors.error[500] }]}
            >
              Retry
            </ThemedButton>
          )}
          {onDismiss && (
            <ThemedButton
              size="sm"
              variant="outline"
              onPress={onDismiss}
              style={[styles.errorButton, { borderColor: theme.colors.error[300] }]}
            >
              Dismiss
            </ThemedButton>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

export interface NetworkErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
  style?: any;
}

export function NetworkError({ onRetry, isRetrying = false, style }: NetworkErrorProps) {
  return (
    <View style={[styles.networkErrorContainer, style]}>
      <ThemedText variant="lg" weight="semibold" color="error" style={styles.networkErrorTitle}>
        Connection Problem
      </ThemedText>
      
      <ThemedText variant="base" color="secondary" style={styles.networkErrorMessage}>
        Please check your internet connection and try again.
      </ThemedText>

      <ThemedButton
        onPress={onRetry}
        disabled={isRetrying}
        loading={isRetrying}
        style={styles.networkErrorButton}
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </ThemedButton>
    </View>
  );
}

export interface DataCorruptionErrorProps {
  onRecover: () => void;
  onReset: () => void;
  isRecovering?: boolean;
  style?: any;
}

export function DataCorruptionError({ onRecover, onReset, isRecovering = false, style }: DataCorruptionErrorProps) {
  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Data',
      'This will clear all local data and start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onReset },
      ]
    );
  }, [onReset]);

  return (
    <View style={[styles.dataErrorContainer, style]}>
      <ThemedText variant="lg" weight="semibold" color="error" style={styles.dataErrorTitle}>
        Data Recovery Needed
      </ThemedText>
      
      <ThemedText variant="base" color="secondary" style={styles.dataErrorMessage}>
        We detected an issue with your local data. We can try to recover it or start fresh.
      </ThemedText>

      <View style={styles.dataErrorActions}>
        <ThemedButton
          onPress={onRecover}
          disabled={isRecovering}
          loading={isRecovering}
          style={styles.dataErrorButton}
        >
          {isRecovering ? 'Recovering...' : 'Try Recovery'}
        </ThemedButton>
        
        <ThemedButton
          variant="outline"
          onPress={handleReset}
          disabled={isRecovering}
          style={styles.dataErrorButton}
        >
          Start Fresh
        </ThemedButton>
      </View>
    </View>
  );
}

export interface FeedbackToastProps {
  feedback: UserFeedback;
  visible: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

export function FeedbackToast({ feedback, visible, onDismiss, position = 'top' }: FeedbackToastProps) {
  const { theme } = useTheme();
  
  if (!visible) return null;

  const getSeverityColor = () => {
    switch (feedback.severity) {
      case 'error':
        return theme.colors.error[500];
      case 'warning':
        return theme.colors.warning[500];
      case 'success':
        return theme.colors.success[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const getSeverityBackgroundColor = () => {
    switch (feedback.severity) {
      case 'error':
        return theme.colors.error[50];
      case 'warning':
        return theme.colors.warning[50];
      case 'success':
        return theme.colors.success[50];
      default:
        return theme.colors.primary[50];
    }
  };

  return (
    <View style={[
      styles.toastContainer,
      position === 'top' ? styles.toastTop : styles.toastBottom,
    ]}>
      <ThemedView style={[
        styles.toast,
        {
          backgroundColor: getSeverityBackgroundColor(),
          borderLeftColor: getSeverityColor(),
        }
      ]}>
        <ThemedText
          variant="sm"
          weight="semibold"
          style={[styles.toastMessage, { color: getSeverityColor() }]}
        >
          {feedback.message}
        </ThemedText>

        {feedback.actions && feedback.actions.length > 0 && (
          <View style={styles.toastActions}>
            {feedback.actions.map((action, index) => (
              <ThemedButton
                key={index}
                size="sm"
                variant={action.style === 'destructive' ? 'outline' : 'solid'}
                onPress={action.onPress}
                style={[
                  styles.toastActionButton,
                  action.style === 'destructive' && { borderColor: theme.colors.error[300] }
                ]}
              >
                {action.label}
              </ThemedButton>
            ))}
          </View>
        )}

        {feedback.dismissible !== false && (
          <ThemedButton
            size="sm"
            variant="ghost"
            onPress={onDismiss}
            style={styles.toastDismiss}
          >
            ×
          </ThemedButton>
        )}
      </ThemedView>
    </View>
  );
}

// Hook for retry logic with exponential backoff
export function useRetry(config: Partial<RetryConfig> = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
  } = config;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    setIsRetrying(true);
    let currentAttempt = 0;

    while (currentAttempt < maxAttempts) {
      try {
        const result = await operation();
        setIsRetrying(false);
        setAttemptCount(0);
        return result;
      } catch (error) {
        currentAttempt++;
        setAttemptCount(currentAttempt);

        if (currentAttempt >= maxAttempts) {
          setIsRetrying(false);
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, currentAttempt - 1),
          maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [maxAttempts, baseDelay, backoffMultiplier, maxDelay]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttemptCount(0);
  }, []);

  return {
    retry,
    reset,
    isRetrying,
    attemptCount,
    canRetry: attemptCount < maxAttempts,
  };
}

// Hook for managing user feedback
export function useFeedback() {
  const [feedback, setFeedback] = useState<UserFeedback | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showFeedback = useCallback((newFeedback: UserFeedback) => {
    setFeedback(newFeedback);
    setIsVisible(true);

    // Auto-dismiss after delay if specified
    if (newFeedback.autoRetry && newFeedback.retryDelay) {
      setTimeout(() => {
        setIsVisible(false);
      }, newFeedback.retryDelay);
    }
  }, []);

  const hideFeedback = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showError = useCallback((message: string, actions?: UserFeedback['actions']) => {
    showFeedback({
      message,
      severity: 'error',
      actions,
      dismissible: true,
    });
  }, [showFeedback]);

  const showSuccess = useCallback((message: string) => {
    showFeedback({
      message,
      severity: 'success',
      dismissible: true,
      autoRetry: true,
      retryDelay: 3000,
    });
  }, [showFeedback]);

  const showWarning = useCallback((message: string, actions?: UserFeedback['actions']) => {
    showFeedback({
      message,
      severity: 'warning',
      actions,
      dismissible: true,
    });
  }, [showFeedback]);

  return {
    feedback,
    isVisible,
    showFeedback,
    hideFeedback,
    showError,
    showSuccess,
    showWarning,
  };
}

const styles = StyleSheet.create({
  errorContainer: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  errorContent: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: 12,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  errorButton: {
    minWidth: 80,
  },
  networkErrorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  networkErrorTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  networkErrorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  networkErrorButton: {
    minWidth: 120,
  },
  dataErrorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  dataErrorTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  dataErrorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  dataErrorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dataErrorButton: {
    minWidth: 100,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toastTop: {
    top: 50,
  },
  toastBottom: {
    bottom: 50,
  },
  toast: {
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastMessage: {
    flex: 1,
    lineHeight: 18,
  },
  toastActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  toastActionButton: {
    minWidth: 60,
  },
  toastDismiss: {
    marginLeft: 8,
    minWidth: 32,
    height: 32,
  },
});