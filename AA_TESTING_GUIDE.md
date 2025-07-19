# AA Journey Testing Guide

## 🚀 How to Test the AA Journey Flow

The AA Journey is now functional with mock data! Here's how to test it:

### 1. Start the Development Server
```bash
cd moneyai
npx expo start
```

### 2. Navigate to the AA Journey
- Open your app
- Navigate to `/start-aa-journey` screen
- You'll see the Account Aggregator introduction

### 3. Start the Demo Flow
Click **"Try Demo"** button to use mock data and start the journey.

## 📱 Flow Testing Steps

### Step 1: Initialization
- The app will automatically initialize the mock SDK
- You'll see a loading screen with progress indicator
- Should automatically proceed to login

### Step 2: Login Screen
- Enter any username (e.g., "testuser")
- Enter any 10-digit mobile number (e.g., "9876543210")
- Click **"Continue"**
- Mock OTP will be sent

### Step 3: OTP Verification
- Enter any 6-digit OTP (e.g., "123456")
- The system will auto-verify when all 6 digits are entered
- Or click **"Verify Code"** manually

### Step 4: FIP Selection
- You'll see mock banks (Finvu Bank, HDFC Bank)
- Click on any bank to select it
- The app will fetch bank details

### Step 5: Account Discovery
- Enter account identifiers (mobile number works)
- Click **"Discover Accounts"**
- Mock accounts will be discovered

### Step 6: Account Linking
- Select accounts you want to link
- Click **"Link Selected Accounts"**
- Mock OTP will be sent for linking

### Step 7: Linking OTP
- Enter any 6-digit OTP
- Accounts will be linked

### Step 8: Consent Review
- Review the consent details
- Select accounts for consent
- Review terms and conditions

### Step 9: Consent Approval
- Click **"Approve Consent"** or **"Deny Consent"**
- Journey will complete

### Step 10: Completion
- Success screen with summary
- Option to return to app

## ✅ What Should Work

### Buttons & Navigation
- ✅ All buttons are connected to functions
- ✅ Navigation between screens works
- ✅ Exit functionality works
- ✅ Back button handling

### Mock Data
- ✅ Realistic FIP data (banks)
- ✅ Mock account discovery
- ✅ Mock OTP verification
- ✅ Mock consent details
- ✅ Mock linking process

### UI Features
- ✅ Loading states
- ✅ Error handling
- ✅ Progress indicators
- ✅ Form validation
- ✅ Auto-focus on inputs

### State Management
- ✅ Context state updates
- ✅ Step transitions
- ✅ Data persistence during flow
- ✅ Error state handling

## 🐛 Testing Scenarios

### Happy Path
1. Complete flow with valid inputs
2. All screens should transition smoothly
3. Mock data should populate correctly

### Error Scenarios
1. Try invalid mobile number format
2. Try empty OTP
3. Test network error simulation

### Edge Cases
1. Exit at different steps
2. Hardware back button
3. App backgrounding/foregrounding

## 🔧 Troubleshooting

### If screens don't load:
- Check console for import errors
- Ensure all dependencies are installed
- Restart the development server

### If buttons don't work:
- Check if context is properly wrapped
- Verify function connections
- Look for JavaScript errors in console

### If navigation fails:
- Check route parameters
- Verify screen imports
- Check navigation stack

## 📝 Mock Data Details

### Mock Banks (FIPs)
- Finvu Bank (DEPOSIT, RECURRING_DEPOSIT)
- HDFC Bank (DEPOSIT, TERM_DEPOSIT, MUTUAL_FUNDS)

### Mock Accounts
- Savings Account (****1234)
- Current Account (****5678)
- Fixed Deposit (****9012)

### Mock Identifiers
- Mobile number: Any 10-digit number
- PAN: Any valid PAN format
- Account number: Any format

## 🎯 Success Criteria

The AA Journey is functional if:
- ✅ All screens load without errors
- ✅ Buttons respond to taps
- ✅ Navigation flows correctly
- ✅ Mock data displays properly
- ✅ Loading states work
- ✅ Error handling works
- ✅ Exit functionality works

## 🚀 Next Steps

Once you confirm the flow works:
1. Replace mock SDK with real Finvu SDK
2. Add real API endpoints
3. Implement proper error handling
4. Add analytics tracking
5. Test with real bank data

Happy testing! 🎉