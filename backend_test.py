import requests
import sys
from datetime import datetime

class PegaBankAPITester:
    def __init__(self, base_url="https://c22a9e69-fa5f-408b-b326-9a67f4655ee1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_workflows(self):
        """Test getting workflows"""
        success, response = self.run_test(
            "Get Workflows",
            "GET",
            "api/workflows",
            200
        )
        return success

    def test_get_cases(self):
        """Test getting cases"""
        success, response = self.run_test(
            "Get Cases",
            "GET",
            "api/cases",
            200
        )
        return success

    def test_get_reports(self):
        """Test getting reports"""
        success, response = self.run_test(
            "Get Reports",
            "GET",
            "api/reports",
            200
        )
        return success

def main():
    # Setup
    tester = PegaBankAPITester()
    
    # Test login with demo accounts
    print("\n===== Testing Authentication =====")
    admin_login = tester.test_login("admin", "admin123")
    if not admin_login:
        print("❌ Admin login failed")
    
    maker_login = tester.test_login("maker1", "maker123")
    if not maker_login:
        print("❌ Maker login failed")
    
    checker_login = tester.test_login("checker1", "checker123")
    if not checker_login:
        print("❌ Checker login failed")
    
    qc_login = tester.test_login("qc1", "qc123")
    if not qc_login:
        print("❌ QC login failed")
    
    # Test API endpoints
    print("\n===== Testing API Endpoints =====")
    tester.test_get_workflows()
    tester.test_get_cases()
    tester.test_get_reports()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())