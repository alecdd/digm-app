#!/usr/bin/env python3
"""
Test script to debug authentication issues
"""

import requests
import json

# Test the authentication endpoint
def test_auth():
    print("🔍 Testing AI Coach Authentication...")
    
    # Test without token (should fail)
    print("\n1. Testing without token (should fail):")
    try:
        response = requests.post(
            "http://localhost:8000/api/coach/query",
            json={"message": "test message"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test with invalid token (should fail)
    print("\n2. Testing with invalid token (should fail):")
    try:
        response = requests.post(
            "http://localhost:8000/api/coach/query",
            json={"message": "test message"},
            headers={"Authorization": "Bearer invalid_token"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test health endpoint (should work)
    print("\n3. Testing health endpoint (should work):")
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_auth()
