import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Paper,
    Tabs,
    Tab,
    Grid
} from '@mui/material';
import { fetchTracks } from './services/api';
import LapTimeChart from './components/LapTimeChart';
import TrackSelector from './components/TrackSelector';
import RaceSelector from './components/RaceSelector';
import PitStrategyPanel from './components/PitStrategyPanel';
import DriverComparisonDashboard from './components/DriverComparisonDashboard';
import RaceResultsTable from './components/RaceResultsTable';
import BestLapsLeaderboard from './components/BestLapsLeaderboard';
import TelemetryViewer from './components/TelemetryViewer';
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
    const [selectedRace, setSelectedRace] = useState('01');
    const [availableRaces, setAvailableRaces] = useState(['01', '02', '03']);
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
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TrackSelector
                                        tracks={tracks}
                                        selectedTrack={selectedTrack}
                                        onTrackChange={setSelectedTrack}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <RaceSelector
                                        races={availableRaces}
                                        selectedRace={selectedRace}
                                        onRaceChange={setSelectedRace}
                                    />
                                </Grid>
                            </Grid>

                            <Paper sx={{ mb: 3 }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={(e, newValue) => setActiveTab(newValue)}
                                    variant="fullWidth"
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    <Tab
                                        label="📈 Lap Times"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="🏁 Pit Strategy"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="👥 Driver Comparison"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="🏆 Race Results"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="⚡ Best Laps"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                    <Tab
                                        label="🎛️ Telemetry"
                                        sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                </Tabs>
                            </Paper>

                            <TabPanel value={activeTab} index={0}>
                                <LapTimeChart
                                    raceId={selectedRace}
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={1}>
                                <PitStrategyPanel
                                    raceId={selectedRace}
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={2}>
                                <DriverComparisonDashboard
                                    raceId={selectedRace}
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={3}>
                                <RaceResultsTable
                                    raceId={selectedRace}
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={4}>
                                <BestLapsLeaderboard
                                    raceId={selectedRace}
                                    track={selectedTrack || null}
                                />
                            </TabPanel>

                            <TabPanel value={activeTab} index={5}>
                                <TelemetryViewer
                                    raceId={selectedRace}
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
                        </Paper>
                    )}
                </Box>
            </Container>
        </div>
    );
}

export default App;