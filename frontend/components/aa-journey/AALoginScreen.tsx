import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AALoginScreen() {
  const { state, loginWithMobile, resetJourney } = useAAJourney();
  const { theme } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter both username and mobile number');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    await loginWithMobile(username.trim(), mobileNumber.trim());
  };

  const handleExit = () => {
    Alert.alert(
      'Exit AA Journey',
      'Are you sure you want to exit? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: async () => {
            await resetJourney();
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Universal Header with Exit, Language, Help */}
      <View style={styles.universalHeader}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
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
        <Text style={styles.headerTitle}>Sign In</Text>
        <Text style={styles.contextualEducation}>
          MoneyAI uses RBI-licensed Account Aggregators to fetch your bank data—100% safe and consent-driven.
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username (Email)</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!state.loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              maxLength={10}
              editable={!state.loading}
            />
          </View>

          {state.error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>⚠️</Text>
              </View>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {/* Legal Consent Checkbox */}
          <View style={styles.consentContainer}>
            <TouchableOpacity style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </TouchableOpacity>
            <Text style={styles.consentText}>
              I agree to <Text style={styles.linkText}>Finvu's Terms & Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, state.loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={state.loading}
          >
            <Text style={styles.primaryButtonText}>
              {state.loading ? 'Sending OTP...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>📱</Text>
          </View>
          <Text style={styles.infoText}>
            An OTP will be sent to your registered mobile number for verification
          </Text>
        </View>

        {/* Bottom spacer for keyboard */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

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
  },
  formCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1B1B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
  // Contextual Education
  contextualEducation: {
    fontSize: 16,
    color: '#32D74B',
    lineHeight: 22,
    fontWeight: '500',
  },
  // Legal Consent Styles
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  consentText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#32D74B',
    textDecorationLine: 'underline',
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
  // ScrollView Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 120,
  },
});