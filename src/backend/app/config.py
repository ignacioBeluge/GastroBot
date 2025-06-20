from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "Gastrobot API"
    debug: bool = True
    api_prefix: str = "/api"
    
    # Configuración de la base de datos
    database_url: str = "sqlite:///./gastrobot.db"
    
    # Configuración de seguridad
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings() 