#!/usr/bin/env python3
"""
Setup script for NagarVani CLIP Integration
This script helps set up the CLIP model server for automatic issue detection.
"""

import subprocess
import sys
import os
import socket

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def get_local_ip():
    """Get local IP address for network access"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

def test_model_loading():
    """Test if the CLIP model can be loaded"""
    print("🤖 Testing CLIP model loading...")
    try:
        from transformers import pipeline
        pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        print("✅ CLIP model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to load CLIP model: {e}")
        print("💡 This might be due to network issues or missing dependencies")
        return False

def create_env_file():
    """Create environment configuration file"""
    local_ip = get_local_ip()
    
    env_content = f"""# NagarVani CLIP API Configuration
CLIP_API_URL=http://{local_ip}:8000
REACT_APP_CLIP_API_URL=http://{local_ip}:8000

# For local development
LOCAL_CLIP_API_URL=http://localhost:8000
"""
    
    with open('.env.clip', 'w') as f:
        f.write(env_content)
    
    print(f"✅ Environment file created: .env.clip")
    print(f"📱 For Expo app, use IP: {local_ip}:8000")
    print(f"🌐 For web app, use: http://localhost:8000")

def main():
    """Main setup function"""
    print("🚀 NagarVani CLIP Integration Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Test model loading
    if not test_model_loading():
        print("⚠️  Model loading failed, but you can still try running the server")
    
    # Create environment file
    create_env_file()
    
    print("\n🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Start the CLIP server:")
    print("   python clip_server.py")
    print("\n2. Update your app configuration:")
    print("   - Web app: Add REACT_APP_CLIP_API_URL to your .env file")
    print("   - Expo app: Update the IP address in clipService.js")
    print("\n3. Test the integration by taking a photo in your app")
    
    local_ip = get_local_ip()
    print(f"\n🔗 API will be available at:")
    print(f"   Local: http://localhost:8000")
    print(f"   Network: http://{local_ip}:8000")

if __name__ == "__main__":
    main()