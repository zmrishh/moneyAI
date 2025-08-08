import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [iconAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const startAnimations = () => {
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered icon animations
    iconAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 400 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    // Show splash for 2 seconds, then show onboarding
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      startAnimations();
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#1A1A1A" />
        
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: 1,
              transform: [{ scale: 1 }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#0ea5e9" />
          </View>
          <Text style={styles.logoText}>MoneyAI</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: 1,
              transform: [{ translateY: 0 }],
            },
          ]}
        >
          <Text style={styles.tagline}>Smart Financial Management</Text>
          <Text style={styles.subtitle}>Track • Budget • Grow</Text>
        </Animated.View>
      </View>
    );
  }

  const handleGetStarted = async () => {
    try {
      // Don't mark onboarding as complete yet - that happens after walkthrough
      router.push('/walkthrough');
    } catch (error) {
      console.error('Error navigating to walkthrough:', error);
      router.push('/walkthrough');
    }
  };

  const handleSkip = async () => {
    await handleGetStarted();
  };

  const financialIcons = [
    { name: 'chart.bar.fill', color: '#0ea5e9', top: '15%', left: '20%' },
    { name: 'creditcard.fill', color: '#f59e0b', top: '25%', right: '15%' },
    { name: 'banknote.fill', color: '#22c55e', top: '35%', left: '10%' },
    { name: 'chart.pie.fill', color: '#ef4444', top: '45%', right: '20%' },
    { name: 'building.columns.fill', color: '#8b5cf6', top: '55%', left: '25%' },
    { name: 'target', color: '#06b6d4', top: '65%', right: '10%' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1A1A1A" />
      
      {/* Skip Button */}
      <Pressable 
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Floating Financial Icons */}
      <View style={styles.iconsContainer}>
        {financialIcons.map((icon, index) => (
          <Animated.View
            key={index}
            style={[
              styles.floatingIcon,
              {
                top: icon.top,
                left: icon.left,
                right: icon.right,
                opacity: iconAnimations[index],
                transform: [
                  {
                    scale: iconAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.iconBackground, { backgroundColor: `${icon.color}20` }]}>
              <IconSymbol name={icon.name} size={24} color={icon.color} />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#0ea5e9" />
          </View>
          <Text style={styles.appName}>MoneyAI</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.textSection}>
          <Text style={styles.welcomeText}>Welcome to MoneyAI</Text>
          <Text style={styles.mainTitle}>
            Smart financial{'\n'}management made{'\n'}
            <Text style={styles.highlightText}>simple</Text>
          </Text>
          <Text style={styles.subtitle}>
            Take control of your financial future with AI-powered insights, 
            budgeting tools, and seamless expense tracking.
          </Text>
        </View>
      </Animated.View>

      {/* Get Started Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get started with MoneyAI"
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  iconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  logoBackground: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  textContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  textSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  highlightText: {
    color: '#0ea5e9',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
  },
  getStartedButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});