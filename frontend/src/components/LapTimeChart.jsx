import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import { fetchLapTimes } from '../services/api';

function LapTimeChart({ raceId = "R1", track = null }) {
    const [lapData, setLapData] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLapTimes();
    }, [raceId, track, selectedDriver]);

    const loadLapTimes = async () => {
        try {
            setLoading(true);
            const driverId = selectedDriver === 'all' ? null : selectedDriver;
            const data = await fetchLapTimes(raceId, track, driverId);

            if (data.lap_times && data.lap_times.length > 0) {
                setLapData(data.lap_times);

                // Extract unique drivers
                const uniqueDrivers = [...new Set(data.lap_times.map(lap => lap.driver_id))];
                setDrivers(uniqueDrivers);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load lap times');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return `${mins}:${secs.padStart(6, '0')}`;
    };

    const getDriverColor = (driverId, index) => {
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0', '#8dd1e1'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
                <Typography variant="h6">⚠️ {error}</Typography>
            </Box>
        );
    }

    if (lapData.length === 0) {
        return (
            <Box sx={{ p: 3, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography>No lap time data available for this race.</Typography>
            </Box>
        );
    }

    // Group data by driver for multi-line chart
    const chartData = selectedDriver === 'all'
        ? lapData.reduce((acc, lap) => {
            const existingLap = acc.find(item => item.lap === lap.lap);
            if (existingLap) {
                existingLap[`driver_${lap.driver_id}`] = lap.lap_time;
            } else {
                acc.push({
                    lap: lap.lap,
                    [`driver_${lap.driver_id}`]: lap.lap_time
                });
            }
            return acc;
        }, [])
        : lapData.map(lap => ({
            lap: lap.lap,
            lap_time: lap.lap_time
        }));

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    📈 Lap Time Analysis
                </Typography>

                <FormControl sx={{ minWidth: 200, mt: 2 }}>
                    <InputLabel>Driver</InputLabel>
                    <Select
                        value={selectedDriver}
                        label="Driver"
                        onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                        <MenuItem value="all">All Drivers</MenuItem>
                        {drivers.map((driver) => (
                            <MenuItem key={driver} value={driver}>
                                Driver {driver}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

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

                    {selectedDriver === 'all' ? (
                        drivers.map((driver, index) => (
                            <Line
                                key={driver}
                                type="monotone"
                                dataKey={`driver_${driver}`}
                                name={`Driver ${driver}`}
                                stroke={getDriverColor(driver, index)}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        ))
                    ) : (
                        <Line
                            type="monotone"
                            dataKey="lap_time"
                            name="Lap Time"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

            {selectedDriver !== 'all' && lapData.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Statistics</Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Best Lap</Typography>
                            <Typography variant="h6">
                                {formatTime(Math.min(...lapData.map(l => l.lap_time)))}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Average</Typography>
                            <Typography variant="h6">
                                {formatTime(lapData.reduce((sum, l) => sum + l.lap_time, 0) / lapData.length)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Total Laps</Typography>
                            <Typography variant="h6">{lapData.length}</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

export default LapTimeChart;