import { ErrorHandler } from '../../../services/errorHandler';

describe('ErrorHandler Basic Tests', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
  });

  describe('Error Type Creation', () => {
    it('creates network errors correctly', () => {
      const error = ErrorHandler.createNetworkError('Network error', 404, 'NOT_FOUND');

      expect(error.message).toBe('Network error');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isNetworkError).toBe(true);
    });

    it('creates data errors correctly', () => {
      const error = ErrorHandler.createDataError('Data error', 'DATA_001', false);

      expect(error.message).toBe('Data error');
      expect(error.code).toBe('DATA_001');
      expect(error.recoverable).toBe(false);
      expect(error.isDataError).toBe(true);
    });

    it('creates validation errors correctly', () => {
      const error = ErrorHandler.createValidationError('Validation error', 'username');

      expect(error.message).toBe('Validation error');
      expect(error.field).toBe('username');
      expect(error.isValidationError).toBe(true);
    });
  });

  describe('Error Type Detection', () => {
    it('identifies network errors correctly', () => {
      const networkError = ErrorHandler.createNetworkError('Network error');
      const regularError = new Error('Regular error');

      expect(ErrorHandler.isNetworkError(networkError)).toBe(true);
      expect(ErrorHandler.isNetworkError(regularError)).toBe(false);
    });

    it('identifies data errors correctly', () => {
      const dataError = ErrorHandler.createDataError('Data error');
      const regularError = new Error('Regular error');

      expect(ErrorHandler.isDataError(dataError)).toBe(true);
      expect(ErrorHandler.isDataError(regularError)).toBe(false);
    });

    it('identifies validation errors correctly', () => {
      const validationError = ErrorHandler.createValidationError('Validation error');
      const regularError = new Error('Regular error');

      expect(ErrorHandler.isValidationError(validationError)).toBe(true);
      expect(ErrorHandler.isValidationError(regularError)).toBe(false);
    });
  });

  describe('Network Error Handling', () => {
    it('handles 401 unauthorized errors', () => {
      const error = ErrorHandler.createNetworkError('Unauthorized', 401);
      const result = handler.handleNetworkError(error);

      expect(result.message).toContain('session has expired');
      expect(result.severity).toBe('warning');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('Log In');
    });

    it('handles 403 forbidden errors', () => {
      const error = ErrorHandler.createNetworkError('Forbidden', 403);
      const result = handler.handleNetworkError(error);

      expect(result.message).toContain('don\'t have permission');
      expect(result.severity).toBe('error');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('Contact Support');
    });

    it('handles 429 rate limit errors', () => {
      const error = ErrorHandler.createNetworkError('Too Many Requests', 429);
      const result = handler.handleNetworkError(error);

      expect(result.message).toContain('Too many requests');
      expect(result.severity).toBe('warning');
      expect(result.autoRetry).toBe(true);
      expect(result.retryDelay).toBe(5000);
    });

    it('handles 500 server errors', () => {
      const error = ErrorHandler.createNetworkError('Internal Server Error', 500);
      const result = handler.handleNetworkError(error);

      expect(result.message).toContain('Server error');
      expect(result.severity).toBe('error');
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toBe('Retry');
      expect(result.actions[1].label).toBe('Report Issue');
    });

    it('handles generic network errors', () => {
      const error = ErrorHandler.createNetworkError('Network Error');
      const result = handler.handleNetworkError(error);

      expect(result.message).toContain('Network connection failed');
      expect(result.severity).toBe('error');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('Retry');
    });
  });

  describe('Data Corruption Handling', () => {
    it('provides recovery options for recoverable errors', () => {
      const error = ErrorHandler.createDataError('Data corrupted', 'DATA_001', true);
      const result = handler.handleDataCorruption(error);

      expect(result.canRecover).toBe(true);
      expect(result.recoveryMethods).toHaveLength(3);
      expect(result.recoveryMethods[0].name).toBe('Restore from Backup');
      expect(result.recoveryMethods[1].name).toBe('Repair Data');
      expect(result.recoveryMethods[2].name).toBe('Reset Data');
    });

    it('provides limited recovery options for non-recoverable errors', () => {
      const error = ErrorHandler.createDataError('Data corrupted', 'DATA_001', false);
      const result = handler.handleDataCorruption(error);

      expect(result.canRecover).toBe(true);
      expect(result.recoveryMethods).toHaveLength(2);
      expect(result.recoveryMethods[0].name).toBe('Restore from Backup');
      expect(result.recoveryMethods[1].name).toBe('Reset Data');
    });
  });

  describe('Sync Conflict Handling', () => {
    it('resolves conflicts based on timestamp for updates', () => {
      const conflict = {
        localData: { updatedAt: '2023-01-02T00:00:00Z' },
        remoteData: { updatedAt: '2023-01-01T00:00:00Z' },
        conflictType: 'update' as const,
        timestamp: new Date(),
      };

      const result = handler.handleSyncConflict(conflict);
      expect(result.resolution).toBe('local');
    });

    it('prefers remote data when it is newer', () => {
      const conflict = {
        localData: { updatedAt: '2023-01-01T00:00:00Z' },
        remoteData: { updatedAt: '2023-01-02T00:00:00Z' },
        conflictType: 'update' as const,
        timestamp: new Date(),
      };

      const result = handler.handleSyncConflict(conflict);
      expect(result.resolution).toBe('remote');
    });

    it('requires manual resolution for complex conflicts', () => {
      const conflict = {
        localData: { id: 1 },
        remoteData: { id: 1 },
        conflictType: 'delete' as const,
        timestamp: new Date(),
      };

      const result = handler.handleSyncConflict(conflict);
      expect(result.resolution).toBe('manual');
    });
  });

  describe('Validation Error Handling', () => {
    it('returns form feedback for validation errors', () => {
      const error = ErrorHandler.createValidationError('Email is required', 'email');
      const result = handler.handleValidationError(error);

      expect(result.field).toBe('email');
      expect(result.message).toBe('Email is required');
      expect(result.severity).toBe('error');
    });

    it('handles validation errors without field', () => {
      const error = ErrorHandler.createValidationError('Form is invalid');
      const result = handler.handleValidationError(error);

      expect(result.field).toBeUndefined();
      expect(result.message).toBe('Form is invalid');
      expect(result.severity).toBe('error');
    });
  });

  describe('Error Listeners', () => {
    it('adds and removes error listeners', () => {
      const listener = jest.fn();
      const unsubscribe = handler.addErrorListener(listener);

      const error = new Error('Test error');
      handler.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);

      // Test unsubscribe
      unsubscribe();
      handler.handleError(new Error('Another error'));
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});