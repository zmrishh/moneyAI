import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';

export default function AAAccountDiscoveryScreen() {
  const { state, discoverAccounts } = useAAJourney();
  const [identifiers, setIdentifiers] = useState<{ [key: string]: string }>({});

  const getRequiredIdentifiers = () => {
    if (!state.fipDetails) return [];
    
    const allIdentifiers: { category: string; type: string; label: string; placeholder: string }[] = [];
    
    state.fipDetails.typeIdentifiers.forEach(typeId => {
      typeId.identifiers.forEach(identifier => {
        const key = `${identifier.category}_${identifier.type}`;
        if (!allIdentifiers.find(id => `${id.category}_${id.type}` === key)) {
          allIdentifiers.push({
            category: identifier.category,
            type: identifier.type,
            label: getIdentifierLabel(identifier.type),
            placeholder: getIdentifierPlaceholder(identifier.type)
          });
        }
      });
    });
    
    return allIdentifiers;
  };

  const getIdentifierLabel = (type: string) => {
    switch (type) {
      case 'MOBILE': return 'Mobile Number';
      case 'PAN': return 'PAN Number';
      case 'DOB': return 'Date of Birth';
      case 'EMAIL': return 'Email Address';
      default: return type;
    }
  };

  const getIdentifierPlaceholder = (type: string) => {
    switch (type) {
      case 'MOBILE': return 'Enter 10-digit mobile number';
      case 'PAN': return 'Enter PAN (e.g., ABCDE1234F)';
      case 'DOB': return 'YYYY-MM-DD';
      case 'EMAIL': return 'Enter email address';
      default: return `Enter ${type}`;
    }
  };

  const validateIdentifier = (type: string, value: string) => {
    switch (type) {
      case 'MOBILE':
        return /^\d{10}$/.test(value);
      case 'PAN':
        return /^[A-Z]{5}\d{4}[A-Z]$/.test(value);
      case 'DOB':
        return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return value.trim().length > 0;
    }
  };

  const handleIdentifierChange = (key: string, value: string) => {
    setIdentifiers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDiscoverAccounts = async () => {
    const requiredIdentifiers = getRequiredIdentifiers();
    const identifierArray: { category: string; type: string; value: string }[] = [];
    
    // Validate all required identifiers
    for (const identifier of requiredIdentifiers) {
      const key = `${identifier.category}_${identifier.type}`;
      const value = identifiers[key]?.trim();
      
      if (!value) {
        Alert.alert('Error', `Please enter ${identifier.label}`);
        return;
      }
      
      if (!validateIdentifier(identifier.type, value)) {
        Alert.alert('Error', `Please enter a valid ${identifier.label}`);
        return;
      }
      
      identifierArray.push({
        category: identifier.category,
        type: identifier.type,
        value: value
      });
    }
    
    await discoverAccounts(identifierArray);
  };

  const requiredIdentifiers = getRequiredIdentifiers();

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 8</Text>
        </View>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Find Your Accounts</Text>
        <Text style={styles.headerSubtitle}>
          Enter your details to discover accounts at {state.selectedFIP?.productName || 'your bank'}
        </Text>
        <View style={styles.securityBadge}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Your data is encrypted and secure</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Your Information</Text>
            
            {requiredIdentifiers.map((identifier) => {
              const key = `${identifier.category}_${identifier.type}`;
              return (
                <View key={key} style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {identifier.label}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={identifiers[key] || ''}
                    onChangeText={(value) => handleIdentifierChange(key, value)}
                    placeholder={identifier.placeholder}
                    placeholderTextColor="#8E8E93"
                    keyboardType={
                      identifier.type === 'MOBILE' ? 'numeric' :
                      identifier.type === 'EMAIL' ? 'email-address' :
                      identifier.type === 'PAN' ? 'default' : 'default'
                    }
                    autoCapitalize={identifier.type === 'PAN' ? 'characters' : 'none'}
                    autoCorrect={false}
                    editable={!state.loading}
                    maxLength={
                      identifier.type === 'MOBILE' ? 10 :
                      identifier.type === 'PAN' ? 10 :
                      identifier.type === 'DOB' ? 10 : undefined
                    }
                  />
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{identifier.category}</Text>
                  </View>
                </View>
              );
            })}

            {state.error && (
              <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>⚠️</Text>
                </View>
                <Text style={styles.errorText}>{state.error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, state.loading && styles.primaryButtonDisabled]}
              onPress={handleDiscoverAccounts}
              disabled={state.loading}
            >
              <Text style={styles.primaryButtonText}>
                {state.loading ? 'Searching...' : 'Find My Accounts'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>ℹ️</Text>
              </View>
              <Text style={styles.infoTitle}>About Identifiers</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={[styles.identifierBadge, styles.strongBadge]}>
                  <Text style={styles.strongText}>STRONG</Text>
                </View>
                <Text style={styles.infoText}>Primary ID like mobile number</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={[styles.identifierBadge, styles.weakBadge]}>
                  <Text style={styles.weakText}>WEAK</Text>
                </View>
                <Text style={styles.infoText}>Secondary ID like PAN</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={[styles.identifierBadge, styles.ancillaryBadge]}>
                  <Text style={styles.ancillaryText}>EXTRA</Text>
                </View>
                <Text style={styles.infoText}>Additional ID like date of birth</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
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
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 0,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '500',
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
    padding: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identifierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  strongBadge: {
    backgroundColor: '#1A2B1A',
  },
  weakBadge: {
    backgroundColor: '#2B1F1A',
  },
  ancillaryBadge: {
    backgroundColor: '#1A1F2B',
  },
  strongText: {
    color: '#32D74B',
    fontSize: 12,
    fontWeight: '600',
  },
  weakText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '600',
  },
  ancillaryText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
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