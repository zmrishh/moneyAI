/**
 * API Service for MoneyAI
 * Fetches real data from the backend instead of local SQLite
 */

import { authService } from './auth';

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use the same base URL as auth service with fallback options
    const isDevice = !__DEV__ || (typeof window !== 'undefined' && window.location?.hostname !== 'localhost');
    
    if (isDevice) {
      // Try multiple possible backend URLs
      this.baseUrl = 'http://192.168.29.189:5090/api';
    } else {
      this.baseUrl = 'http://localhost:5090/api';
    }
    
    console.log('API Service initialized with URL:', this.baseUrl);
    console.log('Environment check:', { __DEV__, isDevice, platform: 'react-native' });
    console.log('🔧 If connection fails, ensure:');
    console.log('   1. Backend server is running: python app.py');
    console.log('   2. Device is on WiFi network: 192.168.29.x');
    console.log('   3. Firewall allows port 5090');
    
    // Perform initial health check
    this.performHealthCheck();
  }

  // Health check to verify backend connectivity
  private async performHealthCheck() {
    try {
      console.log('🔍 Performing backend health check...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout
      
      const testUrl = `${this.baseUrl.replace('/api', '')}/`;
      console.log('🔗 Testing connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 404) {
        console.log('✅ Backend server is accessible');
        console.log('🌐 Network connection: OK');
      } else {
        console.warn(`⚠️ Backend server responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Backend server health check failed:', error);
      console.error('🚨 CONNECTION TROUBLESHOOTING:');
      
      if (error.name === 'AbortError') {
        console.error('   ⏱️ Connection timeout - Server may be slow or unreachable');
      } else if (error.message?.includes('Network request failed')) {
        console.error('   📶 Network error - Check WiFi connection');
      } else if (error.message?.includes('fetch')) {
        console.error('   🔌 Network unavailable - Check device connectivity');
      }
      
      console.error('📋 CHECKLIST:');
      console.error('   1. ✓ Is backend running? → python app.py');
      console.error('   2. ✓ Same WiFi network? → 192.168.29.x');
      console.error('   3. ✓ Port accessible? → curl http://192.168.29.189:5090/');
      console.error('   4. ✓ Firewall disabled? → System Preferences > Security');
    }
  }

  // Retry logic for network requests
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<any> {
    const token = authService.getToken();
    
    console.log('🔐 Auth token check:', { 
      token: token ? `${token.substring(0, 20)}...` : 'null',
      endpoint,
      timestamp: new Date().toISOString()
    });
    
    if (!token || token === 'pending-verification' || token === 'session-token') {
      console.error('❌ No valid authentication token available');
      throw new Error('No valid authentication token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers as Record<string, string>
    };

    // Add cache-busting timestamp for real-time data
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${separator}_t=${Date.now()}`;
    console.log(`Making authenticated request to: ${url} (attempt: ${4 - retries})`);
    console.log('Request headers:', { ...headers, Authorization: `Bearer ${token.substring(0, 20)}...` });

    for (let attempt = 0; attempt < 4 - retries + 1; attempt++) {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`📡 Response status: ${response.status} ${response.statusText} (attempt: ${attempt + 1})`);
        console.log(`🕒 Response time: ${Date.now() - Date.now()} ms`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP ${response.status} error:`, errorText);
          
          // Don't retry on authentication errors (401, 403)
          if (response.status === 401 || response.status === 403) {
            throw new Error(`Authentication failed: ${response.statusText}`);
          }
          
          // Retry on server errors (5xx) and network issues
          if (response.status >= 500 && attempt < 2) {
            console.log(`Server error ${response.status}, retrying in ${(attempt + 1) * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Response data structure:', { 
          type: typeof data, 
          keys: Object.keys(data || {}),
          hasTimezone: !!data.timezone_info,
          timestamp: data.date || 'no date'
        });
        return data;

      } catch (error: any) {
        console.error(`❌ API Request error (attempt ${attempt + 1}):`, {
          error: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200),
          endpoint,
          timestamp: new Date().toISOString()
        });
        
        // Enhanced network error detection
        const isNetworkError = (
          error.name === 'AbortError' ||
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('Network request failed') ||
          error.message?.includes('Failed to fetch')
        );
        
        // Network/timeout errors - retry
        if (isNetworkError && attempt < 2) {
          const retryDelay = (attempt + 1) * 1500; // Increased delay
          console.log(`🔄 Network error detected, retrying in ${retryDelay}ms...`);
          console.log(`📱 Error details: ${error.name} - ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Authentication errors - don't retry
        if (error.message?.includes('Authentication failed')) {
          throw error;
        }
        
        // Final attempt failed - provide helpful error
        if (attempt === 2) {
          if (isNetworkError) {
            throw new Error(`Connection failed after 3 attempts. Please check your network connection and ensure the backend server is running.`);
          } else {
            throw new Error(`Request failed after 3 attempts: ${error.message}`);
          }
        }
      }
    }
    
    throw new Error('Request failed after all retry attempts');
  }

  // Manual network connectivity test
  async testConnection() {
    console.log('🔍 Testing network connectivity manually...');
    try {
      await this.performHealthCheck();
      
      // Test API endpoint
      const response = await fetch(`${this.baseUrl}/analytics/balance`, {
        method: 'HEAD', // Just test connectivity, don't need full response
        headers: { 'Authorization': `Bearer ${authService.getToken()}` },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ API endpoint is accessible');
        return { success: true, message: 'Connection successful' };
      } else {
        console.log(`⚠️ API responded with status: ${response.status}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return { 
        success: false, 
        message: `Connection failed: ${error.message}`,
        troubleshooting: [
          'Check WiFi connection',
          'Ensure backend server is running',
          'Verify IP address: 192.168.29.189',
          'Check firewall settings'
        ]
      };
    }
  }

  // User Profile
  async getUserProfile() {
    try {
      const response = await this.makeAuthenticatedRequest('/auth/profile');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Transactions
  async getTransactions(limit: number = 50) {
    try {
      const response = await this.makeAuthenticatedRequest(`/transactions?limit=${limit}`);
      // Handle different response formats
      let transactions = [];
      if (response.data && Array.isArray(response.data.items)) {
        transactions = response.data.items;
      } else if (Array.isArray(response.data)) {
        transactions = response.data;
      } else if (Array.isArray(response.transactions)) {
        transactions = response.transactions;
      } else if (Array.isArray(response)) {
        transactions = response;
      }
      
      console.log('Transactions API response format:', { 
        responseType: typeof response, 
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(transactions),
        length: transactions.length 
      });
      
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async createTransaction(transaction: any) {
    try {
      const response = await this.makeAuthenticatedRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction)
      });
      return response;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Balance and Analytics
  async getTotalBalance() {
    try {
      const response = await this.makeAuthenticatedRequest('/analytics/balance');
      return {
        balance: response.data?.current_balance || 0,
        income: response.data?.total_income || 0,
        expenses: response.data?.total_expenses || 0
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Balance with real-time data
  async getEnhancedBalance() {
    try {
      console.log('🔄 Fetching enhanced balance data...');
      const response = await this.makeAuthenticatedRequest('/analytics/balance');
      console.log('✅ Enhanced balance response received:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ Error fetching enhanced balance:', error);
      console.log('🚨 Network error - all data must come from database. Re-throwing error.');
      
      // Don't provide fallback data - all data must come from database
      // Let the UI handle the error state appropriately
      throw new Error(`Failed to fetch balance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Money insights with real-time calculations
  async getMoneyInsights() {
    try {
      const response = await this.makeAuthenticatedRequest('/analytics/insights');
      console.log('Money insights response:', response);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching money insights:', error);
      throw new Error(`Failed to fetch money insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User profile information
  async getUserProfileInfo() {
    try {
      const response = await this.makeAuthenticatedRequest('/analytics/user-profile');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user profile info:', error);
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Budgets
  async getBudgets() {
    try {
      const response = await this.makeAuthenticatedRequest('/budgets');
      // Handle different response formats
      let budgets = [];
      if (response.data && Array.isArray(response.data.items)) {
        budgets = response.data.items;
      } else if (Array.isArray(response.data)) {
        budgets = response.data;
      } else if (Array.isArray(response.budgets)) {
        budgets = response.budgets;
      } else if (Array.isArray(response)) {
        budgets = response;
      }
      
      return budgets;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }
  }

  async createBudget(budget: any) {
    try {
      const response = await this.makeAuthenticatedRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify(budget)
      });
      return response;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  // Goals
  async getGoals() {
    try {
      const response = await this.makeAuthenticatedRequest('/goals');
      // Handle different response formats
      let goals = [];
      if (response.data && Array.isArray(response.data.items)) {
        goals = response.data.items;
      } else if (Array.isArray(response.data)) {
        goals = response.data;
      } else if (Array.isArray(response.goals)) {
        goals = response.goals;
      } else if (Array.isArray(response)) {
        goals = response;
      }
      
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  // Bills
  async getBills() {
    try {
      const response = await this.makeAuthenticatedRequest('/bills');
      // Handle different response formats
      let bills = [];
      if (response.data && Array.isArray(response.data.items)) {
        bills = response.data.items;
      } else if (Array.isArray(response.data)) {
        bills = response.data;
      } else if (Array.isArray(response.bills)) {
        bills = response.bills;
      } else if (Array.isArray(response)) {
        bills = response;
      }
      
      // Convert date strings to Date objects to match frontend type expectations
      const convertedBills = bills.map(bill => ({
        ...bill,
        due_date: new Date(bill.due_date),
        payment_date: bill.payment_date ? new Date(bill.payment_date) : undefined,
        created_at: bill.created_at ? new Date(bill.created_at) : undefined,
        updated_at: bill.updated_at ? new Date(bill.updated_at) : undefined,
      }));
      
      console.log(`Converted ${convertedBills.length} bills with proper date objects`);
      return convertedBills;
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async createBill(bill: any) {
    try {
      const response = await this.makeAuthenticatedRequest('/bills', {
        method: 'POST',
        body: JSON.stringify(bill)
      });
      return response;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async markBillPaid(billId: string, actualAmount?: number, notes?: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`/bills/${billId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ actual_amount: actualAmount, notes })
      });
      return response;
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      throw error;
    }
  }

  async toggleBillAutoPay(billId: string, autoPay: boolean) {
    try {
      const response = await this.makeAuthenticatedRequest(`/bills/${billId}`, {
        method: 'PUT',
        body: JSON.stringify({ auto_pay: autoPay })
      });
      return response;
    } catch (error) {
      console.error('Error toggling bill auto pay:', error);
      throw error;
    }
  }

  // Subscriptions
  async getSubscriptions() {
    try {
      const response = await this.makeAuthenticatedRequest('/subscriptions');
      console.log('Subscriptions response:', response);
      
      // Handle different response formats
      let subscriptions = [];
      if (response.data && Array.isArray(response.data)) {
        subscriptions = response.data;
      } else if (Array.isArray(response.subscriptions)) {
        subscriptions = response.subscriptions;
      } else if (Array.isArray(response)) {
        subscriptions = response;
      }
      
      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  async createSubscription(subscription: any) {
    try {
      const response = await this.makeAuthenticatedRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });
      return response;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async renewSubscription(subscriptionId: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`/subscriptions/${subscriptionId}/renew`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  // Debts
  async getDebts() {
    try {
      const response = await this.makeAuthenticatedRequest('/debts');
      console.log('Debts response:', response);
      
      // Handle different response formats
      let debts = [];
      if (response.data && Array.isArray(response.data)) {
        debts = response.data;
      } else if (Array.isArray(response.debts)) {
        debts = response.debts;
      } else if (Array.isArray(response)) {
        debts = response;
      }
      
      return debts;
    } catch (error) {
      console.error('Error fetching debts:', error);
      return [];
    }
  }

  async createDebt(debt: any) {
    try {
      const response = await this.makeAuthenticatedRequest('/debts', {
        method: 'POST',
        body: JSON.stringify(debt)
      });
      return response;
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  }

  async addDebtPayment(debtId: string, payment: any) {
    try {
      const response = await this.makeAuthenticatedRequest(`/debts/${debtId}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment)
      });
      return response;
    } catch (error) {
      console.error('Error adding debt payment:', error);
      throw error;
    }
  }

  async settleDebt(debtId: string, note?: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`/debts/${debtId}/settle`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      return response;
    } catch (error) {
      console.error('Error settling debt:', error);
      throw error;
    }
  }

  // Analytics
  async getSpendingAnalytics(period: string = '30d') {
    try {
      const response = await this.makeAuthenticatedRequest(`/analytics/spending-trends`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching spending analytics:', error);
      return { categories: [], timeline: [] };
    }
  }

  async getIncomeAnalytics(period: string = '30d') {
    try {
      const response = await this.makeAuthenticatedRequest(`/analytics/income?period=${period}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching income analytics:', error);
      return { sources: [], timeline: [] };
    }
  }

  // Dashboard summary with real-time data
  async getDashboardData() {
    try {
      console.log('🔄 Loading fresh dashboard data (no cache)...');
      
      // Force fresh data by adding timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const [enhancedBalance, transactions, budgets, goals, bills, debts, subscriptions] = await Promise.all([
        this.getEnhancedBalance(),
        this.getTransactions(10),
        this.getBudgets(),
        this.getGoals(),
        this.getBills(),
        this.getDebts(),
        this.getSubscriptions()
      ]);
      
      console.log('✅ Fresh dashboard data loaded:', {
        budgetTotal: enhancedBalance.budgets?.total_budget,
        monthlySpent: enhancedBalance.this_month?.spent,
        transactionCount: enhancedBalance.overall?.transaction_count
      });

      // Ensure all data is in the expected format (arrays)
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const safeBudgets = Array.isArray(budgets) ? budgets : [];
      const safeGoals = Array.isArray(goals) ? goals : [];
      const safeBills = Array.isArray(bills) ? bills : [];
      const safeDebts = Array.isArray(debts) ? debts : [];
      const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

      // Use real-time data from enhanced balance
      const todaySpent = enhancedBalance.today?.spent || 0;
      const monthlySpent = enhancedBalance.this_month?.spent || 0;
      const dailyAverage = enhancedBalance.this_month?.daily_average_spending || 0;
      const topCategory = enhancedBalance.insights?.top_category || { name: 'Food', amount: 0 };
      const userInfo = enhancedBalance.user || { full_name: 'User' };

      // Count pending items from real data
      const pendingBills = safeBills.filter((b: any) => 
        b.status === 'pending' || b.status === 'due' || !b.is_paid
      ).length;
      const activeGoals = safeGoals.filter((g: any) => 
        g.status === 'active' || !g.is_completed
      ).length;
      
      const activeDebts = safeDebts.filter((d: any) => 
        d.status === 'active' || !d.is_paid
      ).length;

      return {
        // Real-time financial data
        balance: enhancedBalance.current_balance || 0,
        todaySpent,
        monthlySpent,
        dailyAverage,
        topCategory,
        userInfo,
        
        // Budgets with real calculations
        totalBudget: enhancedBalance.budgets?.total_budget || 0,
        budgetSpent: enhancedBalance.budgets?.spent_amount || 0,
        budgetRemaining: enhancedBalance.budgets?.remaining_amount || 0,
        
        // Transaction and item counts
        transactions: safeTransactions,
        pendingBills,
        savingsGoals: activeGoals,
        budgets: safeBudgets,
        goals: safeGoals,
        bills: safeBills,
        debts: safeDebts,
        activeDebts,
        subscriptions: safeSubscriptions,
        
        // Additional insights
        thisWeekTransactions: enhancedBalance.this_week?.transaction_count || 0,
        weeklySpent: enhancedBalance.this_week?.spent || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;