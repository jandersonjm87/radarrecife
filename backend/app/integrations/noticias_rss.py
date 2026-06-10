# ============================================================
#  backend/app/integrations/noticias_rss.py
#
#  Motor de inteligencia climatica do Radar Recife.
#  Coleta noticias RSS, extrai locais citados, classifica
#  gravidade e gera impacto verificavel no IRA.
#
#  Principio: so gera alerta com evidencia textual real.
# ============================================================

import feedparser
import httpx
import re
from datetime import datetime, timezone, timedelta

# ── Fontes RSS monitoradas ────────────────────────────────
# G1 PE removido — feed retorna noticias de 2018 (feed quebrado)
# Fontes ativas com RSS funcional e noticias recentes
FONTES_RSS = [
    {"nome": "CNN Brasil",      "url": "https://www.cnnbrasil.com.br/feed/"},
    {"nome": "Metropoles",      "url": "https://www.metropoles.com/feed"},
    {"nome": "Clima Tempo",     "url": "https://www.climatempo.com.br/rss/noticias"},
    {"nome": "Agencia Brasil",  "url": "https://agenciabrasil.ebc.com.br/rss/geral/feed.xml"},
]

# ── Palavras que indicam ocorrencia real (nao previsao) ───
PALAVRAS_OCORRENCIA = [
    "alagou", "alagamento", "alagamentos", "alagada", "alagado",
    "enchente", "enchentes", "inundacao", "inundacoes", "inundou",
    "via interditada", "interdicao", "interdita", "bloqueada",
    "transito parado", "transito lento", "acumulo de agua",
    "agua na pista", "barro na pista", "deslizamento",
    "desabamento", "queda de barreira",
    "defesa civil", "emergencia", "evacuacao",
    "vitimas", "desabrigados", "desalojados",
]

# ── Palavras de previsao (menor peso) ─────────────────────
PALAVRAS_PREVISAO = [
    "previsao", "previsto", "esperado", "pode chover",
    "probabilidade de chuva", "alerta preventivo",
    "chuva prevista", "tempo fechado",
]

# ── Palavras gerais de clima ──────────────────────────────
PALAVRAS_CLIMA = [
    "chuva", "chuvas", "temporal", "tempestade",
    "granizo", "ventania", "precipitacao",
    "mm de chuva", "apac", "cemaden",
    "capibaribe", "beberibe", "br-232", "br-101",
]

# ── Bairros de Recife para extração ───────────────────────
BAIRROS_RECIFE = [
    "boa viagem", "imbiribeira", "afogados", "piedade", "pina",
    "torroes", "ibura", "jordao", "cohab", "cajueiro seco",
    "ipsep", "tejipió", "san martin", "areias", "mustardinha",
    "madalena", "torre", "encruzilhada", "agua fria", "brejo",
    "beberibe", "porto", "recife antigo", "boa vista", "soledade",
    "derby", "graças", "espinheiro", "jaqueira", "casa amarela",
    "vasco da gama", "bomba do hemetério", "linha do tiro",
    "alto jose do pinho", "mangabeira", "dois unidos",
    "ilha do retiro", "caxangá", "iputinga", "cordeiro",
    "estância", "prado", "zumbi", "alto jose bonifácio",
    "brasilit", "guabiraba", "pau ferro", "sitio dos pintos",
    "camaragibe", "jaboatao", "caruaru", "olinda", "paulista",
    "abreu e lima", "cabo de santo agostinho", "moreno",
    "vitoria de santo antao", "gravata",
]

# ── Rodovias monitoradas ──────────────────────────────────
RODOVIAS = [
    {"pattern": r"br[- ]?232", "nome": "BR-232"},
    {"pattern": r"br[- ]?101", "nome": "BR-101"},
    {"pattern": r"br[- ]?408", "nome": "BR-408"},
    {"pattern": r"pe[- ]?15",  "nome": "PE-15"},
    {"pattern": r"pe[- ]?60",  "nome": "PE-60"},
]


def _classificar_gravidade(titulo: str, descricao: str) -> dict:
    """
    Classifica a gravidade da noticia em 4 niveis.
    REGRA FUNDAMENTAL: so classifica como ocorrencia se houver
    contexto climatico + ocorrencia juntos no mesmo texto.
    Noticias de violencia, guerra ou acidentes sem chuva = irrelevante.
    """
    texto = f"{titulo} {descricao or ''}".lower()

    hits_clima      = sum(1 for p in PALAVRAS_CLIMA if p in texto)
    hits_ocorrencia = sum(1 for p in PALAVRAS_OCORRENCIA if p in texto)
    hits_previsao   = sum(1 for p in PALAVRAS_PREVISAO if p in texto)

    # SEM contexto climatico = irrelevante, independente do resto
    if hits_clima == 0 and hits_previsao == 0:
        return {"nivel": "verde", "confianca": 0, "tipo": "irrelevante"}

    # Palavras criticas SÓ valem com contexto climatico
    critico = hits_clima >= 1 and any(p in texto for p in [
        "desabrigados", "desalojados", "evacuacao",
        "colapso", "tragedia climatica",
    ])

    if critico or (hits_ocorrencia >= 3 and hits_clima >= 1):
        return {"nivel": "vermelho", "confianca": 90, "tipo": "ocorrencia"}
    elif hits_ocorrencia >= 2 and hits_clima >= 1:
        return {"nivel": "laranja", "confianca": 75, "tipo": "ocorrencia"}
    elif hits_ocorrencia >= 1 and hits_clima >= 1:
        return {"nivel": "amarelo", "confianca": 60, "tipo": "ocorrencia"}
    elif hits_previsao >= 1 and hits_clima >= 1:
        return {"nivel": "amarelo", "confianca": 40, "tipo": "previsao"}
    elif hits_clima >= 2:
        return {"nivel": "verde", "confianca": 30, "tipo": "clima_geral"}
    return {"nivel": "verde", "confianca": 10, "tipo": "irrelevante"}


def _extrair_locais(titulo: str, descricao: str) -> dict:
    """
    Extrai bairros de Recife e rodovias citados no texto.
    Retorna listas de bairros e rodovias encontrados.
    """
    texto = f"{titulo} {descricao or ''}".lower()

    bairros_encontrados = [b for b in BAIRROS_RECIFE if b in texto]

    rodovias_encontradas = []
    for rod in RODOVIAS:
        if re.search(rod["pattern"], texto, re.IGNORECASE):
            rodovias_encontradas.append(rod["nome"])

    return {
        "bairros":  list(set(bairros_encontrados)),
        "rodovias": list(set(rodovias_encontradas)),
    }


def _e_recente(data_str: str = "", horas: int = 48) -> bool:
    """Verifica se a noticia foi publicada nas ultimas X horas."""
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(data_str)
        agora = datetime.now(timezone.utc)
        diferenca = (agora - dt).total_seconds() / 3600
        return diferenca <= horas
    except Exception:
        return True


def _formatar_data(data_str: str) -> str:
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(data_str)
        return dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return data_str or ""


def _tempo_relativo(data_str: str) -> str:
    """Retorna tempo relativo: 'há 2 horas', 'há 30 min'."""
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(data_str)
        agora = datetime.now(timezone.utc)
        diff = (agora - dt).total_seconds()
        if diff < 3600:
            return f"há {int(diff/60)} min"
        elif diff < 86400:
            return f"há {int(diff/3600)}h"
        else:
            return f"há {int(diff/86400)} dias"
    except Exception:
        return ""


async def buscar_noticias_inteligentes() -> list[dict]:
    """
    Busca e processa noticias com analise de impacto.
    Cada noticia retorna:
    - Nivel de gravidade (verde/amarelo/laranja/vermelho)
    - Tipo (ocorrencia confirmada / previsao / clima geral)
    - Bairros e rodovias afetados
    - Score de confianca
    - Tempo relativo de publicacao
    """
    noticias = []

    for fonte in FONTES_RSS:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    fonte["url"],
                    headers={"User-Agent": "RadarRecife/1.0 (monitoramento climatico)"},
                    follow_redirects=True,
                )
                feed = feedparser.parse(response.text)

            for entrada in feed.entries[:25]:
                titulo    = entrada.get("title", "")
                descricao = entrada.get("summary", "")
                link      = entrada.get("link", "")
                data_raw  = entrada.get("published", "")

                if not titulo or not link:
                    continue

                # Filtra apenas noticias recentes (48h)
                if not _e_recente(data_raw, horas=24):
                    continue

                # Analisa gravidade
                gravidade = _classificar_gravidade(titulo, descricao)

                # Ignora noticias sem relevancia climatica
                if gravidade["tipo"] == "irrelevante":
                    continue

                # Extrai locais mencionados
                locais = _extrair_locais(titulo, descricao)

                noticias.append({
                    "titulo":      titulo,
                    "descricao":   descricao[:300] if descricao else "",
                    "link":        link,
                    "fonte":       fonte["nome"],
                    "data":        _formatar_data(data_raw),
                    "data_raw":    data_raw,
                    "tempo_relativo": _tempo_relativo(data_raw),
                    "nivel":       gravidade["nivel"],
                    "tipo":        gravidade["tipo"],
                    "confianca":   gravidade["confianca"],
                    "bairros":     locais["bairros"],
                    "rodovias":    locais["rodovias"],
                    "impacta_ira": gravidade["confianca"] >= 60,
                })

        except Exception as erro:
            print(f"[RSS] Erro em {fonte['nome']}: {erro}")
            continue

    # Ordena: maior confianca primeiro, depois mais recente
    noticias.sort(key=lambda n: (
        -n.get("confianca", 0),
        n.get("data_raw", ""),
    ), reverse=False)

    # Remove duplicatas por titulo similar
    vistos: set = set()
    unicos = []
    for n in noticias:
        chave = n["titulo"][:50].lower()
        if chave not in vistos:
            vistos.add(chave)
            unicos.append(n)

    return unicos[:20]


# Mantém compatibilidade com código anterior
async def buscar_noticias_clima() -> list[dict]:
    return await buscar_noticias_inteligentes()
