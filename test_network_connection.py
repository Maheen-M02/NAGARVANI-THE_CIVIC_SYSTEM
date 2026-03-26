#!/usr/bin/env python3
"""
Test network connectivity to help debug Expo app connection issues
"""

import socket
import requests
import subprocess
import sys

def test_server_accessibility():
    """Test if the CLIP server is accessible from different network interfaces"""
    
    print("🌐 Network Connectivity Test")
    print("=" * 40)
    
    # Test localhost
    print("1. Testing localhost access...")
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Localhost: {data['mode']} mode, Model: {data['model_loaded']}")
        else:
            print(f"   ❌ Localhost: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ Localhost: {e}")
    
    # Test network IP
    print("\n2. Testing network IP access...")
    try:
        response = requests.get('http://10.17.113.216:8000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Network IP: {data['mode']} mode, Model: {data['model_loaded']}")
        else:
            print(f"   ❌ Network IP: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ Network IP: {e}")
    
    # Test port accessibility
    print("\n3. Testing port 8000 accessibility...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('10.17.113.216', 8000))
        sock.close()
        
        if result == 0:
            print("   ✅ Port 8000 is accessible")
        else:
            print("   ❌ Port 8000 is not accessible")
    except Exception as e:
        print(f"   ❌ Port test failed: {e}")
    
    # Check Windows Firewall (if on Windows)
    print("\n4. Checking Windows Firewall...")
    try:
        result = subprocess.run(['netsh', 'advfirewall', 'show', 'allprofiles', 'state'], 
                              capture_output=True, text=True, timeout=10)
        if 'ON' in result.stdout:
            print("   ⚠️  Windows Firewall is ON - this might block connections")
            print("   💡 Try: Windows Security → Firewall → Allow an app → Python")
        else:
            print("   ✅ Windows Firewall appears to be OFF")
    except Exception as e:
        print(f"   ❓ Could not check firewall: {e}")
    
    # Network interface info
    print("\n5. Network interfaces:")
    try:
        result = subprocess.run(['ipconfig'], capture_output=True, text=True, timeout=10)
        lines = result.stdout.split('\n')
        for line in lines:
            if 'IPv4 Address' in line and '10.17.113.216' in line:
                print(f"   ✅ Found target IP: {line.strip()}")
    except Exception as e:
        print(f"   ❓ Could not get network info: {e}")
    
    print("\n📱 For Expo App Connection:")
    print("   1. Ensure your phone/emulator is on the same WiFi network")
    print("   2. Try disabling Windows Firewall temporarily")
    print("   3. Use your phone's browser to test: http://10.17.113.216:8000/health")
    print("   4. If still failing, try using your computer as a hotspot")

if __name__ == "__main__":
    test_server_accessibility()