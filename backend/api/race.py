"""
API endpoints for race data
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, List
import logging

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core import data_loader, pit_optimizer, tire_model

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tracks")
async def get_available_tracks() -> Dict:
    """
    Get list of available tracks/venues.
    """
    try:
        tracks = data_loader.get_available_tracks()
        return {
            "tracks": tracks,
            "count": len(tracks)
        }
    except Exception as e:
        logger.error(f"Error getting tracks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_race_summary(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """
    Get summary of race data.
    
    Returns information about available datasets and basic statistics.
    """
    try:
        summary = data_loader.get_race_summary(race_id, track)
        return summary
    except Exception as e:
        logger.error(f"Error getting race summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
async def get_race_results(
    race_id: Optional[str] = Query(None, description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """
    Get race results and final standings.
    """
    try:
        results_df = data_loader.load_race_results(race_id, track)
        
        if results_df.empty:
            raise HTTPException(status_code=404, detail="No results found")
        
        return {
            "race_id": race_id,
            "track": track,
            "total_drivers": len(results_df),
            "results": results_df.to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading race results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lap-times")
async def get_lap_times(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name"),
    driver_id: Optional[str] = Query(None, description="Filter by driver ID")
) -> Dict:
    """
    Get lap time data for the race.
    """
    try:
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            raise HTTPException(status_code=404, detail="No lap time data found")
        
        # Filter by driver if specified
        if driver_id:
            lap_times_df = lap_times_df[lap_times_df['driver_id'] == driver_id]
        
        return {
            "race_id": race_id,
            "track": track,
            "driver_id": driver_id,
            "total_laps": len(lap_times_df),
            "lap_times": lap_times_df.to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading lap times: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/best-laps")
async def get_best_laps(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """
    Get best lap times by driver.
    """
    try:
        best_laps_df = data_loader.load_best_laps(race_id, track)
        
        if best_laps_df.empty:
            raise HTTPException(status_code=404, detail="No best lap data found")
        
        return {
            "race_id": race_id,
            "track": track,
            "best_laps": best_laps_df.to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading best laps: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather")
async def get_weather_data(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """
    Get weather and track condition data.
    """
    try:
        weather_df = data_loader.load_weather(race_id, track)
        
        if weather_df.empty:
            raise HTTPException(status_code=404, detail="No weather data found")
        
        return {
            "race_id": race_id,
            "track": track,
            "conditions": weather_df.to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading weather data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/driver/{driver_id}/performance")
async def get_driver_performance(
    driver_id: str,
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """
    Get detailed performance analysis for a specific driver.
    """
    try:
        # Load driver's lap times
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            raise HTTPException(status_code=404, detail="No data found")
        
        driver_laps = lap_times_df[lap_times_df['driver_id'] == driver_id]
        
        if driver_laps.empty:
            raise HTTPException(status_code=404, detail=f"No data for driver {driver_id}")
        
        # Calculate statistics
        avg_lap_time = driver_laps['lap_time'].mean()
        best_lap = driver_laps['lap_time'].min()
        consistency = driver_laps['lap_time'].std()
        
        return {
            "driver_id": driver_id,
            "race_id": race_id,
            "track": track,
            "total_laps": len(driver_laps),
            "average_lap_time": float(avg_lap_time),
            "best_lap_time": float(best_lap),
            "consistency_std": float(consistency),
            "lap_times": driver_laps.to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing driver performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))