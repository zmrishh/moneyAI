import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import {
  LoadingSpinner,
  Skeleton,
  ProgressBar,
  LoadingOverlay,
  SkeletonList,
  PulsingDot,
  LoadingDots,
} from '../LoadingStates';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider initialTheme="light">
    {children}
  </ThemeProvider>
);

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <LoadingSpinner />
      </TestWrapper>
    );

    // ActivityIndicator should be present
    expect(() => getByTestId('loading-spinner')).not.toThrow();
  });

  it('renders with custom message', () => {
    const { getByText } = render(
      <TestWrapper>
        <LoadingSpinner message="Loading data..." />
      </TestWrapper>
    );

    expect(getByText('Loading data...')).toBeTruthy();
  });

  it('renders with small size', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <LoadingSpinner size="small" />
      </TestWrapper>
    );

    // Should render without errors
    expect(() => getByTestId('loading-spinner')).not.toThrow();
  });
});

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <Skeleton testID="skeleton" />
      </TestWrapper>
    );

    expect(getByTestId('skeleton')).toBeTruthy();
  });

  it('renders with custom dimensions', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <Skeleton width={200} height={40} testID="skeleton" />
      </TestWrapper>
    );

    const skeleton = getByTestId('skeleton');
    expect(skeleton.props.style).toMatchObject({
      width: 200,
      height: 40,
    });
  });

  it('renders with custom border radius', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <Skeleton borderRadius={12} testID="skeleton" />
      </TestWrapper>
    );

    const skeleton = getByTestId('skeleton');
    expect(skeleton.props.style.borderRadius).toBe(12);
  });
});

describe('ProgressBar', () => {
  it('renders with progress value', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ProgressBar progress={0.5} testID="progress-bar" />
      </TestWrapper>
    );

    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows percentage when enabled', () => {
    const { getByText } = render(
      <TestWrapper>
        <ProgressBar progress={0.75} showPercentage />
      </TestWrapper>
    );

    expect(getByText('75%')).toBeTruthy();
  });

  it('clamps progress value between 0 and 1', () => {
    const { getByText: getByText1 } = render(
      <TestWrapper>
        <ProgressBar progress={-0.5} showPercentage />
      </TestWrapper>
    );

    expect(getByText1('0%')).toBeTruthy();

    const { getByText: getByText2 } = render(
      <TestWrapper>
        <ProgressBar progress={1.5} showPercentage />
      </TestWrapper>
    );

    expect(getByText2('100%')).toBeTruthy();
  });

  it('renders with custom colors', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ProgressBar
          progress={0.5}
          backgroundColor="#f0f0f0"
          progressColor="#007bff"
          testID="progress-bar"
        />
      </TestWrapper>
    );

    expect(getByTestId('progress-bar')).toBeTruthy();
  });
});

describe('LoadingOverlay', () => {
  it('renders when visible', () => {
    const { getByText } = render(
      <TestWrapper>
        <LoadingOverlay visible={true} message="Processing..." />
      </TestWrapper>
    );

    expect(getByText('Processing...')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <TestWrapper>
        <LoadingOverlay visible={false} message="Processing..." />
      </TestWrapper>
    );

    expect(queryByText('Processing...')).toBeNull();
  });

  it('shows progress bar when progress is provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <LoadingOverlay visible={true} progress={0.6} />
      </TestWrapper>
    );

    expect(getByText('60%')).toBeTruthy();
  });

  it('shows cancel button when onCancel is provided', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <LoadingOverlay visible={true} onCancel={onCancel} />
      </TestWrapper>
    );

    const cancelButton = getByText('Cancel');
    expect(cancelButton).toBeTruthy();

    fireEvent.press(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows custom cancel text', () => {
    const { getByText } = render(
      <TestWrapper>
        <LoadingOverlay
          visible={true}
          onCancel={() => {}}
          cancelText="Stop"
        />
      </TestWrapper>
    );

    expect(getByText('Stop')).toBeTruthy();
  });
});

describe('SkeletonList', () => {
  it('renders default number of items', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <SkeletonList />
      </TestWrapper>
    );

    // Should render 5 items by default
    const items = getAllByTestId(/skeleton-item/);
    expect(items).toHaveLength(5);
  });

  it('renders custom number of items', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <SkeletonList itemCount={3} />
      </TestWrapper>
    );

    const items = getAllByTestId(/skeleton-item/);
    expect(items).toHaveLength(3);
  });

  it('shows avatars when enabled', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <SkeletonList showAvatar={true} itemCount={2} />
      </TestWrapper>
    );

    const avatars = getAllByTestId(/skeleton-avatar/);
    expect(avatars).toHaveLength(2);
  });
});

describe('PulsingDot', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <PulsingDot testID="pulsing-dot" />
      </TestWrapper>
    );

    expect(getByTestId('pulsing-dot')).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <PulsingDot size={16} testID="pulsing-dot" />
      </TestWrapper>
    );

    const dot = getByTestId('pulsing-dot');
    expect(dot.props.style).toMatchObject({
      width: 16,
      height: 16,
      borderRadius: 8,
    });
  });
});

describe('LoadingDots', () => {
  it('renders default number of dots', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <LoadingDots />
      </TestWrapper>
    );

    // Should render 3 dots by default
    const dots = getAllByTestId(/loading-dot/);
    expect(dots).toHaveLength(3);
  });

  it('renders custom number of dots', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <LoadingDots count={5} />
      </TestWrapper>
    );

    const dots = getAllByTestId(/loading-dot/);
    expect(dots).toHaveLength(5);
  });

  it('renders with custom size and spacing', () => {
    const { getAllByTestId } = render(
      <TestWrapper>
        <LoadingDots count={2} size={12} spacing={8} />
      </TestWrapper>
    );

    const dots = getAllByTestId(/loading-dot/);
    expect(dots).toHaveLength(2);
    
    dots.forEach(dot => {
      expect(dot.props.style).toMatchObject({
        width: 12,
        height: 12,
        borderRadius: 6,
      });
    });
  });
});