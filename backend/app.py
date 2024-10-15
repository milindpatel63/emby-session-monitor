from flask import Flask, jsonify, send_from_directory
import requests
import os
from config import EMBY_SERVER, API_KEY, IPINFO_TOKEN, USER_ID

app = Flask(__name__, static_folder="../frontend/static", static_url_path="/static")

def get_geolocation(ip_address):
    try:
        response = requests.get(f"https://ipinfo.io/{ip_address}/json?token={IPINFO_TOKEN}")
        if response.status_code == 200:
            return response.json()
        return {"error": "Unable to fetch geolocation"}
    except Exception as e:
        return {"error": str(e)}

@app.route('/user_sessions/<user_id>', methods=['GET'])
def get_user_sessions(user_id):
    response = requests.get(f"{EMBY_SERVER}/emby/Sessions?api_key={API_KEY}")
    if response.status_code == 200:
        sessions = response.json()
        user_sessions = [
            {**session, 'geolocation': get_geolocation(session.get('RemoteEndPoint', '').split(':')[0])}
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

@app.route('/', methods=['GET'])
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5023, debug=True)