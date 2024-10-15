# Emby Session Monitor

This project is a web application that monitors user sessions in Emby. It displays currently active and idle sessions with useful details such as the media being played, stream information, geolocation, and other relevant information.

## Features

- View currently active and idle Emby sessions.
- Display details of each session, such as client, device, media, play status, and ETA.
- Geolocation information for each session with an IP lookup using IPInfo.
- Docker support for easy deployment.
- GitHub Actions workflow to build Docker images automatically.

## Getting Started

### Prerequisites

- Python 3.x
- Docker (for containerization)

### Installation

1. Clone the repository:

   ```sh
   git clone <repository_url>
   cd emby-session-monitor
   ```

2. Create a `.env` file in the root of your project with the following environment variables:

   ```env
   EMBY_SERVER=<your_emby_server_url>
   API_KEY=<your_emby_api_key>
   IPINFO_TOKEN=<your_ipinfo_token>
   USER_ID=<your_emby_user_id>
   ```

3. Install the backend dependencies:

   ```sh
   pip install -r requirements.txt
   ```

4. Run the backend server:

   ```sh
   python app.py
   ```

### Usage

- Access the application by opening your browser and navigating to `http://localhost:5023`.

- You will see active and idle user sessions displayed, with relevant details.

## Docker Setup

1. Build and run the Docker container:

   ```sh
   docker-compose up --build
   ```

2. The application should now be available at `http://localhost:5023`.

### Docker Compose File

Create a `docker-compose.yml` file in the root directory with the following content:

```yaml
version: '3'
services:
  emby-session-monitor:
    build: .
    ports:
      - "5023:5023"
    env_file:
      - .env
```

## GitHub Actions and Docker Deployment

- This project uses GitHub Actions for Continuous Integration (CI).
- GitHub Secrets are used to securely store `.env` variables.
- Whenever a commit is pushed, the Docker image is built and can also be triggered manually.

## File Structure

- `app.py`: The backend server using Flask.
- `backend/`: Contains backend configuration files such as `config.py`.
- `frontend/`: Contains all the frontend assets and JavaScript code.
- `.env`: Contains environment variables (not included in version control).
- `Dockerfile`: Docker instructions to containerize the app.
- `docker-compose.yml`: Configuration to set up Docker services.
- `.github/workflows/`: Contains GitHub Actions workflow files.

## Contributing

Feel free to open issues and submit pull requests if you would like to contribute.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Emby](https://emby.media/) for media server.
- [IPInfo](https://ipinfo.io/) for IP geolocation data.

## Contact

For any questions, feel free to reach out:

- [Your Name]
- [Your Email Address]

---
Thank you for using Emby Session Monitor!