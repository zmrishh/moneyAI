import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAAJourney } from '../../contexts/AAJourneyContext';

export default function AAConsentApprovalScreen() {
  const { state, approveConsent, denyConsent } = useAAJourney();

  const handleApproveConsent = () => {
    if (state.selectedAccountsForConsent.length === 0) {
      Alert.alert('Error', 'Please select at least one account to share data from');
      return;
    }

    Alert.alert(
      'Approve Consent',
      `Are you sure you want to approve data sharing for ${state.selectedAccountsForConsent.length} account(s)?\n\nThis will allow ${state.consentDetails?.financialInformationUser.name} to access your financial data as per the consent terms.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: approveConsent 
        }
      ]
    );
  };

  const handleDenyConsent = () => {
    Alert.alert(
      'Deny Consent',
      'Are you sure you want to deny this consent request? This will prevent the application from accessing your financial data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Deny', 
          style: 'destructive',
          onPress: denyConsent 
        }
      ]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Final Consent Approval</ThemedText>
          <ThemedText style={styles.subtitle}>
            Review your selection and approve or deny the consent request
          </ThemedText>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ThemedText style={styles.summaryTitle}>Consent Summary</ThemedText>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Application:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {state.consentDetails?.financialInformationUser.name}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Purpose:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {state.consentDetails?.consentPurpose.text}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Selected Accounts:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {state.selectedAccountsForConsent.length} account(s)
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Data Range:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatDate(state.consentDetails?.dataDateTimeRange.from)} to{' '}
                {formatDate(state.consentDetails?.dataDateTimeRange.to)}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Consent Valid Until:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatDate(state.consentDetails?.consentDateTimeRange.to)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Selected Accounts */}
        <View style={styles.accountsSection}>
          <ThemedText style={styles.sectionTitle}>Selected Accounts</ThemedText>
          {state.selectedAccountsForConsent.map((account, index) => (
            <View key={account.linkReferenceNumber} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <ThemedText style={styles.accountNumber}>
                  {account.maskedAccountNumber}
                </ThemedText>
                <ThemedText style={styles.accountDetails}>
                  {account.accountType} • {account.fiType}
                </ThemedText>
                <ThemedText style={styles.fipName}>
                  {account.fipName}
                </ThemedText>
              </View>
              <View style={styles.accountStatus}>
                <View style={styles.statusIndicator}>
                  <ThemedText style={styles.statusText}>✓</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <ThemedText style={styles.noticeTitle}>⚠️ Important Notice</ThemedText>
          <ThemedText style={styles.noticeText}>
            • You can revoke this consent at any time through your AA dashboard
          </ThemedText>
          <ThemedText style={styles.noticeText}>
            • Your data will be shared securely using bank-grade encryption
          </ThemedText>
          <ThemedText style={styles.noticeText}>
            • The application will only access data as per the specified purpose
          </ThemedText>
          <ThemedText style={styles.noticeText}>
            • Data retention period is limited as per consent terms
          </ThemedText>
        </View>

        {state.error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{state.error}</ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.denyButton, state.loading && styles.buttonDisabled]}
          onPress={handleDenyConsent}
          disabled={state.loading}
        >
          <ThemedText style={styles.denyButtonText}>
            {state.loading ? 'Processing...' : 'Deny Consent'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.approveButton, 
            (state.loading || state.selectedAccountsForConsent.length === 0) && styles.buttonDisabled
          ]}
          onPress={handleApproveConsent}
          disabled={state.loading || state.selectedAccountsForConsent.length === 0}
        >
          <ThemedText style={styles.approveButtonText}>
            {state.loading ? 'Processing...' : 'Approve Consent'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  summaryContent: {
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  accountsSection: {
    margin: 15,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  accountCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  accountInfo: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  fipName: {
    fontSize: 12,
    opacity: 0.6,
  },
  accountStatus: {
    marginLeft: 10,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noticeCard: {
    backgroundColor: '#fff3cd',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#856404',
  },
  noticeText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#856404',
    lineHeight: 20,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffebee',
    margin: 15,
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  denyButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginLeft: 10,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});