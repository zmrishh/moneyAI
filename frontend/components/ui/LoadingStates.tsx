import React from 'react';
import { View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useTheme } from '../../contexts/ThemeContext';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: any;
}

export function LoadingSpinner({ size = 'large', color, message, style }: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.primary[500];

  return (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <ThemedText variant="sm" color="secondary" style={styles.spinnerMessage}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.neutral[200], theme.colors.neutral[300]],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

export interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  showPercentage?: boolean;
  style?: any;
}

export function ProgressBar({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  borderRadius = 4,
  showPercentage = false,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const bgColor = backgroundColor || theme.colors.neutral[200];
  const fillColor = progressColor || theme.colors.primary[500];
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={style}>
      <View
        style={[
          styles.progressBarContainer,
          {
            height,
            backgroundColor: bgColor,
            borderRadius,
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: fillColor,
              borderRadius,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <ThemedText variant="xs" color="secondary" style={styles.progressText}>
          {Math.round(clampedProgress * 100)}%
        </ThemedText>
      )}
    </View>
  );
}

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  cancelText?: string;
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  progress,
  onCancel,
  cancelText = 'Cancel',
}: LoadingOverlayProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.surface.overlay }]}>
      <ThemedView style={[styles.overlayContent, { backgroundColor: theme.colors.surface.elevated }]}>
        <LoadingSpinner message={message} />
        
        {typeof progress === 'number' && (
          <ProgressBar
            progress={progress}
            showPercentage
            style={styles.overlayProgress}
          />
        )}

        {onCancel && (
          <ThemedText
            variant="sm"
            color="primary"
            style={styles.cancelButton}
            onPress={onCancel}
          >
            {cancelText}
          </ThemedText>
        )}
      </ThemedView>
    </View>
  );
}

export interface SkeletonListProps {
  itemCount?: number;
  itemHeight?: number;
  showAvatar?: boolean;
  style?: any;
}

export function SkeletonList({ itemCount = 5, itemHeight = 60, showAvatar = false, style }: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={[styles.skeletonItem, { height: itemHeight }]}>
          {showAvatar && (
            <Skeleton width={40} height={40} borderRadius={20} style={styles.skeletonAvatar} />
          )}
          <View style={styles.skeletonContent}>
            <Skeleton width="70%" height={16} style={styles.skeletonTitle} />
            <Skeleton width="40%" height={12} style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface PulsingDotProps {
  size?: number;
  color?: string;
  style?: any;
}

export function PulsingDot({ size = 8, color, style }: PulsingDotProps) {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const dotColor = color || theme.colors.primary[500];

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}

export interface LoadingDotsProps {
  count?: number;
  size?: number;
  color?: string;
  spacing?: number;
  style?: any;
}

export function LoadingDots({ count = 3, size = 8, color, spacing = 4, style }: LoadingDotsProps) {
  return (
    <View style={[styles.dotsContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <PulsingDot
          key={index}
          size={size}
          color={color}
          style={[
            { marginHorizontal: spacing / 2 },
            index === 0 && { marginLeft: 0 },
            index === count - 1 && { marginRight: 0 },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  spinnerMessage: {
    marginTop: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    padding: 24,
    borderRadius: 12,
    minWidth: 200,
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
  overlayProgress: {
    width: '100%',
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skeletonAvatar: {
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonSubtitle: {
    marginBottom: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});