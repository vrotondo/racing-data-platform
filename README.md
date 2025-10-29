# Data Directory

This directory contains all race data for the Racing Data Platform.

## Directory Structure

```
data/
├── raw/              # Place your downloaded datasets here
├── processed/        # Processed/cleaned data (auto-generated)
└── cache/            # Cached computations (auto-generated)
```

## How to Use

1. **Download the datasets** from https://trddev.com/hackathon-2025/

2. **Place all downloaded files** in the `raw/` directory:
   ```bash
   cp /path/to/downloaded/data/*.csv data/raw/
   ```

3. **Supported file formats**:
   - CSV (.csv)
   - JSON (.json)
   - Parquet (.parquet)
   - Excel (.xlsx)

4. The platform will automatically discover and load data from the `raw/` directory

## Data Files

After downloading from the hackathon website, you should have files containing:
- Telemetry data (speed, throttle, brake, gear, etc.)
- Lap times and sector times
- Session information
- Driver information
- Tire data
- Fuel consumption data

## Processing

The backend will:
- Automatically discover available datasets
- Parse and validate the data
- Cache processed results for faster access
- Generate analytics and insights

## Notes

- The `raw/` directory is NOT tracked in git (too large)
- Only add your actual race data files here
- The platform supports multiple sessions and drivers
- Data will be loaded on-demand to optimize memory usage

## Example Data Structure

Your raw data files might look like:
```
data/raw/
├── session_1_telemetry.csv
├── session_1_laps.csv
├── session_2_telemetry.csv
├── session_2_laps.csv
└── drivers.json
```

## Troubleshooting

If data isn't loading:
1. Check file formats are supported
2. Verify files are in `data/raw/`
3. Check backend logs for errors
4. Ensure data follows expected schema