from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name:           str           = "Resume Analyzer API"
    app_version:        str           = "5.0.0"
    debug:              bool          = False
    max_upload_size_mb: int           = 10

    # Google AI Studio — enables AI insights layer
    ai_api_key:         Optional[str] = None

    # MongoDB — enables resume storage + GridFS file storage
    mongodb_uri:        Optional[str] = None

    # Allowed frontend origin for CORS (production).
    # Set to your Vercel URL, e.g. https://resume-insights.vercel.app
    # Leave blank in development — defaults to allow all origins.
    frontend_url:       Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
