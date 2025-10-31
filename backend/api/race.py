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


# ==========================================
# PIT STRATEGY ENDPOINTS
# ==========================================

@router.get("/strategy/tire-status")
async def get_tire_status(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name"),
    driver_id: Optional[str] = Query(None, description="Driver ID"),
    compound: str = Query("medium", description="Tire compound (soft/medium/hard)"),
    current_stint_laps: int = Query(10, description="Laps on current tires"),
    track_temp: Optional[float] = Query(None, description="Track temperature (°C)")
) -> Dict:
    """
    Get tire degradation analysis and predictions.
    """
    try:
        # Load lap times for degradation analysis
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            # Return basic prediction without historical data
            prediction = tire_model.TirePrediction(
                compound=compound,
                current_lap=current_stint_laps,
                estimated_remaining_laps=tire_model.tire_model.estimate_tire_life(compound, track_temp) - current_stint_laps,
                degradation_rate=tire_model.tire_model.degradation_rates.get(compound.lower(), 0.05),
                performance_index=max(0, 100 - (current_stint_laps * 4)),
                recommended_change_lap=tire_model.tire_model.estimate_tire_life(compound, track_temp) - 2,
                confidence=0.6
            )
        else:
            # Filter to specific driver if provided
            if driver_id:
                lap_times_df = lap_times_df[lap_times_df['driver_id'] == driver_id]
            
            # Get tire prediction with historical data
            prediction = tire_model.predict_tire_performance(
                compound=compound,
                current_stint_laps=current_stint_laps,
                lap_times=lap_times_df,
                track_temp=track_temp
            )
        
        return {
            "compound": prediction.compound,
            "current_lap": prediction.current_lap,
            "estimated_remaining_laps": prediction.estimated_remaining_laps,
            "degradation_rate": float(prediction.degradation_rate),
            "performance_index": float(prediction.performance_index),
            "recommended_change_lap": prediction.recommended_change_lap,
            "confidence": float(prediction.confidence),
            "status": "critical" if prediction.performance_index < 30 else "warning" if prediction.performance_index < 60 else "good"
        }
    except Exception as e:
        logger.error(f"Error getting tire status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategy/pit-recommendation")
async def get_pit_recommendation(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name"),
    current_lap: int = Query(15, description="Current lap number"),
    total_laps: int = Query(50, description="Total race laps"),
    current_position: int = Query(5, description="Current position"),
    fuel_remaining: float = Query(45.0, description="Fuel remaining (liters)"),
    tire_compound: str = Query("medium", description="Current tire compound"),
    tire_stint_laps: int = Query(15, description="Laps on current tires"),
    gap_ahead: float = Query(2.5, description="Gap to car ahead (seconds)"),
    gap_behind: float = Query(3.2, description="Gap to car behind (seconds)"),
    is_caution: bool = Query(False, description="Is there a caution period?")
) -> Dict:
    """
    Get pit stop strategy recommendation.
    """
    try:
        # Load lap times for fuel consumption calculation
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        # Calculate fuel consumption if we have data
        if not lap_times_df.empty:
            fuel_consumption_rate = pit_optimizer.calculate_fuel_consumption_rate(lap_times_df)
        else:
            fuel_consumption_rate = 3.5  # Default estimate
        
        # Get pit recommendation
        recommendation = pit_optimizer.recommend_pit_strategy(
            current_lap=current_lap,
            total_laps=total_laps,
            current_position=current_position,
            fuel_remaining=fuel_remaining,
            tire_compound=tire_compound,
            tire_stint_laps=tire_stint_laps,
            gap_ahead=gap_ahead,
            gap_behind=gap_behind,
            is_caution=is_caution,
            fuel_consumption_rate=fuel_consumption_rate
        )
        
        # Convert windows to dicts
        windows_data = [
            {
                "lap_start": w.lap_start,
                "lap_end": w.lap_end,
                "reason": w.reason,
                "estimated_time_loss": float(w.estimated_time_loss),
                "fuel_remaining": float(w.fuel_remaining),
                "tire_life_remaining": float(w.tire_life_remaining),
                "confidence": float(w.confidence)
            }
            for w in recommendation.windows
        ]
        
        return {
            "should_pit": recommendation.should_pit,
            "optimal_lap": recommendation.optimal_lap,
            "strategy": recommendation.strategy,
            "reasoning": recommendation.reasoning,
            "windows": windows_data,
            "alternative_strategies": recommendation.alternative_strategies,
            "fuel_consumption_rate": float(fuel_consumption_rate),
            "laps_on_fuel": float(fuel_remaining / fuel_consumption_rate)
        }
    except Exception as e:
        logger.error(f"Error getting pit recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategy/compare-compounds")
async def compare_tire_compounds(
    race_length: int = Query(50, description="Total race laps"),
    current_lap: int = Query(15, description="Current lap number")
) -> Dict:
    """
    Compare different tire compound strategies for the remainder of the race.
    """
    try:
        strategies = tire_model.compare_tire_strategies(
            race_length=race_length,
            current_lap=current_lap,
            compounds_available=["soft", "medium", "hard"]
        )
        
        return {
            "race_length": race_length,
            "current_lap": current_lap,
            "laps_remaining": race_length - current_lap,
            "strategies": strategies
        }
    except Exception as e:
        logger.error(f"Error comparing compounds: {e}")
        raise HTTPException(status_code=500, detail=str(e))