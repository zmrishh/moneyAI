import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { Country, getCountryByCode } from '@/constants/CountryCodes';

const { width, height } = Dimensions.get('window');

interface SignupModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'initial' | 'phone' | 'email' | 'login';

export function SignupModal({ visible, onClose }: SignupModalProps) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(getCountryByCode('IN')!);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animation values
  const modalHeight = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Modal animation effects
  useEffect(() => {
    if (visible) {
      // Show modal with bottom sheet animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(modalHeight, {
          toValue: authMode === 'initial' ? height * 0.65 : height,
          duration: 350,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Hide modal
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(modalHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle auth mode changes with smooth animation
  useEffect(() => {
    if (visible && authMode !== 'initial') {
      // Smooth transition to full screen when switching from initial to form
      Animated.timing(modalHeight, {
        toValue: height,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setIsFullScreen(true);
      });
    }
  }, [authMode, visible]);

  const handleKeyboardShow = () => {
    setKeyboardVisible(true);
    // Keyboard handling is now managed by auth mode changes
  };

  const handleKeyboardHide = () => {
    setKeyboardVisible(false);
  };

  const resetModal = () => {
    setAuthMode('initial');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setIsLoading(false);
    setIsFullScreen(false);
    setKeyboardVisible(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handlePhoneSignup = () => {
    setAuthMode('phone');
    // Animation handled by useEffect
  };

  const handleEmailSignup = () => {
    setAuthMode('email');
    // Animation handled by useEffect
  };

  const navigateToApp = () => {
    handleClose();
    router.replace('/(tabs)');
  };

  const handleAppleSignup = () => {
    console.log('Apple signup initiated');
    // Simulate successful Apple signup
    setTimeout(() => {
      navigateToApp();
    }, 1000);
  };

  const handleGoogleSignup = () => {
    console.log('Google signup initiated');
    // Simulate successful Google signup
    setTimeout(() => {
      navigateToApp();
    }, 1000);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Simulate successful phone verification (skip OTP for demo)
      Alert.alert(
        'Success', 
        `Account created with ${selectedCountry.dialCode} ${phoneNumber}`,
        [
          {
            text: 'Continue',
            onPress: navigateToApp
          }
        ]
      );
    }, 2000);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [
          {
            text: 'Continue',
            onPress: navigateToApp
          }
        ]
      );
    }, 2000);
  };

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success', 
        'Logged in successfully!',
        [
          {
            text: 'Continue',
            onPress: navigateToApp
          }
        ]
      );
    }, 2000);
  };

  const renderInitialView = () => (
    <>
      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={18} color="#FFFFFF" />
      </Pressable>

      {/* 4-point sparkle icon */}
      <View style={styles.sparkleContainer}>
        <Text style={styles.sparkle}>✨</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Get Started</Text>

      {/* Description */}
      <Text style={styles.description}>
        Take control of your finances with AI-powered{'\n'}insights and smart budgeting tools.
      </Text>

      {/* Continue with Phone - White button */}
      <Pressable
        style={styles.phoneButton}
        onPress={handlePhoneSignup}
        accessibilityRole="button"
        accessibilityLabel="Continue with Phone"
      >
        <Text style={styles.phoneButtonText}>Continue with Phone</Text>
      </Pressable>

      {/* Continue with Email - Dark button */}
      <Pressable
        style={styles.emailButton}
        onPress={handleEmailSignup}
        accessibilityRole="button"
        accessibilityLabel="Continue with Email"
      >
        <Text style={styles.emailButtonText}>Continue with Email</Text>
      </Pressable>

      {/* Social sign-in buttons */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.appleButton}
          onPress={handleAppleSignup}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
        >
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={styles.googleButton}
          onPress={handleGoogleSignup}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          <Text style={styles.googleIcon}>G</Text>
        </Pressable>
      </View>

      {/* Login link */}
      <Pressable onPress={() => setAuthMode('login')} style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account? Sign in</Text>
      </Pressable>

      {/* Home Indicator */}
      {/* <View style={styles.homeIndicator} /> */}
    </>
  );

  const renderPhoneForm = () => (
    <>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => setAuthMode('initial')}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Title */}
      <Text style={styles.formTitle}>Enter phone number</Text>

      {/* Description */}
      <Text style={styles.formDescription}>
        We'll send you a verification code to confirm your number
      </Text>

      {/* Phone input container */}
      <View style={styles.phoneInputContainer}>
        <Pressable 
          style={styles.countryCodeContainer}
          onPress={() => setShowCountrySelector(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#8E8E93" style={styles.chevronIcon} />
        </Pressable>
        <TextInput
          style={styles.phoneInput}
          placeholder="Mobile number"
          placeholderTextColor="#8E8E93"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      {/* Continue button */}
      <Pressable
        style={[styles.continueButton, { opacity: phoneNumber.length > 0 ? 1 : 0.5 }]}
        onPress={handlePhoneSubmit}
        disabled={isLoading || phoneNumber.length === 0}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Sending...' : 'Continue'}
        </Text>
      </Pressable>

      {/* Alternative options */}
      <Text style={styles.orText}>or</Text>

      <Pressable style={styles.altButton} onPress={handleEmailSignup}>
        <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Continue with Email</Text>
      </Pressable>

      <Pressable style={styles.altButton} onPress={handleGoogleSignup}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.altButtonText}>Continue with Google</Text>
      </Pressable>

      <Pressable style={styles.altButton} onPress={handleAppleSignup}>
        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Continue with Apple</Text>
      </Pressable>

      {/* Home Indicator
      <View style={styles.homeIndicator} /> */}
    </>
  );

  const renderEmailForm = () => (
    <>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => setAuthMode('initial')}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Title */}
      <Text style={styles.formTitle}>Enter your email</Text>

      {/* Description */}
      <Text style={styles.formDescription}>
        We'll create your account and send you a confirmation email
      </Text>

      {/* Email input */}
      <TextInput
        style={styles.emailInput}
        placeholder="Email address"
        placeholderTextColor="#8E8E93"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      {/* Continue button */}
      <Pressable
        style={[styles.continueButton, { opacity: email.length > 0 ? 1 : 0.5 }]}
        onPress={handleEmailSubmit}
        disabled={isLoading || email.length === 0}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Creating Account...' : 'Continue'}
        </Text>
      </Pressable>

      {/* Alternative options */}
      <Text style={styles.orText}>or</Text>

      <Pressable style={styles.altButton} onPress={handlePhoneSignup}>
        <Ionicons name="call-outline" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Continue with Phone</Text>
      </Pressable>

      <Pressable style={styles.altButton} onPress={handleGoogleSignup}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.altButtonText}>Continue with Google</Text>
      </Pressable>

      <Pressable style={styles.altButton} onPress={handleAppleSignup}>
        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Continue with Apple</Text>
      </Pressable>

      {/* Home Indicator */}
      {/* <View style={styles.homeIndicator} /> */}
    </>
  );

  const renderLoginForm = () => (
    <>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => setAuthMode('initial')}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Title */}
      <Text style={styles.formTitle}>Welcome back</Text>

      {/* Description */}
      <Text style={styles.formDescription}>
        Sign in to your MoneyAI account
      </Text>

      {/* Email input */}
      <TextInput
        style={styles.loginInput}
        placeholder="Email or username"
        placeholderTextColor="#8E8E93"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      {/* Password input */}
      <TextInput
        style={styles.loginInput}
        placeholder="Password"
        placeholderTextColor="#8E8E93"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Forgot password */}
      <Pressable style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </Pressable>

      {/* Sign in button */}
      <Pressable
        style={[styles.continueButton, { opacity: email.length > 0 && password.length > 0 ? 1 : 0.5 }]}
        onPress={handleLoginSubmit}
        disabled={isLoading || email.length === 0 || password.length === 0}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </Pressable>

      {/* Alternative options */}
      <Text style={styles.orText}>or</Text>

      <Pressable style={styles.altButton} onPress={handleAppleSignup}>
        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Sign In With Apple</Text>
      </Pressable>

      <Pressable style={styles.altButton} onPress={handlePhoneSignup}>
        <Ionicons name="call-outline" size={20} color="#FFFFFF" />
        <Text style={styles.altButtonText}>Sign In With Phone</Text>
      </Pressable>

      {/* Home Indicator */}
      {/* <View style={styles.homeIndicator} /> */}
    </>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent={true}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Animated backdrop */}
          <Animated.View 
            style={[
              styles.backdrop, 
              { 
                opacity: backdropOpacity,
                backgroundColor: authMode !== 'initial' ? '#000000' : 'rgba(0, 0, 0, 0.4)'
              }
            ]} 
          >
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={authMode === 'initial' ? handleClose : undefined} 
            />
          </Animated.View>

          {/* Animated bottom sheet modal */}
          <Animated.View
            style={[
              styles.modalContainer,
              {
                height: modalHeight,
                borderTopLeftRadius: authMode === 'initial' ? 28 : 0,
                borderTopRightRadius: authMode === 'initial' ? 28 : 0,
              },
            ]}
          >
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {authMode === 'initial' && renderInitialView()}
              {authMode === 'phone' && renderPhoneForm()}
              {authMode === 'email' && renderEmailForm()}
              {authMode === 'login' && renderLoginForm()}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Country Selector Modal */}
      <CountrySelector
        visible={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSelect={handleCountrySelect}
        selectedCountry={selectedCountry}
      />
    </>
  );
}

// Keep the old component for backward compatibility but redirect to walkthrough
export default function SignupScreen() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/walkthrough');
  }, []);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    position: 'relative',
  },
  // Floating emoji elements
  floatingElement: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  element1: {
    backgroundColor: '#FFE4E1',
    top: height * 0.15,
    left: width * 0.1,
  },
  element2: {
    backgroundColor: '#FFB6C1',
    top: height * 0.12,
    right: width * 0.15,
  },
  element3: {
    backgroundColor: '#98FB98',
    top: height * 0.25,
    left: width * 0.05,
  },
  element4: {
    backgroundColor: '#87CEEB',
    top: height * 0.3,
    right: width * 0.1,
  },
  element5: {
    backgroundColor: '#DDA0DD',
    top: height * 0.4,
    left: width * 0.15,
  },
  element6: {
    backgroundColor: '#F0E68C',
    top: height * 0.35,
    right: width * 0.2,
  },
  element7: {
    backgroundColor: '#FFA07A',
    top: height * 0.2,
    left: width * 0.4,
  },
  emoji: {
    fontSize: 24,
  },
  // Central diamond
  centralDiamond: {
    position: 'absolute',
    top: height * 0.3,
    left: width * 0.5 - 40,
    width: 80,
    height: 80,
    transform: [{ rotate: '45deg' }],
  },
  diamondInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Modal overlay styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sparkleContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  sparkle: {
    fontSize: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'left',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 32,
  },
  // Phone button (white)
  phoneButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  phoneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  // Email button (dark)
  emailButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Social buttons row
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  appleButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal content
  modalContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Login link
  loginLink: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Form titles and descriptions
  formTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 60,
    textAlign: 'left',
  },
  formDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 32,
  },

  // Phone input styles
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#48484A',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Email input styles
  emailInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 24,
  },

  // Login input styles
  loginInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Continue button
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Alternative buttons
  altButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  altButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Or text
  orText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginVertical: 16,
  },

  // Forgot password
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#007AFF',
  },

  // Chevron icon
  chevronIcon: {
    marginLeft: 4,
  },

  // Home indicator

});