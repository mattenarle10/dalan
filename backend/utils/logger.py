"""
Centralized logging configuration for the application
"""
import os
import logging
import json
from datetime import datetime

class LambdaLogFormatter(logging.Formatter):
    """
    Custom formatter for Lambda logs that includes timestamp and log level
    """
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
            
        # Add extra fields if present
        if hasattr(record, 'extra') and record.extra:
            log_entry.update(record.extra)
            
        return json.dumps(log_entry)

def setup_logger(name='dalan', level=None):
    """
    Set up and configure logger
    
    Args:
        name: Logger name
        level: Log level (defaults to INFO or from environment variable)
        
    Returns:
        Configured logger
    """
    # Determine log level from environment or default to INFO
    if level is None:
        level_name = os.environ.get('LOG_LEVEL', 'INFO').upper()
        level = getattr(logging, level_name, logging.INFO)
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Clear existing handlers
    if logger.handlers:
        logger.handlers = []
    
    # Create console handler
    handler = logging.StreamHandler()
    handler.setLevel(level)
    
    # Determine format based on environment
    environment = os.environ.get('ENVIRONMENT', 'development')
    if environment == 'production':
        # JSON format for production (easier parsing in CloudWatch)
        formatter = LambdaLogFormatter()
    else:
        # More readable format for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger

# Create default application logger
logger = setup_logger()
