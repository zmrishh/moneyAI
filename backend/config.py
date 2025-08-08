import os
import time
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

class SupabaseClientWrapper:
    """Wrapper around Supabase client with automatic retry logic"""
    
    def __init__(self):
        Config.validate_config()
        self._client = None
        self._reconnect()
    
    def _reconnect(self):
        """Create new Supabase client connection"""
        try:
            self._client = create_client(Config.SUPABASE_URL, Config.SUPABASE_API_KEY)
        except Exception as e:
            print(f"Failed to connect to Supabase: {e}")
            raise
    
    def _execute_with_retry(self, operation, max_retries=3, delay=1):
        """Execute operation with automatic retry on connection errors"""
        for attempt in range(max_retries):
            try:
                return operation()
            except Exception as e:
                error_msg = str(e).lower()
                is_connection_error = any(term in error_msg for term in [
                    'connectionterminated', 'connection terminated',
                    'server disconnected', 'connection reset',
                    'json could not be generated', 'bad request'
                ])
                
                if is_connection_error and attempt < max_retries - 1:
                    print(f"Connection error (attempt {attempt + 1}), retrying in {delay}s: {e}")
                    time.sleep(delay)
                    self._reconnect()  # Create new connection
                    delay *= 2  # Exponential backoff
                    continue
                else:
                    raise  # Re-raise if not connection error or max retries reached
    
    def table(self, table_name):
        """Get table with retry wrapper"""
        def get_table():
            return self._client.table(table_name)
        
        return TableWrapper(self._execute_with_retry(get_table), self._execute_with_retry)
    
    @property
    def auth(self):
        """Expose auth property from underlying client"""
        return self._client.auth

class TableWrapper:
    """Wrapper around Supabase table with retry logic"""
    
    def __init__(self, table, retry_executor):
        self._table = table
        self._retry_executor = retry_executor
    
    def select(self, *args, **kwargs):
        return QueryWrapper(self._table.select(*args, **kwargs), self._retry_executor)
    
    def insert(self, *args, **kwargs):
        return QueryWrapper(self._table.insert(*args, **kwargs), self._retry_executor)
    
    def update(self, *args, **kwargs):
        return QueryWrapper(self._table.update(*args, **kwargs), self._retry_executor)
    
    def delete(self, *args, **kwargs):
        return QueryWrapper(self._table.delete(*args, **kwargs), self._retry_executor)

class QueryWrapper:
    """Wrapper around Supabase query with retry logic"""
    
    def __init__(self, query, retry_executor):
        self._query = query
        self._retry_executor = retry_executor
    
    def eq(self, *args, **kwargs):
        return QueryWrapper(self._query.eq(*args, **kwargs), self._retry_executor)
    
    def neq(self, *args, **kwargs):
        return QueryWrapper(self._query.neq(*args, **kwargs), self._retry_executor)
    
    def gte(self, *args, **kwargs):
        return QueryWrapper(self._query.gte(*args, **kwargs), self._retry_executor)
    
    def lte(self, *args, **kwargs):
        return QueryWrapper(self._query.lte(*args, **kwargs), self._retry_executor)
    
    def order(self, *args, **kwargs):
        return QueryWrapper(self._query.order(*args, **kwargs), self._retry_executor)
    
    def limit(self, *args, **kwargs):
        return QueryWrapper(self._query.limit(*args, **kwargs), self._retry_executor)
    
    def range(self, *args, **kwargs):
        return QueryWrapper(self._query.range(*args, **kwargs), self._retry_executor)
    
    def gt(self, *args, **kwargs):
        return QueryWrapper(self._query.gt(*args, **kwargs), self._retry_executor)
    
    def lt(self, *args, **kwargs):
        return QueryWrapper(self._query.lt(*args, **kwargs), self._retry_executor)
    
    def like(self, *args, **kwargs):
        return QueryWrapper(self._query.like(*args, **kwargs), self._retry_executor)
    
    def ilike(self, *args, **kwargs):
        return QueryWrapper(self._query.ilike(*args, **kwargs), self._retry_executor)
    
    def is_(self, *args, **kwargs):
        return QueryWrapper(self._query.is_(*args, **kwargs), self._retry_executor)
    
    def in_(self, *args, **kwargs):
        return QueryWrapper(self._query.in_(*args, **kwargs), self._retry_executor)
    
    def execute(self):
        return self._retry_executor(lambda: self._query.execute())

def get_supabase_client() -> SupabaseClientWrapper:
    """Get configured Supabase client with retry logic"""
    return SupabaseClientWrapper()

# Global Supabase client instance
supabase_client = get_supabase_client()