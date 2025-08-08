#!/usr/bin/env python3
"""
Execute data transfer with proper validation and rollback capability
"""

from config import supabase_client
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def execute_transfer():
    """Execute the complete data transfer"""
    logger.info("🚀 Starting data transfer execution...")
    
    try:
        # Import and run the complete transfer
        from transfer_user_data_complete import transfer_complete_user_data
        
        SOURCE_EMAIL = "danieldaskonarapu@gmail.com"
        TARGET_EMAIL = "kenesislabs@gmail.com"
        
        logger.info(f"📧 Transferring from {SOURCE_EMAIL} to {TARGET_EMAIL}")
        
        success = transfer_complete_user_data(SOURCE_EMAIL, TARGET_EMAIL)
        
        if success:
            logger.info("✅ Data transfer completed successfully!")
            return True
        else:
            logger.error("❌ Data transfer failed!")
            return False
            
    except Exception as e:
        logger.error(f"❌ Transfer execution failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = execute_transfer()
    exit(0 if success else 1)