"""
auth.py — Authentication system with JWT for SHG APEX Platform
"""
import os
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
import re
from email_validator import validate_email, EmailNotValidError
from database import UserOperations, JWTUtils, User

def validate_email_format(email: str) -> bool:
    """Validate email format"""
    try:
        # Simple regex validation for email format
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    except:
        return False

def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength
    
    Returns:
        Dictionary with validation result and message
    """
    if len(password) < 8:
        return {"valid": False, "message": "Password must be at least 8 characters long"}
    
    if not re.search(r"[A-Z]", password):
        return {"valid": False, "message": "Password must contain at least one uppercase letter"}
    
    if not re.search(r"[a-z]", password):
        return {"valid": False, "message": "Password must contain at least one lowercase letter"}
    
    if not re.search(r"\d", password):
        return {"valid": False, "message": "Password must contain at least one digit"}
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return {"valid": False, "message": "Password must contain at least one special character"}
    
    return {"valid": True, "message": "Password is strong"}

def generate_token_response(user_id: str, email: str) -> Dict[str, Any]:
    """Generate JWT token response"""
    token = JWTUtils.generate_token(user_id, email)
    return {
        "success": True,
        "token": token,
        "user_id": user_id,
        "email": email,
        "message": "Authentication successful"
    }

def authenticate_user(email: str, password: str) -> Dict[str, Any]:
    """
    Authenticate user with email and password
    
    Returns:
        Dictionary with authentication result
    """
    # Validate email format
    if not validate_email_format(email):
        return {"success": False, "message": "Invalid email format"}
    
    # Get user from database
    user = UserOperations.get_user_by_email(email)
    if not user:
        return {"success": False, "message": "Invalid email or password"}
    
    # Check if user is active
    if not user.is_active:
        return {"success": False, "message": "Account is deactivated"}
    
    # Verify password
    if not User.verify_password(password, user.password_hash):
        return {"success": False, "message": "Invalid email or password"}
    
    # Update last login
    UserOperations.update_last_login(str(user._id))
    
    # Generate token
    return generate_token_response(str(user._id), email)

def register_user(email: str, password: str, name: str = None) -> Dict[str, Any]:
    """
    Register new user
    
    Returns:
        Dictionary with registration result
    """
    # Validate email format
    if not validate_email_format(email):
        return {"success": False, "message": "Invalid email format"}
    
    # Validate password strength
    password_validation = validate_password_strength(password)
    if not password_validation["valid"]:
        return {"success": False, "message": password_validation["message"]}
    
    # Check if user already exists
    existing_user = UserOperations.get_user_by_email(email)
    if existing_user:
        return {"success": False, "message": "Email already registered"}
    
    # Create new user
    try:
        user = User(email, password, name)
        user_id = UserOperations.create_user(user)
        
        # Generate token
        return generate_token_response(user_id, email)
        
    except Exception as e:
        return {"success": False, "message": f"Registration failed: {str(e)}"}

def get_current_user() -> Dict[str, Any]:
    """
    Get current authenticated user from request
    
    Returns:
        Dictionary with user data or error
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return {"success": False, "message": "Missing authorization header"}
    
    # Extract token from "Bearer <token>"
    try:
        token = auth_header.split(' ')[1]
    except IndexError:
        return {"success": False, "message": "Invalid authorization header format"}
    
    # Verify token
    payload = JWTUtils.verify_token(token)
    if not payload:
        return {"success": False, "message": "Invalid or expired token"}
    
    # Get user from database
    user = UserOperations.get_user_by_id(payload["user_id"])
    if not user or not user.is_active:
        return {"success": False, "message": "User not found or inactive"}
    
    return {
        "success": True,
        "user_id": str(user._id),
        "email": user.email,
        "name": user.name
    }

# Decorator for protected routes
def token_required(f):
    """
    Decorator to require JWT token for API endpoints
    
    Usage:
        @token_required
        def protected_route():
            # Your code here
            pass
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get current user
        user_result = get_current_user()
        
        if not user_result["success"]:
            return jsonify(user_result), 401
        
        # Add user data to request context
        request.current_user = user_result
        return f(*args, **kwargs)
    
    return decorated

# Decorator for optional authentication (guest access allowed)
def optional_token(f):
    """
    Decorator for optional authentication - allows guest access
    but provides user data if token is provided
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Try to get current user, but don't fail if not authenticated
        user_result = get_current_user()
        request.current_user = user_result
        return f(*args, **kwargs)
    
    return decorated

# Utility functions for user management
def update_user_profile(user_id: str, name: str = None) -> Dict[str, Any]:
    """Update user profile"""
    try:
        user = UserOperations.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}
        
        if name:
            user.name = name
            user.updated_at = datetime.now(timezone.utc)
        
        # Update in database
        from database import get_users_collection
        collection = get_users_collection()
        collection.update_one(
            {"_id": user._id},
            {"$set": {
                "name": user.name,
                "updated_at": user.updated_at
            }}
        )
        
        return {"success": True, "message": "Profile updated successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Update failed: {str(e)}"}

def change_password(user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
    """Change user password"""
    try:
        user = UserOperations.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Verify current password
        if not User.verify_password(current_password, user.password_hash):
            return {"success": False, "message": "Current password is incorrect"}
        
        # Validate new password
        password_validation = validate_password_strength(new_password)
        if not password_validation["valid"]:
            return {"success": False, "message": password_validation["message"]}
        
        # Update password
        user.password_hash = user._hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)
        
        # Update in database
        from database import get_users_collection
        collection = get_users_collection()
        collection.update_one(
            {"_id": user._id},
            {"$set": {
                "password_hash": user.password_hash,
                "updated_at": user.updated_at
            }}
        )
        
        return {"success": True, "message": "Password changed successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Password change failed: {str(e)}"}

def delete_user_account(user_id: str, password: str) -> Dict[str, Any]:
    """Delete user account and all associated data"""
    try:
        user = UserOperations.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Verify password
        if not User.verify_password(password, user.password_hash):
            return {"success": False, "message": "Password is incorrect"}
        
        # Delete user data
        from database import ChatOperations, AnalysisOperations
        
        # Delete chat history
        ChatOperations.delete_user_chat_history(user_id)
        
        # Delete analysis results
        AnalysisOperations.delete_user_analyses(user_id)
        
        # Delete user
        from database import get_users_collection
        collection = get_users_collection()
        collection.delete_one({"_id": user._id})
        
        return {"success": True, "message": "Account deleted successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Account deletion failed: {str(e)}"}

# Password reset functionality
import secrets
import string

def generate_reset_token() -> str:
    """Generate a secure password reset token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def store_reset_token(email: str, token: str) -> Dict[str, Any]:
    """Store password reset token in database (simplified version)"""
    try:
        # In a production environment, you'd store this in a separate collection with expiration
        # For now, we'll use a simple approach with the user document
        user = UserOperations.get_user_by_email(email)
        if not user:
            return {"success": False, "message": "Email not found"}
        
        # Store reset token and expiration (24 hours)
        from database import get_users_collection
        collection = get_users_collection()
        collection.update_one(
            {"_id": user._id},
            {"$set": {
                "reset_token": token,
                "reset_token_expires": datetime.now(timezone.utc) + timedelta(hours=24)
            }}
        )
        
        return {"success": True, "message": "Reset token stored"}
        
    except Exception as e:
        return {"success": False, "message": f"Failed to store reset token: {str(e)}"}

def request_password_reset(email: str) -> Dict[str, Any]:
    """Request password reset"""
    # Validate email format
    if not validate_email_format(email):
        return {"success": False, "message": "Invalid email format"}
    
    # Check if user exists
    user = UserOperations.get_user_by_email(email)
    if not user:
        # Don't reveal if email exists or not for security
        return {"success": True, "message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    
    # Store token
    token_result = store_reset_token(email, reset_token)
    if not token_result["success"]:
        return {"success": False, "message": "Failed to generate reset token"}
    
    # In a production environment, you'd send an email here
    # For now, we'll just return the token for testing
    return {
        "success": True, 
        "message": "Password reset token generated (in production, this would be emailed)",
        "reset_token": reset_token  # Only for testing - remove in production
    }

def verify_reset_token(email: str, token: str) -> Dict[str, Any]:
    """Verify password reset token"""
    try:
        user = UserOperations.get_user_by_email(email)
        if not user:
            return {"success": False, "message": "Invalid email or token"}
        
        # Check if token exists and is not expired
        if not hasattr(user, 'reset_token') or not user.reset_token:
            return {"success": False, "message": "No reset token found"}
        
        if user.reset_token != token:
            return {"success": False, "message": "Invalid token"}
        
        if hasattr(user, 'reset_token_expires'):
            if datetime.now(timezone.utc) > user.reset_token_expires:
                return {"success": False, "message": "Token has expired"}
        
        return {"success": True, "message": "Token is valid"}
        
    except Exception as e:
        return {"success": False, "message": f"Token verification failed: {str(e)}"}

def reset_password(email: str, token: str, new_password: str) -> Dict[str, Any]:
    """Reset password with token"""
    # Verify token first
    token_result = verify_reset_token(email, token)
    if not token_result["success"]:
        return token_result
    
    # Validate new password
    password_validation = validate_password_strength(new_password)
    if not password_validation["valid"]:
        return {"success": False, "message": password_validation["message"]}
    
    try:
        user = UserOperations.get_user_by_email(email)
        if not user:
            return {"success": False, "message": "User not found"}
        
        # Update password
        user.password_hash = user._hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)
        
        # Clear reset token
        from database import get_users_collection
        collection = get_users_collection()
        collection.update_one(
            {"_id": user._id},
            {
                "$set": {
                    "password_hash": user.password_hash,
                    "updated_at": user.updated_at
                },
                "$unset": {
                    "reset_token": "",
                    "reset_token_expires": ""
                }
            }
        )
        
        return {"success": True, "message": "Password reset successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Password reset failed: {str(e)}"}
