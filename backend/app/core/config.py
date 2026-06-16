# ============================================================
#  backend/app/core/config.py
#  Configuracoes centralizadas do Radar Recife.
#  Variaveis sensiveis vem exclusivamente do .env / Railway env.
# ============================================================

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Informacoes da aplicacao
    APP_NAME: str    = "Radar Recife"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool      = False

    # CORS — em dev use "*", em producao use o dominio exato do Railway
    # Exemplo: ALLOWED_ORIGINS=https://radarrecife.up.railway.app
    ALLOWED_ORIGINS: List[str] = ["*"]

    # APIs meteorologicas
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"

    # Intervalos de atualizacao em segundos
    INTERVALO_COLETA:   int = 600      # 10 minutos
    INTERVALO_PREVISAO: int = 1800     # 30 minutos
    INTERVALO_ELNINO:   int = 2592000  # 30 dias

    # Cache TTL em segundos (evita chamadas repetidas a Open-Meteo)
    CACHE_CLIMA_TTL:    int = 300      # 5 minutos
    CACHE_ELNINO_TTL:   int = 86400    # 24 horas
    CACHE_MARINE_TTL:   int = 1800     # 30 minutos
    CACHE_NOTICIAS_TTL: int = 600      # 10 minutos

    class Config:
        env_file          = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna as configuracoes usando cache.
    lru_cache garante que o .env e lido apenas uma vez por processo.
    """
    return Settings()
