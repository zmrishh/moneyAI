import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { LinkedAccountDetails } from '../../services/finvu-sdk';

export default function AAConsentReviewScreen() {
  const { state, selectAccountsForConsent, approveConsent, denyConsent } = useAAJourney();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const toggleAccountSelection = (linkRef: string) => {
    setSelectedAccounts(prev => {
      const newSelection = prev.includes(linkRef)
        ? prev.filter(ref => ref !== linkRef)
        : [...prev, linkRef];
      
      // Update context with selected accounts
      const selectedAccountObjects = state.linkedAccounts.filter(
        account => newSelection.includes(account.linkReferenceNumber)
      );
      selectAccountsForConsent(selectedAccountObjects);
      
      return newSelection;
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderAccountItem = ({ item }: { item: LinkedAccountDetails }) => {
    const isSelected = selectedAccounts.includes(item.linkReferenceNumber);
    
    return (
      <TouchableOpacity
        style={[styles.accountCard, isSelected && styles.accountCardSelected]}
        onPress={() => toggleAccountSelection(item.linkReferenceNumber)}
      >
        <View style={styles.accountInfo}>
          <View style={styles.bankIcon}>
            <Text style={styles.bankIconText}>🏦</Text>
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountNumber}>{item.maskedAccountNumber}</Text>
            <Text style={styles.accountType}>{item.accountType}</Text>
            <Text style={styles.bankName}>{item.fipName}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (!state.consentDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading consent details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '87%' }]} />
          </View>
          <Text style={styles.progressText}>Step 7 of 8 - Final Review</Text>
        </View>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Review Consent</Text>
        <Text style={styles.headerSubtitle}>
          {state.consentDetails.financialInformationUser.name} wants to access your data
        </Text>
        <View style={styles.complianceBadge}>
          <Text style={styles.complianceIcon}>🛡️</Text>
          <Text style={styles.complianceText}>RBI Regulated • You control your data</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* What they want */}
        <View style={styles.purposeCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🎯</Text>
            </View>
            <Text style={styles.cardTitle}>Purpose</Text>
          </View>
          <Text style={styles.purposeText}>
            {state.consentDetails.consentPurpose.text}
          </Text>
        </View>

        {/* Consent Details - Sahamati Requirement 40,41,42 */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>Consent Details</Text>
          </View>
          
          <View style={styles.consentAttribute}>
            <Text style={styles.attributeLabel}>Consent Validity</Text>
            <Text style={styles.attributeValue}>
              {formatDate(state.consentDetails.consentDateTimeRange.to)}
            </Text>
            <Text style={styles.attributeExplanation}>
              How long this permission will remain active
            </Text>
          </View>
          
          <View style={styles.consentAttribute}>
            <Text style={styles.attributeLabel}>Data Range</Text>
            <Text style={styles.attributeValue}>
              {formatDate(state.consentDetails.dataDateTimeRange.from)} to {formatDate(state.consentDetails.dataDateTimeRange.to)}
            </Text>
            <Text style={styles.attributeExplanation}>
              Which period of your transaction history will be shared
            </Text>
          </View>
          
          <View style={styles.consentAttribute}>
            <Text style={styles.attributeLabel}>Data Life</Text>
            <Text style={styles.attributeValue}>
              {state.consentDetails.consentDataLife.value} {state.consentDetails.consentDataLife.unit.toLowerCase()}(s)
            </Text>
            <Text style={styles.attributeExplanation}>
              How long the app can store your data after receiving it
            </Text>
          </View>
          
          <View style={styles.consentAttribute}>
            <Text style={styles.attributeLabel}>Access Frequency</Text>
            <Text style={styles.attributeValue}>
              Every {state.consentDetails.consentDataFrequency.value} {state.consentDetails.consentDataFrequency.unit.toLowerCase()}(s)
            </Text>
            <Text style={styles.attributeExplanation}>
              How often the app can request your data
            </Text>
          </View>

          {/* Data Types */}
          {state.consentDetails.fiTypes && (
            <View style={styles.consentAttribute}>
              <Text style={styles.attributeLabel}>Data Types</Text>
              <View style={styles.dataTypesList}>
                {state.consentDetails.fiTypes.map((fiType, index) => (
                  <View key={index} style={styles.dataTypeTag}>
                    <Text style={styles.dataTypeText}>{fiType}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.attributeExplanation}>
                Types of financial information that will be shared
              </Text>
            </View>
          )}
        </View>

        {/* What data */}
        <View style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>Data Access</Text>
          </View>
          
          <View style={styles.permissionsList}>
            {state.consentDetails.consentDisplayDescriptions.map((desc, index) => (
              <View key={index} style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <Text style={styles.permissionIconText}>✓</Text>
                </View>
                <Text style={styles.permissionText}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Selection */}
        <View style={styles.accountsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🏦</Text>
            </View>
            <Text style={styles.cardTitle}>
              Choose Accounts ({selectedAccounts.length} selected)
            </Text>
          </View>
          
          <FlatList
            data={state.linkedAccounts}
            renderItem={renderAccountItem}
            keyExtractor={(item) => item.linkReferenceNumber}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {state.error && (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => denyConsent()}
          disabled={state.loading}
        >
          <Text style={styles.denyButtonText}>
            {state.loading ? 'Processing...' : 'Deny'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.approveButton, (selectedAccounts.length === 0 || state.loading) && styles.approveButtonDisabled]}
          onPress={() => approveConsent()}
          disabled={selectedAccounts.length === 0 || state.loading}
        >
          <Text style={styles.approveButtonText}>
            {state.loading ? 'Processing...' : `Approve ${selectedAccounts.length > 0 ? `(${selectedAccounts.length})` : ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
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
  purposeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  purposeText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  dataCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  permissionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  permissionIconText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    lineHeight: 20,
  },
  accountsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountCardSelected: {
    borderColor: '#32D74B',
    backgroundColor: '#1A2B1A',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3C3C3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankIconText: {
    fontSize: 20,
  },
  accountDetails: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  bankName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#32D74B',
    borderColor: '#32D74B',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorIconText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#1A1A1A',
    gap: 12,
  },
  denyButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 2,
    backgroundColor: '#32D74B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  approveButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#32D74B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#32D74B',
  },
  complianceIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  complianceText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '600',
  },
  // Sahamati Consent Attribute Styles (Requirements 40-42)
  consentAttribute: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  attributeValue: {
    fontSize: 15,
    color: '#32D74B',
    fontWeight: '500',
    marginBottom: 6,
  },
  attributeExplanation: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dataTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  dataTypeTag: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#32D74B',
  },
  dataTypeText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '600',
  },
});