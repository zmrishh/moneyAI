import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

export default function StartAAJourneyScreen() {
  const [consentHandleId, setConsentHandleId] = useState('');
  const [userType, setUserType] = useState<'new' | 'existing' | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  const handleStartJourney = () => {
    if (!consentHandleId.trim()) {
      Alert.alert('Error', 'Please enter a valid Consent Handle ID');
      return;
    }

    // Navigate to AA journey with consent handle ID
    router.push({
      pathname: '/aa-journey',
      params: { consentHandleId: consentHandleId.trim() }
    });
  };

  const handleUseMockData = () => {
    // Use a mock consent handle ID for testing
    const mockConsentHandleId = 'MOCK_CONSENT_HANDLE_' + Date.now();
    router.push({
      pathname: '/aa-journey',
      params: { consentHandleId: mockConsentHandleId }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Account Aggregator</Text>
        <Text style={styles.headerSubtitle}>
          Securely connect your bank accounts through RBI-licensed Account Aggregators
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Customer Education Card - Sahamati Requirement 1,2 */}
        <View style={styles.educationCard}>
          <View style={styles.educationHeader}>
            <View style={styles.rbiIcon}>
              <Text style={styles.rbiIconText}>🏛️</Text>
            </View>
            <Text style={styles.educationTitle}>About Account Aggregator</Text>
          </View>
          <Text style={styles.educationDescription}>
            Account Aggregators are RBI-licensed entities that help you securely share your financial data with authorized applications. You maintain complete control over what data is shared, with whom, and for how long.
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>RBI regulated and licensed</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>You control your data sharing</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Secure, encrypted data transfer</Text>
            </View>
          </View>
        </View>

        {/* User Type Selection - Sahamati Requirement 3 */}
        <View style={styles.userTypeCard}>
          <Text style={styles.userTypeTitle}>Are you new to Account Aggregator?</Text>
          <View style={styles.userTypeOptions}>
            <TouchableOpacity 
              style={[
                styles.userTypeOption,
                userType === 'new' && styles.userTypeOptionSelected
              ]}
              onPress={() => setUserType('new')}
            >
              <View style={styles.userTypeIcon}>
                <Text style={styles.userTypeIconText}>👋</Text>
              </View>
              <Text style={styles.userTypeText}>New to AA</Text>
              <Text style={styles.userTypeSubtext}>First time using Account Aggregator</Text>
              {userType === 'new' && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedCheckmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.userTypeOption,
                userType === 'existing' && styles.userTypeOptionSelected
              ]}
              onPress={() => setUserType('existing')}
            >
              <View style={styles.userTypeIcon}>
                <Text style={styles.userTypeIconText}>👤</Text>
              </View>
              <Text style={styles.userTypeText}>Existing AA User</Text>
              <Text style={styles.userTypeSubtext}>I have an AA handle already</Text>
              {userType === 'existing' && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedCheckmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Get Started</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Consent Handle ID</Text>
            <TextInput
              style={styles.input}
              value={consentHandleId}
              onChangeText={setConsentHandleId}
              placeholder="Enter consent handle ID"
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHelper}>
              Provided by the requesting application
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !consentHandleId.trim() && styles.primaryButtonDisabled]}
            onPress={handleStartJourney}
            disabled={!consentHandleId.trim()}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUseMockData}
          >
            <Text style={styles.secondaryButtonText}>Try Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Features Card */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Why it's secure</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🔒</Text>
              </View>
              <Text style={styles.featureText}>Bank-grade encryption</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>⏱️</Text>
              </View>
              <Text style={styles.featureText}>Time-limited access</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🔄</Text>
              </View>
              <Text style={styles.featureText}>Revoke anytime</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacer for scrolling */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    backgroundColor: '#1A1A1A',
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
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  infoDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
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
    marginBottom: 8,
    borderWidth: 0,
  },
  inputHelper: {
    fontSize: 14,
    color: '#8E8E93',
  },
  primaryButton: {
    backgroundColor: '#32D74B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2C2C2E',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#32D74B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#32D74B',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#8E8E93',
    flex: 1,
  },
  // Sahamati Compliance Styles
  educationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#32D74B',
  },
  educationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rbiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rbiIconText: {
    fontSize: 20,
  },
  educationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  educationDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 16,
    color: '#32D74B',
    fontWeight: 'bold',
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  userTypeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeOption: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3C3C3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userTypeIconText: {
    fontSize: 24,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  userTypeSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  userTypeOptionSelected: {
    borderColor: '#32D74B',
    backgroundColor: '#1A2B1A',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});