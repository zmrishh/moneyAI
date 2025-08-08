#!/usr/bin/env python3
"""
Execute the database migration script to add user_id columns
"""

from config import supabase_client
import logging

# Enable detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_migration():
    # Read and execute the migration SQL
    with open('migration_fix_user_isolation_20250808_032128.sql', 'r') as f:
        migration_sql = f.read()

    logger.info('🚀 Executing database migration...')

    try:
        # Split by statements and execute each one
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--') and stmt.strip() != 'COMMIT']
        
        for i, statement in enumerate(statements, 1):
            if statement:
                logger.info(f'Executing statement {i}/{len(statements)}...')
                result = supabase_client.rpc('exec_sql', {'sql': statement}).execute()
                logger.info(f'✅ Statement {i} completed')
        
        logger.info('🎉 Migration completed successfully!')
        return True
        
    except Exception as e:
        logger.error(f'❌ Migration failed: {str(e)}')
        return False

if __name__ == "__main__":
    success = execute_migration()
    if not success:
        exit(1)