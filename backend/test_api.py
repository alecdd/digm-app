#!/usr/bin/env python3
"""
Simple test script for the Digm AI Coach API
Run this after starting the backend server
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
TEST_MESSAGE = "I need help staying motivated with my goals"

def test_health_endpoints():
    """Test health check endpoints"""
    print("🔍 Testing health endpoints...")
    
    try:
        # Test root endpoint
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
        
        # Test health endpoint
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health endpoint: {response.status_code} - {response.json()}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing health endpoints: {e}")
        return False
    
    return True

def test_coach_endpoint_without_auth():
    """Test coach endpoint without authentication (should fail)"""
    print("\n🔍 Testing coach endpoint without authentication...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/coach/query",
            json={"message": TEST_MESSAGE}
        )
        print(f"✅ Coach endpoint (no auth): {response.status_code} - {response.json()}")
        
    except Exception as e:
        print(f"❌ Error testing coach endpoint: {e}")
        return False
    
    return True

def test_embeddings_endpoint_without_auth():
    """Test embeddings endpoint without authentication (should fail)"""
    print("\n🔍 Testing embeddings endpoint without authentication...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/embeddings/generate",
            json={"user_id": "test-user-id"}
        )
        print(f"✅ Embeddings endpoint (no auth): {response.status_code} - {response.json()}")
        
    except Exception as e:
        print(f"❌ Error testing embeddings endpoint: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Testing Digm AI Coach API")
    print("=" * 40)
    
    # Test health endpoints
    if not test_health_endpoints():
        print("\n❌ Health check failed. Server may not be running.")
        return
    
    # Test protected endpoints (should return 401)
    test_coach_endpoint_without_auth()
    test_embeddings_endpoint_without_auth()
    
    print("\n" + "=" * 40)
    print("✅ Basic API tests completed!")
    print("\n📝 Next steps:")
    print("1. Set up your .env file with OpenAI and Supabase credentials")
    print("2. Test with a real JWT token from your React Native app")
    print("3. Enable pgvector in Supabase for vector search")
    print("4. Deploy to production when ready")

if __name__ == "__main__":
    main()
