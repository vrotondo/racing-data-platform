const API_BASE = 'http://localhost:8000/api';

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

export const fetchTracks = async () => {
    return apiCall('/race/tracks');
};

export const fetchRaceSummary = async (raceId, track = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    return apiCall(`/race/summary?${params}`);
};

export const fetchLapTimes = async (raceId, track = null, driverId = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    if (driverId) params.append('driver_id', driverId);
    return apiCall(`/race/lap-times?${params}`);
};