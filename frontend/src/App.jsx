import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import { fetchTracks } from './services/api';
import LapTimeChart from './components/LapTimeChart';
import TrackSelector from './components/TrackSelector';
import PitStrategyPanel from './components/PitStrategyPanel';
import './App.css';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ paddingTop: '20px' }}>
            {value === index && children}
        </div>
    );
}

function App() {
    const [tracks, setTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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

                            <Paper sx={{ mb: 3 }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="fullWidth"
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    <Tab
                                        label="📈 Lap Time Analysis"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="🏁 Pit Strategy"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                </Tabs>
                            </Paper>

                            <TabPanel value={activeTab} index={0}>
                                <LapTimeChart
                                    raceId="01"
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={1}>
                                <PitStrategyPanel
                                    raceId="01"
                                    track={selectedTrack || null}
                                />
                            </TabPanel>
                        </Box>
                    )}

                    {!loading && !error && tracks.length === 0 && (
                        <Paper sx={{ p: 3, bgcolor: 'warning.light' }}>
                            <Typography variant="h6">📂 No tracks found</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Add your track data folders to: <code>data/raw/</code>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Example structure:
                            </Typography>
                            <Typography variant="body2" component="pre" sx={{
                                bgcolor: 'rgba(0,0,0,0.1)',
                                p: 2,
                                borderRadius: 1,
                                mt: 1,
                                fontFamily: 'monospace'
                            }}>
                                {`data/raw/
├── barber-motorsports-park/
├── circuit-of-the-americas/
└── sonoma/`}
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Container>
        </div>
    );
}

export default App;