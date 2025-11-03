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

// NEW: Pit Strategy API Functions
export const fetchTireStatus = async (params) => {
    const {
        raceId = 'R1',
        track = null,
        driverId = null,
        compound = 'medium',
        currentStintLaps = 10,
        trackTemp = null
    } = params;

    const queryParams = new URLSearchParams({
        race_id: raceId,
        compound: compound,
        current_stint_laps: currentStintLaps
    });

    if (track) queryParams.append('track', track);
    if (driverId) queryParams.append('driver_id', driverId);
    if (trackTemp !== null) queryParams.append('track_temp', trackTemp);

    return apiCall(`/race/strategy/tire-status?${queryParams}`);
};

export const fetchPitRecommendation = async (params) => {
    const {
        raceId = 'R1',
        track = null,
        currentLap = 15,
        totalLaps = 50,
        currentPosition = 5,
        fuelRemaining = 45.0,
        tireCompound = 'medium',
        tireStintLaps = 15,
        gapAhead = 2.5,
        gapBehind = 3.2,
        isCaution = false
    } = params;

    const queryParams = new URLSearchParams({
        race_id: raceId,
        current_lap: currentLap,
        total_laps: totalLaps,
        current_position: currentPosition,
        fuel_remaining: fuelRemaining,
        tire_compound: tireCompound,
        tire_stint_laps: tireStintLaps,
        gap_ahead: gapAhead,
        gap_behind: gapBehind,
        is_caution: isCaution
    });

    if (track) queryParams.append('track', track);

    return apiCall(`/race/strategy/pit-recommendation?${queryParams}`);
};

export const fetchCompoundComparison = async (raceLength, currentLap) => {
    const queryParams = new URLSearchParams({
        race_length: raceLength,
        current_lap: currentLap
    });

    return apiCall(`/race/strategy/compare-compounds?${queryParams}`);
};

// Driver Comparison API Function
export const fetchDriverComparison = async (raceId, track, driverIds) => {
    const queryParams = new URLSearchParams({
        race_id: raceId,
        driver_ids: driverIds.join(',')
    });

    if (track) queryParams.append('track', track);

    return apiCall(`/race/compare-drivers?${queryParams}`);
};

// Telemetry API Function
export const fetchTelemetry = async (raceId, track = null, driverId = null, lap = null) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);
    if (driverId) params.append('driver_id', driverId);
    if (lap) params.append('lap', lap);

    return apiCall(`/race/telemetry?${params}`);
};