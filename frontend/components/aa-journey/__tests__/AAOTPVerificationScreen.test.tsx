import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AAOTPVerificationScreen from '../AAOTPVerificationScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the AA Journey context
const mockVerifyLoginOTP = jest.fn();
const mockAAJourneyContext = {
  state: {
    loading: false,
    error: null,
    currentStep: 'otp_verification',
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
    loginOtpReference: 'test-otp-ref',
    linkingOtpReference: null,
  },
  verifyLoginOTP: mockVerifyLoginOTP,
  loginWithMobile: jest.fn(),
  // Add other required context methods as no-ops
  initializeSDK: jest.fn(),
  connectToFinvu: jest.fn(),
  disconnectFromFinvu: jest.fn(),
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
}));

// Mock timers
jest.useFakeTimers();

describe('AAOTPVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should render OTP verification form correctly', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    expect(getByText('Enter OTP')).toBeTruthy();
    expect(getByText("We've sent a 6-digit code to your registered mobile number")).toBeTruthy();
    expect(getByText('Verify OTP')).toBeTruthy();
  });

  it('should render 6 OTP input fields', () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    // All inputs should be empty initially
    const inputs = getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThanOrEqual(6);
  });

  it('should handle OTP input correctly', () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Enter first digit
    fireEvent.changeText(inputs[0], '1');
    
    // Should move focus to next input (we can't test focus directly in RNTL)
    expect(inputs[0].props.value).toBe('1');
  });

  it('should validate complete OTP before verification', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    fireEvent.press(getByText('Verify OTP'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter the complete 6-digit OTP');
  });

  it('should call verifyLoginOTP with correct OTP', async () => {
    const { getAllByDisplayValue, getByText } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Enter complete OTP
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    fireEvent.press(getByText('Verify OTP'));

    await waitFor(() => {
      expect(mockVerifyLoginOTP).toHaveBeenCalledWith('123456');
    });
  });

  it('should auto-verify when all digits are entered', async () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Enter complete OTP - should auto-verify
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    await waitFor(() => {
      expect(mockVerifyLoginOTP).toHaveBeenCalledWith('123456');
    });
  });

  it('should show loading state', () => {
    mockAAJourneyContext.state.loading = true;
    
    const { getByText } = render(<AAOTPVerificationScreen />);

    expect(getByText('Verifying...')).toBeTruthy();
  });

  it('should display error message', () => {
    mockAAJourneyContext.state.error = 'OTP verification failed';
    
    const { getByText } = render(<AAOTPVerificationScreen />);

    expect(getByText('OTP verification failed')).toBeTruthy();
  });

  it('should show resend timer', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    expect(getByText('Resend in 30s')).toBeTruthy();
  });

  it('should countdown resend timer', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    expect(getByText('Resend in 30s')).toBeTruthy();

    // Fast-forward 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText('Resend in 29s')).toBeTruthy();
  });

  it('should enable resend button after timer expires', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(getByText('Resend OTP')).toBeTruthy();
  });

  it('should handle resend OTP', () => {
    const { getByText } = render(<AAOTPVerificationScreen />);

    // Fast-forward to enable resend
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    fireEvent.press(getByText('Resend OTP'));

    expect(Alert.alert).toHaveBeenCalledWith('Resend OTP', 'Please go back and request a new OTP');
  });

  it('should only accept numeric input', () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Try to enter non-numeric character
    fireEvent.changeText(inputs[0], 'a');
    
    // Should not accept non-numeric input
    expect(inputs[0].props.value).toBe('');
  });

  it('should limit input to single digit', () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Each input should have maxLength of 1
    expect(inputs[0].props.maxLength).toBe(1);
  });

  it('should disable inputs when loading', () => {
    mockAAJourneyContext.state.loading = true;
    
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    inputs.forEach(input => {
      expect(input.props.editable).toBe(false);
    });
  });

  it('should handle backspace navigation', () => {
    const { getAllByDisplayValue } = render(<AAOTPVerificationScreen />);

    const inputs = getAllByDisplayValue('');
    
    // Enter digit in second input
    fireEvent.changeText(inputs[1], '2');
    
    // Simulate backspace on empty second input
    fireEvent(inputs[1], 'onKeyPress', { nativeEvent: { key: 'Backspace' } });
    
    // Should focus previous input (we can't test focus directly)
    // This test mainly ensures the handler doesn't crash
  });
});