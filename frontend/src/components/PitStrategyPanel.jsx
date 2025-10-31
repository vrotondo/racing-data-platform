import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Alert,
    Button,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Speed as SpeedIcon,
    LocalGasStation as FuelIcon,
    DirectionsCar as CarIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { fetchTireStatus, fetchPitRecommendation, fetchCompoundComparison } from '../services/api';

function PitStrategyPanel({ raceId = "01", track = null }) {
    // Race state
    const [currentLap, setCurrentLap] = useState(15);
    const [totalLaps, setTotalLaps] = useState(50);
    const [currentPosition, setCurrentPosition] = useState(5);

    // Tire state
    const [tireCompound, setTireCompound] = useState('medium');
    const [tireStintLaps, setTireStintLaps] = useState(15);
    const [trackTemp, setTrackTemp] = useState(25);

    // Fuel state
    const [fuelRemaining, setFuelRemaining] = useState(45.0);

    // Gap state
    const [gapAhead, setGapAhead] = useState(2.5);
    const [gapBehind, setGapBehind] = useState(3.2);
    const [isCaution, setIsCaution] = useState(false);

    // Data state
    const [tireStatus, setTireStatus] = useState(null);
    const [pitRecommendation, setPitRecommendation] = useState(null);
    const [compoundComparison, setCompoundComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStrategyData();
    }, [currentLap, totalLaps, tireCompound, tireStintLaps, fuelRemaining, trackTemp, gapAhead, gapBehind, isCaution, raceId, track]);

    const loadStrategyData = async () => {
        try {
            setLoading(true);

            // Load all strategy data in parallel
            const [tireData, pitData, comparisonData] = await Promise.all([
                fetchTireStatus({
                    raceId,
                    track,
                    compound: tireCompound,
                    currentStintLaps: tireStintLaps,
                    trackTemp
                }),
                fetchPitRecommendation({
                    raceId,
                    track,
                    currentLap,
                    totalLaps,
                    currentPosition,
                    fuelRemaining,
                    tireCompound,
                    tireStintLaps,
                    gapAhead,
                    gapBehind,
                    isCaution
                }),
                fetchCompoundComparison(totalLaps, currentLap)
            ]);

            setTireStatus(tireData);
            setPitRecommendation(pitData);
            setCompoundComparison(comparisonData);
            setError(null);
        } catch (err) {
            setError('Failed to load strategy data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'good': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'info';
        }
    };

    const getCompoundEmoji = (compound) => {
        switch (compound.toLowerCase()) {
            case 'soft': return '🔴';
            case 'medium': return '🟡';
            case 'hard': return '⚪';
            default: return '⚫';
        }
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
            <Alert severity="error" sx={{ mb: 3 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🏁 Pit Strategy Command Center
            </Typography>

            {/* Main Pit Recommendation */}
            <Paper
                elevation={4}
                sx={{
                    p: 3,
                    mb: 3,
                    background: pitRecommendation?.should_pit
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CarIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                {pitRecommendation?.should_pit ? '🚨 PIT NOW' : '✅ STAY OUT'}
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                Strategy: {pitRecommendation?.strategy?.toUpperCase()}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5">Lap {currentLap} / {totalLaps}</Typography>
                        <Typography variant="body1">Position: P{currentPosition}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />

                <Box>
                    <Typography variant="h6" gutterBottom>📋 Reasoning:</Typography>
                    {pitRecommendation?.reasoning?.map((reason, idx) => (
                        <Typography key={idx} variant="body1" sx={{ mb: 0.5, pl: 2 }}>
                            • {reason}
                        </Typography>
                    ))}
                </Box>

                {pitRecommendation?.should_pit && (
                    <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        <Typography variant="body1" fontWeight="bold">
                            Optimal Pit Window: Lap {pitRecommendation.optimal_lap}
                        </Typography>
                    </Alert>
                )}
            </Paper>

            <Grid container spacing={3}>
                {/* Tire Status */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SpeedIcon color="primary" />
                                <Typography variant="h6">
                                    Tire Status {getCompoundEmoji(tireCompound)}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Performance Index
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {tireStatus?.performance_index?.toFixed(1)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={tireStatus?.performance_index || 0}
                                    color={getStatusColor(tireStatus?.status)}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Chip
                                    label={tireStatus?.status?.toUpperCase()}
                                    color={getStatusColor(tireStatus?.status)}
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Compound</Typography>
                                    <Typography variant="h6">{tireCompound.toUpperCase()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Stint Laps</Typography>
                                    <Typography variant="h6">{tireStintLaps}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Remaining Laps</Typography>
                                    <Typography variant="h6">{tireStatus?.estimated_remaining_laps}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Degradation</Typography>
                                    <Typography variant="h6">
                                        {tireStatus?.degradation_rate?.toFixed(3)}s/lap
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Fuel Status */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <FuelIcon color="primary" />
                                <Typography variant="h6">Fuel Status</Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Fuel Remaining
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {fuelRemaining.toFixed(1)}L
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(fuelRemaining / 120) * 100}
                                    color={fuelRemaining < 20 ? 'error' : fuelRemaining < 40 ? 'warning' : 'success'}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Laps on Fuel</Typography>
                                    <Typography variant="h6">
                                        {pitRecommendation?.laps_on_fuel?.toFixed(1)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Consumption</Typography>
                                    <Typography variant="h6">
                                        {pitRecommendation?.fuel_consumption_rate?.toFixed(2)}L/lap
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    {pitRecommendation?.laps_on_fuel < (totalLaps - currentLap) && (
                                        <Alert severity="error" icon={<WarningIcon />}>
                                            <Typography variant="body2">
                                                ⚠️ Fuel critical! Will run out in {pitRecommendation?.laps_on_fuel?.toFixed(0)} laps
                                            </Typography>
                                        </Alert>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pit Windows */}
                <Grid item xs={12}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                ⏰ Optimal Pit Windows
                            </Typography>

                            {pitRecommendation?.windows && pitRecommendation.windows.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Lap Window</strong></TableCell>
                                                <TableCell><strong>Reason</strong></TableCell>
                                                <TableCell><strong>Time Loss</strong></TableCell>
                                                <TableCell><strong>Confidence</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pitRecommendation.windows.map((window, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Chip
                                                            label={`Lap ${window.lap_start}-${window.lap_end}`}
                                                            color={idx === 0 ? 'primary' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{window.reason}</TableCell>
                                                    <TableCell>{window.estimated_time_loss.toFixed(1)}s</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={window.confidence * 100}
                                                                sx={{ width: 60, height: 6 }}
                                                            />
                                                            <Typography variant="body2">
                                                                {(window.confidence * 100).toFixed(0)}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info">
                                    No immediate pit windows detected. Continue monitoring.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Compound Comparison */}
                <Grid item xs={12}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🔄 Tire Compound Strategy Comparison
                            </Typography>

                            {compoundComparison?.strategies && (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Compound</strong></TableCell>
                                                <TableCell><strong>Tire Life</strong></TableCell>
                                                <TableCell><strong>Can Finish</strong></TableCell>
                                                <TableCell><strong>Pit Stops</strong></TableCell>
                                                <TableCell><strong>Total Time Impact</strong></TableCell>
                                                <TableCell><strong>Recommended</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {compoundComparison.strategies.map((strategy, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    sx={{
                                                        bgcolor: strategy.recommended ? 'success.light' : 'transparent',
                                                        opacity: strategy.recommended ? 1 : 0.7
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Chip
                                                            label={`${getCompoundEmoji(strategy.compound)} ${strategy.compound.toUpperCase()}`}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{strategy.tire_life} laps</TableCell>
                                                    <TableCell>
                                                        {strategy.can_finish ? (
                                                            <CheckIcon color="success" />
                                                        ) : (
                                                            <WarningIcon color="error" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{strategy.pit_stops_needed}</TableCell>
                                                    <TableCell>
                                                        <strong>{strategy.total_time_impact.toFixed(1)}s</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        {strategy.recommended && (
                                                            <Chip label="BEST" color="success" size="small" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Race Parameters Control Panel */}
                <Grid item xs={12}>
                    <Card elevation={3} sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🎛️ Strategy Simulator
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Adjust parameters to simulate different race scenarios
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Current Lap: {currentLap}</Typography>
                                    <Slider
                                        value={currentLap}
                                        onChange={(e, val) => setCurrentLap(val)}
                                        min={1}
                                        max={totalLaps}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Total Laps: {totalLaps}</Typography>
                                    <Slider
                                        value={totalLaps}
                                        onChange={(e, val) => setTotalLaps(val)}
                                        min={20}
                                        max={100}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Tire Stint Laps: {tireStintLaps}</Typography>
                                    <Slider
                                        value={tireStintLaps}
                                        onChange={(e, val) => setTireStintLaps(val)}
                                        min={0}
                                        max={40}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tire Compound</InputLabel>
                                        <Select
                                            value={tireCompound}
                                            label="Tire Compound"
                                            onChange={(e) => setTireCompound(e.target.value)}
                                        >
                                            <MenuItem value="soft">🔴 Soft</MenuItem>
                                            <MenuItem value="medium">🟡 Medium</MenuItem>
                                            <MenuItem value="hard">⚪ Hard</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Fuel Remaining: {fuelRemaining.toFixed(1)}L</Typography>
                                    <Slider
                                        value={fuelRemaining}
                                        onChange={(e, val) => setFuelRemaining(val)}
                                        min={0}
                                        max={120}
                                        step={5}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Gap Ahead: {gapAhead.toFixed(1)}s</Typography>
                                    <Slider
                                        value={gapAhead}
                                        onChange={(e, val) => setGapAhead(val)}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Gap Behind: {gapBehind.toFixed(1)}s</Typography>
                                    <Slider
                                        value={gapBehind}
                                        onChange={(e, val) => setGapBehind(val)}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography gutterBottom>Track Temp: {trackTemp}°C</Typography>
                                    <Slider
                                        value={trackTemp}
                                        onChange={(e, val) => setTrackTemp(val)}
                                        min={10}
                                        max={45}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={isCaution}
                                                onChange={(e) => setIsCaution(e.target.checked)}
                                            />
                                        }
                                        label="🚨 Caution Period"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={loadStrategyData}
                                    startIcon={<TrendingUpIcon />}
                                >
                                    Refresh Strategy
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setCurrentLap(15);
                                        setTireStintLaps(15);
                                        setFuelRemaining(45);
                                        setGapAhead(2.5);
                                        setGapBehind(3.2);
                                        setIsCaution(false);
                                    }}
                                >
                                    Reset to Defaults
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PitStrategyPanel;