import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { lightTheme } from '../../../constants/Theme';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider initialTheme="light">
    {children}
  </ThemeProvider>
);

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
          <div>No error content</div>
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('No error content')).toBeTruthy();
  });

  it('renders error fallback when child component throws', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/We encountered an unexpected error/)).toBeTruthy();
  });

  it('shows retry button and allows retry', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('Try Again')).toBeTruthy();

    // Click retry button
    fireEvent.press(getByText('Try Again'));

    // Wait for error boundary to reset
    await waitFor(() => {
      // The error should be cleared, but since our component still throws,
      // it should show the error again
      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('resets when resetKeys change', async () => {
    let resetKey = 'key1';
    const { rerender, getByText, queryByText } = render(
      <TestWrapper>
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Change reset key
    resetKey = 'key2';
    rerender(
      <TestWrapper>
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Something went wrong')).toBeNull();
    });
  });

  it('shows error details in development mode', () => {
    const originalEnv = __DEV__;
    (global as any).__DEV__ = true;

    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('Error Details (Development Mode):')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();

    (global as any).__DEV__ = originalEnv;
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    const { getByText } = render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(getByText('Test component')).toBeTruthy();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    const { getByText } = render(
      <TestWrapper>
        <WrappedComponent shouldThrow={true} />
      </TestWrapper>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('passes error boundary props to wrapper', () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(ThrowError, { onError });

    render(
      <TestWrapper>
        <WrappedComponent shouldThrow={true} />
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalled();
  });
});