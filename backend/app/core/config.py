# ============================================================
#  backend/app/core/config.py
#  Configuracoes centralizadas do Radar Recife.
#  Todas as variaveis sensiveis vem do arquivo .env.
# ============================================================

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Informacoes da aplicacao
    APP_NAME: str = "Radar Recife"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Banco de dados
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # APIs meteorologicas
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"

    # Intervalo de atualizacao (segundos)
    INTERVALO_COLETA: int = 600       # 10 minutos
    INTERVALO_ALERTAS: int = 600      # 10 minutos
    INTERVALO_PREVISAO: int = 1800    # 30 minutos
    INTERVALO_ELNINO: int = 2592000   # 30 dias

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna as configuracoes da aplicacao usando cache.
    lru_cache garante que o arquivo .env e lido apenas uma vez.
    """
    return Settings()
