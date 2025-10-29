"""
Efficient data loading and processing for racing datasets
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Dict, List
import logging
from functools import lru_cache
import pickle

from ..config import settings

logger = logging.getLogger(__name__)


class RacingDataLoader:
    """
    Handles loading and caching of racing data files.
    Optimized for large datasets with chunked reading and caching.
    """
    
    def __init__(self):
        self.cache_dir = settings.PROCESSED_DATA_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_path(self, filename: str) -> Path:
        """Get cache file path for a dataset"""
        return self.cache_dir / f"{filename}.pkl"
    
    def _load_from_cache(self, filename: str) -> Optional[pd.DataFrame]:
        """Load data from cache if it exists"""
        cache_path = self._get_cache_path(filename)
        if cache_path.exists():
            logger.info(f"Loading {filename} from cache")
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        return None
    
    def _save_to_cache(self, df: pd.DataFrame, filename: str):
        """Save data to cache"""
        cache_path = self._get_cache_path(filename)
        logger.info(f"Saving {filename} to cache")
        with open(cache_path, 'wb') as f:
            pickle.dump(df, f)
    
    def load_csv(
        self,
        filepath: Path,
        use_cache: bool = True,
        chunk_size: Optional[int] = None,
        **pandas_kwargs
    ) -> pd.DataFrame:
        """
        Load CSV file with optional caching and chunked reading.
        
        Args:
            filepath: Path to CSV file
            use_cache: Whether to use cached version if available
            chunk_size: If set, read file in chunks (useful for very large files)
            **pandas_kwargs: Additional arguments to pass to pd.read_csv
            
        Returns:
            DataFrame with loaded data
        """
        filename = filepath.stem
        
        # Try cache first
        if use_cache:
            cached_df = self._load_from_cache(filename)
            if cached_df is not None:
                return cached_df
        
        # Load from file
        logger.info(f"Loading {filepath.name} from disk")
        
        if chunk_size:
            # Load in chunks for very large files
            chunks = []
            for chunk in pd.read_csv(filepath, chunksize=chunk_size, **pandas_kwargs):
                chunks.append(chunk)
            df = pd.concat(chunks, ignore_index=True)
        else:
            df = pd.read_csv(filepath, **pandas_kwargs)
        
        # Save to cache
        if use_cache:
            self._save_to_cache(df, filename)
        
        logger.info(f"Loaded {len(df)} rows from {filepath.name}")
        return df
    
    def load_telemetry(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """
        Load telemetry data for a specific race.
        
        Args:
            race_id: Race identifier (e.g., "R1", "Race_1")
            track: Optional track name (e.g., "sonoma", "barber-motorsports-park")
        
        Returns DataFrame with columns:
        - timestamp, lap, driver_id, speed, throttle, brake, gear, etc.
        """
        # Search pattern for telemetry files
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*telemetry*{race_id}*.csv"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*telemetry*{race_id}*.csv"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            logger.warning(f"No telemetry files found matching {file_pattern} in {search_path}")
            return pd.DataFrame()
        
        logger.info(f"Found telemetry file: {files[0]}")
        df = self.load_csv(files[0])
        
        # Data cleaning and type conversion
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        
        return df
    
    def load_lap_times(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """
        Load lap time data for a specific race.
        
        Args:
            race_id: Race identifier
            track: Optional track name
        
        Returns DataFrame with lap times, sectors, and driver info.
        """
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*lap_time*{race_id}*.csv"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*lap_time*{race_id}*.csv"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            logger.warning(f"No lap time files found matching {file_pattern}")
            return pd.DataFrame()
        
        logger.info(f"Found lap time file: {files[0]}")
        df = self.load_csv(files[0])
        
        # Ensure lap time is numeric
        if 'lap_time' in df.columns:
            df['lap_time'] = pd.to_numeric(df['lap_time'], errors='coerce')
        
        return df
    
    def load_lap_start_times(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """Load lap start times"""
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*lap_start_time*{race_id}*.csv"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*lap_start_time*{race_id}*.csv"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            return pd.DataFrame()
        
        df = self.load_csv(files[0])
        if 'start_time' in df.columns:
            df['start_time'] = pd.to_datetime(df['start_time'], errors='coerce')
        
        return df
    
    def load_lap_end_times(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """Load lap end times"""
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*lap_end_time*{race_id}*.csv"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*lap_end_time*{race_id}*.csv"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            return pd.DataFrame()
        
        df = self.load_csv(files[0])
        if 'end_time' in df.columns:
            df['end_time'] = pd.to_datetime(df['end_time'], errors='coerce')
        
        return df
    
    def load_race_results(self, race_id: Optional[str] = None, track: Optional[str] = None) -> pd.DataFrame:
        """
        Load race results data.
        
        Args:
            race_id: Optional race identifier
            track: Optional track name
        
        Returns DataFrame with final positions, times, and classifications.
        """
        if track:
            search_path = settings.RAW_DATA_DIR / track
        else:
            search_path = settings.RAW_DATA_DIR
        
        if race_id:
            file_pattern = f"**/*Results*{race_id}*.CSV" if not track else f"*Results*{race_id}*.CSV"
        else:
            file_pattern = "**/*Results*.CSV" if not track else "*Results*.CSV"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            logger.warning(f"No results files found")
            return pd.DataFrame()
        
        # Load the first matching file
        logger.info(f"Found results file: {files[0]}")
        return self.load_csv(files[0])
    
    def load_weather(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """
        Load weather data for a specific race.
        
        Args:
            race_id: Race identifier
            track: Optional track name
        
        Returns DataFrame with track temperature, air temp, humidity, etc.
        """
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*Weather*{race_id}*.CSV"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*Weather*{race_id}*.CSV"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            logger.warning(f"No weather files found")
            return pd.DataFrame()
        
        logger.info(f"Found weather file: {files[0]}")
        df = self.load_csv(files[0])
        
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        
        return df
    
    def load_best_laps(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """Load best lap times by driver"""
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*Best*Laps*{race_id}*.CSV"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*Best*Laps*{race_id}*.CSV"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            return pd.DataFrame()
        
        logger.info(f"Found best laps file: {files[0]}")
        return self.load_csv(files[0])
    
    def load_endurance_analysis(self, race_id: str = "R1", track: Optional[str] = None) -> pd.DataFrame:
        """Load endurance race analysis with sections"""
        if track:
            search_path = settings.RAW_DATA_DIR / track
            file_pattern = f"*Endurance*{race_id}*.CSV"
        else:
            search_path = settings.RAW_DATA_DIR
            file_pattern = f"**/*Endurance*{race_id}*.CSV"
        
        files = list(search_path.glob(file_pattern))
        
        if not files:
            return pd.DataFrame()
        
        logger.info(f"Found endurance analysis file: {files[0]}")
        return self.load_csv(files[0])
    
    def get_available_tracks(self) -> List[str]:
        """
        Get list of available track folders.
        
        Returns:
            List of track names (folder names in data/raw/)
        """
        tracks = []
        for path in settings.RAW_DATA_DIR.iterdir():
            if path.is_dir() and not path.name.startswith('.'):
                tracks.append(path.name)
        return sorted(tracks)
    
    def get_race_summary(self, race_id: str = "R1", track: Optional[str] = None) -> Dict:
        """
        Get a summary of available data for a race.
        
        Args:
            race_id: Race identifier
            track: Optional track name
        
        Returns:
            Dictionary with counts and info about available datasets
        """
        summary = {
            "race_id": race_id,
            "track": track or "auto-detect",
            "datasets": {}
        }
        
        # Check each dataset
        datasets = {
            "telemetry": self.load_telemetry(race_id, track),
            "lap_times": self.load_lap_times(race_id, track),
            "results": self.load_race_results(race_id, track),
            "weather": self.load_weather(race_id, track),
            "best_laps": self.load_best_laps(race_id, track),
        }
        
        for name, df in datasets.items():
            if not df.empty:
                summary["datasets"][name] = {
                    "rows": len(df),
                    "columns": list(df.columns),
                    "memory_mb": df.memory_usage(deep=True).sum() / 1024**2
                }
        
        return summary
    
    def clear_cache(self):
        """Clear all cached data"""
        cache_files = list(self.cache_dir.glob("*.pkl"))
        for file in cache_files:
            file.unlink()
        logger.info(f"Cleared {len(cache_files)} cache files")


# Create singleton instance
data_loader = RacingDataLoader()