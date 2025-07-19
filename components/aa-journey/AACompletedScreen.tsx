import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAAJourney } from '../../contexts/AAJourneyContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AACompletedScreen() {
  const { state, resetJourney } = useAAJourney();
  const { theme } = useTheme();
  const router = useRouter();

  const handleFinish = async () => {
    await resetJourney();
    // Use router.dismissAll() to close all modals and return to main app
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)');
    }
  };

  const getSuccessMessage = () => {
    if (state.selectedAccountsForConsent.length > 0) {
      return {
        title: '✅ Consent Approved Successfully!',
        message: `You have successfully approved data sharing for ${state.selectedAccountsForConsent.length} account(s). The application can now access your financial data as per the consent terms.`
      };
    } else {
      return {
        title: '❌ Consent Denied',
        message: 'You have successfully denied the consent request. No data will be shared with the requesting application.'
      };
    }
  };

  const { title, message } = getSuccessMessage();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>MoneyAI</Text>
        <Text style={styles.headerTitle}>
          {state.selectedAccountsForConsent.length > 0 ? 'All Set!' : 'Request Denied'}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success/Denial Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { 
            backgroundColor: state.selectedAccountsForConsent.length > 0 ? '#32D74B' : '#FF3B30' 
          }]}>
            <Text style={styles.icon}>
              {state.selectedAccountsForConsent.length > 0 ? '✓' : '✕'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>
          {state.selectedAccountsForConsent.length > 0 ? 'Consent Approved' : 'Consent Denied'}
        </Text>
        <Text style={styles.message}>{message}</Text>

        {state.selectedAccountsForConsent.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryIconText}>📋</Text>
              </View>
              <Text style={styles.summaryTitle}>Summary</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Application</Text>
              <Text style={styles.summaryValue}>
                {state.consentDetails?.financialInformationUser.name}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Accounts Linked</Text>
              <Text style={styles.summaryValue}>
                {state.selectedAccountsForConsent.length}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valid Until</Text>
              <Text style={styles.summaryValue}>
                {state.consentDetails?.consentDateTimeRange.to 
                  ? new Date(state.consentDetails.consentDateTimeRange.to).toLocaleDateString('en-IN')
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>💡</Text>
            </View>
            <Text style={styles.infoTitle}>What's Next?</Text>
          </View>
          
          <View style={styles.infoList}>
            {state.selectedAccountsForConsent.length > 0 ? (
              <>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    The app can now access your financial data securely
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    You can revoke this consent anytime
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    All data sharing uses bank-grade encryption
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    No data will be shared with the application
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    Your financial data remains private and secure
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.infoText}>
                    You can start a new consent request anytime
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <View style={styles.finishButtonContent}>
            <Text style={styles.finishButtonText}>Return to MoneyAI</Text>
            <View style={styles.finishButtonIcon}>
              <Text style={styles.finishButtonIconText}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Sahamati Requirement 32: Grievance Redressal */}
        <View style={styles.grievanceCard}>
          <View style={styles.grievanceHeader}>
            <View style={styles.grievanceIcon}>
              <Text style={styles.grievanceIconText}>📞</Text>
            </View>
            <Text style={styles.grievanceTitle}>Need Help?</Text>
          </View>
          <Text style={styles.grievanceText}>
            For any issues with Account Aggregator services, you can raise a grievance through the Sahamati grievance redressal mechanism.
          </Text>
          <TouchableOpacity style={styles.grievanceButton}>
            <Text style={styles.grievanceButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacer to ensure button is always accessible */}
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
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32D74B',
    marginTop: 7,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    flex: 1,
  },
  finishButton: {
    backgroundColor: '#32D74B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  finishButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // Sahamati Requirement 32: Grievance Redressal Styles
  grievanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  grievanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  grievanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  grievanceIconText: {
    fontSize: 16,
  },
  grievanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  grievanceText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  grievanceButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  grievanceButtonText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
});