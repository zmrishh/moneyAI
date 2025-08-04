/**
 * Finvu SDK Mock Implementation
 * This is a mock implementation that follows the exact API structure
 * Replace this with the actual SDK once installation issues are resolved
 */

export interface Result<T> {
  isSuccess: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

export interface FinvuConfig {
  finvuEndpoint: string;
  certificatePins?: string[];
}

export interface FIPInfo {
  fipId: string;
  productName?: string;
  fipFiTypes: string[];
  productDesc?: string;
  productIconUri?: string;
  enabled: boolean;
}

export interface TypeIdentifier {
  category: string;
  type: string;
}

export interface FipFiTypeIdentifier {
  fiType: string;
  identifiers: TypeIdentifier[];
}

export interface FipDetails {
  fipId: string;
  typeIdentifiers: FipFiTypeIdentifier[];
}

export interface DiscoveredAccount {
  accountReferenceNumber: string;
  accountType: string;
  fiType: string;
  maskedAccountNumber: string;
}

export interface LinkedAccountDetails {
  userId: string;
  fipId: string;
  fipName: string;
  maskedAccountNumber: string;
  accountReferenceNumber: string;
  linkReferenceNumber: string;
  consentIdList: string[] | null;
  fiType: string;
  accountType: string;
  linkedAccountUpdateTimestamp: Date | null;
  authenticatorType: string;
}

export interface ConsentDetail {
  consentId: string | null;
  consentHandle: string;
  statusLastUpdateTimestamp: Date | null;
  financialInformationUser: {
    id: string;
    name: string;
  };
  consentPurpose: {
    code: string;
    text: string;
  };
  consentDisplayDescriptions: string[];
  dataDateTimeRange: {
    from: Date;
    to: Date;
  };
  consentDateTimeRange: {
    from: Date;
    to: Date;
  };
  consentDataLife: {
    unit: string;
    value: number;
  };
  consentDataFrequency: {
    unit: string;
    value: number;
  };
  fiTypes: string[] | null;
}

class FinvuSDK {
  private isInitialized = false;
  private isConnected = false;
  private isAuthenticated = false;

  async initializeWith(config: FinvuConfig): Promise<Result<string>> {
    try {
      // Mock initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isInitialized = true;
      return {
        isSuccess: true,
        data: 'Initialized successfully'
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'INIT_FAILED',
          message: 'Initialization failed'
        }
      };
    }
  }

  async connect(): Promise<Result<void>> {
    try {
      if (!this.isInitialized) {
        throw new Error('SDK not initialized');
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      this.isConnected = true;
      return {
        isSuccess: true
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: 'Connection failed'
        }
      };
    }
  }

  async disconnect(): Promise<Result<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this.isConnected = false;
      return {
        isSuccess: true
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'DISCONNECT_FAILED',
          message: 'Failed to disconnect from finvu'
        }
      };
    }
  }

  async loginWithUsernameOrMobileNumber(
    username: string,
    mobileNumber: string,
    consentHandleId: string
  ): Promise<Result<{ reference: string }>> {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        isSuccess: true,
        data: { reference: 'mock_ref_' + Date.now() }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'AUTH_LOGIN_FAILED',
          message: 'Login failed'
        }
      };
    }
  }

  async verifyLoginOtp(otp: string, otpReference: string): Promise<Result<{ userId: string }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      this.isAuthenticated = true;
      return {
        isSuccess: true,
        data: { userId: 'mock_user_' + Date.now() }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'AUTH_LOGIN_FAILED',
          message: 'OTP verification failed'
        }
      };
    }
  }

  async logout(): Promise<Result<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this.isAuthenticated = false;
      return {
        isSuccess: true
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Logout failed'
        }
      };
    }
  }

  async fipsAllFIPOptions(): Promise<Result<{ searchOptions: FIPInfo[] }>> {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFIPs: FIPInfo[] = [
        {
          fipId: 'FINVU-FIP',
          productName: 'Finvu Bank',
          fipFiTypes: ['DEPOSIT', 'RECURRING_DEPOSIT'],
          productDesc: 'Leading digital bank',
          productIconUri: 'https://example.com/icon.png',
          enabled: true
        },
        {
          fipId: 'HDFC-FIP',
          productName: 'HDFC Bank',
          fipFiTypes: ['DEPOSIT', 'TERM_DEPOSIT', 'MUTUAL_FUNDS'],
          productDesc: 'Private sector bank',
          enabled: true
        }
      ];

      return {
        isSuccess: true,
        data: { searchOptions: mockFIPs }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          message: 'Fetching FIPs failed'
        }
      };
    }
  }

  async fetchFipDetails(fipId: string): Promise<Result<FipDetails>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockDetails: FipDetails = {
        fipId,
        typeIdentifiers: [
          {
            fiType: 'DEPOSIT',
            identifiers: [
              { category: 'STRONG', type: 'MOBILE' }
            ]
          },
          {
            fiType: 'MUTUAL_FUNDS',
            identifiers: [
              { category: 'STRONG', type: 'MOBILE' },
              { category: 'WEAK', type: 'PAN' }
            ]
          }
        ]
      };

      return {
        isSuccess: true,
        data: mockDetails
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          message: 'Fetching FIP details failed'
        }
      };
    }
  }

  async discoverAccounts(
    fipId: string,
    fiTypes: string[],
    identifiers: { category: string; type: string; value: string }[]
  ): Promise<Result<{ discoveredAccounts: DiscoveredAccount[] }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAccounts: DiscoveredAccount[] = [
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
      ];

      return {
        isSuccess: true,
        data: { discoveredAccounts: mockAccounts }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          message: 'Discovery failed'
        }
      };
    }
  }

  async linkAccounts(
    selectedAccounts: DiscoveredAccount[],
    fipDetails: FipDetails
  ): Promise<Result<{ referenceNumber?: string }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        isSuccess: true,
        data: { referenceNumber: 'link_ref_' + Date.now() }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'LINK_FAILED',
          message: 'Linking accounts failed'
        }
      };
    }
  }

  async confirmAccountLinking(
    referenceNumber: string,
    otp: string
  ): Promise<Result<{ linkedAccounts: any[] }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        isSuccess: true,
        data: {
          linkedAccounts: [
            {
              customerAddress: 'mock@example.com',
              accountReferenceNumber: 'ACC001',
              linkReferenceNumber: referenceNumber,
              status: 'ACTIVE'
            }
          ]
        }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'OTP_VERIFICATION_FAILED',
          message: 'OTP verification failed'
        }
      };
    }
  }

  async fetchLinkedAccounts(): Promise<Result<{ linkedAccounts: LinkedAccountDetails[] }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockLinkedAccounts: LinkedAccountDetails[] = [
        {
          userId: 'user123',
          fipId: 'FINVU-FIP',
          fipName: 'Finvu Bank',
          maskedAccountNumber: 'XXXXXX1234',
          accountReferenceNumber: 'ACC001',
          linkReferenceNumber: 'link123',
          consentIdList: null,
          fiType: 'DEPOSIT',
          accountType: 'SAVINGS',
          linkedAccountUpdateTimestamp: new Date(),
          authenticatorType: 'OTP'
        }
      ];

      return {
        isSuccess: true,
        data: { linkedAccounts: mockLinkedAccounts }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          message: 'Failed to retrieve accounts'
        }
      };
    }
  }

  async getConsentRequestDetails(consentHandleId: string): Promise<Result<{ consentDetail: ConsentDetail }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockConsentDetail: ConsentDetail = {
        consentId: 'consent123',
        consentHandle: consentHandleId,
        statusLastUpdateTimestamp: new Date(),
        financialInformationUser: {
          id: 'fiu123',
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
        fiTypes: ['DEPOSIT', 'MUTUAL_FUNDS']
      };

      return {
        isSuccess: true,
        data: { consentDetail: mockConsentDetail }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'CONSENT_FETCH_FAILED',
          message: 'Fetching consent request details failed'
        }
      };
    }
  }

  async approveConsentRequest(
    consentDetails: ConsentDetail,
    selectedAccounts: LinkedAccountDetails[]
  ): Promise<Result<{ consentIntentId?: string; consentsInfo?: { fipId?: string; consentId?: string }[] }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        isSuccess: true,
        data: {
          consentIntentId: 'intent_' + Date.now(),
          consentsInfo: [
            { fipId: 'FINVU-FIP', consentId: 'consent_' + Date.now() }
          ]
        }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'CONSENT_APPROVAL_FAILED',
          message: 'Approving consent failed'
        }
      };
    }
  }

  async denyConsentRequest(
    consentDetail: ConsentDetail
  ): Promise<Result<{ consentIntentId?: string; consentsInfo?: { fipId?: string; consentId?: string }[] }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        isSuccess: true,
        data: {
          consentIntentId: 'deny_intent_' + Date.now(),
          consentsInfo: [
            { fipId: consentDetail.consentHandle, consentId: null }
          ]
        }
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: {
          code: 'CONSENT_DENIAL_FAILED',
          message: 'Denying consent failed'
        }
      };
    }
  }
}

// Export singleton instance
export const finvuSDK = new FinvuSDK();
export default finvuSDK;