import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
  ErrorMessage,
  NetworkError,
  DataCorruptionError,
  FeedbackToast,
  useRetry,
  useFeedback,
} from '../ErrorHandling';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider initialTheme="light">
    {children}
  </ThemeProvider>
);

describe('ErrorMessage', () => {
  it('renders error message string', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorMessage error="Something went wrong" />
      </TestWrapper>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders error object message', () => {
    const error = {
      message: 'Network error occurred',
      code: 'NET_001',
      timestamp: new Date(),
    };

    const { getByText } = render(
      <TestWrapper>
        <ErrorMessage error={error} />
      </TestWrapper>
    );

    expect(getByText('Network error occurred')).toBeTruthy();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <ErrorMessage error="Error message" onRetry={onRetry} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <ErrorMessage error="Error message" onDismiss={onDismiss} />
      </TestWrapper>
    );

    const dismissButton = getByText('Dismiss');
    expect(dismissButton).toBeTruthy();

    fireEvent.press(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders in compact mode', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorMessage error="Error message" compact={true} />
      </TestWrapper>
    );

    expect(getByText('Error message')).toBeTruthy();
  });
});

describe('NetworkError', () => {
  it('renders network error message', () => {
    const { getByText } = render(
      <TestWrapper>
        <NetworkError onRetry={() => {}} />
      </TestWrapper>
    );

    expect(getByText('Connection Problem')).toBeTruthy();
    expect(getByText(/Please check your internet connection/)).toBeTruthy();
  });

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <NetworkError onRetry={onRetry} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows retrying state', () => {
    const { getByText } = render(
      <TestWrapper>
        <NetworkError onRetry={() => {}} isRetrying={true} />
      </TestWrapper>
    );

    expect(getByText('Retrying...')).toBeTruthy();
  });

  it('disables button when retrying', () => {
    const { getByText } = render(
      <TestWrapper>
        <NetworkError onRetry={() => {}} isRetrying={true} />
      </TestWrapper>
    );

    const button = getByText('Retrying...');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });
});

describe('DataCorruptionError', () => {
  it('renders data corruption error message', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataCorruptionError onRecover={() => {}} onReset={() => {}} />
      </TestWrapper>
    );

    expect(getByText('Data Recovery Needed')).toBeTruthy();
    expect(getByText(/We detected an issue with your local data/)).toBeTruthy();
  });

  it('calls onRecover when recovery button is pressed', () => {
    const onRecover = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <DataCorruptionError onRecover={onRecover} onReset={() => {}} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Try Recovery'));
    expect(onRecover).toHaveBeenCalled();
  });

  it('shows confirmation alert before reset', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <DataCorruptionError onRecover={() => {}} onReset={onReset} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Start Fresh'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Reset Data',
      'This will clear all local data and start fresh. Are you sure?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Reset', onPress: onReset }),
      ])
    );
  });

  it('shows recovering state', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataCorruptionError
          onRecover={() => {}}
          onReset={() => {}}
          isRecovering={true}
        />
      </TestWrapper>
    );

    expect(getByText('Recovering...')).toBeTruthy();
  });
});

describe('FeedbackToast', () => {
  const mockFeedback = {
    message: 'Operation completed successfully',
    severity: 'success' as const,
    dismissible: true,
  };

  it('renders when visible', () => {
    const { getByText } = render(
      <TestWrapper>
        <FeedbackToast
          feedback={mockFeedback}
          visible={true}
          onDismiss={() => {}}
        />
      </TestWrapper>
    );

    expect(getByText('Operation completed successfully')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <TestWrapper>
        <FeedbackToast
          feedback={mockFeedback}
          visible={false}
          onDismiss={() => {}}
        />
      </TestWrapper>
    );

    expect(queryByText('Operation completed successfully')).toBeNull();
  });

  it('shows dismiss button when dismissible', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <FeedbackToast
          feedback={mockFeedback}
          visible={true}
          onDismiss={onDismiss}
        />
      </TestWrapper>
    );

    const dismissButton = getByText('×');
    expect(dismissButton).toBeTruthy();

    fireEvent.press(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows action buttons when provided', () => {
    const action = jest.fn();
    const feedbackWithActions = {
      ...mockFeedback,
      actions: [
        { label: 'Undo', onPress: action },
        { label: 'View Details', onPress: action },
      ],
    };

    const { getByText } = render(
      <TestWrapper>
        <FeedbackToast
          feedback={feedbackWithActions}
          visible={true}
          onDismiss={() => {}}
        />
      </TestWrapper>
    );

    expect(getByText('Undo')).toBeTruthy();
    expect(getByText('View Details')).toBeTruthy();

    fireEvent.press(getByText('Undo'));
    expect(action).toHaveBeenCalled();
  });

  it('renders different severity styles', () => {
    const errorFeedback = {
      message: 'Error occurred',
      severity: 'error' as const,
    };

    const { getByText } = render(
      <TestWrapper>
        <FeedbackToast
          feedback={errorFeedback}
          visible={true}
          onDismiss={() => {}}
        />
      </TestWrapper>
    );

    expect(getByText('Error occurred')).toBeTruthy();
  });
});

// Test component for useRetry hook
const RetryTestComponent = ({ operation }: { operation: () => Promise<any> }) => {
  const { retry, isRetrying, attemptCount, canRetry } = useRetry({
    maxAttempts: 3,
    baseDelay: 100,
  });

  const handleRetry = async () => {
    try {
      await retry(operation);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <>
      <button testID="retry-button" onPress={handleRetry} disabled={isRetrying}>
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
      <span testID="attempt-count">{attemptCount}</span>
      <span testID="can-retry">{canRetry.toString()}</span>
    </>
  );
};

describe('useRetry hook', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('retries operation on failure', async () => {
    let callCount = 0;
    const operation = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Operation failed'));
      }
      return Promise.resolve('Success');
    });

    const { getByTestId } = render(
      <TestWrapper>
        <RetryTestComponent operation={operation} />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('retry-button'));

    // Fast-forward timers to complete retries
    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  it('updates attempt count during retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

    const { getByTestId } = render(
      <TestWrapper>
        <RetryTestComponent operation={operation} />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('retry-button'));

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getByTestId('attempt-count').children[0]).toBe('1');
    });
  });

  it('stops retrying after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

    const { getByTestId } = render(
      <TestWrapper>
        <RetryTestComponent operation={operation} />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('retry-button'));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(getByTestId('can-retry').children[0]).toBe('false');
    });
  });
});

// Test component for useFeedback hook
const FeedbackTestComponent = () => {
  const { feedback, isVisible, showError, showSuccess, showWarning, hideFeedback } = useFeedback();

  return (
    <>
      <button testID="show-error" onPress={() => showError('Error message')}>
        Show Error
      </button>
      <button testID="show-success" onPress={() => showSuccess('Success message')}>
        Show Success
      </button>
      <button testID="show-warning" onPress={() => showWarning('Warning message')}>
        Show Warning
      </button>
      <button testID="hide-feedback" onPress={hideFeedback}>
        Hide Feedback
      </button>
      {feedback && (
        <FeedbackToast
          feedback={feedback}
          visible={isVisible}
          onDismiss={hideFeedback}
        />
      )}
    </>
  );
};

describe('useFeedback hook', () => {
  it('shows error feedback', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <FeedbackTestComponent />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('show-error'));
    expect(getByText('Error message')).toBeTruthy();
  });

  it('shows success feedback', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <FeedbackTestComponent />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('show-success'));
    expect(getByText('Success message')).toBeTruthy();
  });

  it('shows warning feedback', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <FeedbackTestComponent />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('show-warning'));
    expect(getByText('Warning message')).toBeTruthy();
  });

  it('hides feedback when requested', () => {
    const { getByTestId, getByText, queryByText } = render(
      <TestWrapper>
        <FeedbackTestComponent />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('show-error'));
    expect(getByText('Error message')).toBeTruthy();

    fireEvent.press(getByTestId('hide-feedback'));
    expect(queryByText('Error message')).toBeNull();
  });
});