import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { fetchTracks } from './services/api';
import './App.css';

function App() {
    const [tracks, setTracks] = useState([]);
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
                    <Typography variant="h2" component="h1" gutterBottom>
                        🏁 Racing Data Platform
                    </Typography>

                    <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
                        Real-time Racing Analytics & Strategy
                    </Typography>

                    <Box sx={{ mt: 4 }}>
                        {loading && (
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                <CircularProgress />
                            </Box>
                        )}

                        {error && (
                            <Box sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
                                <Typography variant="h6">⚠️ Error</Typography>
                                <Typography>{error}</Typography>
                            </Box>
                        )}

                        {!loading && !error && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Available Tracks: {tracks.length}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                    {tracks.map((track) => (
                                        <Box key={track} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2, minWidth: 200 }}>
                                            <Typography variant="body1">
                                                🏎️ {track.replace(/-/g, ' ').toUpperCase()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>
        </div>
    );
}

export default App;