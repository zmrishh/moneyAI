import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AAOTPVerificationScreen() {
  const { state, verifyLoginOTP, loginWithMobile } = useAAJourney();
  const { theme } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    await verifyLoginOTP(otpToVerify);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    // Reset timer
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    
    // Resend OTP by calling login again (as per SDK documentation)
    Alert.alert('Info', 'Resending OTP...');
    // Note: In real implementation, you'd need to store the original login credentials
    // For now, we'll show a message to the user
    Alert.alert('Resend OTP', 'Please go back and request a new OTP');
  };

  return (
    <View style={styles.container}>
      {/* Universal Header with Exit, Language, Help */}
      <View style={styles.universalHeader}>
        <TouchableOpacity style={styles.exitButton}>
          <Text style={styles.exitIcon}>←</Text>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageIcon}>🌐</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <Text style={styles.headerSubtitle}>
          Enter the 6-digit code sent to your mobile
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.otpCard}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          
          {/* Auto-submit Toggle */}
          <View style={styles.autoSubmitContainer}>
            <TouchableOpacity style={styles.autoSubmitToggle}>
              <View style={styles.toggleSwitch}>
                <View style={styles.toggleThumb} />
              </View>
              <Text style={styles.autoSubmitText}>Auto-submit OTP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  state.error && styles.otpInputError
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                editable={!state.loading}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Enhanced Error Handling */}
          {state.error && (
            <View style={styles.errorBanner}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>⚠️</Text>
              </View>
              <Text style={styles.errorText}>Oops—that code doesn't match. Try again.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (state.loading || otp.join('').length !== 6) && styles.primaryButtonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={state.loading || otp.join('').length !== 6}
          >
            <Text style={styles.primaryButtonText}>
              {state.loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resendCard}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={resendTimer > 0}
          >
            <Text style={[styles.resendButtonText, resendTimer > 0 && styles.resendButtonTextDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Persistent Footer - Required on every AA screen */}
      <View style={styles.persistentFooter}>
        <View style={styles.footerContent}>
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by RBI-Regulated AA</Text>
            <View style={styles.finvuLogo}>
              <Text style={styles.finvuLogoText}>Finvu</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.helpSupportButton}>
            <Text style={styles.helpSupportIcon}>💬</Text>
            <Text style={styles.helpSupportText}>Help & Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#8E8E93',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  otpCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: '#32D74B',
    backgroundColor: '#1A2B1A',
  },
  otpInputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#2B1A1A',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1B1B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorIconText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#32D74B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#32D74B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resendButtonDisabled: {
    borderColor: '#2C2C2E',
  },
  resendButtonText: {
    color: '#32D74B',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#8E8E93',
  },
  // Universal Header Styles
  universalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  exitIcon: {
    fontSize: 18,
    color: '#8E8E93',
    marginRight: 4,
  },
  exitText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIcon: {
    fontSize: 16,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  // Auto-submit Toggle Styles
  autoSubmitContainer: {
    marginBottom: 24,
  },
  autoSubmitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: '#32D74B',
    borderRadius: 12,
    padding: 2,
    marginRight: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  autoSubmitText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Enhanced Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1B1B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  // Persistent Footer Styles
  persistentFooter: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  finvuLogo: {
    backgroundColor: '#32D74B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  finvuLogoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  helpSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  helpSupportIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  helpSupportText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});