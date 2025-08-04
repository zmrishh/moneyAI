import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AALoginScreen from '../AALoginScreen';
import { AAJourneyProvider } from '../../../contexts/AAJourneyContext';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the AA Journey context
const mockLoginWithMobile = jest.fn();
const mockAAJourneyContext = {
  state: {
    loading: false,
    error: null,
    currentStep: 'login',
    isInitialized: true,
    isConnected: true,
    isAuthenticated: false,
    userId: null,
    consentHandleId: 'test-consent-handle',
    availableFIPs: [],
    selectedFIP: null,
    fipDetails: null,
    discoveredAccounts: [],
    selectedAccountsToLink: [],
    linkedAccounts: [],
    consentDetails: null,
    selectedAccountsForConsent: [],
    loginOtpReference: null,
    linkingOtpReference: null,
  },
  loginWithMobile: mockLoginWithMobile,
  // Add other required context methods as no-ops
  initializeSDK: jest.fn(),
  connectToFinvu: jest.fn(),
  disconnectFromFinvu: jest.fn(),
  verifyLoginOTP: jest.fn(),
  logout: jest.fn(),
  fetchAvailableFIPs: jest.fn(),
  selectFIP: jest.fn(),
  discoverAccounts: jest.fn(),
  selectAccountsToLink: jest.fn(),
  linkSelectedAccounts: jest.fn(),
  confirmAccountLinking: jest.fn(),
  fetchLinkedAccounts: jest.fn(),
  fetchConsentDetails: jest.fn(),
  selectAccountsForConsent: jest.fn(),
  approveConsent: jest.fn(),
  denyConsent: jest.fn(),
  resetJourney: jest.fn(),
  setError: jest.fn(),
};

jest.mock('../../../contexts/AAJourneyContext', () => ({
  useAAJourney: () => mockAAJourneyContext,
  AAJourneyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('AALoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<AALoginScreen />);

    expect(getByText('Account Aggregator Login')).toBeTruthy();
    expect(getByText('Enter your credentials to access your financial accounts')).toBeTruthy();
    expect(getByPlaceholderText('Enter your username')).toBeTruthy();
    expect(getByPlaceholderText('Enter 10-digit mobile number')).toBeTruthy();
    expect(getByText('Send OTP')).toBeTruthy();
  });

  it('should validate empty fields', () => {
    const { getByText } = render(<AALoginScreen />);

    fireEvent.press(getByText('Send OTP'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter both username and mobile number');
  });

  it('should validate mobile number format', () => {
    const { getByPlaceholderText, getByText } = render(<AALoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '123');

    fireEvent.press(getByText('Send OTP'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid 10-digit mobile number');
  });

  it('should call loginWithMobile with correct parameters', async () => {
    const { getByPlaceholderText, getByText } = render(<AALoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '9999999999');

    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(mockLoginWithMobile).toHaveBeenCalledWith('test@example.com', '9999999999');
    });
  });

  it('should show loading state', () => {
    mockAAJourneyContext.state.loading = true;
    
    const { getByText } = render(<AALoginScreen />);

    expect(getByText('Sending OTP...')).toBeTruthy();
  });

  it('should display error message', () => {
    mockAAJourneyContext.state.error = 'Login failed';
    
    const { getByText } = render(<AALoginScreen />);

    expect(getByText('Login failed')).toBeTruthy();
  });

  it('should disable inputs when loading', () => {
    mockAAJourneyContext.state.loading = true;
    
    const { getByPlaceholderText } = render(<AALoginScreen />);

    const usernameInput = getByPlaceholderText('Enter your username');
    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');

    expect(usernameInput.props.editable).toBe(false);
    expect(mobileInput.props.editable).toBe(false);
  });

  it('should trim whitespace from inputs', async () => {
    const { getByPlaceholderText, getByText } = render(<AALoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your username'), '  test@example.com  ');
    fireEvent.changeText(getByPlaceholderText('Enter 10-digit mobile number'), '  9999999999  ');

    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(mockLoginWithMobile).toHaveBeenCalledWith('test@example.com', '9999999999');
    });
  });

  it('should limit mobile number input to 10 digits', () => {
    const { getByPlaceholderText } = render(<AALoginScreen />);

    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');
    expect(mobileInput.props.maxLength).toBe(10);
  });

  it('should use numeric keyboard for mobile number', () => {
    const { getByPlaceholderText } = render(<AALoginScreen />);

    const mobileInput = getByPlaceholderText('Enter 10-digit mobile number');
    expect(mobileInput.props.keyboardType).toBe('numeric');
  });

  it('should use email keyboard for username', () => {
    const { getByPlaceholderText } = render(<AALoginScreen />);

    const usernameInput = getByPlaceholderText('Enter your username');
    expect(usernameInput.props.keyboardType).toBe('email-address');
  });
});