"""
Utility functions for handling API Gateway events and responses
"""
import json
import base64
import traceback
from typing import Dict, Any, Optional, List, Tuple, Union
from config.settings import logger

def parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse API Gateway event and extract relevant information
    
    Args:
        event: API Gateway event
        
    Returns:
        Dict containing parsed information
    """
    result = {
        "path": event.get("path", ""),
        "http_method": event.get("httpMethod", ""),
        "headers": event.get("headers", {}),
        "query_parameters": event.get("queryStringParameters", {}) or {},
        "path_parameters": event.get("pathParameters", {}) or {},
        "body": None,
        "is_base64_encoded": event.get("isBase64Encoded", False),
        "request_context": event.get("requestContext", {})
    }
    
    # Parse body if present
    body = event.get("body")
    if body:
        if result["is_base64_encoded"]:
            try:
                body = base64.b64decode(body).decode('utf-8')
            except Exception as e:
                logger.error(f"Error decoding base64 body: {e}")
                body = None
        
        # Try to parse as JSON if it looks like JSON
        if body and body.strip().startswith('{'):
            try:
                result["body"] = json.loads(body)
            except json.JSONDecodeError:
                result["body"] = body
        else:
            result["body"] = body
    
    # Extract authorization token if present
    auth_header = result["headers"].get("Authorization") or result["headers"].get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        result["token"] = auth_header[7:]  # Remove "Bearer " prefix
    else:
        result["token"] = None
    
    return result

def parse_multipart_form(event: Dict[str, Any]) -> Tuple[Dict[str, Any], Optional[bytes]]:
    """
    Parse multipart form data from API Gateway event
    
    Args:
        event: API Gateway event with multipart form data
        
    Returns:
        Tuple of (form_fields, image_data)
    """
    try:
        if not event.get("body"):
            return {}, None
            
        # Decode base64 body if needed
        body = event["body"]
        if event.get("isBase64Encoded", False):
            body = base64.b64decode(body)
        else:
            body = body.encode('utf-8')
            
        # Extract content type and boundary
        content_type = event.get("headers", {}).get("content-type") or event.get("headers", {}).get("Content-Type", "")
        if not content_type or "multipart/form-data" not in content_type:
            logger.warning(f"Invalid content type for multipart form: {content_type}")
            return {}, None
            
        boundary = None
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[9:].strip('"')
                break
                
        if not boundary:
            logger.warning("No boundary found in content type")
            return {}, None
            
        # Parse form data
        form_data = {}
        image_data = None
        
        # Split by boundary
        boundary_bytes = f"--{boundary}".encode('utf-8')
        parts = body.split(boundary_bytes)
        
        # Process each part
        for part in parts:
            if not part or part == b"--\r\n" or part == b"--":
                continue
                
            # Split headers and content
            try:
                headers_content = part.split(b"\r\n\r\n", 1)
                if len(headers_content) != 2:
                    continue
                    
                headers_bytes, content = headers_content
                headers_text = headers_bytes.decode('utf-8')
                
                # Parse headers
                headers = {}
                for header_line in headers_text.split("\r\n"):
                    if not header_line or ":" not in header_line:
                        continue
                    key, value = header_line.split(":", 1)
                    headers[key.strip().lower()] = value.strip()
                
                # Get field name and filename
                content_disposition = headers.get("content-disposition", "")
                if not content_disposition or "form-data" not in content_disposition:
                    continue
                    
                field_name = None
                filename = None
                
                for param in content_disposition.split(";"):
                    param = param.strip()
                    if param.startswith("name="):
                        field_name = param[5:].strip('"')
                    elif param.startswith("filename="):
                        filename = param[9:].strip('"')
                
                if not field_name:
                    continue
                
                # Remove trailing \r\n if present
                if content.endswith(b"\r\n"):
                    content = content[:-2]
                
                # Handle file upload
                if filename and "image" in headers.get("content-type", ""):
                    image_data = content
                    form_data["filename"] = filename
                else:
                    # Handle regular form field
                    try:
                        form_data[field_name] = content.decode('utf-8')
                    except UnicodeDecodeError:
                        form_data[field_name] = content
            except Exception as e:
                logger.error(f"Error parsing form part: {e}")
                continue
        
        return form_data, image_data
    except Exception as e:
        logger.error(f"Error parsing multipart form: {e}")
        logger.error(traceback.format_exc())
        return {}, None

def create_response(
    status_code: int = 200,
    body: Union[Dict[str, Any], List[Any], str] = None,
    headers: Optional[Dict[str, str]] = None,
    is_base64_encoded: bool = False
) -> Dict[str, Any]:
    """
    Create API Gateway response
    
    Args:
        status_code: HTTP status code
        body: Response body
        headers: Response headers
        is_base64_encoded: Whether body is base64 encoded
        
    Returns:
        API Gateway response dict
    """
    # Default headers with CORS
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    # Merge with custom headers
    if headers:
        default_headers.update(headers)
    
    # Prepare response
    response = {
        "statusCode": status_code,
        "headers": default_headers,
        "isBase64Encoded": is_base64_encoded
    }
    
    # Add body if provided
    if body is not None:
        if isinstance(body, (dict, list)):
            response["body"] = json.dumps(body)
        else:
            response["body"] = body
    
    return response

def error_response(
    status_code: int = 500,
    message: str = "Internal server error",
    error_type: str = "ServerError",
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create error response
    
    Args:
        status_code: HTTP status code
        message: Error message
        error_type: Type of error
        details: Additional error details
        
    Returns:
        API Gateway error response
    """
    error_body = {
        "error": {
            "type": error_type,
            "message": message
        }
    }
    
    if details:
        error_body["error"]["details"] = details
    
    return create_response(status_code=status_code, body=error_body)
