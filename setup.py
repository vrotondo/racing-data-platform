#!/usr/bin/env python3
"""
Setup script for Racing Data Platform
Creates necessary directories and checks dependencies
"""

import os
import sys
from pathlib import Path
import subprocess


def create_directory_structure():
    """Create all necessary directories for the project"""
    directories = [
        "data/raw",
        "data/processed",
        "data/models",
        "backend/api",
        "backend/core",
        "backend/ml",
        "backend/utils",
        "backend/tests",
        "frontend/src/components/Dashboard",
        "frontend/src/components/Charts",
        "frontend/src/components/Strategy",
        "frontend/src/pages",
        "frontend/src/services",
        "scripts",
        "docs",
        "notebooks",
    ]
    
    print("📁 Creating directory structure...")
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {directory}")
    
    # Create .gitkeep file in data/raw to preserve the directory
    gitkeep = Path("data/raw") / ".gitkeep"
    gitkeep.touch()


def check_python_version():
    """Check if Python version is compatible"""
    print("\n🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("  ❌ Python 3.9+ is required")
        print(f"  Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"  ✓ Python {version.major}.{version.minor}.{version.micro}")
    return True


def create_virtual_environment():
    """Create Python virtual environment"""
    print("\n🔧 Creating virtual environment...")
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("  ⚠ Virtual environment already exists")
        return True
    
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("  ✓ Virtual environment created")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Failed to create virtual environment: {e}")
        return False


def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Determine pip path
    if sys.platform == "win32":
        pip_path = Path("venv/Scripts/pip")
    else:
        pip_path = Path("venv/bin/pip")
    
    if not pip_path.exists():
        print("  ⚠ Virtual environment not found. Run setup again.")
        return False
    
    try:
        subprocess.run(
            [str(pip_path), "install", "-r", "requirements.txt"],
            check=True,
            capture_output=True
        )
        print("  ✓ Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Failed to install dependencies: {e}")
        return False


def create_env_file():
    """Create .env file from example"""
    print("\n⚙️  Setting up configuration...")
    
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("  ⚠ .env file already exists")
        return True
    
    if env_example.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("  ✓ Created .env file from template")
        return True
    else:
        print("  ⚠ .env.example not found")
        return False


def print_next_steps():
    """Print instructions for next steps"""
    print("\n" + "="*60)
    print("🏁 Setup Complete!")
    print("="*60)
    print("\nNext steps:")
    print("\n1. Activate virtual environment:")
    if sys.platform == "win32":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\n2. Add your racing data to:")
    print("   Move your track folders (e.g., barber-motorsports-park,")
    print("   circuit-of-the-americas, sonoma) into:")
    print("   - data/raw/")
    print("\n   Example:")
    print("   data/raw/barber-motorsports-park/")
    print("   data/raw/circuit-of-the-americas/")
    print("   data/raw/sonoma/")
    
    print("\n3. Start the backend:")
    print("   cd backend")
    print("   python main.py")
    
    print("\n4. Open http://localhost:8000/docs to test the API")
    
    print("\n5. Read DATA_SETUP_GUIDE.md for detailed instructions")
    print("\n" + "="*60)


def main():
    """Main setup function"""
    print("🏎️  Racing Data Platform - Setup")
    print("="*60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    create_directory_structure()
    
    # Create virtual environment
    if not create_virtual_environment():
        print("\n⚠️  Could not create virtual environment automatically.")
        print("   Please create it manually: python -m venv venv")
    
    # Install dependencies
    if Path("requirements.txt").exists():
        response = input("\n📦 Install dependencies now? (y/n): ")
        if response.lower() == 'y':
            install_dependencies()
    else:
        print("\n⚠️  requirements.txt not found. Skipping dependency installation.")
    
    # Create .env file
    create_env_file()
    
    # Print next steps
    print_next_steps()


if __name__ == "__main__":
    main()