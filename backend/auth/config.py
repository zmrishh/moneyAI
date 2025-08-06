#!/usr/bin/env python3
"""
Supabase Authentication Configuration
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class SupabaseConfig:
    """Supabase configuration and client management"""
    
    def __init__(self):
        # Get Supabase credentials from environment variables first
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_API_KEY')
        
        # Security: Require environment variables for production
        if not self.supabase_url:
            if os.getenv('ENVIRONMENT', 'development') == 'production':
                raise ValueError("SUPABASE_URL environment variable is required for production")
            else:
                raise ValueError("SUPABASE_URL environment variable is required. Please set it in your .env file.")
            
        if not self.supabase_key:
            if os.getenv('ENVIRONMENT', 'development') == 'production':
                raise ValueError("SUPABASE_API_KEY environment variable is required for production")
            else:
                raise ValueError("SUPABASE_API_KEY environment variable is required. Please set it in your .env file.")
        
        # Validate configuration
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing required Supabase configuration")
        
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get or create Supabase client"""
        if self._client is None:
            self._client = create_client(self.supabase_url, self.supabase_key)
        return self._client
    
    def get_client(self) -> Client:
        """Get Supabase client instance"""
        return self.client
    
    def health_check(self) -> dict:
        """Check if Supabase connection is working"""
        try:
            # Simple test query to check connection - test auth instead of table query
            self.client.auth.get_user()
            return {
                "status": "healthy",
                "url": self.supabase_url,
                "connected": True
            }
        except Exception as e:
            return {
                "status": "error",
                "url": self.supabase_url,
                "connected": False,
                "error": str(e)
            }

# Global Supabase configuration instance
supabase_config = SupabaseConfig()

# Convenience function to get client
def get_supabase_client() -> Client:
    """Get the global Supabase client"""
    return supabase_config.client