import requests
import random
import time
from datetime import datetime
import json

# API endpoints that only read data
READ_ONLY_APIS = [
    {
        'url': 'https://zeroxarena.onrender.com/user.php',
        'method': 'GET',
        'params': ['walletaddress', 'token'],
        'description': 'Get user data'
    },
    {
        'url': 'https://zeroxarena.onrender.com/userlog/check_level_value.php',
        'method': 'GET',
        'params': ['walletaddress'],
        'description': 'Check level value'
    },
    {
        'url': 'https://zeroxarena.onrender.com/userlog/is_registered.php',
        'method': 'GET',
        'params': ['walletaddress'],
        'description': 'Check if user is registered'
    },
    {
        'url': 'https://zeroxarena.onrender.com/ShowAllTournoSimple.php',
        'method': 'GET',
        'params': [],
        'description': 'Get all tournaments'
    },
    {
        'url': 'https://zeroxarena.onrender.com/d3BackEnd.php',
        'method': 'GET',
        'params': [],
        'description': 'Get all user data'
    }
]

# Sample data for testing
SAMPLE_WALLET_ADDRESSES = [
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdef1234567890abcdef1234567890abcdef12',
    '0x7890abcdef1234567890abcdef1234567890abcd'
]

SAMPLE_TOKENS = [
    'token123',
    'token456',
    'token789'
]

def make_api_call(api):
    """Make an API call and return the response"""
    try:
        params = {}
        
        # Add required parameters
        for param in api['params']:
            if param == 'walletaddress':
                params[param] = random.choice(SAMPLE_WALLET_ADDRESSES)
            elif param == 'token':
                params[param] = random.choice(SAMPLE_TOKENS)
        
        # Make the request
        if api['method'] == 'GET':
            response = requests.get(api['url'], params=params)
        else:
            response = requests.post(api['url'], data=params)
        
        # Log the result
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        status = 'SUCCESS' if response.status_code == 200 else 'FAILED'
        
        print(f"\n[{timestamp}] {api['description']} - {status}")
        print(f"URL: {response.url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                print("Response Data:")
                print(json.dumps(response_data, indent=2))
            except json.JSONDecodeError:
                print("Response (raw):")
                print(response.text)
        else:
            print(f"Error: {response.text}")
        
        print("-" * 50)
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Error making API call: {str(e)}")
        return False

def run_api_tests(num_calls=10, delay_between_calls=2):
    """Run API tests for a specified number of times"""
    print(f"Starting API tests. Will make {num_calls} calls with {delay_between_calls} seconds delay between calls.")
    print("-" * 50)
    
    successful_calls = 0
    failed_calls = 0
    
    for i in range(num_calls):
        # Select a random API
        api = random.choice(READ_ONLY_APIS)
        
        # Make the API call
        if make_api_call(api):
            successful_calls += 1
        else:
            failed_calls += 1
        
        # Wait before next call
        if i < num_calls - 1:  # Don't wait after the last call
            time.sleep(delay_between_calls)
    
    # Print summary
    print("\nTest Summary:")
    print(f"Total Calls: {num_calls}")
    print(f"Successful: {successful_calls}")
    print(f"Failed: {failed_calls}")
    print(f"Success Rate: {(successful_calls/num_calls)*100:.2f}%")

if __name__ == "__main__":
    # You can adjust these parameters
    NUM_CALLS = 100  # Number of API calls to make
    DELAY = 0.1       # Delay between calls in seconds
    
    run_api_tests(NUM_CALLS, DELAY) 