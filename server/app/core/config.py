from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pholar Naturals API"
    DATABASE_URL: str

    # Stripe Settings
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    DOMAIN: str = "http://localhost:3000"

    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ADMIN_REGISTRATION_KEY: str 

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Resend
    RESEND_API_KEY: Optional[str] = None
    DEFAULT_FROM_EMAIL: str = "onboarding@resend.dev"


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()