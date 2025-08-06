from flask import jsonify
from datetime import datetime, date
import decimal
import uuid

def success_response(data=None, message="Success", status_code=200):
    """Create a standardized success response"""
    response = {
        'success': True,
        'message': message,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    if data is not None:
        response['data'] = serialize_data(data)
    
    return jsonify(response), status_code

def error_response(message="An error occurred", status_code=400, error_code=None, details=None):
    """Create a standardized error response"""
    response = {
        'success': False,
        'error': {
            'message': message,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    }
    
    if error_code:
        response['error']['code'] = error_code
    
    if details:
        response['error']['details'] = details
    
    return jsonify(response), status_code

def serialize_data(data):
    """Serialize data for JSON response, handling special types"""
    if isinstance(data, list):
        return [serialize_data(item) for item in data]
    
    if isinstance(data, dict):
        return {key: serialize_data(value) for key, value in data.items()}
    
    if isinstance(data, (datetime, date)):
        return data.isoformat()
    
    if isinstance(data, decimal.Decimal):
        return float(data)
    
    if isinstance(data, uuid.UUID):
        return str(data)
    
    return data

def paginated_response(data, page, per_page, total, message="Success"):
    """Create a paginated response"""
    return success_response({
        'items': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'has_next': page * per_page < total,
            'has_prev': page > 1
        }
    }, message)