import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';

export default function AALinkingOTPScreen() {
  const { state, confirmAccountLinking, linkSelectedAccounts } = useAAJourney();
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
      handleConfirmLinking(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmLinking = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    await confirmAccountLinking(otpToVerify);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    // Reset timer and OTP
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    
    // Resend OTP by calling linkAccounts again
    Alert.alert('Info', 'Resending OTP...');
    await linkSelectedAccounts();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Confirm Linking</Text>
        <Text style={styles.headerSubtitle}>
          Enter the OTP sent to your mobile
        </Text>
      </View>

      <View style={styles.content}>
        {/* Account Summary */}
        <View style={styles.accountSummary}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryIconText}>🔗</Text>
            </View>
            <Text style={styles.summaryTitle}>Linking {state.selectedAccountsToLink.length} Account(s)</Text>
          </View>
          {state.selectedAccountsToLink.slice(0, 2).map((account, index) => (
            <View key={account.accountReferenceNumber} style={styles.accountItem}>
              <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>🏦</Text>
              </View>
              <Text style={styles.accountText}>
                {account.maskedAccountNumber}
              </Text>
            </View>
          ))}
          {state.selectedAccountsToLink.length > 2 && (
            <Text style={styles.moreAccounts}>
              +{state.selectedAccountsToLink.length - 2} more accounts
            </Text>
          )}
        </View>

        {/* OTP Input */}
        <View style={styles.otpCard}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          
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

          {state.error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>⚠️</Text>
              </View>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (state.loading || otp.join('').length !== 6) && styles.primaryButtonDisabled]}
            onPress={() => handleConfirmLinking()}
            disabled={state.loading || otp.join('').length !== 6}
          >
            <Text style={styles.primaryButtonText}>
              {state.loading ? 'Confirming...' : 'Confirm Linking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resend */}
        <View style={styles.resendCard}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={[styles.resendButton, (resendTimer > 0 || state.loading) && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={resendTimer > 0 || state.loading}
          >
            <Text style={[styles.resendButtonText, (resendTimer > 0 || state.loading) && styles.resendButtonTextDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>🔒</Text>
          </View>
          <Text style={styles.infoText}>
            Your account linking is secured with bank-grade encryption
          </Text>
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
  accountSummary: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    fontSize: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 12,
  },
  accountText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  moreAccounts: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
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
    marginBottom: 24,
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
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    lineHeight: 20,
  },
});