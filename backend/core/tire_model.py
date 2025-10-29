"""
Tire degradation prediction and analysis
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class TirePrediction:
    """Tire performance prediction"""
    compound: str
    current_lap: int
    estimated_remaining_laps: int
    degradation_rate: float  # seconds per lap
    performance_index: float  # 0-100, where 100 is optimal
    recommended_change_lap: int
    confidence: float


class TireDegradationModel:
    """
    Predicts tire degradation based on:
    - Historical lap time data
    - Track temperature
    - Driving style (braking/acceleration patterns)
    - Tire compound characteristics
    """
    
    def __init__(self):
        # Tire compound characteristics (baseline life in laps)
        self.compound_life = {
            "soft": 15,
            "medium": 25,
            "hard": 35
        }
        
        # Performance drop per lap (seconds)
        self.degradation_rates = {
            "soft": 0.08,
            "medium": 0.05,
            "hard": 0.03
        }
        
        # Temperature multipliers (how temp affects degradation)
        self.temp_factors = {
            "cold": 0.8,   # < 20°C
            "optimal": 1.0,  # 20-30°C
            "hot": 1.3     # > 30°C
        }
    
    def analyze_lap_time_progression(
        self,
        lap_times: pd.DataFrame,
        window_size: int = 5
    ) -> Dict:
        """
        Analyze how lap times degrade over a stint.
        
        Args:
            lap_times: DataFrame with 'lap' and 'lap_time' columns
            window_size: Rolling window for smoothing
            
        Returns:
            Dictionary with degradation metrics
        """
        if len(lap_times) < window_size:
            return {
                "degradation_rate": 0.0,
                "total_degradation": 0.0,
                "consistent": True
            }
        
        # Calculate rolling average to smooth out anomalies
        lap_times_sorted = lap_times.sort_values('lap').copy()
        lap_times_sorted['rolling_avg'] = (
            lap_times_sorted['lap_time']
            .rolling(window=window_size, min_periods=1)
            .mean()
        )
        
        # Calculate degradation rate (linear regression)
        laps = lap_times_sorted['lap'].values
        times = lap_times_sorted['rolling_avg'].values
        
        if len(laps) > 1:
            # Simple linear regression
            A = np.vstack([laps, np.ones(len(laps))]).T
            degradation_rate, intercept = np.linalg.lstsq(A, times, rcond=None)[0]
        else:
            degradation_rate = 0.0
        
        # Total degradation
        if len(times) > 1:
            total_degradation = times[-1] - times[0]
        else:
            total_degradation = 0.0
        
        # Check consistency (standard deviation)
        consistency = lap_times_sorted['lap_time'].std() < 0.5
        
        return {
            "degradation_rate": float(degradation_rate),
            "total_degradation": float(total_degradation),
            "consistent": bool(consistency),
            "lap_times": lap_times_sorted[['lap', 'lap_time', 'rolling_avg']].to_dict('records')
        }
    
    def estimate_tire_life(
        self,
        compound: str,
        track_temp: Optional[float] = None,
        driving_aggression: float = 1.0
    ) -> int:
        """
        Estimate tire life in laps.
        
        Args:
            compound: Tire compound (soft/medium/hard)
            track_temp: Track temperature in Celsius
            driving_aggression: Multiplier for aggressive driving (0.8-1.2)
            
        Returns:
            Estimated tire life in laps
        """
        base_life = self.compound_life.get(compound.lower(), 25)
        
        # Adjust for temperature
        if track_temp is not None:
            if track_temp < 20:
                temp_factor = self.temp_factors["cold"]
            elif track_temp > 30:
                temp_factor = self.temp_factors["hot"]
            else:
                temp_factor = self.temp_factors["optimal"]
        else:
            temp_factor = 1.0
        
        # Adjust for driving style
        adjusted_life = base_life * temp_factor / driving_aggression
        
        return int(adjusted_life)
    
    def predict_tire_performance(
        self,
        compound: str,
        current_stint_laps: int,
        lap_times: pd.DataFrame,
        track_temp: Optional[float] = None,
        weather_conditions: Optional[Dict] = None
    ) -> TirePrediction:
        """
        Predict tire performance and remaining life.
        
        Args:
            compound: Current tire compound
            current_stint_laps: Laps completed on current tires
            lap_times: Historical lap time data
            track_temp: Current track temperature
            weather_conditions: Additional weather data
            
        Returns:
            TirePrediction with detailed analysis
        """
        # Analyze actual degradation from lap times
        degradation_analysis = self.analyze_lap_time_progression(lap_times)
        actual_degradation_rate = degradation_analysis["degradation_rate"]
        
        # Get expected tire life
        expected_life = self.estimate_tire_life(compound, track_temp)
        
        # Calculate remaining laps
        remaining_laps = max(0, expected_life - current_stint_laps)
        
        # Performance index (0-100)
        # Starts at 100, decreases as tires wear
        performance_index = max(0, (remaining_laps / expected_life) * 100)
        
        # Recommended change lap
        # Change tires when performance drops below 30% or 3 laps remaining
        if performance_index < 30 or remaining_laps < 3:
            recommended_change_lap = current_stint_laps + 1
        else:
            recommended_change_lap = expected_life - 2  # 2 laps before complete wear
        
        # Confidence based on data consistency
        confidence = 0.8 if degradation_analysis["consistent"] else 0.6
        
        return TirePrediction(
            compound=compound,
            current_lap=current_stint_laps,
            estimated_remaining_laps=remaining_laps,
            degradation_rate=actual_degradation_rate,
            performance_index=performance_index,
            recommended_change_lap=recommended_change_lap,
            confidence=confidence
        )
    
    def compare_tire_strategies(
        self,
        race_length: int,
        current_lap: int,
        compounds_available: List[str] = ["soft", "medium", "hard"]
    ) -> List[Dict]:
        """
        Compare different tire strategy options.
        
        Args:
            race_length: Total race laps
            current_lap: Current lap number
            compounds_available: List of available compounds
            
        Returns:
            List of strategy options with analysis
        """
        strategies = []
        laps_remaining = race_length - current_lap
        
        for compound in compounds_available:
            tire_life = self.compound_life[compound.lower()]
            degradation = self.degradation_rates[compound.lower()]
            
            # Calculate if one stint can finish the race
            can_finish_on_one_stint = tire_life >= laps_remaining
            
            # Estimate total time loss from degradation
            if can_finish_on_one_stint:
                total_degradation = degradation * laps_remaining
                pit_stops = 0
            else:
                # Need multiple stints
                stints_needed = int(np.ceil(laps_remaining / tire_life))
                total_degradation = degradation * laps_remaining
                pit_stops = stints_needed - 1
            
            # Calculate total time impact
            # Pit stop = 25s loss, degradation = cumulative lap time loss
            total_time_impact = (pit_stops * 25) + total_degradation
            
            strategies.append({
                "compound": compound,
                "tire_life": tire_life,
                "can_finish": can_finish_on_one_stint,
                "pit_stops_needed": pit_stops,
                "degradation_per_lap": degradation,
                "total_degradation": total_degradation,
                "total_time_impact": total_time_impact,
                "recommended": False  # Will mark best strategy
            })
        
        # Sort by total time impact and mark best
        strategies = sorted(strategies, key=lambda x: x["total_time_impact"])
        if strategies:
            strategies[0]["recommended"] = True
        
        return strategies
    
    def predict_lap_time(
        self,
        base_lap_time: float,
        compound: str,
        stint_lap: int,
        track_temp: Optional[float] = None
    ) -> float:
        """
        Predict lap time based on tire wear.
        
        Args:
            base_lap_time: Optimal lap time on fresh tires
            compound: Tire compound
            stint_lap: Lap number in current stint
            track_temp: Track temperature
            
        Returns:
            Predicted lap time in seconds
        """
        degradation_rate = self.degradation_rates.get(compound.lower(), 0.05)
        
        # Temperature adjustment
        if track_temp is not None:
            if track_temp > 35:
                degradation_rate *= 1.2
            elif track_temp < 15:
                degradation_rate *= 0.9
        
        # Calculate degradation
        time_loss = degradation_rate * stint_lap
        
        return base_lap_time + time_loss


# Create singleton instance
tire_model = TireDegradationModel()