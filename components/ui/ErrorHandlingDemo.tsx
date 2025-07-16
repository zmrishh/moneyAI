import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ThemedButton } from './ThemedComponents';
import { ErrorBoundary } from './ErrorBoundary';
import {
  ErrorMessage,
  NetworkError,
  DataCorruptionError,
  FeedbackToast,
  useRetry,
  useFeedback,
} from './ErrorHandling';
import {
  LoadingSpinner,
  LoadingOverlay,
  ProgressBar,
  SkeletonList,
} from './LoadingStates';
import { ErrorHandler } from '../../services/errorHandler';
import { useTheme } from '../../contexts/ThemeContext';

// Demo component that can throw errors
const ErrorProneComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Demo error from component');
  }
  return (
    <ThemedText variant="base" color="success">
      Component loaded successfully!
    </ThemedText>
  );
};

// Demo component for network operations
const NetworkOperationDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { retry, isRetrying, attemptCount } = useRetry({
    maxAttempts: 3,
    baseDelay: 1000,
  });

  const simulateNetworkOperation = async () => {
    // Simulate random failure
    if (Math.random() < 0.7) {
      throw ErrorHandler.createNetworkError('Network request failed', 500);
    }
    return 'Success';
  };

  const handleOperation = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      await retry(simulateNetworkOperation);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasError) {
    return (
      <NetworkError
        onRetry={handleOperation}
        isRetrying={isRetrying}
      />
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
        Network Operation Demo
      </ThemedText>
      
      <ThemedButton
        onPress={handleOperation}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? 'Loading...' : 'Simulate Network Request'}
      </ThemedButton>

      {attemptCount > 0 && (
        <ThemedText variant="sm" color="secondary" style={styles.attemptText}>
          Attempt: {attemptCount}
        </ThemedText>
      )}
    </View>
  );
};

// Demo component for data operations
const DataOperationDemo = () => {
  const [hasDataError, setHasDataError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const simulateDataCorruption = () => {
    setHasDataError(true);
  };

  const handleRecover = async () => {
    setIsRecovering(true);
    // Simulate recovery process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRecovering(false);
    setHasDataError(false);
  };

  const handleReset = async () => {
    // Simulate reset process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasDataError(false);
  };

  if (hasDataError) {
    return (
      <DataCorruptionError
        onRecover={handleRecover}
        onReset={handleReset}
        isRecovering={isRecovering}
      />
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
        Data Operation Demo
      </ThemedText>
      
      <ThemedButton
        onPress={simulateDataCorruption}
        style={styles.button}
      >
        Simulate Data Corruption
      </ThemedButton>
    </View>
  );
};

// Demo component for feedback system
const FeedbackDemo = () => {
  const { feedback, isVisible, showError, showSuccess, showWarning, hideFeedback } = useFeedback();

  return (
    <View style={styles.section}>
      <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
        Feedback System Demo
      </ThemedText>
      
      <View style={styles.buttonRow}>
        <ThemedButton
          size="sm"
          onPress={() => showSuccess('Operation completed successfully!')}
          style={[styles.button, styles.smallButton]}
        >
          Success
        </ThemedButton>
        
        <ThemedButton
          size="sm"
          onPress={() => showWarning('Please review your settings')}
          style={[styles.button, styles.smallButton]}
        >
          Warning
        </ThemedButton>
        
        <ThemedButton
          size="sm"
          onPress={() => showError('Something went wrong', [
            { label: 'Retry', onPress: () => console.log('Retry pressed') },
            { label: 'Cancel', onPress: hideFeedback },
          ])}
          style={[styles.button, styles.smallButton]}
        >
          Error
        </ThemedButton>
      </View>

      <FeedbackToast
        feedback={feedback!}
        visible={isVisible}
        onDismiss={hideFeedback}
      />
    </View>
  );
};

// Demo component for loading states
const LoadingStatesDemo = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateProgress = () => {
    setShowOverlay(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval);
          setShowOverlay(false);
          return 0;
        }
        return prev + 0.1;
      });
    }, 200);
  };

  return (
    <View style={styles.section}>
      <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
        Loading States Demo
      </ThemedText>
      
      <LoadingSpinner message="Loading data..." style={styles.spinner} />
      
      <ProgressBar progress={0.65} showPercentage style={styles.progressBar} />
      
      <ThemedButton
        onPress={simulateProgress}
        style={styles.button}
      >
        Show Progress Overlay
      </ThemedButton>

      <SkeletonList itemCount={3} showAvatar style={styles.skeletonList} />

      <LoadingOverlay
        visible={showOverlay}
        message="Processing..."
        progress={progress}
        onCancel={() => setShowOverlay(false)}
      />
    </View>
  );
};

export default function ErrorHandlingDemo() {
  const { theme } = useTheme();
  const [throwError, setThrowError] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="2xl" weight="bold" style={styles.title}>
          Error Handling & Feedback Demo
        </ThemedText>
        <ThemedText variant="base" color="secondary" style={styles.subtitle}>
          Comprehensive error handling and user feedback system
        </ThemedText>
      </ThemedView>

      {/* Error Boundary Demo */}
      <View style={styles.section}>
        <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
          Error Boundary Demo
        </ThemedText>
        
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.log('Error caught by boundary:', error, errorInfo);
          }}
        >
          <ErrorProneComponent shouldThrow={throwError} />
        </ErrorBoundary>

        <ThemedButton
          onPress={() => setThrowError(!throwError)}
          style={styles.button}
        >
          {throwError ? 'Fix Component' : 'Break Component'}
        </ThemedButton>
      </View>

      {/* Error Message Demo */}
      <View style={styles.section}>
        <ThemedText variant="lg" weight="semibold" style={styles.sectionTitle}>
          Error Message Demo
        </ThemedText>
        
        <ErrorMessage
          error="This is a sample error message with retry functionality"
          onRetry={() => console.log('Retry pressed')}
          onDismiss={() => console.log('Dismiss pressed')}
        />
      </View>

      {/* Network Operation Demo */}
      <NetworkOperationDemo />

      {/* Data Operation Demo */}
      <DataOperationDemo />

      {/* Feedback Demo */}
      <FeedbackDemo />

      {/* Loading States Demo */}
      <LoadingStatesDemo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attemptText: {
    marginTop: 8,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: 16,
  },
  progressBar: {
    marginVertical: 16,
  },
  skeletonList: {
    marginTop: 16,
  },
});