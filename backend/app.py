from quart import Quart, jsonify, send_from_directory
import httpx
import os
from config import EMBY_SERVER, API_KEY, IPINFO_TOKEN, USER_ID
import asyncio

app = Quart(__name__, static_folder="../frontend/static", static_url_path="/static")

# In-memory cache with a dictionary
geolocation_cache = {}
cache_lock = asyncio.Lock()

async def get_geolocation(ip_address):
    async with cache_lock:
        if ip_address in geolocation_cache:
            return geolocation_cache[ip_address]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://ipinfo.io/{ip_address}/json?token={IPINFO_TOKEN}")
            if response.status_code == 200:
                geolocation_data = response.json()
                async with cache_lock:
                    geolocation_cache[ip_address] = geolocation_data
                return geolocation_data
            return {"error": "Unable to fetch geolocation"}
    except httpx.RequestError as e:
        return {"error": str(e)}

@app.route('/user_sessions/<user_id>', methods=['GET'])
async def get_user_sessions(user_id):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{EMBY_SERVER}/emby/Sessions?api_key={API_KEY}")
        if response.status_code == 200:
            sessions = response.json()
            user_sessions = [
                {**session, 'geolocation': await get_geolocation(session.get('RemoteEndPoint', '').split(':')[0])}
                for session in sessions if session['UserId'] == user_id
            ]
            return jsonify(user_sessions)
    return jsonify({'error': 'Unable to fetch sessions'}), response.status_code

@app.route('/config', methods=['GET'])
async def get_frontend_config():
    config_data = {
        'EMBY_SERVER': EMBY_SERVER,
        'API_KEY': API_KEY,
        'IPINFO_TOKEN': IPINFO_TOKEN,
        'USER_ID': USER_ID
    }
    return jsonify(config_data)

@app.route('/ipinfo/<ip>', methods=['GET'])
async def get_ipinfo(ip):
    try:
        ip_info = await get_geolocation(ip)
        return jsonify(ip_info)
    except Exception as e:
        return jsonify({"error": "Failed to fetch IP information"}), 500

@app.route('/', methods=['GET'])
async def serve_frontend():
    return await send_from_directory('../frontend', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5023, debug=True)
