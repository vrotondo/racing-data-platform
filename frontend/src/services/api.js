/**
 * API service for connecting to Racing Data Platform backend
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Generic API call wrapper
 */
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

/**
 * Get list of available tracks
 */
export const fetchTracks = async () => {
    return apiCall('/race/tracks');
};

/**
 * Get race summary
 */
export const fetchRaceSummary = async (raceId, track = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    return apiCall(`/race/summary?${params}`);
};

/**
 * Get race results
 */
export const fetchRaceResults = async (raceId = null, track = null) => {
    const params = new URLSearchParams();
    if (raceId) params.append('race_id', raceId);
    if (track) params.append('track', track);
    return apiCall(`/race/results?${params}`);
};

/**
 * Get lap times
 */
export const fetchLapTimes = async (raceId, track = null, driverId = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    if (driverId) params.append('driver_id', driverId);
    return apiCall(`/race/lap-times?${params}`);
};

/**
 * Get best laps
 */
export const fetchBestLaps = async (raceId, track = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    return apiCall(`/race/best-laps?${params}`);
};

/**
 * Get weather data
 */
export const fetchWeather = async (raceId, track = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    return apiCall(`/race/weather?${params}`);
};

/**
 * Get driver performance
 */
export const fetchDriverPerformance = async (driverId, raceId, track = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    return apiCall(`/race/driver/${driverId}/performance?${params}`);
};

/**
 * Get pit strategy recommendation (TODO: implement backend endpoint)
 */
export const fetchPitRecommendation = async (strategyParams) => {
    return apiCall('/strategy/pit', {
        method: 'POST',
        body: JSON.stringify(strategyParams),
    });
};

/**
 * Get tire strategy analysis (TODO: implement backend endpoint)
 */
export const fetchTireStrategy = async (tireParams) => {
    return apiCall('/strategy/tire', {
        method: 'POST',
        body: JSON.stringify(tireParams),
    });
};