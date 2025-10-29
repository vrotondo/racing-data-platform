import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

function TrackSelector({ tracks, selectedTrack, onTrackChange }) {
    return (
        <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
                <InputLabel>Select Track</InputLabel>
                <Select
                    value={selectedTrack}
                    label="Select Track"
                    onChange={(e) => onTrackChange(e.target.value)}
                >
                    <MenuItem value="">All Tracks</MenuItem>
                    {tracks.map((track) => (
                        <MenuItem key={track} value={track}>
                            🏎️ {track.replace(/-/g, ' ').toUpperCase()}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}

export default TrackSelector;