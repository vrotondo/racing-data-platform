"""
Pit stop strategy optimization and analysis
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings

logger = logging.getLogger(__name__)


@dataclass
class PitWindow:
    """Represents an optimal pit stop window"""
    lap_start: int
    lap_end: int
    reason: str
    estimated_time_loss: float
    fuel_remaining: float
    tire_life_remaining: float
    confidence: float


@dataclass
class PitRecommendation:
    """Pit stop recommendation with detailed analysis"""
    should_pit: bool
    optimal_lap: int
    windows: List[PitWindow]
    strategy: str  # "undercut", "overcut", "normal", "caution"
    reasoning: List[str]
    alternative_strategies: List[Dict]


class PitStrategyOptimizer:
    """
    Optimizes pit stop strategy based on:
    - Fuel consumption
    - Tire degradation
    - Track position and gaps
    - Caution periods
    - Undercut/overcut opportunities
    """
    
    def __init__(self):
        self.pit_time_loss = settings.PIT_STOP_TIME_LOSS
        self.fuel_capacity = settings.FUEL_TANK_CAPACITY
        self.tire_life = settings.TIRE_LIFE_LAPS
    
    def calculate_fuel_consumption_rate(
        self,
        lap_times: pd.DataFrame,
        fuel_data: Optional[pd.DataFrame] = None
    ) -> float:
        """
        Calculate average fuel consumption per lap.
        
        Args:
            lap_times: DataFrame with lap time data
            fuel_data: Optional DataFrame with actual fuel measurements
            
        Returns:
            Average fuel consumption in liters per lap
        """
        if fuel_data is not None and 'fuel_used' in fuel_data.columns:
            return fuel_data['fuel_used'].mean()
        
        # Estimate based on race length (typical GR Cup consumption)
        # Average: 3-4 liters per lap for a sprint race
        estimated_consumption = 3.5
        
        logger.info(f"Estimated fuel consumption: {estimated_consumption} L/lap")
        return estimated_consumption
    
    def calculate_tire_degradation(
        self,
        lap_times: pd.DataFrame,
        tire_compound: str = "medium",
        current_stint_laps: int = 0
    ) -> Dict:
        """
        Calculate tire degradation and remaining life.
        
        Args:
            lap_times: DataFrame with lap times
            tire_compound: Current tire compound (soft/medium/hard)
            current_stint_laps: Laps on current tires
            
        Returns:
            Dictionary with degradation metrics
        """
        max_life = self.tire_life.get(tire_compound.lower(), 25)
        
        # Calculate degradation rate from lap time increase
        if len(lap_times) > 5:
            recent_times = lap_times['lap_time'].tail(5).mean()
            early_times = lap_times['lap_time'].head(5).mean()
            degradation_rate = (recent_times - early_times) / len(lap_times)
        else:
            degradation_rate = 0.0
        
        remaining_laps = max(0, max_life - current_stint_laps)
        life_percentage = (remaining_laps / max_life) * 100
        
        return {
            "compound": tire_compound,
            "stint_laps": current_stint_laps,
            "remaining_laps": remaining_laps,
            "life_percentage": life_percentage,
            "degradation_rate": degradation_rate,
            "performance_drop": degradation_rate * current_stint_laps
        }
    
    def find_pit_windows(
        self,
        current_lap: int,
        total_laps: int,
        fuel_remaining: float,
        tire_stint_laps: int,
        tire_compound: str,
        gap_ahead: float,
        gap_behind: float,
        fuel_consumption_rate: float
    ) -> List[PitWindow]:
        """
        Identify optimal pit stop windows.
        
        Args:
            current_lap: Current race lap
            total_laps: Total race distance
            fuel_remaining: Fuel left in tank (liters)
            tire_stint_laps: Laps on current tires
            tire_compound: Current tire compound
            gap_ahead: Gap to car ahead (seconds)
            gap_behind: Gap to car behind (seconds)
            fuel_consumption_rate: Fuel used per lap
            
        Returns:
            List of optimal pit windows
        """
        windows = []
        
        # Calculate remaining race distance
        laps_remaining = total_laps - current_lap
        
        # Fuel window
        laps_on_fuel = fuel_remaining / fuel_consumption_rate
        if laps_on_fuel < laps_remaining:
            fuel_pit_lap = int(current_lap + laps_on_fuel - 2)  # Pit 2 laps before running out
            windows.append(PitWindow(
                lap_start=max(current_lap + 1, fuel_pit_lap - 2),
                lap_end=fuel_pit_lap,
                reason="Fuel critical",
                estimated_time_loss=self.pit_time_loss,
                fuel_remaining=fuel_remaining,
                tire_life_remaining=self.tire_life[tire_compound] - tire_stint_laps,
                confidence=0.9
            ))
        
        # Tire window
        tire_life_remaining = self.tire_life[tire_compound] - tire_stint_laps
        if tire_life_remaining < 5:
            tire_pit_lap = current_lap + tire_life_remaining - 1
            windows.append(PitWindow(
                lap_start=current_lap + 1,
                lap_end=min(tire_pit_lap, total_laps - 1),
                reason="Tire degradation critical",
                estimated_time_loss=self.pit_time_loss,
                fuel_remaining=fuel_remaining,
                tire_life_remaining=tire_life_remaining,
                confidence=0.85
            ))
        
        # Undercut opportunity (if close to car ahead)
        if gap_ahead < 2.0 and tire_stint_laps > 8:
            undercut_lap = current_lap + 2
            windows.append(PitWindow(
                lap_start=undercut_lap,
                lap_end=undercut_lap + 1,
                reason=f"Undercut opportunity (gap: {gap_ahead:.1f}s)",
                estimated_time_loss=self.pit_time_loss,
                fuel_remaining=fuel_remaining,
                tire_life_remaining=tire_life_remaining,
                confidence=0.7
            ))
        
        # Strategic window (mid-race, good track position)
        if current_lap > total_laps * 0.3 and gap_behind > 5.0:
            strategic_lap = int(total_laps * 0.5)
            windows.append(PitWindow(
                lap_start=strategic_lap - 2,
                lap_end=strategic_lap + 2,
                reason="Strategic window with clear air",
                estimated_time_loss=self.pit_time_loss,
                fuel_remaining=fuel_remaining,
                tire_life_remaining=tire_life_remaining,
                confidence=0.6
            ))
        
        return sorted(windows, key=lambda w: w.confidence, reverse=True)
    
    def calculate_undercut_advantage(
        self,
        gap_to_ahead: float,
        tire_age_difference: int,
        track_overtaking_difficulty: float = 0.7
    ) -> float:
        """
        Calculate time advantage from undercut strategy.
        
        Args:
            gap_to_ahead: Current gap to car ahead (seconds)
            tire_age_difference: Lap difference in tire age
            track_overtaking_difficulty: 0-1 scale (higher = harder to pass)
            
        Returns:
            Estimated time gain in seconds
        """
        # New tires gain approximately 0.3-0.5s per lap
        tire_advantage_per_lap = 0.4
        
        # Out-lap advantage (fresh tires vs worn)
        out_lap_gain = tire_advantage_per_lap * 2
        
        # In-lap gain (opponent slows for pit entry)
        in_lap_gain = 0.5
        
        # Total potential gain
        total_gain = out_lap_gain + in_lap_gain
        
        # Account for tire age difference
        if tire_age_difference > 0:
            total_gain += tire_advantage_per_lap * min(tire_age_difference, 5)
        
        # Adjust for pit stop time loss
        net_advantage = total_gain - self.pit_time_loss
        
        # Factor in overtaking difficulty
        if net_advantage + gap_to_ahead < 0:
            # Successful undercut
            success_probability = 1 - track_overtaking_difficulty
            return net_advantage * success_probability
        
        return net_advantage
    
    def recommend_pit_strategy(
        self,
        current_lap: int,
        total_laps: int,
        current_position: int,
        fuel_remaining: float,
        tire_compound: str,
        tire_stint_laps: int,
        gap_ahead: float,
        gap_behind: float,
        is_caution: bool = False,
        fuel_consumption_rate: Optional[float] = None
    ) -> PitRecommendation:
        """
        Generate comprehensive pit stop recommendation.
        
        Returns:
            PitRecommendation with detailed strategy and reasoning
        """
        if fuel_consumption_rate is None:
            fuel_consumption_rate = 3.5  # Default estimate
        
        reasoning = []
        
        # Find all possible pit windows
        windows = self.find_pit_windows(
            current_lap=current_lap,
            total_laps=total_laps,
            fuel_remaining=fuel_remaining,
            tire_stint_laps=tire_stint_laps,
            tire_compound=tire_compound,
            gap_ahead=gap_ahead,
            gap_behind=gap_behind,
            fuel_consumption_rate=fuel_consumption_rate
        )
        
        # Determine if we should pit now
        should_pit = False
        strategy = "normal"
        
        # Check for critical situations
        laps_remaining = total_laps - current_lap
        fuel_laps_remaining = fuel_remaining / fuel_consumption_rate
        tire_life_remaining = self.tire_life[tire_compound] - tire_stint_laps
        
        # Caution period strategy
        if is_caution:
            should_pit = True
            strategy = "caution"
            reasoning.append("Caution period - pit now to minimize time loss")
        
        # Fuel critical
        elif fuel_laps_remaining < laps_remaining + 2:
            should_pit = True
            strategy = "fuel_critical"
            reasoning.append(f"Fuel critical: only {fuel_laps_remaining:.1f} laps remaining")
        
        # Tire critical
        elif tire_life_remaining < 3:
            should_pit = True
            strategy = "tire_critical"
            reasoning.append(f"Tire life critical: only {tire_life_remaining} laps remaining")
        
        # Undercut opportunity
        elif gap_ahead < 2.0 and tire_stint_laps > 8:
            undercut_advantage = self.calculate_undercut_advantage(
                gap_ahead, tire_stint_laps - 8
            )
            if undercut_advantage > 0:
                should_pit = True
                strategy = "undercut"
                reasoning.append(
                    f"Undercut opportunity: {gap_ahead:.1f}s gap, "
                    f"estimated gain: {undercut_advantage:.1f}s"
                )
        
        # Normal strategic window
        elif current_lap in range(
            int(total_laps * 0.4),
            int(total_laps * 0.6)
        ) and gap_behind > 5.0:
            should_pit = True
            strategy = "strategic"
            reasoning.append("Strategic pit window with clear air behind")
        
        # If not pitting, explain why
        if not should_pit:
            reasoning.append(f"Continue: {fuel_laps_remaining:.1f} fuel laps, {tire_life_remaining} tire laps remaining")
            if gap_behind < 3.0:
                reasoning.append(f"Risk: Car {gap_behind:.1f}s behind may undercut")
        
        # Determine optimal lap from windows
        optimal_lap = current_lap + 1
        if windows:
            optimal_lap = windows[0].lap_start
        
        # Generate alternative strategies
        alternatives = []
        if not should_pit:
            alternatives.append({
                "strategy": "Early pit",
                "lap": current_lap + 2,
                "pros": ["Fresh tires", "Clear air"],
                "cons": ["Potential overcut vulnerability"]
            })
            alternatives.append({
                "strategy": "Late pit",
                "lap": int(total_laps * 0.7),
                "pros": ["Track position", "Tire advantage at end"],
                "cons": ["Fuel/tire risk"]
            })
        
        return PitRecommendation(
            should_pit=should_pit,
            optimal_lap=optimal_lap,
            windows=windows,
            strategy=strategy,
            reasoning=reasoning,
            alternative_strategies=alternatives
        )


# Create singleton instance
pit_optimizer = PitStrategyOptimizer()