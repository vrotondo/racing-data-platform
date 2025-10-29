"""
Configuration settings for the Racing Data Platform
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Racing Data Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API
    API_V1_PREFIX: str = "/api"
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    MODELS_DIR: Path = DATA_DIR / "models"
    
    # Track directories (data organized by track/venue)
    # Example: data/raw/barber-motorsports-park/, data/raw/circuit-of-the-americas/
    TRACKS_DIR: Path = RAW_DATA_DIR
    
    # Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    CACHE_TTL: int = 3600  # 1 hour
    USE_CACHE: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./racing_data.db"
    
    # ML Models
    TIRE_MODEL_PATH: Path = MODELS_DIR / "tire_degradation.joblib"
    LAP_TIME_MODEL_PATH: Path = MODELS_DIR / "lap_time_predictor.joblib"
    
    # Racing Constants
    PIT_STOP_TIME_LOSS: float = 25.0  # seconds lost during pit stop
    FUEL_TANK_CAPACITY: float = 120.0  # liters
    TIRE_LIFE_LAPS: dict = {
        "soft": 15,
        "medium": 25,
        "hard": 35
    }
    
    # Strategy Parameters
    OPTIMAL_FUEL_WINDOW: tuple = (10.0, 15.0)  # liters remaining
    MIN_PIT_WINDOW_GAP: float = 20.0  # seconds
    CAUTION_PROBABILITY_THRESHOLD: float = 0.3
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure directories exist
for directory in [
    settings.DATA_DIR,
    settings.RAW_DATA_DIR,
    settings.PROCESSED_DATA_DIR,
    settings.MODELS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)