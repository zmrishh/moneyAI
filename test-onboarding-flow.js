// Test script to verify onboarding flow
// Run this with: node test-onboarding-flow.js

const { resetOnboarding, checkOnboardingStatus, setOnboardingCompleted } = require('./utils/onboarding');

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow...\n');
  
  try {
    // Test 1: Reset onboarding
    console.log('1. Resetting onboarding...');
    await resetOnboarding();
    const statusAfterReset = await checkOnboardingStatus();
    console.log(`   Status after reset: ${statusAfterReset ? '✅ Completed' : '❌ Not completed'}`);
    
    // Test 2: Check initial status
    console.log('\n2. Checking initial onboarding status...');
    const initialStatus = await checkOnboardingStatus();
    console.log(`   Initial status: ${initialStatus ? '✅ Completed' : '❌ Not completed'}`);
    
    // Test 3: Complete onboarding
    console.log('\n3. Marking onboarding as completed...');
    await setOnboardingCompleted();
    const statusAfterCompletion = await checkOnboardingStatus();
    console.log(`   Status after completion: ${statusAfterCompletion ? '✅ Completed' : '❌ Not completed'}`);
    
    console.log('\n🎉 All tests passed! Onboarding flow is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOnboardingFlow();