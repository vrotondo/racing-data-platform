import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, Chip,
    Alert, FormControl, InputLabel, Select, MenuItem, Button,
    CircularProgress, Divider, OutlinedInput
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
    TrendingUp as TrendingIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchLapTimes, fetchDriverComparison } from '../services/api';

const DRIVER_COLORS = [
    '#8884d8', // Blue
    '#82ca9d', // Green
    '#ffc658', // Yellow
    '#ff7c7c', // Red
    '#a4de6c', // Light green
];

function DriverComparisonDashboard({ raceId = "01", track = null }) {
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAvailableDrivers();
    }, [raceId, track]);

    useEffect(() => {
        if (selectedDrivers.length >= 2) {
            loadComparisonData();
        }
    }, [selectedDrivers, raceId, track]);

    const loadAvailableDrivers = async () => {
        try {
            setLoading(true);
            const data = await fetchLapTimes(raceId, track);

            if (data.lap_times && data.lap_times.length > 0) {
                const uniqueDrivers = [...new Set(data.lap_times.map(lap => lap.driver_id))];
                setAvailableDrivers(uniqueDrivers);

                // Auto-select first 2 drivers for initial comparison
                if (uniqueDrivers.length >= 2) {
                    setSelectedDrivers([uniqueDrivers[0], uniqueDrivers[1]]);
                }
            }

            setError(null);
        } catch (err) {
            setError('Failed to load driver data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadComparisonData = async () => {
        try {
            setLoading(true);
            const data = await fetchDriverComparison(raceId, track, selectedDrivers);
            setComparisonData(data);
            setError(null);
        } catch (err) {
            setError('Failed to load comparison data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDriverChange = (event) => {
        const value = event.target.value;
        setSelectedDrivers(typeof value === 'string' ? value.split(',') : value);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return `${mins}:${secs.padStart(6, '0')}`;
    };

    const getDriverColor = (driverId) => {
        const index = selectedDrivers.indexOf(driverId);
        return DRIVER_COLORS[index % DRIVER_COLORS.length];
    };

    const calculateDelta = (driver1, driver2) => {
        return (driver1.best_lap - driver2.best_lap).toFixed(3);
    };

    if (loading && !comparisonData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error && !comparisonData) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

    // Prepare chart data
    const chartData = [];
    if (comparisonData && comparisonData.drivers.length > 0) {
        const maxLaps = Math.max(...comparisonData.drivers.map(d => d.total_laps));

        for (let lap = 1; lap <= maxLaps; lap++) {
            const dataPoint = { lap };

            comparisonData.drivers.forEach(driver => {
                const lapData = driver.lap_progression.find(l => l.lap === lap);
                if (lapData) {
                    dataPoint[`driver_${driver.driver_id}`] = lapData.lap_time;
                }
            });

            chartData.push(dataPoint);
        }
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                👥 Driver Comparison Dashboard
            </Typography>

            {/* Driver Selector */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Select Drivers to Compare</InputLabel>
                    <Select
                        multiple
                        value={selectedDrivers}
                        onChange={handleDriverChange}
                        input={<OutlinedInput label="Select Drivers to Compare" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((driverId) => (
                                    <Chip
                                        key={driverId}
                                        label={`Driver ${driverId}`}
                                        sx={{
                                            bgcolor: getDriverColor(driverId),
                                            color: 'white'
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        {availableDrivers.map((driverId) => (
                            <MenuItem key={driverId} value={driverId}>
                                <PersonIcon sx={{ mr: 1 }} />
                                Driver {driverId}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedDrivers.length < 2 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Select at least 2 drivers to compare
                    </Alert>
                )}
            </Paper>

            {comparisonData && comparisonData.drivers.length >= 2 && (
                <>
                    {/* Overall Winner Banner */}
                    {comparisonData.analysis && (
                        <Paper
                            elevation={4}
                            sx={{
                                p: 3,
                                mb: 3,
                                background: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
                                color: 'white'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrophyIcon sx={{ fontSize: 48 }} />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        Fastest: Driver {comparisonData.analysis.fastest_driver}
                                    </Typography>
                                    <Typography variant="h6">
                                        Best Lap: {formatTime(comparisonData.analysis.fastest_lap)}
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', mx: 2 }} />
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        Most Consistent: Driver {comparisonData.analysis.most_consistent_driver}
                                    </Typography>
                                    <Typography variant="body1">
                                        Std Dev: {comparisonData.analysis.best_consistency.toFixed(3)}s
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Driver Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {comparisonData.drivers.map((driver, index) => (
                            <Grid item xs={12} md={6} lg={4} key={driver.driver_id}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        borderTop: `4px solid ${getDriverColor(driver.driver_id)}`,
                                        height: '100%'
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <PersonIcon
                                                sx={{
                                                    fontSize: 32,
                                                    color: getDriverColor(driver.driver_id)
                                                }}
                                            />
                                            <Typography variant="h5" fontWeight="bold">
                                                Driver {driver.driver_id}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    bgcolor: 'success.light',
                                                    borderRadius: 1,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Best Lap
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {formatTime(driver.best_lap)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    bgcolor: 'info.light',
                                                    borderRadius: 1,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Average
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {formatTime(driver.average_lap)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    bgcolor: 'warning.light',
                                                    borderRadius: 1,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Consistency
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {driver.consistency_std.toFixed(3)}s
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    bgcolor: 'grey.200',
                                                    borderRadius: 1,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total Laps
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {driver.total_laps}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Delta to fastest driver */}
                                        {comparisonData.analysis &&
                                            driver.driver_id !== comparisonData.analysis.fastest_driver && (
                                                <Alert
                                                    severity="info"
                                                    icon={<SpeedIcon />}
                                                    sx={{ mt: 2 }}
                                                >
                                                    <Typography variant="body2">
                                                        +{calculateDelta(
                                                            driver,
                                                            comparisonData.drivers.find(
                                                                d => d.driver_id === comparisonData.analysis.fastest_driver
                                                            )
                                                        )}s behind fastest lap
                                                    </Typography>
                                                </Alert>
                                            )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Lap Time Comparison Chart */}
                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingIcon />
                            Lap Time Progression
                        </Typography>

                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="lap"
                                    label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft' }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    formatter={(value) => [formatTime(value), 'Lap Time']}
                                    labelFormatter={(label) => `Lap ${label}`}
                                />
                                <Legend />

                                {comparisonData.drivers.map((driver) => (
                                    <Line
                                        key={driver.driver_id}
                                        type="monotone"
                                        dataKey={`driver_${driver.driver_id}`}
                                        name={`Driver ${driver.driver_id}`}
                                        stroke={getDriverColor(driver.driver_id)}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* Head-to-Head Analysis */}
                    {comparisonData.drivers.length === 2 && (
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                📊 Head-to-Head Analysis
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ bgcolor: 'grey.50' }}>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Best Lap Advantage
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {Math.abs(calculateDelta(
                                                    comparisonData.drivers[0],
                                                    comparisonData.drivers[1]
                                                ))}s
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Driver {comparisonData.drivers[0].best_lap < comparisonData.drivers[1].best_lap
                                                    ? comparisonData.drivers[0].driver_id
                                                    : comparisonData.drivers[1].driver_id
                                                } is faster
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Card sx={{ bgcolor: 'grey.50' }}>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Average Pace Difference
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {Math.abs((
                                                    comparisonData.drivers[0].average_lap -
                                                    comparisonData.drivers[1].average_lap
                                                ).toFixed(3))}s/lap
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Over {Math.max(
                                                    comparisonData.drivers[0].total_laps,
                                                    comparisonData.drivers[1].total_laps
                                                )} laps
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Card sx={{ bgcolor: 'grey.50' }}>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Consistency Winner
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                Driver {comparisonData.drivers[0].consistency_std < comparisonData.drivers[1].consistency_std
                                                    ? comparisonData.drivers[0].driver_id
                                                    : comparisonData.drivers[1].driver_id
                                                }
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {Math.abs((
                                                    comparisonData.drivers[0].consistency_std -
                                                    comparisonData.drivers[1].consistency_std
                                                ).toFixed(3))}s better
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
}

export default DriverComparisonDashboard;