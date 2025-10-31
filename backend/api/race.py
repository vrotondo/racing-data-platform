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
    """Get list of available tracks/venues."""
    try:
        tracks = data_loader.get_available_tracks()
        return {"tracks": tracks, "count": len(tracks)}
    except Exception as e:
        logger.error(f"Error getting tracks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_race_summary(
    race_id: str = Query("R1", description="Race identifier"),
    track: Optional[str] = Query(None, description="Track/venue name")
) -> Dict:
    """Get summary of race data."""
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
    """Get race results and final standings."""
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
    """Get lap time data for the race."""
    try:
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            raise HTTPException(status_code=404, detail="No lap time data found")
        
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
    """Get best lap times by driver."""
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
    """Get weather and track condition data."""
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
    """Get detailed performance analysis for a specific driver."""
    try:
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            raise HTTPException(status_code=404, detail="No data found")
        
        driver_laps = lap_times_df[lap_times_df['driver_id'] == driver_id]
        
        if driver_laps.empty:
            raise HTTPException(status_code=404, detail=f"No data for driver {driver_id}")
        
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


# ==============================================
# NEW: PIT STRATEGY ENDPOINTS
# ==============================================

@router.get("/strategy/tire-status")
async def get_tire_status(
    race_id: str = Query("R1"),
    track: Optional[str] = Query(None),
    driver_id: Optional[str] = Query(None),
    compound: str = Query("medium"),
    current_stint_laps: int = Query(10),
    track_temp: Optional[float] = Query(None)
) -> Dict:
    """Get tire degradation analysis and predictions."""
    try:
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
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
            if driver_id:
                lap_times_df = lap_times_df[lap_times_df['driver_id'] == driver_id]
            
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
    race_id: str = Query("R1"),
    track: Optional[str] = Query(None),
    current_lap: int = Query(15),
    total_laps: int = Query(50),
    current_position: int = Query(5),
    fuel_remaining: float = Query(45.0),
    tire_compound: str = Query("medium"),
    tire_stint_laps: int = Query(15),
    gap_ahead: float = Query(2.5),
    gap_behind: float = Query(3.2),
    is_caution: bool = Query(False)
) -> Dict:
    """Get pit stop strategy recommendation."""
    try:
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if not lap_times_df.empty:
            fuel_consumption_rate = pit_optimizer.calculate_fuel_consumption_rate(lap_times_df)
        else:
            fuel_consumption_rate = 3.5
        
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
    race_length: int = Query(50),
    current_lap: int = Query(15)
) -> Dict:
    """Compare different tire compound strategies."""
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


# ==============================================
# DRIVER COMPARISON ENDPOINT
# ==============================================

@router.get("/compare-drivers")
async def compare_drivers(
    race_id: str = Query("R1"),
    track: Optional[str] = Query(None),
    driver_ids: str = Query(..., description="Comma-separated driver IDs (e.g., '1,2,3')")
) -> Dict:
    """Compare performance metrics for multiple drivers."""
    try:
        # Parse driver IDs
        driver_list = [d.strip() for d in driver_ids.split(',')]
        
        if len(driver_list) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 drivers to compare")
        
        if len(driver_list) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 drivers for comparison")
        
        # Load lap times
        lap_times_df = data_loader.load_lap_times(race_id, track)
        
        if lap_times_df.empty:
            raise HTTPException(status_code=404, detail="No lap time data found")
        
        # Build comparison data
        comparison = {
            "race_id": race_id,
            "track": track,
            "drivers": []
        }
        
        for driver_id in driver_list:
            driver_laps = lap_times_df[lap_times_df['driver_id'] == driver_id]
            
            if driver_laps.empty:
                continue
            
            # Calculate stats
            best_lap = float(driver_laps['lap_time'].min())
            avg_lap = float(driver_laps['lap_time'].mean())
            worst_lap = float(driver_laps['lap_time'].max())
            consistency = float(driver_laps['lap_time'].std())
            total_laps = len(driver_laps)
            
            # Lap time progression
            lap_progression = driver_laps.sort_values('lap')[['lap', 'lap_time']].to_dict('records')
            
            comparison["drivers"].append({
                "driver_id": driver_id,
                "best_lap": best_lap,
                "average_lap": avg_lap,
                "worst_lap": worst_lap,
                "consistency_std": consistency,
                "total_laps": total_laps,
                "lap_progression": lap_progression
            })
        
        # Add head-to-head analysis
        if len(comparison["drivers"]) >= 2:
            # Find overall fastest driver
            fastest = min(comparison["drivers"], key=lambda d: d["best_lap"])
            most_consistent = min(comparison["drivers"], key=lambda d: d["consistency_std"])
            
            comparison["analysis"] = {
                "fastest_driver": fastest["driver_id"],
                "fastest_lap": fastest["best_lap"],
                "most_consistent_driver": most_consistent["driver_id"],
                "best_consistency": most_consistent["consistency_std"]
            }
        
        return comparison
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing drivers: {e}")
        raise HTTPException(status_code=500, detail=str(e))