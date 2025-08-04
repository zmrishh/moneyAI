import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AAJourneyProvider, useAAJourney, AAStep } from '../contexts/AAJourneyContext';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

// Import AA Journey Screens
import AAInitializationScreen from '../components/aa-journey/AAInitializationScreen';
import AALoginScreen from '../components/aa-journey/AALoginScreen';
import AAOTPVerificationScreen from '../components/aa-journey/AAOTPVerificationScreen';
import AAFIPSelectionScreen from '../components/aa-journey/AAFIPSelectionScreen';
import AAAccountDiscoveryScreen from '../components/aa-journey/AAAccountDiscoveryScreen';
import AAAccountLinkingScreen from '../components/aa-journey/AAAccountLinkingScreen';
import AALinkingOTPScreen from '../components/aa-journey/AALinkingOTPScreen';
import AAConsentReviewScreen from '../components/aa-journey/AAConsentReviewScreen';
import AAConsentApprovalScreen from '../components/aa-journey/AAConsentApprovalScreen';
import AACompletedScreen from '../components/aa-journey/AACompletedScreen';
import AAErrorScreen from '../components/aa-journey/AAErrorScreen';

function AAJourneyContent() {
  const { state, resetJourney } = useAAJourney();
  const router = useRouter();

  // Handle hardware back button - Clean up and exit AA journey
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Exit AA Journey',
        'Are you sure you want to exit the Account Aggregator journey? All progress will be lost.',
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
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [resetJourney, router]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up AA journey data when exiting
      resetJourney();
    };
  }, [resetJourney]);

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case AAStep.INITIALIZATION:
        return <AAInitializationScreen />;
      case AAStep.LOGIN:
        return <AALoginScreen />;
      case AAStep.OTP_VERIFICATION:
        return <AAOTPVerificationScreen />;
      case AAStep.FIP_SELECTION:
        return <AAFIPSelectionScreen />;
      case AAStep.ACCOUNT_DISCOVERY:
        return <AAAccountDiscoveryScreen />;
      case AAStep.ACCOUNT_LINKING:
        return <AAAccountLinkingScreen />;
      case AAStep.LINKING_OTP:
        return <AALinkingOTPScreen />;
      case AAStep.CONSENT_REVIEW:
        return <AAConsentReviewScreen />;
      case AAStep.CONSENT_APPROVAL:
        return <AAConsentApprovalScreen />;
      case AAStep.COMPLETED:
        return <AACompletedScreen />;
      case AAStep.ERROR:
        return <AAErrorScreen />;
      default:
        return (
          <ThemedView style={styles.container}>
            <ThemedText>Unknown step: {state.currentStep}</ThemedText>
          </ThemedView>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentStep()}
    </View>
  );
}

export default function AAJourneyScreen() {
  const { consentHandleId } = useLocalSearchParams<{ consentHandleId: string }>();

  if (!consentHandleId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Error: Consent Handle ID is required to start AA journey
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <AAJourneyProvider>
      <AAJourneyContent />
    </AAJourneyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'red',
  },
});