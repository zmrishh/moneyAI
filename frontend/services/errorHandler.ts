import { Alert } from 'react-native';

export interface NetworkError extends Error {
  code?: string;
  status?: number;
  isNetworkError: true;
}

export interface DataError extends Error {
  code?: string;
  isDataError: true;
  recoverable?: boolean;
}

export interface ValidationError extends Error {
  field?: string;
  isValidationError: true;
}

export interface SyncConflict {
  localData: any;
  remoteData: any;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: Date;
}

export interface RecoveryOptions {
  canRecover: boolean;
  recoveryMethods: Array<{
    name: string;
    description: string;
    action: () => Promise<void>;
  }>;
}

export interface ConflictResolution {
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  mergedData?: any;
}

export interface FormFeedback {
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: Error) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Network error handling
  handleNetworkError(error: NetworkError): {
    message: string;
    severity: 'info' | 'warning' | 'error';
    actions: Array<{ label: string; onPress: () => void }>;
    autoRetry?: boolean;
    retryDelay?: number;
  } {
    console.error('Network error:', error);

    // Determine error type and appropriate response
    if (error.status === 401) {
      return {
        message: 'Your session has expired. Please log in again.',
        severity: 'warning',
        actions: [
          {
            label: 'Log In',
            onPress: () => {
              // Navigate to login screen
              console.log('Navigate to login');
            },
          },
        ],
      };
    }

    if (error.status === 403) {
      return {
        message: 'You don\'t have permission to perform this action.',
        severity: 'error',
        actions: [
          {
            label: 'Contact Support',
            onPress: () => {
              // Open support contact
              console.log('Contact support');
            },
          },
        ],
      };
    }

    if (error.status === 429) {
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        severity: 'warning',
        actions: [
          {
            label: 'Retry',
            onPress: () => {
              // Retry the failed operation
              console.log('Retry operation');
            },
          },
        ],
        autoRetry: true,
        retryDelay: 5000,
      };
    }

    if (error.status >= 500) {
      return {
        message: 'Server error. Our team has been notified.',
        severity: 'error',
        actions: [
          {
            label: 'Retry',
            onPress: () => {
              // Retry the failed operation
              console.log('Retry operation');
            },
          },
          {
            label: 'Report Issue',
            onPress: () => {
              this.reportError(error);
            },
          },
        ],
      };
    }

    // Generic network error
    return {
      message: 'Network connection failed. Please check your internet connection.',
      severity: 'error',
      actions: [
        {
          label: 'Retry',
          onPress: () => {
            // Retry the failed operation
            console.log('Retry operation');
          },
        },
      ],
    };
  }

  // Data corruption handling
  handleDataCorruption(error: DataError): RecoveryOptions {
    console.error('Data corruption error:', error);

    const recoveryMethods = [];

    // Try to recover from backup
    recoveryMethods.push({
      name: 'Restore from Backup',
      description: 'Restore your data from the most recent backup',
      action: async () => {
        try {
          // Implement backup restoration logic
          console.log('Restoring from backup...');
          // await backupService.restore();
        } catch (restoreError) {
          console.error('Backup restoration failed:', restoreError);
          throw new Error('Failed to restore from backup');
        }
      },
    });

    // Try to repair corrupted data
    if (error.recoverable) {
      recoveryMethods.push({
        name: 'Repair Data',
        description: 'Attempt to repair the corrupted data automatically',
        action: async () => {
          try {
            // Implement data repair logic
            console.log('Repairing data...');
            // await dataService.repair();
          } catch (repairError) {
            console.error('Data repair failed:', repairError);
            throw new Error('Failed to repair data');
          }
        },
      });
    }

    // Reset to clean state
    recoveryMethods.push({
      name: 'Reset Data',
      description: 'Clear all local data and start fresh (you will lose unsaved changes)',
      action: async () => {
        try {
          // Implement data reset logic
          console.log('Resetting data...');
          // await dataService.reset();
        } catch (resetError) {
          console.error('Data reset failed:', resetError);
          throw new Error('Failed to reset data');
        }
      },
    });

    return {
      canRecover: true,
      recoveryMethods,
    };
  }

  // Sync conflict handling
  handleSyncConflict(conflict: SyncConflict): ConflictResolution {
    console.log('Sync conflict detected:', conflict);

    // For simple conflicts, try automatic resolution
    if (conflict.conflictType === 'update') {
      // Use the most recent timestamp
      const localTimestamp = new Date(conflict.localData.updatedAt || 0);
      const remoteTimestamp = new Date(conflict.remoteData.updatedAt || 0);

      if (localTimestamp > remoteTimestamp) {
        return { resolution: 'local' };
      } else if (remoteTimestamp > localTimestamp) {
        return { resolution: 'remote' };
      }
    }

    // For complex conflicts, require manual resolution
    return { resolution: 'manual' };
  }

  // Validation error handling
  handleValidationError(error: ValidationError): FormFeedback {
    console.log('Validation error:', error);

    return {
      field: error.field,
      message: error.message,
      severity: 'error',
    };
  }

  // Generic error handling
  handleError(error: Error): void {
    console.error('Unhandled error:', error);

    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Show generic error message
    Alert.alert(
      'Unexpected Error',
      'Something went wrong. Please try again or contact support if the problem persists.',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Report',
          style: 'default',
          onPress: () => this.reportError(error),
        },
      ]
    );
  }

  // Error reporting
  private reportError(error: Error): void {
    try {
      // In a real app, this would send error reports to a service like Sentry
      const errorReport = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: 'MoneyAI Mobile App',
        // Add more context as needed
      };

      console.log('Error report:', errorReport);
      
      // Show confirmation to user
      Alert.alert(
        'Error Reported',
        'Thank you for reporting this issue. Our team will investigate.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Add error listener
  addErrorListener(listener: (error: Error) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Create typed errors
  static createNetworkError(message: string, status?: number, code?: string): NetworkError {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.status = status;
    error.code = code;
    return error;
  }

  static createDataError(message: string, code?: string, recoverable = true): DataError {
    const error = new Error(message) as DataError;
    error.isDataError = true;
    error.code = code;
    error.recoverable = recoverable;
    return error;
  }

  static createValidationError(message: string, field?: string): ValidationError {
    const error = new Error(message) as ValidationError;
    error.isValidationError = true;
    error.field = field;
    return error;
  }

  // Check error types
  static isNetworkError(error: any): error is NetworkError {
    return error && error.isNetworkError === true;
  }

  static isDataError(error: any): error is DataError {
    return error && error.isDataError === true;
  }

  static isValidationError(error: any): error is ValidationError {
    return error && error.isValidationError === true;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handleError(event.reason);
  });
}

// React Native specific error handling
if (typeof global !== 'undefined' && global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global error:', error, 'Fatal:', isFatal);
    errorHandler.handleError(error);
    
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}