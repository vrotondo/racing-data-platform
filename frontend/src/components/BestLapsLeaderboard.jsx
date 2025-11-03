import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
    Timer as TimerIcon
} from '@mui/icons-material';
import { fetchLapTimes } from '../services/api';

function BestLapsLeaderboard({ raceId = "01", track = null }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadBestLaps();
    }, [raceId, track]);

    const loadBestLaps = async () => {
        try {
            setLoading(true);
            const data = await fetchLapTimes(raceId, track);

            if (data.lap_times && data.lap_times.length > 0) {
                // Sort all laps by time and take top 10
                const sortedLaps = [...data.lap_times]
                    .filter(lap => lap.lap_time > 0) // Remove invalid times
                    .sort((a, b) => a.lap_time - b.lap_time)
                    .slice(0, 10);

                setLeaderboard(sortedLaps);
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

    const getPositionIcon = (position) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}`;
        }
    };

    const getPositionColor = (position) => {
        switch (position) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return 'transparent';
        }
    };

    const getDelta = (time, fastestTime) => {
        const delta = time - fastestTime;
        if (delta === 0) return '-';
        return `+${delta.toFixed(3)}s`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

    if (leaderboard.length === 0) {
        return (
            <Alert severity="info" sx={{ mb: 3 }}>
                No lap data available for this race.
            </Alert>
        );
    }

    const fastestLap = leaderboard[0];

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚡ Best Laps Leaderboard
            </Typography>

            {/* Fastest Lap Highlight */}
            <Paper
                elevation={4}
                sx={{
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrophyIcon sx={{ fontSize: 64 }} />
                    <Box>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            FASTEST LAP OF THE RACE
                        </Typography>
                        <Typography variant="h2" fontWeight="bold">
                            {formatTime(fastestLap.lap_time)}
                        </Typography>
                        <Typography variant="h5">
                            Driver {fastestLap.driver_id} • Lap {fastestLap.lap}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Statistics Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SpeedIcon color="primary" />
                            <Typography variant="h6">Total Laps Analyzed</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold">
                            {leaderboard.length}+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Top 10 shown
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TimerIcon color="primary" />
                            <Typography variant="h6">Time Gap</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold">
                            {getDelta(leaderboard[leaderboard.length - 1].lap_time, fastestLap.lap_time)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            10th to 1st place
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon /> Top 3 Fastest Laps
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-around' }}>
                        {leaderboard.slice(0, 3).map((lap, idx) => (
                            <Card
                                key={idx}
                                sx={{
                                    flex: 1,
                                    bgcolor: getPositionColor(idx + 1),
                                    color: 'white',
                                    textAlign: 'center'
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h2" sx={{ mb: 1 }}>
                                        {getPositionIcon(idx + 1)}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        Driver {lap.driver_id}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ my: 1 }}>
                                        {formatTime(lap.lap_time)}
                                    </Typography>
                                    <Chip
                                        label={`Lap ${lap.lap}`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Full Leaderboard Table */}
            <Paper elevation={3}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Rank</strong></TableCell>
                                <TableCell><strong>Driver</strong></TableCell>
                                <TableCell><strong>Lap Time</strong></TableCell>
                                <TableCell><strong>Delta</strong></TableCell>
                                <TableCell><strong>Lap #</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderboard.map((lap, idx) => {
                                const position = idx + 1;
                                const isPodium = position <= 3;

                                return (
                                    <TableRow
                                        key={idx}
                                        sx={{
                                            bgcolor: isPodium ? `${getPositionColor(position)}22` : 'transparent',
                                            '&:hover': { bgcolor: 'grey.50' }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {position}
                                                </Typography>
                                                {isPodium && (
                                                    <Typography variant="h6">
                                                        {getPositionIcon(position)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="medium">
                                                Driver {lap.driver_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={formatTime(lap.lap_time)}
                                                color={position === 1 ? 'secondary' : 'default'}
                                                sx={{ fontWeight: position === 1 ? 'bold' : 'normal' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                color={position === 1 ? 'text.secondary' : 'text.primary'}
                                            >
                                                {getDelta(lap.lap_time, fastestLap.lap_time)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`Lap ${lap.lap}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Legend */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> This shows the 10 fastest individual laps across all drivers.
                    Multiple laps from the same driver may appear.
                </Typography>
            </Box>
        </Box>
    );
}

export default BestLapsLeaderboard;