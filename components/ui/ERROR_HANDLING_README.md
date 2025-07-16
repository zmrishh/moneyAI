# Error Handling and User Feedback System

This document describes the comprehensive error handling and user feedback system implemented for MoneyAI.

## Overview

The error handling system provides:
- **Error Boundaries** - Catch and handle React component errors
- **Loading States** - Various loading indicators and progress bars
- **User Feedback** - Toast notifications and error messages
- **Retry Mechanisms** - Automatic and manual retry functionality
- **Recovery Options** - Data corruption and sync conflict resolution

## Components

### Error Boundary Components

#### `ErrorBoundary`
Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

```tsx
import { ErrorBoundary } from './components/ui';

<ErrorBoundary
  onError={(error, errorInfo) => console.log('Error:', error)}
  resetKeys={[userId]} // Reset when userId changes
>
  <MyComponent />
</ErrorBoundary>
```

#### `withErrorBoundary` HOC
Higher-order component that wraps any component with an error boundary.

```tsx
import { withErrorBoundary } from './components/ui';

const SafeComponent = withErrorBoundary(MyComponent, {
  onError: (error) => reportError(error)
});
```

### Loading State Components

#### `LoadingSpinner`
Simple activity indicator with optional message.

```tsx
<LoadingSpinner size="large" message="Loading data..." />
```

#### `Skeleton`
Animated placeholder for content that's loading.

```tsx
<Skeleton width="100%" height={20} borderRadius={4} />
```

#### `ProgressBar`
Progress indicator with optional percentage display.

```tsx
<ProgressBar progress={0.65} showPercentage />
```

#### `LoadingOverlay`
Full-screen loading overlay with progress and cancel options.

```tsx
<LoadingOverlay
  visible={isLoading}
  message="Processing..."
  progress={uploadProgress}
  onCancel={() => cancelUpload()}
/>
```

#### `SkeletonList`
Animated list of skeleton items for loading states.

```tsx
<SkeletonList itemCount={5} showAvatar />
```

### Error Handling Components

#### `ErrorMessage`
Displays error messages with retry and dismiss options.

```tsx
<ErrorMessage
  error="Network connection failed"
  onRetry={() => retryOperation()}
  onDismiss={() => hideError()}
/>
```

#### `NetworkError`
Specialized component for network-related errors.

```tsx
<NetworkError
  onRetry={handleRetry}
  isRetrying={isRetrying}
/>
```

#### `DataCorruptionError`
Component for handling data corruption scenarios.

```tsx
<DataCorruptionError
  onRecover={handleDataRecovery}
  onReset={handleDataReset}
  isRecovering={isRecovering}
/>
```

#### `FeedbackToast`
Toast notification for user feedback.

```tsx
<FeedbackToast
  feedback={{
    message: "Operation completed successfully",
    severity: "success",
    actions: [
      { label: "Undo", onPress: handleUndo }
    ]
  }}
  visible={showToast}
  onDismiss={hideToast}
/>
```

## Hooks

### `useRetry`
Hook for implementing retry logic with exponential backoff.

```tsx
const { retry, isRetrying, attemptCount, canRetry } = useRetry({
  maxAttempts: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
});

const handleOperation = async () => {
  try {
    await retry(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    });
  } catch (error) {
    console.error('Operation failed after retries:', error);
  }
};
```

### `useFeedback`
Hook for managing user feedback and notifications.

```tsx
const { 
  feedback, 
  isVisible, 
  showError, 
  showSuccess, 
  showWarning, 
  hideFeedback 
} = useFeedback();

// Show different types of feedback
showSuccess("Data saved successfully");
showError("Failed to save data", [
  { label: "Retry", onPress: handleRetry }
]);
showWarning("Please review your settings");
```

## Error Handler Service

### `ErrorHandler`
Centralized error handling service with typed error handling.

```tsx
import { ErrorHandler, errorHandler } from './services/errorHandler';

// Handle different types of errors
try {
  await networkOperation();
} catch (error) {
  if (ErrorHandler.isNetworkError(error)) {
    const feedback = errorHandler.handleNetworkError(error);
    showFeedback(feedback);
  } else if (ErrorHandler.isDataError(error)) {
    const recovery = errorHandler.handleDataCorruption(error);
    showRecoveryOptions(recovery);
  } else {
    errorHandler.handleError(error);
  }
}

// Create typed errors
const networkError = ErrorHandler.createNetworkError('Connection failed', 500);
const dataError = ErrorHandler.createDataError('Database corrupted', 'DB_001');
const validationError = ErrorHandler.createValidationError('Email required', 'email');
```

## Error Types

### Network Errors
- **401 Unauthorized** - Session expired, redirect to login
- **403 Forbidden** - Insufficient permissions
- **429 Rate Limited** - Too many requests, auto-retry with delay
- **500+ Server Errors** - Server issues, offer retry and reporting
- **Generic Network** - Connection problems, basic retry

### Data Errors
- **Recoverable** - Attempt repair, restore from backup, or reset
- **Non-recoverable** - Restore from backup or reset only

### Validation Errors
- **Field-specific** - Show error next to specific form field
- **Form-wide** - Show general form validation message

## Usage Patterns

### Basic Error Boundary
```tsx
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}
```

### Network Operation with Retry
```tsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { retry, isRetrying } = useRetry();
  const { showError } = useFeedback();

  const loadData = async () => {
    try {
      const result = await retry(async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw ErrorHandler.createNetworkError(
            'Failed to load data', 
            response.status
          );
        }
        return response.json();
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      if (ErrorHandler.isNetworkError(err)) {
        const feedback = errorHandler.handleNetworkError(err);
        showError(feedback.message, feedback.actions);
      }
    }
  };

  if (error && !isRetrying) {
    return <NetworkError onRetry={loadData} />;
  }

  if (isRetrying || !data) {
    return <LoadingSpinner message="Loading data..." />;
  }

  return <DataDisplay data={data} />;
}
```

### Form with Validation
```tsx
function ContactForm() {
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useFeedback();

  const handleSubmit = async (formData) => {
    try {
      await submitForm(formData);
      showSuccess("Form submitted successfully");
    } catch (error) {
      if (ErrorHandler.isValidationError(error)) {
        const feedback = errorHandler.handleValidationError(error);
        setErrors({ [feedback.field]: feedback.message });
      } else {
        showError("Failed to submit form");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <ErrorMessage error={errors.email} compact />}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Testing

The error handling system includes comprehensive tests:

- **Unit tests** for individual components and hooks
- **Integration tests** for error scenarios
- **Recovery scenario tests** for data corruption handling
- **Retry mechanism tests** with timing verification

Run tests with:
```bash
npm test -- --testPathPatterns="ErrorHandling"
```

## Best Practices

1. **Always wrap main app components** with ErrorBoundary
2. **Use typed errors** from ErrorHandler for better handling
3. **Provide meaningful error messages** to users
4. **Implement retry logic** for transient failures
5. **Test error scenarios** thoroughly
6. **Log errors** for debugging and monitoring
7. **Provide recovery options** when possible
8. **Show loading states** during operations
9. **Use appropriate error severity** levels
10. **Make error messages actionable** with clear next steps

## Requirements Compliance

This implementation satisfies all requirements from the specification:

### Requirement 3.1: Network Error Handling
✅ Clear error messages with retry options for network failures

### Requirement 3.2: Loading States
✅ Appropriate loading states with progress indicators

### Requirement 3.3: Action Feedback
✅ Specific error messages explaining what went wrong

### Requirement 3.4: Visual Feedback
✅ Immediate visual feedback confirming actions

### Requirement 3.5: Database Recovery
✅ Recovery options for database corruption scenarios

The system provides a robust foundation for handling errors gracefully while maintaining a positive user experience.