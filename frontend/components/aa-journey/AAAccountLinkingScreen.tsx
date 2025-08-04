import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { DiscoveredAccount } from '../../services/finvu-sdk';

export default function AAAccountLinkingScreen() {
  const { state, selectAccountsToLink, linkSelectedAccounts } = useAAJourney();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const toggleAccountSelection = (accountRef: string) => {
    setSelectedAccounts(prev => {
      const newSelection = prev.includes(accountRef)
        ? prev.filter(ref => ref !== accountRef)
        : [...prev, accountRef];
      
      // Update context with selected accounts
      const selectedAccountObjects = state.discoveredAccounts.filter(
        account => newSelection.includes(account.accountReferenceNumber)
      );
      selectAccountsToLink(selectedAccountObjects);
      
      return newSelection;
    });
  };

  const handleLinkAccounts = async () => {
    if (selectedAccounts.length === 0) {
      Alert.alert('Error', 'Please select at least one account to link');
      return;
    }

    Alert.alert(
      'Link Accounts',
      `Are you sure you want to link ${selectedAccounts.length} account(s)? An OTP will be sent for verification.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Link', onPress: linkSelectedAccounts }
      ]
    );
  };

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'savings': return '💰';
      case 'current': return '🏢';
      case 'credit': return '💳';
      case 'loan': return '🏠';
      default: return '🏦';
    }
  };

  const getFiTypeColor = (fiType: string) => {
    switch (fiType) {
      case 'DEPOSIT': return '#4caf50';
      case 'TERM_DEPOSIT': return '#2196f3';
      case 'RECURRING_DEPOSIT': return '#ff9800';
      case 'MUTUAL_FUNDS': return '#9c27b0';
      case 'INSURANCE_POLICIES': return '#f44336';
      default: return '#757575';
    }
  };

  const renderAccountItem = ({ item }: { item: DiscoveredAccount }) => {
    const isSelected = selectedAccounts.includes(item.accountReferenceNumber);
    
    return (
      <TouchableOpacity
        style={[styles.accountCard, isSelected && styles.accountCardSelected]}
        onPress={() => toggleAccountSelection(item.accountReferenceNumber)}
        disabled={state.loading}
      >
        <View style={styles.accountContent}>
          <View style={styles.accountIcon}>
            <Text style={styles.accountIconText}>
              {getAccountTypeIcon(item.accountType)}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountNumber}>
              {item.maskedAccountNumber}
            </Text>
            <Text style={styles.accountType}>
              {item.accountType} Account
            </Text>
            <View style={styles.fiTypeTag}>
              <Text style={styles.fiTypeText}>{item.fiType}</Text>
            </View>
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '62%' }]} />
          </View>
          <Text style={styles.progressText}>Step 5 of 8</Text>
        </View>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Link Your Accounts</Text>
        <Text style={styles.headerSubtitle}>
          Found {state.discoveredAccounts.length} account(s) at {state.selectedFIP?.productName}
        </Text>
        <View style={styles.securityBadge}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Secure account linking with OTP verification</Text>
        </View>
      </View>

      {state.error && (
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>⚠️</Text>
          </View>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}

      <FlatList
        data={state.discoveredAccounts}
        renderItem={renderAccountItem}
        keyExtractor={(item) => item.accountReferenceNumber}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Footer */}
      <View style={styles.actionContainer}>
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionText}>
            {selectedAccounts.length} of {state.discoveredAccounts.length} selected
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.primaryButton, (state.loading || selectedAccounts.length === 0) && styles.primaryButtonDisabled]}
          onPress={handleLinkAccounts}
          disabled={state.loading || selectedAccounts.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            {state.loading ? 'Linking...' : `Link ${selectedAccounts.length} Account${selectedAccounts.length !== 1 ? 's' : ''}`}
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
  errorCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  accountCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountCardSelected: {
    borderColor: '#32D74B',
    backgroundColor: '#1A2B1A',
  },
  accountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountIconText: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  fiTypeTag: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fiTypeText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '500',
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
  actionContainer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  selectionSummary: {
    marginBottom: 16,
  },
  selectionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
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
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '600',
  },
});