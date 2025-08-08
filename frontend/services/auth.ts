/**
 * Authentication service for MoneyAI
 * Integrates with Flask backend authentication API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  country_code?: string;
  currency?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: User;
  };
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  country_code?: string;
}

export interface PhoneAuthCredentials {
  phone: string;
  country_code: string;
}

class AuthService {
  private baseUrl: string;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Backend API URL - automatically detect if running on device vs simulator/web
    const isDevice = !__DEV__ || (typeof window !== 'undefined' && window.location?.hostname !== 'localhost');
    
    if (isDevice) {
      // For physical devices, use your computer's actual IP address
      this.baseUrl = 'http://192.168.29.189:5090/api';
    } else {
      // For simulators and web development
      this.baseUrl = 'http://localhost:5090/api';
    }
    
    console.log('Using API base URL:', this.baseUrl);
    this.loadStoredAuth();
  }

  private async loadStoredAuth() {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('@moneyai_token'),
        AsyncStorage.getItem('@moneyai_user')
      ]);
      
      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  }

  private async storeAuth(token: string, user: User) {
    try {
      await Promise.all([
        AsyncStorage.setItem('@moneyai_token', token),
        AsyncStorage.setItem('@moneyai_user', JSON.stringify(user))
      ]);
      this.token = token;
      this.user = user;
    } catch (error) {
      console.error('Error storing auth:', error);
    }
  }

  private async clearAuth() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('@moneyai_token'),
        AsyncStorage.removeItem('@moneyai_user')
      ]);
      this.token = null;
      this.user = null;
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`Making request to: ${url}`, { method: options.method || 'GET' });

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success && response.data) {
        // Handle your backend's response format
        const user = {
          id: response.data.user_id || response.data.id,
          email: response.data.email,
          full_name: response.data.full_name,
          avatar_url: response.data.avatar_url || null
        };
        
        const token = response.data.access_token || 'session-token';
        await this.storeAuth(token, user);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Register with email and password
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success && response.data) {
        // Your backend returns user data directly, not in a nested structure
        const user = {
          id: response.data.user_id,
          email: response.data.email,
          full_name: response.data.full_name,
          avatar_url: null
        };
        
        // For signup, only store auth if we have a valid token
        if (response.data.access_token) {
          const token = response.data.access_token;
          await this.storeAuth(token, user);
        } else {
          // Store user data but no token (email verification needed)
          this.user = user;
          await AsyncStorage.setItem('@moneyai_user', JSON.stringify(user));
        }
      }

      return response;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Signup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle Google OAuth with direct Supabase integration
   */
  async handleGoogleOAuth(): Promise<AuthResponse> {
    try {
      console.log('Starting Google OAuth with direct Supabase integration...');
      
      // Import WebBrowser for in-app browser
      const WebBrowser = await import('expo-web-browser');
      
      // Use the correct Supabase URL from your backend config
      const supabaseUrl = 'https://iwkxludrhzhumnhzjlyi.supabase.co';
      const googleUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=moneyai://auth/callback`;
      
      console.log('Opening Google OAuth in in-app browser:', googleUrl);
      
      // Open in-app browser instead of external browser
      const result = await WebBrowser.openAuthSessionAsync(
        googleUrl,
        'moneyai://auth/callback'
      );
      
      console.log('Google OAuth result:', result);
      
      if (result.type === 'success') {
        const url = result.url;
        console.log('OAuth callback URL:', url);
        
        // Parse the callback URL for tokens
        const urlParams = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
        
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        
        if (error) {
          return {
            success: false,
            message: `Google authentication failed: ${error}`,
          };
        }
        
        if (accessToken) {
          console.log('Got access token from Supabase OAuth');
          
          try {
            // Get the actual user data from Supabase using the access token
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3a3hsdWRyaHpodW1uaHpqbHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTUxMDUsImV4cCI6MjA2OTg5MTEwNX0.Rl-vubKV3Tv4WT1z2aLTcIBtfS2_FvjrAlBID5oRRZI'
              }
            });
            
            if (userResponse.ok) {
              const responseText = await userResponse.text();
              console.log('Raw response from Supabase:', responseText);
              
              let userData;
              try {
                userData = JSON.parse(responseText);
                console.log('Parsed user data from Supabase:', userData);
              } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text that failed to parse:', responseText);
                throw new Error('Invalid JSON response from Supabase');
              }
              
              const user = {
                id: userData.id,
                email: userData.email,
                full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email.split('@')[0],
                avatar_url: userData.user_metadata?.avatar_url || userData.user_metadata?.picture || null
              };
              
              // Create or link user profile in backend for Google OAuth users
              try {
                console.log('Syncing Google OAuth user profile with backend...');
                const profileResponse = await this.makeRequest('/auth/create-oauth-user', {
                  method: 'POST',
                  body: JSON.stringify({
                    auth_id: userData.id,
                    email: userData.email,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                    provider: 'google',
                    is_verified: true
                  })
                });
                
                if (profileResponse.success) {
                  console.log('Google OAuth user profile synced successfully:', profileResponse.data?.status);
                } else {
                  console.log('Profile sync response:', profileResponse);
                }
              } catch (profileError) {
                console.error('Error syncing Google OAuth user profile:', profileError);
                // Continue anyway - don't fail the OAuth flow
              }
              
              // Store the real auth data
              await this.storeAuth(accessToken, user);
              
              return {
                success: true,
                message: 'Google authentication successful',
                data: {
                  access_token: accessToken,
                  user: user
                }
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
          
          // Fallback to basic user object
          const user = {
            id: 'oauth-user-' + Date.now(),
            email: 'google-user@gmail.com',
            full_name: 'Google User',
            avatar_url: null
          };
          
          await this.storeAuth(accessToken, user);
          
          return {
            success: true,
            message: 'Google authentication successful',
            data: {
              access_token: accessToken,
              user: user
            }
          };
        }
        
        return {
          success: false,
          message: 'No access token received from Google OAuth'
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          message: 'Google login was cancelled',
        };
      } else {
        return {
          success: false,
          message: 'Google login failed',
        };
      }
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        message: 'Google authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle Google OAuth callback (for deep linking)
   */
  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      if (response.success && response.data) {
        await this.storeAuth(response.data.access_token, response.data.user);
      }

      return response;
    } catch (error) {
      console.error('Google callback error:', error);
      return {
        success: false,
        message: 'Google authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Phone authentication
   */
  async phoneAuth(credentials: PhoneAuthCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/phone', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      return response;
    } catch (error) {
      console.error('Phone auth error:', error);
      return {
        success: false,
        message: 'Phone authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(phone: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      });

      if (response.success && response.data) {
        await this.storeAuth(response.data.access_token, response.data.user);
      }

      return response;
    } catch (error) {
      console.error('Phone OTP verification error:', error);
      return {
        success: false,
        message: 'OTP verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User | null> {
    try {
      if (!this.token) {
        return null;
      }

      const response = await this.makeRequest('/auth/profile');
      
      if (response.success && response.data) {
        this.user = response.data;
        await AsyncStorage.setItem('@moneyai_user', JSON.stringify(this.user));
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Get profile error:', error);
      // If token is invalid, clear auth
      if (error instanceof Error && error.message.includes('401')) {
        await this.clearAuth();
      }
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.success && response.data) {
        this.user = response.data;
        await AsyncStorage.setItem('@moneyai_user', JSON.stringify(this.user));
      }

      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Profile update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/refresh', {
        method: 'POST'
      });

      if (response.success && response.data) {
        await this.storeAuth(response.data.access_token, response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAuth();
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;