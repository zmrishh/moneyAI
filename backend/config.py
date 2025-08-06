import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Supabase configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_API_KEY = os.getenv('SUPABASE_API_KEY')
    
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = False  # For development
    
    # OpenAI configuration (for AI features)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Redis configuration (for caching and background tasks)
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # File upload configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    @staticmethod
    def validate_config():
        """Validate that required configuration is present"""
        required_vars = ['SUPABASE_URL', 'SUPABASE_API_KEY']
        missing_vars = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

def get_supabase_client() -> Client:
    """Get configured Supabase client"""
    Config.validate_config()
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_API_KEY)

# Global Supabase client instance
supabase_client = get_supabase_client()