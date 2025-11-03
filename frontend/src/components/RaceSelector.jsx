import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

function RaceSelector({ races, selectedRace, onRaceChange }) {
    return (
        <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
                <InputLabel>Select Race</InputLabel>
                <Select
                    value={selectedRace}
                    label="Select Race"
                    onChange={(e) => onRaceChange(e.target.value)}
                >
                    {races.map((race) => (
                        <MenuItem key={race} value={race}>
                            🏁 Race {race}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}

export default RaceSelector;