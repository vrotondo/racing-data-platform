import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Paper } from '@mui/material';
import { fetchTracks } from './services/api';
import LapTimeChart from './components/LapTimeChart';
import TrackSelector from './components/TrackSelector';
import './App.css';

function App() {
    const [tracks, setTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = async () => {
        try {
            setLoading(true);
            const data = await fetchTracks();
            setTracks(data.tracks || []);

            // Auto-select first track if available
            if (data.tracks && data.tracks.length > 0) {
                setSelectedTrack(data.tracks[0]);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load tracks. Make sure the backend is running on http://localhost:8000');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <Container maxWidth="lg">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'white' }}>
                        🏁 Racing Data Platform
                    </Typography>

                    <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                        Real-time Racing Analytics & Strategy
                    </Typography>

                    {loading && (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                            <CircularProgress sx={{ color: 'white' }} />
                        </Box>
                    )}

                    {error && (
                        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText', mb: 3 }}>
                            <Typography variant="h6">⚠️ Error</Typography>
                            <Typography>{error}</Typography>
                        </Paper>
                    )}

                    {!loading && !error && tracks.length > 0 && (
                        <Box>
                            <TrackSelector
                                tracks={tracks}
                                selectedTrack={selectedTrack}
                                onTrackChange={setSelectedTrack}
                            />

                            <LapTimeChart
                                raceId="R1"
                                track={selectedTrack || null}
                            />
                        </Box>
                    )}

                    {!loading && !error && tracks.length === 0 && (
                        <Paper sx={{ p: 3, bgcolor: 'warning.light' }}>
                            <Typography variant="h6">📂 No tracks found</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Add your track data folders to: <code>data/raw/</code>
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Container>
        </div>
    );
}

export default App;