from gevent import monkey
monkey.patch_all()
from flask import Flask, jsonify, send_from_directory
import httpx
import os
from config import EMBY_SERVER, API_KEY, IPINFO_TOKEN, USER_ID
from functools import lru_cache
import asyncio

app = Flask(__name__, static_folder="../frontend/static", static_url_path="/static")

@lru_cache(maxsize=100)
async def get_geolocation(ip_address):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://ipinfo.io/{ip_address}/json?token={IPINFO_TOKEN}")
            if response.status_code == 200:
                return response.json()
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
def get_frontend_config():
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
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5023, debug=True)
