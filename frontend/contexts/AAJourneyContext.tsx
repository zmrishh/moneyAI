import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import finvuSDK, { 
  FIPInfo, 
  FipDetails, 
  DiscoveredAccount, 
  LinkedAccountDetails, 
  ConsentDetail 
} from '../services/finvu-sdk';

// AA Journey State Types
interface AAJourneyState {
  // Connection & Auth
  isInitialized: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  
  // Current Flow State
  currentStep: AAStep;
  consentHandleId: string | null;
  
  // FIP Management
  availableFIPs: FIPInfo[];
  selectedFIP: FIPInfo | null;
  fipDetails: FipDetails | null;
  
  // Account Discovery & Linking
  discoveredAccounts: DiscoveredAccount[];
  selectedAccountsToLink: DiscoveredAccount[];
  linkedAccounts: LinkedAccountDetails[];
  
  // Consent Management
  consentDetails: ConsentDetail | null;
  selectedAccountsForConsent: LinkedAccountDetails[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // OTP References
  loginOtpReference: string | null;
  linkingOtpReference: string | null;
}

export enum AAStep {
  INITIALIZATION = 'initialization',
  LOGIN = 'login',
  OTP_VERIFICATION = 'otp_verification',
  FIP_SELECTION = 'fip_selection',
  ACCOUNT_DISCOVERY = 'account_discovery',
  ACCOUNT_LINKING = 'account_linking',
  LINKING_OTP = 'linking_otp',
  CONSENT_REVIEW = 'consent_review',
  CONSENT_APPROVAL = 'consent_approval',
  COMPLETED = 'completed',
  ERROR = 'error'
}

type AAJourneyAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STEP'; payload: AAStep }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { isAuthenticated: boolean; userId?: string } }
  | { type: 'SET_CONSENT_HANDLE'; payload: string }
  | { type: 'SET_LOGIN_OTP_REF'; payload: string }
  | { type: 'SET_LINKING_OTP_REF'; payload: string }
  | { type: 'SET_AVAILABLE_FIPS'; payload: FIPInfo[] }
  | { type: 'SET_SELECTED_FIP'; payload: FIPInfo }
  | { type: 'SET_FIP_DETAILS'; payload: FipDetails }
  | { type: 'SET_DISCOVERED_ACCOUNTS'; payload: DiscoveredAccount[] }
  | { type: 'SET_SELECTED_ACCOUNTS_TO_LINK'; payload: DiscoveredAccount[] }
  | { type: 'SET_LINKED_ACCOUNTS'; payload: LinkedAccountDetails[] }
  | { type: 'SET_CONSENT_DETAILS'; payload: ConsentDetail }
  | { type: 'SET_SELECTED_ACCOUNTS_FOR_CONSENT'; payload: LinkedAccountDetails[] }
  | { type: 'RESET_JOURNEY' };

const initialState: AAJourneyState = {
  isInitialized: false,
  isConnected: false,
  isAuthenticated: false,
  userId: null,
  currentStep: AAStep.INITIALIZATION,
  consentHandleId: null,
  availableFIPs: [],
  selectedFIP: null,
  fipDetails: null,
  discoveredAccounts: [],
  selectedAccountsToLink: [],
  linkedAccounts: [],
  consentDetails: null,
  selectedAccountsForConsent: [],
  loading: false,
  error: null,
  loginOtpReference: null,
  linkingOtpReference: null,
};

function aaJourneyReducer(state: AAJourneyState, action: AAJourneyAction): AAJourneyState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_AUTHENTICATED':
      return { 
        ...state, 
        isAuthenticated: action.payload.isAuthenticated,
        userId: action.payload.userId || null
      };
    case 'SET_CONSENT_HANDLE':
      return { ...state, consentHandleId: action.payload };
    case 'SET_LOGIN_OTP_REF':
      return { ...state, loginOtpReference: action.payload };
    case 'SET_LINKING_OTP_REF':
      return { ...state, linkingOtpReference: action.payload };
    case 'SET_AVAILABLE_FIPS':
      return { ...state, availableFIPs: action.payload };
    case 'SET_SELECTED_FIP':
      return { ...state, selectedFIP: action.payload };
    case 'SET_FIP_DETAILS':
      return { ...state, fipDetails: action.payload };
    case 'SET_DISCOVERED_ACCOUNTS':
      return { ...state, discoveredAccounts: action.payload };
    case 'SET_SELECTED_ACCOUNTS_TO_LINK':
      return { ...state, selectedAccountsToLink: action.payload };
    case 'SET_LINKED_ACCOUNTS':
      return { ...state, linkedAccounts: action.payload };
    case 'SET_CONSENT_DETAILS':
      return { ...state, consentDetails: action.payload };
    case 'SET_SELECTED_ACCOUNTS_FOR_CONSENT':
      return { ...state, selectedAccountsForConsent: action.payload };
    case 'RESET_JOURNEY':
      return initialState;
    default:
      return state;
  }
}

interface AAJourneyContextType {
  state: AAJourneyState;
  
  // Initialization & Connection
  initializeSDK: (consentHandleId: string) => Promise<void>;
  connectToFinvu: () => Promise<void>;
  disconnectFromFinvu: () => Promise<void>;
  
  // Authentication
  loginWithMobile: (username: string, mobileNumber: string) => Promise<void>;
  verifyLoginOTP: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // FIP Management
  fetchAvailableFIPs: () => Promise<void>;
  selectFIP: (fip: FIPInfo) => Promise<void>;
  
  // Account Discovery & Linking
  discoverAccounts: (identifiers: { category: string; type: string; value: string }[]) => Promise<void>;
  selectAccountsToLink: (accounts: DiscoveredAccount[]) => void;
  linkSelectedAccounts: () => Promise<void>;
  confirmAccountLinking: (otp: string) => Promise<void>;
  fetchLinkedAccounts: () => Promise<void>;
  
  // Consent Management
  fetchConsentDetails: () => Promise<void>;
  selectAccountsForConsent: (accounts: LinkedAccountDetails[]) => void;
  approveConsent: () => Promise<void>;
  denyConsent: () => Promise<void>;
  
  // Journey Control
  resetJourney: () => Promise<void>;
  setError: (error: string | null) => void;
}

const AAJourneyContext = createContext<AAJourneyContextType | undefined>(undefined);

export function AAJourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(aaJourneyReducer, initialState);

  // Initialization & Connection
  const initializeSDK = useCallback(async (consentHandleId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      dispatch({ type: 'SET_CONSENT_HANDLE', payload: consentHandleId });
      
      const config = {
        finvuEndpoint: 'wss://webvwdev.finvu.in/consentapi', // UAT endpoint
        certificatePins: [
          'TmZriS3UEzT3t5s8SJATgFdUH/llYL8vieP2wOuBAB8=',
          'aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/='
        ]
      };
      
      const result = await finvuSDK.initializeWith(config);
      
      if (result.isSuccess) {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        dispatch({ type: 'SET_STEP', payload: AAStep.LOGIN });
      } else {
        throw new Error(result.error?.message || 'Initialization failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Initialization failed' });
      dispatch({ type: 'SET_STEP', payload: AAStep.ERROR });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const connectToFinvu = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.connect();
      
      if (result.isSuccess) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
      } else {
        throw new Error(result.error?.message || 'Connection failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Connection failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const disconnectFromFinvu = useCallback(async () => {
    try {
      await finvuSDK.disconnect();
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, []);

  // Authentication
  const loginWithMobile = useCallback(async (username: string, mobileNumber: string) => {
    if (!state.consentHandleId) {
      dispatch({ type: 'SET_ERROR', payload: 'Consent handle not set' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.loginWithUsernameOrMobileNumber(
        username,
        mobileNumber,
        state.consentHandleId
      );
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_LOGIN_OTP_REF', payload: result.data.reference });
        dispatch({ type: 'SET_STEP', payload: AAStep.OTP_VERIFICATION });
      } else {
        throw new Error(result.error?.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.consentHandleId]);

  const verifyLoginOTP = useCallback(async (otp: string) => {
    if (!state.loginOtpReference) {
      dispatch({ type: 'SET_ERROR', payload: 'OTP reference not found' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.verifyLoginOtp(otp, state.loginOtpReference);
      
      if (result.isSuccess && result.data) {
        dispatch({ 
          type: 'SET_AUTHENTICATED', 
          payload: { isAuthenticated: true, userId: result.data.userId }
        });
        dispatch({ type: 'SET_STEP', payload: AAStep.FIP_SELECTION });
      } else {
        throw new Error(result.error?.message || 'OTP verification failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'OTP verification failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.loginOtpReference]);

  const logout = useCallback(async () => {
    try {
      await finvuSDK.logout();
      dispatch({ type: 'SET_AUTHENTICATED', payload: { isAuthenticated: false } });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // FIP Management
  const fetchAvailableFIPs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.fipsAllFIPOptions();
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_AVAILABLE_FIPS', payload: result.data.searchOptions });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch FIPs');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch FIPs' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectFIP = useCallback(async (fip: FIPInfo) => {
    dispatch({ type: 'SET_SELECTED_FIP', payload: fip });
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.fetchFipDetails(fip.fipId);
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_FIP_DETAILS', payload: result.data });
        dispatch({ type: 'SET_STEP', payload: AAStep.ACCOUNT_DISCOVERY });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch FIP details');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch FIP details' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Account Discovery & Linking
  const discoverAccounts = useCallback(async (identifiers: { category: string; type: string; value: string }[]) => {
    if (!state.selectedFIP || !state.fipDetails) {
      dispatch({ type: 'SET_ERROR', payload: 'FIP not selected' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.discoverAccounts(
        state.selectedFIP.fipId,
        state.selectedFIP.fipFiTypes,
        identifiers
      );
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_DISCOVERED_ACCOUNTS', payload: result.data.discoveredAccounts });
        dispatch({ type: 'SET_STEP', payload: AAStep.ACCOUNT_LINKING });
      } else {
        throw new Error(result.error?.message || 'Account discovery failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Account discovery failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.selectedFIP, state.fipDetails]);

  const selectAccountsToLink = useCallback((accounts: DiscoveredAccount[]) => {
    dispatch({ type: 'SET_SELECTED_ACCOUNTS_TO_LINK', payload: accounts });
  }, []);

  const linkSelectedAccounts = useCallback(async () => {
    if (!state.selectedAccountsToLink.length || !state.fipDetails) {
      dispatch({ type: 'SET_ERROR', payload: 'No accounts selected or FIP details missing' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.linkAccounts(state.selectedAccountsToLink, state.fipDetails);
      
      if (result.isSuccess && result.data?.referenceNumber) {
        dispatch({ type: 'SET_LINKING_OTP_REF', payload: result.data.referenceNumber });
        dispatch({ type: 'SET_STEP', payload: AAStep.LINKING_OTP });
      } else {
        throw new Error(result.error?.message || 'Account linking failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Account linking failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.selectedAccountsToLink, state.fipDetails]);

  const confirmAccountLinking = useCallback(async (otp: string) => {
    if (!state.linkingOtpReference) {
      dispatch({ type: 'SET_ERROR', payload: 'Linking reference not found' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.confirmAccountLinking(state.linkingOtpReference, otp);
      
      if (result.isSuccess) {
        dispatch({ type: 'SET_STEP', payload: AAStep.CONSENT_REVIEW });
        await fetchLinkedAccounts();
      } else {
        throw new Error(result.error?.message || 'Account linking confirmation failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Account linking confirmation failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.linkingOtpReference]);

  const fetchLinkedAccounts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.fetchLinkedAccounts();
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_LINKED_ACCOUNTS', payload: result.data.linkedAccounts });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch linked accounts');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch linked accounts' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Consent Management
  const fetchConsentDetails = useCallback(async () => {
    if (!state.consentHandleId) {
      dispatch({ type: 'SET_ERROR', payload: 'Consent handle not set' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.getConsentRequestDetails(state.consentHandleId);
      
      if (result.isSuccess && result.data) {
        dispatch({ type: 'SET_CONSENT_DETAILS', payload: result.data.consentDetail });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch consent details');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch consent details' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.consentHandleId]);

  const selectAccountsForConsent = useCallback((accounts: LinkedAccountDetails[]) => {
    dispatch({ type: 'SET_SELECTED_ACCOUNTS_FOR_CONSENT', payload: accounts });
  }, []);

  const approveConsent = useCallback(async () => {
    if (!state.consentDetails || !state.selectedAccountsForConsent.length) {
      dispatch({ type: 'SET_ERROR', payload: 'Consent details or selected accounts missing' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.approveConsentRequest(
        state.consentDetails,
        state.selectedAccountsForConsent
      );
      
      if (result.isSuccess) {
        dispatch({ type: 'SET_STEP', payload: AAStep.COMPLETED });
      } else {
        throw new Error(result.error?.message || 'Consent approval failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Consent approval failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.consentDetails, state.selectedAccountsForConsent]);

  const denyConsent = useCallback(async () => {
    if (!state.consentDetails) {
      dispatch({ type: 'SET_ERROR', payload: 'Consent details missing' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await finvuSDK.denyConsentRequest(state.consentDetails);
      
      if (result.isSuccess) {
        dispatch({ type: 'SET_STEP', payload: AAStep.COMPLETED });
      } else {
        throw new Error(result.error?.message || 'Consent denial failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Consent denial failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.consentDetails]);

  // Journey Control
  const resetJourney = useCallback(async () => {
    try {
      await finvuSDK.logout();
      await finvuSDK.disconnect();
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      dispatch({ type: 'RESET_JOURNEY' });
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Auto-connect when initialized
  useEffect(() => {
    if (state.isInitialized && !state.isConnected && !state.loading) {
      connectToFinvu();
    }
  }, [state.isInitialized, state.isConnected, state.loading, connectToFinvu]);

  // Auto-fetch FIPs when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.currentStep === AAStep.FIP_SELECTION && state.availableFIPs.length === 0) {
      fetchAvailableFIPs();
    }
  }, [state.isAuthenticated, state.currentStep, state.availableFIPs.length, fetchAvailableFIPs]);

  // Auto-fetch consent details when in consent review
  useEffect(() => {
    if (state.currentStep === AAStep.CONSENT_REVIEW && !state.consentDetails) {
      fetchConsentDetails();
    }
  }, [state.currentStep, state.consentDetails, fetchConsentDetails]);

  const contextValue: AAJourneyContextType = {
    state,
    initializeSDK,
    connectToFinvu,
    disconnectFromFinvu,
    loginWithMobile,
    verifyLoginOTP,
    logout,
    fetchAvailableFIPs,
    selectFIP,
    discoverAccounts,
    selectAccountsToLink,
    linkSelectedAccounts,
    confirmAccountLinking,
    fetchLinkedAccounts,
    fetchConsentDetails,
    selectAccountsForConsent,
    approveConsent,
    denyConsent,
    resetJourney,
    setError,
  };

  return (
    <AAJourneyContext.Provider value={contextValue}>
      {children}
    </AAJourneyContext.Provider>
  );
}

export function useAAJourney() {
  const context = useContext(AAJourneyContext);
  if (context === undefined) {
    throw new Error('useAAJourney must be used within an AAJourneyProvider');
  }
  return context;
}