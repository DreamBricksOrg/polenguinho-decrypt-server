from datetime import datetime, timedelta, timezone

# Horário de Brasília (UTC-3, sem horário de verão desde 2019).
BRT = timezone(timedelta(hours=-3))


def now_brt_iso():
    """Timestamp atual em horário de Brasília (ISO 8601, com offset -03:00)."""
    return datetime.now(BRT).isoformat()
