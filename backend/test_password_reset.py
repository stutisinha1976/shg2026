import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_password_reset_flow():
    """Test complete password reset flow"""
    print("Testing Password Reset Flow...")
    
    # Step 1: Request password reset
    print("\n1. Requesting password reset...")
    data = {"email": "test@example.com"}
    
    response = requests.post(f"{BASE_URL}/auth/request-reset", json=data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if not result.get("success"):
        print("Password reset request failed")
        return
    
    # Get the reset token (only available in testing mode)
    reset_token = result.get("reset_token")
    if not reset_token:
        print("No reset token received")
        return
    
    print(f"Reset token: {reset_token}")
    
    # Step 2: Reset password
    print("\n2. Resetting password...")
    data = {
        "email": "test@example.com",
        "token": reset_token,
        "new_password": "NewSecurePass123!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/reset-password", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Step 3: Test login with new password
    print("\n3. Testing login with new password...")
    data = {
        "email": "test@example.com",
        "password": "NewSecurePass123!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Step 4: Test login with old password (should fail)
    print("\n4. Testing login with old password (should fail)...")
    data = {
        "email": "test@example.com",
        "password": "TestPass123!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_invalid_token():
    """Test password reset with invalid token"""
    print("\n\nTesting Invalid Token...")
    
    data = {
        "email": "test@example.com",
        "token": "invalid_token_123",
        "new_password": "SomePass123!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/reset-password", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    try:
        test_password_reset_flow()
        test_invalid_token()
        print("\n✓ Password reset testing completed!")
    except Exception as e:
        print(f"Error: {e}")
