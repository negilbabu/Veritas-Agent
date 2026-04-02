import os
import urllib.request
import urllib.error
from datetime import datetime
from dotenv import load_dotenv

# Find the absolute path to the root directory (one level up from /scripts)
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, '.env')

# Load the .env file if it exists (for local testing)
load_dotenv(dotenv_path=env_path)

# Fetch the URL from the environment (either .env or GitHub Secrets)
BACKEND_URL = os.getenv("RENDER_BACKEND_URL")

def ping_server():
    if not BACKEND_URL:
        print("❌ Error: RENDER_BACKEND_URL is not set.")
        return

    print(f"[{datetime.utcnow().isoformat()}] Pinging {BACKEND_URL}...")
    try:
        # A simple GET request to wake the server
        # We add a timeout so the script doesn't hang forever
        response = urllib.request.urlopen(BACKEND_URL, timeout=10)
        if response.getcode() == 200:
            print("✅ Server is awake and responded with 200 OK.")
        else:
            print(f"⚠️ Server responded with status code: {response.getcode()}")
    except urllib.error.URLError as e:
        print(f"❌ Failed to reach the server: {e.reason}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    ping_server()