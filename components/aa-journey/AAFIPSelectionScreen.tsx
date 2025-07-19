import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Text } from 'react-native';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FIPInfo } from '../../services/finvu-sdk';

export default function AAFIPSelectionScreen() {
  const { state, selectFIP } = useAAJourney();
  const { theme } = useTheme();

  const renderFIPItem = ({ item }: { item: FIPInfo }) => (
    <TouchableOpacity
      style={[styles.fipCard, !item.enabled && styles.fipCardDisabled]}
      onPress={() => item.enabled && selectFIP(item)}
      disabled={!item.enabled || state.loading}
    >
      <View style={styles.fipContent}>
        <View style={styles.bankIcon}>
          <Text style={styles.bankIconText}>🏦</Text>
        </View>
        <View style={styles.fipInfo}>
          <Text style={styles.fipName}>
            {item.productName || item.fipId}
          </Text>
          {item.productDesc && (
            <Text style={styles.fipDescription}>
              {item.productDesc}
            </Text>
          )}
          <View style={styles.fiTypesContainer}>
            {item.fipFiTypes.slice(0, 2).map((fiType, index) => (
              <View key={index} style={styles.fiTypeTag}>
                <Text style={styles.fiTypeText}>{fiType}</Text>
              </View>
            ))}
            {item.fipFiTypes.length > 2 && (
              <Text style={styles.moreTypes}>+{item.fipFiTypes.length - 2} more</Text>
            )}
          </View>
        </View>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </View>
      {!item.enabled && (
        <View style={styles.disabledBadge}>
          <Text style={styles.disabledText}>Unavailable</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (state.loading && state.availableFIPs.length === 0) {
    return (
      <View style={styles.container}>
        {/* Universal Header */}
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

        {/* Loading Content */}
        <View style={styles.loadingContent}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color="#32D74B" />
            </View>
            <Text style={styles.loadingTitle}>Discovering your accounts...</Text>
            <Text style={styles.loadingSubtitle}>
              We're securely fetching your linked accounts—this may take up to 30 seconds.
            </Text>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Discovery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Persistent Footer */}
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

  return (
    <View style={styles.container}>
      {/* Header with Progress Indicator */}
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
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 8</Text>
        </View>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>Choose Your Bank</Text>
        <Text style={styles.headerSubtitle}>
          MoneyAI uses RBI-licensed Account Aggregators to fetch your bank data—100% safe and consent-driven.
        </Text>
        <View style={styles.securityBadge}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>RBI Regulated • Bank Grade Security</Text>
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

      <View style={styles.content}>
        {/* AA Network Information - Sahamati Requirement 11,12 */}
        <View style={styles.networkInfoCard}>
          <View style={styles.networkInfoHeader}>
            <View style={styles.networkIcon}>
              <Text style={styles.networkIconText}>🌐</Text>
            </View>
            <Text style={styles.networkInfoTitle}>Live AA Network</Text>
          </View>
          <Text style={styles.networkInfoText}>
            {state.availableFIPs.length} financial institutions are currently live in the Account Aggregator network
          </Text>
        </View>

        <FlatList
          data={state.availableFIPs}
          renderItem={renderFIPItem}
          keyExtractor={(item) => item.fipId}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {state.loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#32D74B" />
          <Text style={styles.loadingOverlayText}>Loading...</Text>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  fipCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  fipCardDisabled: {
    opacity: 0.5,
  },
  fipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bankIconText: {
    fontSize: 24,
  },
  fipInfo: {
    flex: 1,
  },
  fipName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  fipDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  fiTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  fiTypeTag: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  fiTypeText: {
    fontSize: 12,
    color: '#32D74B',
    fontWeight: '500',
  },
  moreTypes: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 16,
  },
  arrowText: {
    fontSize: 24,
    color: '#8E8E93',
  },
  disabledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  disabledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
  },
  loadingOverlayText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
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
  // Sahamati Network Information Styles
  networkInfoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#32D74B',
  },
  networkInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  networkIconText: {
    fontSize: 14,
  },
  networkInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  networkInfoText: {
    fontSize: 14,
    color: '#8E8E93',
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
  // Loading Screen Styles
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingIconContainer: {
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  // Content container to fix layout
  content: {
    flex: 1,
  },
});