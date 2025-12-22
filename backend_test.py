#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import time

class Layer7StresserAPITester:
    def __init__(self, base_url="https://layer7-stress-test.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.api_key = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if headers:
            req_headers.update(headers)
        
        if self.token and 'Authorization' not in req_headers:
            req_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, response.status_code, response_data

        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, status, data = self.make_request('GET', '')
        expected_message = "Layer 7 Stresser API"
        
        if success and expected_message in data.get('message', ''):
            self.log_test("Root API Endpoint", True, f"Status: {status}, Message: {data.get('message')}")
        else:
            self.log_test("Root API Endpoint", False, f"Status: {status}, Response: {data}")

    def test_get_plans(self):
        """Test get plans endpoint"""
        success, status, data = self.make_request('GET', 'plans')
        
        if success and isinstance(data, list) and len(data) > 0:
            plan_names = [p.get('name') for p in data]
            self.log_test("Get Plans", True, f"Found {len(data)} plans: {plan_names}")
            return True
        else:
            self.log_test("Get Plans", False, f"Status: {status}, Response: {data}")
            return False

    def test_get_methods(self):
        """Test get attack methods endpoint"""
        success, status, data = self.make_request('GET', 'methods')
        
        if success and isinstance(data, list) and len(data) > 0:
            method_names = [m.get('name') for m in data]
            self.log_test("Get Attack Methods", True, f"Found {len(data)} methods: {method_names}")
            return True
        else:
            self.log_test("Get Attack Methods", False, f"Status: {status}, Response: {data}")
            return False

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "username": f"testuser_{timestamp}",
            "password": "TestPass123!",
            "telegram_id": f"@testuser_{timestamp}"
        }
        
        success, status, data = self.make_request('POST', 'auth/register', test_data, expected_status=200)
        
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_id = data['user']['id']
            self.api_key = data['user'].get('api_key')
            self.log_test("User Registration", True, f"User ID: {self.user_id}, Plan: {data['user']['plan']}")
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {data}")
            return False

    def test_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            self.log_test("User Login", False, "No user registered for login test")
            return False
            
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "username": f"testuser_{timestamp}",
            "password": "TestPass123!"
        }
        
        success, status, data = self.make_request('POST', 'auth/login', test_data, expected_status=200)
        
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.log_test("User Login", True, f"Login successful for user: {data['user']['username']}")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {data}")
            return False

    def test_get_me(self):
        """Test get current user info"""
        if not self.token:
            self.log_test("Get User Info", False, "No token available")
            return False
            
        success, status, data = self.make_request('GET', 'auth/me')
        
        if success and 'id' in data and 'username' in data:
            self.log_test("Get User Info", True, f"User: {data['username']}, Plan: {data.get('plan')}")
            return True
        else:
            self.log_test("Get User Info", False, f"Status: {status}, Response: {data}")
            return False

    def test_regenerate_api_key(self):
        """Test API key regeneration"""
        if not self.token:
            self.log_test("Regenerate API Key", False, "No token available")
            return False
            
        success, status, data = self.make_request('POST', 'auth/regenerate-key')
        
        if success and 'api_key' in data:
            self.api_key = data['api_key']
            self.log_test("Regenerate API Key", True, f"New API key generated: {data['api_key'][:20]}...")
            return True
        else:
            self.log_test("Regenerate API Key", False, f"Status: {status}, Response: {data}")
            return False

    def test_create_attack(self):
        """Test creating an attack"""
        if not self.token:
            self.log_test("Create Attack", False, "No token available")
            return False
            
        attack_data = {
            "target": "httpbin.org",
            "port": 80,
            "method": "HTTP-GET",
            "duration": 30,
            "concurrents": 1
        }
        
        success, status, data = self.make_request('POST', 'attacks', attack_data, expected_status=200)
        
        if success and 'id' in data and data.get('status') == 'running':
            attack_id = data['id']
            self.log_test("Create Attack", True, f"Attack started with ID: {attack_id}")
            
            # Test stopping the attack
            time.sleep(2)  # Wait a bit before stopping
            stop_success, stop_status, stop_data = self.make_request('POST', f'attacks/{attack_id}/stop')
            
            if stop_success:
                self.log_test("Stop Attack", True, "Attack stopped successfully")
            else:
                self.log_test("Stop Attack", False, f"Status: {stop_status}, Response: {stop_data}")
            
            return True
        else:
            self.log_test("Create Attack", False, f"Status: {status}, Response: {data}")
            return False

    def test_get_attacks(self):
        """Test getting attack history"""
        if not self.token:
            self.log_test("Get Attack History", False, "No token available")
            return False
            
        success, status, data = self.make_request('GET', 'attacks')
        
        if success and isinstance(data, list):
            self.log_test("Get Attack History", True, f"Found {len(data)} attacks in history")
            return True
        else:
            self.log_test("Get Attack History", False, f"Status: {status}, Response: {data}")
            return False

    def test_get_running_attacks(self):
        """Test getting running attacks"""
        if not self.token:
            self.log_test("Get Running Attacks", False, "No token available")
            return False
            
        success, status, data = self.make_request('GET', 'attacks/running')
        
        if success and isinstance(data, list):
            self.log_test("Get Running Attacks", True, f"Found {len(data)} running attacks")
            return True
        else:
            self.log_test("Get Running Attacks", False, f"Status: {status}, Response: {data}")
            return False

    def test_api_key_attack(self):
        """Test API key based attack"""
        if not self.api_key:
            self.log_test("API Key Attack", False, "No API key available")
            return False
            
        attack_data = {
            "target": "httpbin.org",
            "port": 80,
            "method": "HTTP-GET",
            "duration": 20,
            "concurrents": 1
        }
        
        headers = {'X-API-Key': self.api_key}
        success, status, data = self.make_request('POST', 'v1/attack', attack_data, headers=headers, expected_status=403)
        
        # Free plan users should get 403 for API access
        if status == 403:
            self.log_test("API Key Attack (Free Plan)", True, "Correctly blocked API access for free plan")
            return True
        else:
            self.log_test("API Key Attack", False, f"Status: {status}, Response: {data}")
            return False

    def test_checkout_invalid_plan(self):
        """Test checkout with invalid plan"""
        if not self.token:
            self.log_test("Checkout Invalid Plan", False, "No token available")
            return False
            
        checkout_data = {
            "plan_id": "invalid_plan",
            "origin_url": "https://example.com"
        }
        
        success, status, data = self.make_request('POST', 'checkout', checkout_data, expected_status=400)
        
        if status == 400:
            self.log_test("Checkout Invalid Plan", True, "Correctly rejected invalid plan")
            return True
        else:
            self.log_test("Checkout Invalid Plan", False, f"Status: {status}, Response: {data}")
            return False

    def test_admin_endpoints_unauthorized(self):
        """Test admin endpoints without admin privileges"""
        if not self.token:
            self.log_test("Admin Unauthorized", False, "No token available")
            return False
            
        success, status, data = self.make_request('GET', 'admin/users', expected_status=403)
        
        if status == 403:
            self.log_test("Admin Unauthorized", True, "Correctly blocked non-admin access")
            return True
        else:
            self.log_test("Admin Unauthorized", False, f"Status: {status}, Response: {data}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Layer 7 Stresser API Tests")
        print("=" * 50)
        
        # Basic endpoint tests
        self.test_root_endpoint()
        self.test_get_plans()
        self.test_get_methods()
        
        # Authentication tests
        if self.test_register():
            self.test_get_me()
            self.test_regenerate_api_key()
            
            # Attack tests
            self.test_create_attack()
            self.test_get_attacks()
            self.test_get_running_attacks()
            
            # API key tests
            self.test_api_key_attack()
            
            # Payment tests
            self.test_checkout_invalid_plan()
            
            # Admin tests
            self.test_admin_endpoints_unauthorized()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            return 1

def main():
    tester = Layer7StresserAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())