// Quick script to reset onboarding for testing
// Run this with: node reset-onboarding.js

const { execSync } = require('child_process');

try {
  // Clear AsyncStorage for the app
  console.log('Resetting onboarding status...');
  
  // For iOS Simulator
  try {
    execSync('xcrun simctl privacy booted reset all com.yourcompany.moneyai', { stdio: 'inherit' });
    console.log('✅ iOS Simulator data cleared');
  } catch (e) {
    console.log('ℹ️  iOS Simulator not available or app not installed');
  }
  
  // For Android Emulator
  try {
    execSync('adb shell pm clear com.yourcompany.moneyai', { stdio: 'inherit' });
    console.log('✅ Android Emulator data cleared');
  } catch (e) {
    console.log('ℹ️  Android Emulator not available or app not installed');
  }
  
  console.log('\n🎉 Onboarding reset complete!');
  console.log('Next app launch will show the onboarding flow.');
  
} catch (error) {
  console.error('❌ Error resetting onboarding:', error.message);
  console.log('\n💡 Alternative: Uninstall and reinstall the app to reset onboarding.');
}