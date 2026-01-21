#!/usr/bin/env python3
"""
Weather Station API Testing Suite
Tests all backend endpoints for the weather app with Weather Underground integration
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class WeatherAPITester:
    def __init__(self, base_url: str = "https://clima-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.timeout = 30

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})
        print()

    def test_root_endpoint(self) -> bool:
        """Test GET /api/ - Root endpoint with station info"""
        try:
            response = self.session.get(f"{self.api_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "station_id" in data:
                    self.log_test("Root Endpoint", True, f"Station ID: {data.get('station_id')}")
                    return True
                else:
                    self.log_test("Root Endpoint", False, "Missing required fields in response")
                    return False
            else:
                self.log_test("Root Endpoint", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_current_weather(self) -> bool:
        """Test GET /api/weather/current - Current weather conditions"""
        try:
            response = self.session.get(f"{self.api_url}/weather/current")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and "data" in data:
                    weather_data = data["data"]
                    # Check for key weather metrics
                    has_temp = weather_data.get("temp_c") is not None
                    has_humidity = weather_data.get("humidity") is not None
                    has_pressure = weather_data.get("pressure_mb") is not None
                    
                    if has_temp and has_humidity:
                        self.log_test("Current Weather", True, 
                                    f"Temp: {weather_data.get('temp_c')}°C, Humidity: {weather_data.get('humidity')}%")
                        return True
                    else:
                        self.log_test("Current Weather", False, "Missing essential weather data")
                        return False
                else:
                    self.log_test("Current Weather", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Current Weather", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Current Weather", False, f"Exception: {str(e)}")
            return False

    def test_weather_history(self) -> bool:
        """Test GET /api/weather/history - Historical weather data"""
        try:
            # Test with last 2 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=1)
            
            start_str = start_date.strftime("%Y%m%d")
            end_str = end_date.strftime("%Y%m%d")
            
            response = self.session.get(
                f"{self.api_url}/weather/history",
                params={"start_date": start_str, "end_date": end_str}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and "data" in data:
                    observations = data["data"]
                    count = data.get("count", 0)
                    self.log_test("Weather History", True, 
                                f"Retrieved {count} observations for {start_str}-{end_str}")
                    return True
                else:
                    self.log_test("Weather History", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Weather History", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Weather History", False, f"Exception: {str(e)}")
            return False

    def test_weather_statistics(self) -> bool:
        """Test GET /api/weather/statistics - Weather statistics"""
        try:
            # Test with last 2 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=1)
            
            start_str = start_date.strftime("%Y%m%d")
            end_str = end_date.strftime("%Y%m%d")
            
            response = self.session.get(
                f"{self.api_url}/weather/statistics",
                params={"start_date": start_str, "end_date": end_str}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    stats = data.get("statistics")
                    if stats:
                        self.log_test("Weather Statistics", True, 
                                    f"Stats: {stats.get('observation_count', 0)} observations")
                        return True
                    else:
                        self.log_test("Weather Statistics", True, "No data for period (expected)")
                        return True
                else:
                    self.log_test("Weather Statistics", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Weather Statistics", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Weather Statistics", False, f"Exception: {str(e)}")
            return False

    def test_excel_export(self) -> bool:
        """Test GET /api/weather/export/excel - Excel export functionality"""
        try:
            # Test with last 2 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=1)
            
            start_str = start_date.strftime("%Y%m%d")
            end_str = end_date.strftime("%Y%m%d")
            
            response = self.session.get(
                f"{self.api_url}/weather/export/excel",
                params={"start_date": start_str, "end_date": end_str}
            )
            
            if response.status_code == 200:
                # Check if response is Excel file
                content_type = response.headers.get('content-type', '')
                if 'spreadsheet' in content_type or 'excel' in content_type:
                    file_size = len(response.content)
                    self.log_test("Excel Export", True, f"Excel file generated ({file_size} bytes)")
                    return True
                else:
                    self.log_test("Excel Export", False, f"Wrong content type: {content_type}")
                    return False
            elif response.status_code == 404:
                self.log_test("Excel Export", True, "No data for period (expected)")
                return True
            else:
                self.log_test("Excel Export", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Excel Export", False, f"Exception: {str(e)}")
            return False

    def test_last_24h_endpoint(self) -> bool:
        """Test GET /api/weather/last24h - Last 24 hours data"""
        try:
            response = self.session.get(f"{self.api_url}/weather/last24h")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and "data" in data:
                    count = data.get("count", 0)
                    self.log_test("Last 24h Data", True, f"Retrieved {count} observations")
                    return True
                else:
                    self.log_test("Last 24h Data", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Last 24h Data", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Last 24h Data", False, f"Exception: {str(e)}")
            return False

    def test_station_info(self) -> bool:
        """Test GET /api/station/info - Station information"""
        try:
            response = self.session.get(f"{self.api_url}/station/info")
            
            if response.status_code == 200:
                data = response.json()
                if "station_id" in data and "api_configured" in data:
                    api_configured = data.get("api_configured", False)
                    station_id = data.get("station_id", "")
                    self.log_test("Station Info", True, 
                                f"Station: {station_id}, API configured: {api_configured}")
                    return True
                else:
                    self.log_test("Station Info", False, "Missing required fields")
                    return False
            else:
                self.log_test("Station Info", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Station Info", False, f"Exception: {str(e)}")
            return False

    def test_invalid_date_format(self) -> bool:
        """Test error handling for invalid date formats"""
        try:
            response = self.session.get(
                f"{self.api_url}/weather/history",
                params={"start_date": "invalid", "end_date": "invalid"}
            )
            
            if response.status_code == 400:
                self.log_test("Invalid Date Format", True, "Correctly rejected invalid dates")
                return True
            else:
                self.log_test("Invalid Date Format", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Date Format", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("🧪 Starting Weather Station API Tests")
        print("=" * 50)
        print(f"Testing API at: {self.api_url}")
        print()

        # Run all tests
        tests = [
            self.test_root_endpoint,
            self.test_station_info,
            self.test_current_weather,
            self.test_weather_history,
            self.test_weather_statistics,
            self.test_excel_export,
            self.test_last_24h_endpoint,
            self.test_invalid_date_format
        ]

        for test in tests:
            test()

        # Summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": len(self.failed_tests),
            "success_rate": success_rate,
            "failures": self.failed_tests
        }

def main():
    """Main test runner"""
    tester = WeatherAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())