import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { checkOnboardingStatus } from '@/utils/onboarding';
import SplashScreen from './splash';

export default function IndexScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Checking onboarding status...');
        
        // Add minimum splash time and check onboarding
        const [onboardingCompleted] = await Promise.all([
          checkOnboardingStatus(),
          new Promise(resolve => setTimeout(resolve, 2500)) // 2.5 seconds splash
        ]);
        
        console.log('📱 Onboarding completed:', onboardingCompleted);
        
        // FOR DEVELOPMENT: Always show onboarding flow
        // Remove this line when you want normal onboarding behavior
        const forceOnboarding = true;
        
        // Navigate based on onboarding status
        if (onboardingCompleted && !forceOnboarding) {
          console.log('➡️ Going to main app');
          router.replace('/(tabs)');
        } else {
          console.log('➡️ Going to onboarding (forced for development)');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('❌ Error checking onboarding:', error);
        // Default to onboarding on error
        router.replace('/onboarding');
      }
    };

    initializeApp();
  }, []);

  return <SplashScreen />;
}