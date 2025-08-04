import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AAJourneyScreen from '../../../app/aa-journey';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    consentHandleId: 'test-consent-handle-123'
  }),
}));

// Mock React Native components that might cause issues in tests
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock the Finvu SDK with realistic responses
const mockFinvuSDK = {
  initializeWith: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  loginWithUsernameOrMobileNumber: jest.fn(),
  verifyLoginOtp: jest.fn(),
  logout: jest.fn(),
  fipsAllFIPOptions: jest.fn(),
  fetchFipDetails: jest.fn(),
  discoverAccounts: jest.fn(),
  linkAccounts: jest.fn(),
  confirmAccountLinking: jest.fn(),
  fetchLinkedAccounts: jest.fn(),
  getConsentRequestDetails: jest.fn(),
  approveConsentRequest: jest.fn(),
  denyConsentRequest: jest.fn(),
};

jest.mock('../../../services/finvu-sdk', () => ({
  __esModule: true,
  default: mockFinvuSDK,
}));

// Mock ThemedView and ThemedText components
jest.mock('../../../components/ThemedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: View,
  };
});

jest.mock('../../../components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: Text,
  };
});

describe('AA Journey Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    mockFinvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    
    mockFinvuSDK.connect.mockResolvedValue({
      isSuccess: true
    });
    
    mockFinvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: true,
      data: { reference: 'otp-ref-123' }
    });
    
    mockFinvuSDK.verifyLoginOtp.mockResolvedValue({
      isSuccess: true,
      data: { userId: 'user-123' }
    });
    
    mockFinvuSDK.fipsAllFIPOptions.mockResolvedValue({
      isSuccess: true,
      data: {
        searchOptions: [
          {
            fipId: 'FINVU-FIP',
            productName: 'Finvu Bank',
            fipFiTypes: ['DEPOSIT', 'RECURRING_DEPOSIT'],
            productDesc: 'Leading digital bank',
            enabled: true
          },
          {
            fipId: 'HDFC-FIP',
            productName: 'HDFC Bank',
            fipFiTypes: ['DEPOSIT', 'TERM_DEPOSIT'],
            productDesc: 'Private sector bank',
            enabled: true
          }
        ]
      }
    });
    
    mockFinvuSDK.fetchFipDetails.mockResolvedValue({
      isSuccess: true,
      data: {
        fipId: 'FINVU-FIP',
        typeIdentifiers: [
          {
            fiType: 'DEPOSIT',
            identifiers: [
              { category: 'STRONG', type: 'MOBILE' }
            ]
          }
        ]
      }
    });
    
    mockFinvuSDK.discoverAccounts.mockResolvedValue({
      isSuccess: true,
      data: {
        discoveredAccounts: [
          {
            accountReferenceNumber: 'ACC001',
            accountType: 'SAVINGS',
            fiType: 'DEPOSIT',
            maskedAccountNumber: 'XXXXXX1234'
          },
          {
            accountReferenceNumber: 'ACC002',
            accountType: 'CURRENT',
            fiType: 'DEPOSIT',
            maskedAccountNumber: 'XXXXXX5678'
          }
        ]
      }
    });
    
    mockFinvuSDK.linkAccounts.mockResolvedValue({
      isSuccess: true,
      data: { referenceNumber: 'link-ref-123' }
    });
    
    mockFinvuSDK.confirmAccountLinking.mockResolvedValue({
      isSuccess: true,
      data: {
        linkedAccounts: [
          {
            customerAddress: 'test@example.com',
            accountReferenceNumber: 'ACC001',
            linkReferenceNumber: 'link-ref-123',
            status: 'ACTIVE'
          }
        ]
      }
    });
    
    mockFinvuSDK.fetchLinkedAccounts.mockResolvedValue({
      isSuccess: true,
      data: {
        linkedAccounts: [
          {
            userId: 'user-123',
            fipId: 'FINVU-FIP',
            fipName: 'Finvu Bank',
            maskedAccountNumber: 'XXXXXX1234',
            accountReferenceNumber: 'ACC001',
            linkReferenceNumber: 'link-ref-123',
            consentIdList: null,
            fiType: 'DEPOSIT',
            accountType: 'SAVINGS',
            linkedAccountUpdateTimestamp: new Date(),
            authenticatorType: 'OTP'
          }
        ]
      }
    });
    
    mockFinvuSDK.getConsentRequestDetails.mockResolvedValue({
      isSuccess: true,
      data: {
        consentDetail: {
          consentId: 'consent-123',
          consentHandle: 'test-consent-handle-123',
          statusLastUpdateTimestamp: new Date(),
          financialInformationUser: {
            id: 'fiu-123',
            name: 'MoneyAI App'
          },
          consentPurpose: {
            code: 'WEALTH_MGMT',
            text: 'Wealth Management'
          },
          consentDisplayDescriptions: ['Access to account balance', 'Transaction history'],
          dataDateTimeRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            to: new Date()
          },
          consentDateTimeRange: {
            from: new Date(),
            to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
          consentDataLife: {
            unit: 'MONTH',
            value: 12
          },
          consentDataFrequency: {
            unit: 'MONTH',
            value: 1
          },
          fiTypes: ['DEPOSIT']
        }
      }
    });
    
    mockFinvuSDK.approveConsentRequest.mockResolvedValue({
      isSuccess: true,
      data: {
        consentIntentId: 'intent-123',
        consentsInfo: [
          { fipId: 'FINVU-FIP', consentId: 'consent-123' }
        ]
      }
    });
  });

  const renderAAJourney = () => {
    return render(
      <NavigationContainer>
        <AAJourneyScreen />
      </NavigationContainer>
    );
  };

  it('should complete full AA journey flow successfully', async () => {
    const { getByText, getByPlaceholderText, getAllByDisplayValue } = renderAAJourney();

    // 1. Should start with initialization
    expect(getByText('Initializing Account Aggregator')).toBeTruthy();

    // Wait for initialization to complete and move to login
    await waitFor(() => {
      expect(getByText('Account Aggregator Login')).toBeTruthy();
    }, { timeout: 5000 });

    // 2. Login step
    const usernameInput = getByPlaceholderText('Enter your username');
    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');
    
    fireEvent.changeText(usernameInput, 'test@example.com');
    fireEvent.changeText(mobileInput, '9999999999');
    fireEvent.press(getByText('Send OTP'));

    // Wait for OTP screen
    await waitFor(() => {
      expect(getByText('Enter OTP')).toBeTruthy();
    }, { timeout: 3000 });

    // 3. OTP Verification step
    const otpInputs = getAllByDisplayValue('');
    fireEvent.changeText(otpInputs[0], '1');
    fireEvent.changeText(otpInputs[1], '2');
    fireEvent.changeText(otpInputs[2], '3');
    fireEvent.changeText(otpInputs[3], '4');
    fireEvent.changeText(otpInputs[4], '5');
    fireEvent.changeText(otpInputs[5], '6');

    // Wait for FIP selection screen
    await waitFor(() => {
      expect(getByText('Select Financial Institution')).toBeTruthy();
    }, { timeout: 3000 });

    // 4. FIP Selection step
    expect(getByText('Finvu Bank')).toBeTruthy();
    expect(getByText('HDFC Bank')).toBeTruthy();
    
    fireEvent.press(getByText('Finvu Bank'));

    // Wait for account discovery screen
    await waitFor(() => {
      expect(getByText('Account Discovery')).toBeTruthy();
    }, { timeout: 3000 });

    // 5. Account Discovery step
    const mobileNumberInput = getByPlaceholderText('Enter 10-digit mobile number');
    fireEvent.changeText(mobileNumberInput, '9999999999');
    fireEvent.press(getByText('Discover Accounts'));

    // Wait for account linking screen
    await waitFor(() => {
      expect(getByText('Select Accounts to Link')).toBeTruthy();
    }, { timeout: 3000 });

    // 6. Account Linking step
    expect(getByText('XXXXXX1234')).toBeTruthy();
    expect(getByText('XXXXXX5678')).toBeTruthy();
    
    // Select first account
    fireEvent.press(getByText('XXXXXX1234'));
    fireEvent.press(getByText('Link 1 Account(s)'));

    // Wait for linking OTP screen
    await waitFor(() => {
      expect(getByText('Verify Account Linking')).toBeTruthy();
    }, { timeout: 3000 });

    // 7. Linking OTP step
    const linkingOtpInputs = getAllByDisplayValue('');
    fireEvent.changeText(linkingOtpInputs[0], '1');
    fireEvent.changeText(linkingOtpInputs[1], '2');
    fireEvent.changeText(linkingOtpInputs[2], '3');
    fireEvent.changeText(linkingOtpInputs[3], '4');
    fireEvent.changeText(linkingOtpInputs[4], '5');
    fireEvent.changeText(linkingOtpInputs[5], '6');

    // Wait for consent review screen
    await waitFor(() => {
      expect(getByText('Consent Review')).toBeTruthy();
    }, { timeout: 3000 });

    // 8. Consent Review step
    expect(getByText('MoneyAI App')).toBeTruthy();
    expect(getByText('Wealth Management')).toBeTruthy();
    
    // Select account for consent
    fireEvent.press(getByText('XXXXXX1234'));

    // Wait for consent approval screen
    await waitFor(() => {
      expect(getByText('Final Consent Approval')).toBeTruthy();
    }, { timeout: 3000 });

    // 9. Consent Approval step
    fireEvent.press(getByText('Approve Consent'));

    // Wait for completion screen
    await waitFor(() => {
      expect(getByText('✅ Consent Approved Successfully!')).toBeTruthy();
    }, { timeout: 3000 });

    // 10. Completion step
    expect(getByText('Return to MoneyAI')).toBeTruthy();
  }, 30000); // Increase timeout for full flow

  it('should handle initialization failure', async () => {
    mockFinvuSDK.initializeWith.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Network connection failed' }
    });

    const { getByText } = renderAAJourney();

    await waitFor(() => {
      expect(getByText('Connection Error')).toBeTruthy();
    }, { timeout: 5000 });

    expect(getByText('Try Again')).toBeTruthy();
    expect(getByText('Return to MoneyAI')).toBeTruthy();
  });

  it('should handle login failure', async () => {
    mockFinvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Invalid credentials' }
    });

    const { getByText, getByPlaceholderText } = renderAAJourney();

    // Wait for login screen
    await waitFor(() => {
      expect(getByText('Account Aggregator Login')).toBeTruthy();
    }, { timeout: 5000 });

    // Attempt login
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '9999999999');
    fireEvent.press(getByText('Send OTP'));

    // Should show error
    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle OTP verification failure', async () => {
    mockFinvuSDK.verifyLoginOtp.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Invalid OTP' }
    });

    const { getByText, getByPlaceholderText, getAllByDisplayValue } = renderAAJourney();

    // Go through login
    await waitFor(() => {
      expect(getByText('Account Aggregator Login')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '9999999999');
    fireEvent.press(getByText('Send OTP'));

    // Wait for OTP screen
    await waitFor(() => {
      expect(getByText('Enter OTP')).toBeTruthy();
    }, { timeout: 3000 });

    // Enter invalid OTP
    const otpInputs = getAllByDisplayValue('');
    fireEvent.changeText(otpInputs[0], '0');
    fireEvent.changeText(otpInputs[1], '0');
    fireEvent.changeText(otpInputs[2], '0');
    fireEvent.changeText(otpInputs[3], '0');
    fireEvent.changeText(otpInputs[4], '0');
    fireEvent.changeText(otpInputs[5], '0');

    // Should show error
    await waitFor(() => {
      expect(getByText('Invalid OTP')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle account discovery failure', async () => {
    mockFinvuSDK.discoverAccounts.mockResolvedValue({
      isSuccess: false,
      error: { message: 'No accounts found' }
    });

    const { getByText, getByPlaceholderText, getAllByDisplayValue } = renderAAJourney();

    // Go through login and OTP
    await waitFor(() => {
      expect(getByText('Account Aggregator Login')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '9999999999');
    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(getByText('Enter OTP')).toBeTruthy();
    }, { timeout: 3000 });

    const otpInputs = getAllByDisplayValue('');
    fireEvent.changeText(otpInputs[0], '1');
    fireEvent.changeText(otpInputs[1], '2');
    fireEvent.changeText(otpInputs[2], '3');
    fireEvent.changeText(otpInputs[3], '4');
    fireEvent.changeText(otpInputs[4], '5');
    fireEvent.changeText(otpInputs[5], '6');

    await waitFor(() => {
      expect(getByText('Select Financial Institution')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.press(getByText('Finvu Bank'));

    await waitFor(() => {
      expect(getByText('Account Discovery')).toBeTruthy();
    }, { timeout: 3000 });

    // Try to discover accounts
    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');
    fireEvent.changeText(mobileInput, '9999999999');
    fireEvent.press(getByText('Discover Accounts'));

    // Should show error
    await waitFor(() => {
      expect(getByText('No accounts found')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle consent denial flow', async () => {
    mockFinvuSDK.denyConsentRequest.mockResolvedValue({
      isSuccess: true,
      data: {
        consentIntentId: 'deny-intent-123',
        consentsInfo: []
      }
    });

    const { getByText, getByPlaceholderText, getAllByDisplayValue } = renderAAJourney();

    // Go through full flow until consent approval
    await waitFor(() => {
      expect(getByText('Account Aggregator Login')).toBeTruthy();
    }, { timeout: 5000 });

    // Login
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '9999999999');
    fireEvent.press(getByText('Send OTP'));

    // OTP
    await waitFor(() => {
      expect(getByText('Enter OTP')).toBeTruthy();
    }, { timeout: 3000 });

    const otpInputs = getAllByDisplayValue('');
    fireEvent.changeText(otpInputs[0], '1');
    fireEvent.changeText(otpInputs[1], '2');
    fireEvent.changeText(otpInputs[2], '3');
    fireEvent.changeText(otpInputs[3], '4');
    fireEvent.changeText(otpInputs[4], '5');
    fireEvent.changeText(otpInputs[5], '6');

    // FIP Selection
    await waitFor(() => {
      expect(getByText('Select Financial Institution')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.press(getByText('Finvu Bank'));

    // Account Discovery
    await waitFor(() => {
      expect(getByText('Account Discovery')).toBeTruthy();
    }, { timeout: 3000 });

    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');
    fireEvent.changeText(mobileInput, '9999999999');
    fireEvent.press(getByText('Discover Accounts'));

    // Account Linking
    await waitFor(() => {
      expect(getByText('Select Accounts to Link')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.press(getByText('XXXXXX1234'));
    fireEvent.press(getByText('Link 1 Account(s)'));

    // Linking OTP
    await waitFor(() => {
      expect(getByText('Verify Account Linking')).toBeTruthy();
    }, { timeout: 3000 });

    const linkingOtpInputs = getAllByDisplayValue('');
    fireEvent.changeText(linkingOtpInputs[0], '1');
    fireEvent.changeText(linkingOtpInputs[1], '2');
    fireEvent.changeText(linkingOtpInputs[2], '3');
    fireEvent.changeText(linkingOtpInputs[3], '4');
    fireEvent.changeText(linkingOtpInputs[4], '5');
    fireEvent.changeText(linkingOtpInputs[5], '6');

    // Consent Review
    await waitFor(() => {
      expect(getByText('Consent Review')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.press(getByText('XXXXXX1234'));

    // Consent Approval
    await waitFor(() => {
      expect(getByText('Final Consent Approval')).toBeTruthy();
    }, { timeout: 3000 });

    // Deny consent
    fireEvent.press(getByText('Deny Consent'));

    // Should complete with denial message
    await waitFor(() => {
      expect(getByText('❌ Consent Denied')).toBeTruthy();
    }, { timeout: 3000 });
  });
});