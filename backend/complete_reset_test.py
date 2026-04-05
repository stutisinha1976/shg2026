import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_complete_reset():
    print("=== Testing Password Reset Flow ===")
    
    # Step 1: Request password reset
    print("\n1. Requesting password reset...")
    response = requests.post(f"{BASE_URL}/auth/request-reset", json={"email": "test@example.com"})
    
    if response.status_code != 200:
        print(f"❌ Reset request failed: {response.status_code} - {response.text}")
        return
    
    result = response.json()
    if not result.get("success"):
        print(f"❌ Reset request failed: {result}")
        return
    
    reset_token = result.get("reset_token")
    print(f"✅ Reset token received: {reset_token}")
    
    # Step 2: Reset password
    print("\n2. Resetting password...")
    response = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "email": "test@example.com",
        "token": reset_token,
        "new_password": "NewPassword123!"
    })
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if response.status_code == 200 and result.get("success"):
        print("✅ Password reset successful!")
        
        # Step 3: Test login with new password
        print("\n3. Testing login with new password...")
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "NewPassword123!"
        })
        
        if response.status_code == 200:
            print("✅ Login with new password successful!")
        else:
            print(f"❌ Login with new password failed: {response.json()}")
        
        # Step 4: Test login with old password (should fail)
        print("\n4. Testing login with old password (should fail)...")
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123!"
        })
        
        if response.status_code == 401:
            print("✅ Login with old password correctly failed!")
        else:
            print(f"❌ Login with old password should have failed: {response.json()}")
    else:
        print(f"❌ Password reset failed: {result}")

def test_invalid_token():
    print("\n=== Testing Invalid Token ===")
    
    response = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "email": "test@example.com",
        "token": "invalid_token_123",
        "new_password": "SomePass123!"
    })
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if response.status_code == 400:
        print("✅ Invalid token correctly rejected!")
    else:
        print("❌ Invalid token should have been rejected")

if __name__ == "__main__":
    try:
        test_complete_reset()
        test_invalid_token()
        print("\n🎉 Password reset testing completed!")
    except Exception as e:
        print(f"❌ Error: {e}")
