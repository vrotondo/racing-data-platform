import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, Alert, Card, CardContent,
    Grid, TableSortLabel
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Flag as FlagIcon,
    Speed as SpeedIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';

// Fetch race results - using existing endpoint
const fetchRaceResults = async (raceId, track) => {
    const params = new URLSearchParams({ race_id: raceId });
    if (track) params.append('track', track);

    // Check if results file exists first
    const checkResponse = await fetch(`http://localhost:8000/api/race/results/available?${params}`);
    const { available } = await checkResponse.json();

    if (available) {
        // Use actual results file
        const response = await fetch(`http://localhost:8000/api/race/results?${params}`);
        return await response.json();
    } else {
        // Calculate from lap times
        console.log('Calculating results from lap times...');
        const response = await fetch(`http://localhost:8000/api/race/results-from-laps?${params}`);
        return await response.json();
    }
};

function RaceResultsTable({ raceId = "01", track = null }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderBy, setOrderBy] = useState('position');
    const [order, setOrder] = useState('asc');

    useEffect(() => {
        loadResults();
    }, [raceId, track]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await fetchRaceResults(raceId, track);
            setResults(data);
            setError(null);
        } catch (err) {
            setError('Failed to load race results');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return `${mins}:${secs.padStart(6, '0')}`;
    };

    const formatGap = (gap) => {
        if (!gap || gap === 0) return '-';
        return `+${gap.toFixed(3)}s`;
    };

    const getPositionIcon = (position) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
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

    const getStatusChip = (status) => {
        const statusLower = status?.toLowerCase() || 'finished';

        if (statusLower.includes('finished') || statusLower.includes('classified')) {
            return <Chip label="Finished" color="success" size="small" icon={<CheckIcon />} />;
        } else if (statusLower.includes('dnf') || statusLower.includes('retired')) {
            return <Chip label="DNF" color="error" size="small" icon={<CancelIcon />} />;
        } else if (statusLower.includes('dsq') || statusLower.includes('disqualified')) {
            return <Chip label="DSQ" color="warning" size="small" />;
        } else {
            return <Chip label={status} size="small" />;
        }
    };

    const sortData = (data) => {
        if (!data) return [];

        return [...data].sort((a, b) => {
            let aVal = a[orderBy];
            let bVal = b[orderBy];

            // Handle special cases
            if (orderBy === 'position') {
                aVal = parseInt(aVal) || 999;
                bVal = parseInt(bVal) || 999;
            } else if (orderBy === 'driver_name' || orderBy === 'vehicle_number') {
                aVal = String(aVal || '');
                bVal = String(bVal || '');
            } else {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
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

    if (!results || !results.results || results.results.length === 0) {
        return (
            <Alert severity="info" sx={{ mb: 3 }}>
                No race results available for this race.
            </Alert>
        );
    }

    const sortedResults = sortData(results.results);

    // Calculate statistics
    const finishers = sortedResults.filter(r => {
        const status = r.status?.toLowerCase() || 'finished';
        return status.includes('finished') || status.includes('classified');
    }).length;

    const dnfs = sortedResults.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('dnf') || status.includes('retired');
    }).length;

    // Find fastest lap
    const fastestLapEntry = sortedResults.reduce((fastest, current) => {
        const currentBest = current.best_lap_time || current.fastest_lap || 999999;
        const fastestBest = fastest.best_lap_time || fastest.fastest_lap || 999999;
        return currentBest < fastestBest ? current : fastest;
    }, sortedResults[0] || {});

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🏁 Race Results
            </Typography>

            {/* Summary Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TrophyIcon color="primary" />
                                <Typography variant="h6">Total Entries</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {results.total_drivers}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                drivers started
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CheckIcon color="success" />
                                <Typography variant="h6">Finishers</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold" color="success.main">
                                {finishers}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {dnfs} DNF{dnfs !== 1 ? 's' : ''}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <SpeedIcon color="primary" />
                                <Typography variant="h6">Fastest Lap</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {formatTime(fastestLapEntry.best_lap_time || fastestLapEntry.fastest_lap)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Driver {fastestLapEntry.vehicle_number || fastestLapEntry.driver_name || '?'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Podium Finishers */}
            {sortedResults.length >= 3 && (
                <Paper elevation={4} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon /> Podium Finishers
                    </Typography>
                    <Grid container spacing={2}>
                        {sortedResults.slice(0, 3).map((driver, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                                <Card sx={{ bgcolor: getPositionColor(idx + 1), color: 'white' }}>
                                    <CardContent>
                                        <Typography variant="h2" sx={{ mb: 1 }}>
                                            {getPositionIcon(idx + 1)}
                                        </Typography>
                                        <Typography variant="h5" fontWeight="bold">
                                            P{idx + 1}: Driver {driver.vehicle_number || driver.driver_name || '?'}
                                        </Typography>
                                        <Typography variant="h6">
                                            {idx === 0
                                                ? formatTime(driver.total_time || driver.race_time)
                                                : formatGap(driver.gap || driver.interval)
                                            }
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Full Results Table */}
            <Paper elevation={3}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'position'}
                                        direction={orderBy === 'position' ? order : 'asc'}
                                        onClick={() => handleSort('position')}
                                    >
                                        <strong>Pos</strong>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'vehicle_number'}
                                        direction={orderBy === 'vehicle_number' ? order : 'asc'}
                                        onClick={() => handleSort('vehicle_number')}
                                    >
                                        <strong>Driver</strong>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'total_time'}
                                        direction={orderBy === 'total_time' ? order : 'asc'}
                                        onClick={() => handleSort('total_time')}
                                    >
                                        <strong>Time/Gap</strong>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'best_lap_time'}
                                        direction={orderBy === 'best_lap_time' ? order : 'asc'}
                                        onClick={() => handleSort('best_lap_time')}
                                    >
                                        <strong>Best Lap</strong>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell><strong>Laps</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedResults.map((driver, idx) => {
                                const position = parseInt(driver.position || idx + 1);
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
                                                {getPositionIcon(position)}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="medium">
                                                Driver {driver.vehicle_number || driver.driver_name || '?'}
                                            </Typography>
                                            {driver.team && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {driver.team}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight={position === 1 ? 'bold' : 'normal'}>
                                                {position === 1
                                                    ? formatTime(driver.total_time || driver.race_time)
                                                    : formatGap(driver.gap || driver.interval)
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={formatTime(driver.best_lap_time || driver.fastest_lap)}
                                                size="small"
                                                color={driver.best_lap_time === fastestLapEntry.best_lap_time ? 'secondary' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {driver.laps_completed || driver.laps || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(driver.status || 'Finished')}
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
                    <strong>Legend:</strong> 🥇 Winner • 🥈 Second • 🥉 Third •
                    Click column headers to sort • Podium finishers highlighted
                </Typography>
            </Box>
        </Box>
    );
}

export default RaceResultsTable;