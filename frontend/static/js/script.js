document.addEventListener("DOMContentLoaded", () => {
    fetch('/config')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch configuration');
            }
            return response.json();
        })
        .then(config => {
            if (!config.EMBY_SERVER || !config.API_KEY || !config.IPINFO_TOKEN || !config.USER_ID) {
                alert("Configuration could not be loaded properly. Please check the server.");
                return;
            }

            const { EMBY_SERVER: baseUrl, API_KEY: apiKey, IPINFO_TOKEN: ipInfoToken, USER_ID: userId } = config;

            fetchUserSessions(userId, baseUrl, apiKey, ipInfoToken);
            // Uncomment this line to fetch user sessions every 30 seconds
            setInterval(() => fetchUserSessions(userId, baseUrl, apiKey, ipInfoToken), 30000);

        })
        .catch(() => {
            alert("An error occurred while fetching the configuration. Please check the console for details.");
        });
});

function fetchUserSessions(userId, baseUrl, apiKey, ipInfoToken) {
    fetch(`/user_sessions/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user sessions');
            }
            return response.json();
        })
        .then(sessions => {
            const activeContainer = document.getElementById('active-sessions-container');
            const idleContainer = document.getElementById('idle-sessions-container');
            activeContainer.innerHTML = '';
            idleContainer.innerHTML = '';

            if (!Array.isArray(sessions) || sessions.length === 0) {
                return;
            }

            sessions.forEach(session => {
                const sessionDiv = document.createElement('div');
                sessionDiv.className = 'session-card';

                let thumbnailUrl = "";
                if (session.NowPlayingItem) {
                    if (session.NowPlayingItem.Type === 'Episode') {
                        thumbnailUrl = `${baseUrl}/Items/${session.NowPlayingItem.SeriesId}/Images/Primary?quality=90&api_key=${apiKey}`;
                    } else if (session.NowPlayingItem.Type === 'Movie') {
                        thumbnailUrl = `${baseUrl}/Items/${session.NowPlayingItem.Id}/Images/Primary?quality=90&api_key=${apiKey}`;
                    }
                }

                if (session.NowPlayingItem) {
                    const currentPosition = formatTime(session.PlayState.PositionTicks);
                    const totalDuration = formatTime(session.NowPlayingItem.RunTimeTicks);
                    const status = session.PlayState.IsPaused ? "Paused" : "Playing";
                    const { finishTime } = calculateFinishTime(session.PlayState.PositionTicks, session.NowPlayingItem.RunTimeTicks);
                    const mediaTitle = getMediaTitle(session.NowPlayingItem);
                    let videoBitrate = 0;
                    let audioBitrate = 0;

                    if (session.NowPlayingItem.MediaStreams) {
                        session.NowPlayingItem.MediaStreams.forEach(stream => {
                            if (stream.Type === 'Video' && stream.BitRate) {
                                videoBitrate = stream.BitRate;
                            }
                            if (stream.Type === 'Audio' && stream.BitRate) {
                                audioBitrate += stream.BitRate;
                            }
                        });
                    }

                    const bandwidthMbps = (videoBitrate + audioBitrate) ? ((videoBitrate + audioBitrate) / 1000000).toFixed(2) : "N/A";

                    const video = session.PlayState.PlayMethod == "Transcode" ? (session.TranscodingInfo.IsVideoDirect ? "Direct Stream" : "Transcoding") : "Direct Stream";
                    const audio = session.PlayState.PlayMethod == "Transcode" ? (session.TranscodingInfo.IsAudioDirect ? "Direct Stream" : "Transcoding") : "Direct Stream";
                    const reason = session.TranscodingInfo?.TranscodeReasons?.[0] || "Unknown Reason";

                    sessionDiv.innerHTML = `
                        <div class="thumbnail-container">
                            <img src="${thumbnailUrl}" alt="Media Thumbnail" class="thumbnail-image">
                        </div>
                        <div class="session-info">
                            <div class="product-info">
                                <div class="label">Client:</div>
                                <div class="value">${session.Client}</div>
                                <div class="label">Device:</div>
                                <div class="value">${session.DeviceName}</div>
                                <div class="label">Media:</div>
                                <div class="value">${mediaTitle}</div>
                                <div class="label">${status}</div>
                                <div class="value">${currentPosition} / ${totalDuration}</div>
                                <div class="label">ETA:</div>
                                <div class="value">${finishTime}</div>
                            </div>
                            <div class="stream-info">
                                <span>Stream: ${session.PlayState.PlayMethod}</span>
                                ${session.PlayState.PlayMethod == "Transcode" ? `<span>Reason: ${reason}</span>` : ''}
                                <span>Container: ${session.NowPlayingItem.Container || 'Unknown'}</span>
                                <span>Video: ${video}</span>
                                <span>Audio: ${audio}</span>
                            </div>
                            <div class="network-info">
                                <div class="label">Location:</div>
                                <div class="value">${session.RemoteEndPoint} <button class="info-button" data-ip="${session.RemoteEndPoint.split(':')[0]}" data-token="${ipInfoToken}" title="IP Info">ℹ️</button></div>
                                <div class="label">Bandwidth:</div>
                                <span class="value">${bandwidthMbps} Mbps</span>
                            </div>
                        </div>
                    `;
                } else {
                    sessionDiv.innerHTML = `
                        <div class="session-info">
                            <div class="product-info">
                                <div class="label">Client:</div>
                                <div class="value">${session.Client}</div>
                                <div class="label">Device:</div>
                                <div class="value">${session.DeviceName}</div>
                            </div>
                            <div class="network-info">
                                <div class="label">Location:</div>
                                <div class="value">${session.RemoteEndPoint} <button class="info-button" data-ip="${session.RemoteEndPoint.split(':')[0]}" data-token="${ipInfoToken}" title="IP Info">ℹ️</button></div>
                            </div>
                        </div>
                    `;
                }

                (session.NowPlayingItem ? activeContainer : idleContainer).appendChild(sessionDiv);
            });

            addInfoButtonListeners();
        })
        .catch(() => {
            alert("An error occurred while fetching user sessions. Please check the console for details.");
        });
}

function addInfoButtonListeners() {
    document.querySelectorAll('.info-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const ip = event.target.getAttribute('data-ip');
            const ipInfoToken = event.target.getAttribute('data-token');
            const ipInfo = await fetchIPInfo(ip, ipInfoToken);
            displayIPInfo(ipInfo);
        });
    });

    document.addEventListener('click', (event) => {
        const ipInfoDialog = document.getElementById('ip-info-dialog');
        if (ipInfoDialog.style.display === 'block' && !ipInfoDialog.contains(event.target)) {
            ipInfoDialog.style.display = 'none';
        }
    });

    document.getElementById('close-ip-info')?.addEventListener('click', () => {
        document.getElementById('ip-info-dialog').style.display = 'none';
    });
}

async function fetchIPInfo(ip, ipInfoToken) {
    try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=${ipInfoToken}`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Unable to fetch IP information');
        }
    } catch {
        return { error: 'Failed to fetch IP information' };
    }
}

function displayIPInfo(ipInfo) {
    const ipInfoContent = document.getElementById('ip-info-content');
    if (ipInfo.error) {
        ipInfoContent.innerHTML = `<p>${ipInfo.error}</p>`;
    } else {
        const loc = ipInfo.loc;
        const googleMapsUrl = `https://www.google.com/maps?q=${loc}`;

        ipInfoContent.innerHTML = `
            <p><strong>IP:</strong> ${ipInfo.ip}</p>
            <p><strong>Location:</strong> ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country} - ${ipInfo.postal}</p>
            <p><strong>Organization:</strong> ${ipInfo.org}</p>
            <p><strong>Latitude, Longitude:</strong> ${loc}
                <button id="maps-button" class="maps-button" title="View in Google Maps">📍</button>
            </p>
            <p><strong>Timezone:</strong> ${ipInfo.timezone}</p>
        `;

        document.getElementById('maps-button').addEventListener('click', () => {
            window.open(googleMapsUrl, '_blank');
        });
    }

    document.getElementById('ip-info-dialog').style.display = 'block';
}

function formatTime(ticks) {
    const totalSeconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function calculateFinishTime(positionTicks, totalTicks) {
    const remainingTicks = totalTicks - positionTicks;
    const remainingSeconds = Math.floor(remainingTicks / 10000000);
    const now = new Date();
    const finishTime = new Date(now.getTime() + remainingSeconds * 1000);
    return {
        timeLeft: formatTime(remainingTicks),
        finishTime: finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

function getMediaTitle(nowPlayingItem) {
    if (nowPlayingItem.Type === 'Movie') {
        return `${nowPlayingItem.Name} (${nowPlayingItem.ProductionYear || 'Unknown Year'})`;
    } else if (nowPlayingItem.Type === 'Episode') {
        return `${nowPlayingItem.SeriesName} S${nowPlayingItem.ParentIndexNumber.toString().padStart(2, '0')}E${nowPlayingItem.IndexNumber.toString().padStart(2, '0')} - ${nowPlayingItem.Name}`;
    }
    return 'Unknown Media';
}