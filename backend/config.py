import os
from dotenv import load_dotenv

load_dotenv()

EMBY_SERVER = os.getenv('EMBY_SERVER')
API_KEY = os.getenv('API_KEY')
IPINFO_TOKEN = os.getenv('IPINFO_TOKEN')
USER_ID = os.getenv('USER_ID')
