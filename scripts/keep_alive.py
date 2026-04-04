import os
import urllib.request
import urllib.error
from datetime import datetime
from dotenv import load_dotenv
import json

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, '.env')
load_dotenv(dotenv_path=env_path)

# Safely construct the health check URL
base_url = os.getenv("RENDER_BACKEND_URL", "").rstrip("/")
HEALTH_URL = f"{base_url}/api/health" if base_url else None

def ping_server():
    if not HEALTH_URL:
        print("❌ Error: RENDER_BACKEND_URL is not set.")
        return

    print(f"[{datetime.utcnow().isoformat()}] Pinging Health Endpoint: {HEALTH_URL}...")
    try:
        # Give Render up to 120 seconds to wake up from sleep
        req = urllib.request.Request(HEALTH_URL, headers={'User-Agent': 'Veritas-KeepAlive-Bot'})
        response = urllib.request.urlopen(req, timeout=120)
        
        if response.getcode() == 200:
            # Read and print the actual JSON response from your FastAPI backend
            data = json.loads(response.read().decode('utf-8'))
            print(f"✅ Success! Server responded with: {data['message']}")
        else:
            print(f"⚠️ Server responded with status code: {response.getcode()}")
            
    except urllib.error.HTTPError as e:
        print(f"❌ Server is awake, but returned HTTP Error: {e.code}")
    except urllib.error.URLError as e:
        print(f"❌ Failed to reach the server: {e.reason}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    ping_server()