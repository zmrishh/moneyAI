import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AAJourneyProvider, useAAJourney, AAStep } from '../../../contexts/AAJourneyContext';
import { Text, TouchableOpacity } from 'react-native';

// Mock the Finvu SDK
jest.mock('../../../services/finvu-sdk', () => ({
  __esModule: true,
  default: {
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
  },
}));

// Test component that uses the AA Journey context
function TestComponent() {
  const { state, initializeSDK, loginWithMobile, verifyLoginOTP } = useAAJourney();

  return (
    <>
      <Text testID="current-step">{state.currentStep}</Text>
      <Text testID="loading">{state.loading.toString()}</Text>
      <Text testID="error">{state.error || 'no-error'}</Text>
      <TouchableOpacity
        testID="initialize-button"
        onPress={() => initializeSDK('test-consent-handle')}
      >
        <Text>Initialize</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="login-button"
        onPress={() => loginWithMobile('test@example.com', '9999999999')}
      >
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="verify-otp-button"
        onPress={() => verifyLoginOTP('123456')}
      >
        <Text>Verify OTP</Text>
      </TouchableOpacity>
    </>
  );
}

describe('AAJourneyContext', () => {
  const finvuSDK = require('../../../services/finvu-sdk').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    expect(getByTestId('current-step')).toHaveTextContent(AAStep.INITIALIZATION);
    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle successful SDK initialization', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.LOGIN);
    });

    expect(finvuSDK.initializeWith).toHaveBeenCalledWith({
      finvuEndpoint: 'wss://webvwdev.finvu.in/consentapi',
      certificatePins: [
        'TmZriS3UEzT3t5s8SJATgFdUH/llYL8vieP2wOuBAB8=',
        'aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/='
      ]
    });
  });

  it('should handle SDK initialization failure', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Initialization failed' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Initialization failed');
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.ERROR);
    });
  });

  it('should handle successful login', async () => {
    // Setup successful initialization first
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({ isSuccess: true });
    finvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: true,
      data: { reference: 'test-otp-ref' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    // Initialize first
    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.LOGIN);
    });

    // Then login
    await act(async () => {
      getByTestId('login-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.OTP_VERIFICATION);
    });

    expect(finvuSDK.loginWithUsernameOrMobileNumber).toHaveBeenCalledWith(
      'test@example.com',
      '9999999999',
      'test-consent-handle'
    );
  });

  it('should handle successful OTP verification', async () => {
    // Setup successful flow up to OTP verification
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({ isSuccess: true });
    finvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: true,
      data: { reference: 'test-otp-ref' }
    });
    finvuSDK.verifyLoginOtp.mockResolvedValue({
      isSuccess: true,
      data: { userId: 'test-user-id' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    // Go through initialization and login
    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.LOGIN);
    });

    await act(async () => {
      getByTestId('login-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.OTP_VERIFICATION);
    });

    // Verify OTP
    await act(async () => {
      getByTestId('verify-otp-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.FIP_SELECTION);
    });

    expect(finvuSDK.verifyLoginOtp).toHaveBeenCalledWith('123456', 'test-otp-ref');
  });

  it('should handle login failure', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({ isSuccess: true });
    finvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Login failed' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.LOGIN);
    });

    await act(async () => {
      getByTestId('login-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Login failed');
    });
  });

  it('should handle OTP verification failure', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({ isSuccess: true });
    finvuSDK.loginWithUsernameOrMobileNumber.mockResolvedValue({
      isSuccess: true,
      data: { reference: 'test-otp-ref' }
    });
    finvuSDK.verifyLoginOtp.mockResolvedValue({
      isSuccess: false,
      error: { message: 'OTP verification failed' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    // Go through initialization and login
    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.LOGIN);
    });

    await act(async () => {
      getByTestId('login-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('current-step')).toHaveTextContent(AAStep.OTP_VERIFICATION);
    });

    await act(async () => {
      getByTestId('verify-otp-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('OTP verification failed');
    });
  });

  it('should auto-connect after initialization', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({ isSuccess: true });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(finvuSDK.connect).toHaveBeenCalled();
    });
  });

  it('should handle connection failure', async () => {
    finvuSDK.initializeWith.mockResolvedValue({
      isSuccess: true,
      data: 'Initialized successfully'
    });
    finvuSDK.connect.mockResolvedValue({
      isSuccess: false,
      error: { message: 'Connection failed' }
    });

    const { getByTestId } = render(
      <AAJourneyProvider>
        <TestComponent />
      </AAJourneyProvider>
    );

    await act(async () => {
      getByTestId('initialize-button').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Connection failed');
    });
  });
});