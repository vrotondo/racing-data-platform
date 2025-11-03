import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Grid, Card, CardContent, Chip, Switch,
    FormControlLabel, FormGroup
} from '@mui/material';
import {
    Speed as SpeedIcon,
    Visibility as VisibilityIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTelemetry } from '../services/api';

function TelemetryViewer({ raceId = "01", track = null }) {
    const [telemetryData, setTelemetryData] = useState(null);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [availableLaps, setAvailableLaps] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedLap, setSelectedLap] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Channel visibility toggles
    const [showSpeed, setShowSpeed] = useState(true);
    const [showThrottle, setShowThrottle] = useState(true);
    const [showBrake, setShowBrake] = useState(true);
    const [showGear, setShowGear] = useState(false);

    useEffect(() => {
        loadTelemetryMetadata();
    }, [raceId, track]);

    useEffect(() => {
        if (selectedDriver && selectedLap) {
            loadTelemetryData();
        }
    }, [selectedDriver, selectedLap, raceId, track]);

    const loadTelemetryMetadata = async () => {
        try {
            setLoading(true);
            // Load metadata without filtering
            const data = await fetchTelemetry(raceId, track);

            if (data.available_drivers && data.available_drivers.length > 0) {
                setAvailableDrivers(data.available_drivers);
                setSelectedDriver(data.available_drivers[0]);
            }

            if (data.available_laps && data.available_laps.length > 0) {
                setAvailableLaps(data.available_laps);
                setSelectedLap(data.available_laps[0]);
            }

            setError(null);
        } catch (err) {
            // 404 is expected if no telemetry data exists - handle gracefully
            console.log('No telemetry data available for this race (this is normal)');
            setError('No telemetry data available for this race');
            setAvailableDrivers([]);
            setAvailableLaps([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTelemetryData = async () => {
        try {
            setLoading(true);
            const data = await fetchTelemetry(raceId, track, selectedDriver, selectedLap);

            if (data.telemetry && data.telemetry.length > 0) {
                // Add distance/time index for X axis
                const processedData = data.telemetry.map((point, idx) => ({
                    ...point,
                    index: idx,
                    distance: idx * 10 // Approximate distance in meters
                }));

                setTelemetryData(processedData);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load telemetry data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        if (!telemetryData || telemetryData.length === 0) return null;

        const speeds = telemetryData.map(d => d.speed || 0).filter(s => s > 0);
        const throttles = telemetryData.map(d => d.throttle || 0);
        const brakes = telemetryData.map(d => d.brake || 0);

        return {
            maxSpeed: speeds.length > 0 ? Math.max(...speeds).toFixed(1) : 0,
            avgSpeed: speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : 0,
            maxThrottle: throttles.length > 0 ? Math.max(...throttles).toFixed(1) : 0,
            maxBrake: brakes.length > 0 ? Math.max(...brakes).toFixed(1) : 0
        };
    };

    if (loading && !telemetryData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="warning" sx={{ mb: 3 }}>
                {error}
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Telemetry data may not be available for this race. Try selecting a different race or track.
                </Typography>
            </Alert>
        );
    }

    const stats = calculateStats();

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎛️ Telemetry Viewer
            </Typography>

            {/* Selection Controls */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Select Driver</InputLabel>
                            <Select
                                value={selectedDriver}
                                label="Select Driver"
                                onChange={(e) => setSelectedDriver(e.target.value)}
                            >
                                {availableDrivers.map((driver) => (
                                    <MenuItem key={driver} value={driver}>
                                        Driver {driver}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Select Lap</InputLabel>
                            <Select
                                value={selectedLap}
                                label="Select Lap"
                                onChange={(e) => setSelectedLap(e.target.value)}
                            >
                                {availableLaps.map((lap) => (
                                    <MenuItem key={lap} value={lap}>
                                        Lap {lap}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
                            <VisibilityIcon color="primary" />
                            <Typography variant="body1">
                                Analyzing: <strong>Driver {selectedDriver}, Lap {selectedLap}</strong>
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <SpeedIcon color="primary" />
                                    <Typography variant="h6">Max Speed</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold" color="primary.main">
                                    {stats.maxSpeed}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    km/h
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <SpeedIcon color="success" />
                                    <Typography variant="h6">Avg Speed</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold" color="success.main">
                                    {stats.avgSpeed}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    km/h
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Max Throttle</Typography>
                                <Typography variant="h3" fontWeight="bold" color="success.main">
                                    {stats.maxThrottle}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    throttle application
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Max Brake</Typography>
                                <Typography variant="h3" fontWeight="bold" color="error.main">
                                    {stats.maxBrake}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    brake pressure
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Channel Visibility Controls */}
            <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SettingsIcon />
                    <Typography variant="h6">Channel Visibility</Typography>
                </Box>
                <FormGroup row>
                    <FormControlLabel
                        control={<Switch checked={showSpeed} onChange={(e) => setShowSpeed(e.target.checked)} />}
                        label={<Chip label="Speed" color="primary" size="small" />}
                    />
                    <FormControlLabel
                        control={<Switch checked={showThrottle} onChange={(e) => setShowThrottle(e.target.checked)} />}
                        label={<Chip label="Throttle" color="success" size="small" />}
                    />
                    <FormControlLabel
                        control={<Switch checked={showBrake} onChange={(e) => setShowBrake(e.target.checked)} />}
                        label={<Chip label="Brake" color="error" size="small" />}
                    />
                    <FormControlLabel
                        control={<Switch checked={showGear} onChange={(e) => setShowGear(e.target.checked)} />}
                        label={<Chip label="Gear" color="warning" size="small" />}
                    />
                </FormGroup>
            </Paper>

            {/* Telemetry Chart */}
            {telemetryData && telemetryData.length > 0 ? (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        📊 Telemetry Traces
                    </Typography>

                    <ResponsiveContainer width="100%" height={500}>
                        <LineChart data={telemetryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="index"
                                label={{ value: 'Sample Points', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                label={{ value: 'Values', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <Paper sx={{ p: 2 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Sample: {payload[0].payload.index}
                                                </Typography>
                                                {payload.map((entry, index) => (
                                                    <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                                                        {entry.name}: {entry.value?.toFixed(2)}
                                                    </Typography>
                                                ))}
                                            </Paper>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />

                            {showSpeed && (
                                <Line
                                    type="monotone"
                                    dataKey="speed"
                                    name="Speed (km/h)"
                                    stroke="#1976d2"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showThrottle && (
                                <Line
                                    type="monotone"
                                    dataKey="throttle"
                                    name="Throttle (%)"
                                    stroke="#2e7d32"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showBrake && (
                                <Line
                                    type="monotone"
                                    dataKey="brake"
                                    name="Brake (%)"
                                    stroke="#d32f2f"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showGear && (
                                <Line
                                    type="stepAfter"
                                    dataKey="gear"
                                    name="Gear"
                                    stroke="#ed6c02"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>How to read:</strong> Blue line = Speed • Green line = Throttle •
                            Red line = Brake • Orange steps = Gear changes
                        </Typography>
                    </Box>
                </Paper>
            ) : (
                <Alert severity="info">
                    No telemetry data available for the selected lap. Try choosing a different lap or driver.
                </Alert>
            )}
        </Box>
    );
}

export default TelemetryViewer;