# ============================================================
#  backend/app/core/config.py
#  Configuracoes centralizadas do Radar Recife.
# ============================================================

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Informacoes da aplicacao
    APP_NAME:    str  = "Radar Recife"
    APP_VERSION: str  = "1.0.0"
    DEBUG:       bool = False

    # CORS — string simples para evitar problema de parsing JSON do pydantic
    # Desenvolvimento: ALLOWED_ORIGINS=*
    # Producao: ALLOWED_ORIGINS=https://radarrecife.up.railway.app
    ALLOWED_ORIGINS: str = "*"

    # APIs meteorologicas
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"

    # Cache TTL em segundos
    CACHE_CLIMA_TTL:    int = 300      # 5 minutos
    CACHE_ELNINO_TTL:   int = 86400    # 24 horas
    CACHE_MARINE_TTL:   int = 1800     # 30 minutos
    CACHE_NOTICIAS_TTL: int = 600      # 10 minutos

    # Intervalos de atualizacao em segundos
    INTERVALO_COLETA:   int = 600
    INTERVALO_PREVISAO: int = 1800
    INTERVALO_ELNINO:   int = 2592000

    @property
    def allowed_origins_list(self) -> list[str]:
        """
        Converte ALLOWED_ORIGINS string para lista.
        Suporta: "*" ou "https://a.com,https://b.com"
        """
        if self.ALLOWED_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file          = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Retorna as configuracoes com cache — .env lido apenas uma vez."""
    return Settings()
