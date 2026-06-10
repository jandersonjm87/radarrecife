# ============================================================
#  backend/app/integrations/noticias_rss.py
#
#  Responsabilidade: buscar noticias relevantes sobre clima
#  e alagamentos nos principais portais de Pernambuco via RSS.
#
#  Filtra automaticamente por palavras-chave relacionadas
#  a chuva, alagamento e condicoes climaticas.
# ============================================================

import feedparser
import httpx
from datetime import datetime
from typing import Optional

# ── Portais monitorados ───────────────────────────────────
FONTES_RSS = [
    {"nome": "G1 PE",      "url": "https://g1.globo.com/rss/g1/pernambuco/"},
    {"nome": "CNN Brasil", "url": "https://www.cnnbrasil.com.br/feed/"},
    {"nome": "Metropoles", "url": "https://www.metropoles.com/feed"},
    {"nome": "UOL",        "url": "https://rss.uol.com.br/feed/noticias.xml"},
]

# ── Palavras-chave para filtrar noticias relevantes ───────
PALAVRAS_CLIMA = [
    "chuva", "chuvas", "alagamento", "alagamentos", "enchente",
    "enchentes", "temporal", "tempestade", "inundacao", "inundacoes",
    "transtorno", "interdicao", "interdito", "previsao do tempo",
    "alerta de chuva", "defesa civil", "granizo", "ventania",
    "precipitacao", "mm de chuva", "risco de alagamento",
    "capibaribe", "br-232", "apac pernambuco",
]



def _e_recente(data_str: str = "", dias: int = 30) -> bool:
    """Verifica se a noticia foi publicada nos ultimos X dias."""
    try:
        from email.utils import parsedate_to_datetime
        from datetime import timezone
        dt = parsedate_to_datetime(data_str)
        agora = datetime.now(timezone.utc)
        diferenca = agora - dt
        return diferenca.days <= dias
    except Exception:
        return True  # Se nao conseguir parsear, inclui a noticia


def _e_relevante(titulo: str, descricao: str) -> bool:
    """
    Verifica se uma noticia e relevante para o contexto
    de clima e alagamentos com base nas palavras-chave.
    """
    texto = f"{titulo} {descricao or ''}".lower()
    return any(palavra in texto for palavra in PALAVRAS_CLIMA)


def _formatar_data(data_str: str) -> str:
    """Formata a data da noticia para exibicao."""
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(data_str)
        return dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return data_str or ""


async def buscar_noticias_clima() -> list[dict]:
    """
    Busca noticias sobre clima e alagamentos nos portais locais.
    Filtra automaticamente por palavras-chave relevantes.
    Retorna lista ordenada por data, mais recentes primeiro.
    """
    noticias = []

    for fonte in FONTES_RSS:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    fonte["url"],
                    headers={"User-Agent": "RadarRecife/1.0"},
                    follow_redirects=True,
                )
                feed = feedparser.parse(response.text)

            for entrada in feed.entries[:20]:
                titulo = entrada.get("title", "")
                descricao = entrada.get("summary", "")
                link = entrada.get("link", "")
                data = entrada.get("published", "")

                if not titulo or not link:
                    continue

                if _e_relevante(titulo, descricao) and _e_recente(data_str=data, dias=30):
                    noticias.append({
                        "titulo":    titulo,
                        "descricao": descricao[:200] if descricao else "",
                        "link":      link,
                        "fonte":     fonte["nome"],
                        "data":      _formatar_data(data),
                        "data_raw":  data,
                    })

        except Exception as erro:
            print(f"Erro ao buscar RSS de {fonte['nome']}: {erro}")
            continue

    # Ordena por data — mais recentes primeiro
    noticias.sort(key=lambda n: n.get("data_raw", ""), reverse=True)

    return noticias[:15]
