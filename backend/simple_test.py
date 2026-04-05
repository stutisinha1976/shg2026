import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_route():
    try:
        # Test the route exists
        response = requests.post(f"{BASE_URL}/auth/request-reset", json={"email": "test@example.com"})
        print(f"Status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 404:
            try:
                data = response.json()
                print(f"JSON Response: {data}")
            except:
                print("No JSON response")
        else:
            print("Route not found (404)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_route()
