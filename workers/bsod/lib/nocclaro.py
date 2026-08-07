"""Cliente HTTP do portal CRM BSOD (bsod.nocclaro.com.br)."""

from __future__ import annotations

import logging
import re
from html import unescape
from typing import Any
from urllib.parse import urljoin

import requests
import urllib3
from bs4 import BeautifulSoup

from lib.config import get_nocclaro_config
from lib.nocclaro_parse import dedupe_by_protocolo, parse_planilha

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)


def _session() -> requests.Session:
    """Session HTTPS com verify=False (certificado do portal pode estar expirado)."""
    session = requests.Session()
    # Ignora HTTP(S)_PROXY do ambiente — proxy lab bloqueia CONNECT no portal.
    session.trust_env = False
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (compatible; EmpresarialBSOD/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    )
    session.verify = False
    return session


def _require_auth() -> dict[str, str]:
    """Lê config nocclaro e exige user/senha."""
    cfg = get_nocclaro_config()
    if not cfg["user"] or not cfg["password"]:
        raise RuntimeError("BSOD_NOCCLARO_USER / BSOD_NOCCLARO_PASS não configurados")
    return cfg


def login(session: requests.Session, cfg: dict[str, str]) -> None:
    """Autentica no portal (USERNAME/SENHA → Login.asp)."""
    base = cfg["base_url"]
    login_url = urljoin(base + "/", "Login.asp")
    session.get(login_url, timeout=60)
    resp = session.post(
        login_url,
        data={
            "USERNAME": cfg["user"],
            "SENHA": cfg["password"],
            "login": "true",
            "Envia": "Entrar",
        },
        timeout=60,
        allow_redirects=True,
    )
    resp.raise_for_status()
    body = resp.text or ""
    if 'name="USERNAME"' in body and 'name="SENHA"' in body and "logout" not in body.lower():
        raise RuntimeError("Login nocclaro rejeitado (ainda na tela de login)")
    logger.info("Login nocclaro OK user=%s", cfg["user"])


def _index_url(cfg: dict[str, str]) -> str:
    return urljoin(cfg["base_url"] + "/", "Index.asp")


def _find_opcao_value(html: str) -> str:
    """Extrai value do submit name=opcao na página autenticada."""
    soup = BeautifulSoup(html, "html.parser")
    for inp in soup.find_all(["input", "button"]):
        name = (inp.get("name") or "").strip().lower()
        if name != "opcao":
            continue
        value = (inp.get("value") or "").strip()
        if value:
            return value
    return "Buscar"


def _find_form_action(html: str, field_name: str) -> str:
    """Retorna action do form que contém o campo, ou Index.asp."""
    soup = BeautifulSoup(html, "html.parser")
    for form in soup.find_all("form"):
        if form.find(attrs={"name": field_name}) or form.find(attrs={"name": field_name.upper()}):
            action = (form.get("action") or "Index.asp").strip()
            return action or "Index.asp"
    return "Index.asp"


def search_by_uf(session: requests.Session, cfg: dict[str, str], uf: str) -> str:
    """Busca clientes por UF e retorna HTML do resultado (com form Planilha)."""
    index = _index_url(cfg)
    page = session.get(index, timeout=60)
    page.raise_for_status()
    action = _find_form_action(page.text, "BUSCA_TEXTO")
    opcao = _find_opcao_value(page.text)
    search_url = urljoin(cfg["base_url"] + "/", action)
    resp = session.post(
        search_url,
        data={
            "BUSCA_CAMPO": "UF",
            "BUSCA_TEXTO": uf.strip().upper(),
            "opcao": opcao,
        },
        timeout=120,
        allow_redirects=True,
    )
    resp.raise_for_status()
    if "Planilha.asp" not in (resp.text or "") and 'name="SQL"' not in (resp.text or ""):
        logger.warning("Busca UF=%s sem form Planilha.asp visível", uf)
    return resp.text


def _extract_planilha_sql(html: str) -> str:
    """Extrai SQL do form de exportação Planilha.asp."""
    soup = BeautifulSoup(html, "html.parser")
    for form in soup.find_all("form"):
        action = (form.get("action") or "").lower()
        if "planilha.asp" not in action:
            continue
        sql_input = form.find("input", attrs={"name": re.compile(r"^SQL$", re.I)})
        if sql_input and sql_input.get("value"):
            return unescape(str(sql_input.get("value")))
    sql_input = soup.find("input", attrs={"name": re.compile(r"^SQL$", re.I)})
    if sql_input and sql_input.get("value"):
        return unescape(str(sql_input.get("value")))
    raise RuntimeError("Form Planilha.asp / campo SQL não encontrado no HTML")


def download_planilha(session: requests.Session, cfg: dict[str, str], sql: str) -> tuple[bytes, str]:
    """POST Planilha.asp e retorna (bytes, content_type)."""
    url = urljoin(cfg["base_url"] + "/", "Planilha.asp")
    resp = session.post(
        url,
        data={"SQL": sql, "Botao": "Planilha"},
        timeout=180,
        allow_redirects=True,
    )
    resp.raise_for_status()
    content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    return resp.content or b"", content_type


def fetch_clients_for_uf(uf: str) -> list[dict[str, str]]:
    """Login + busca UF + download planilha + parse (dedupe por cvlan)."""
    uf_key = (uf or "").strip().upper()
    if not uf_key:
        raise RuntimeError("UF vazia para sync CRM")
    cfg = _require_auth()
    session = _session()
    login(session, cfg)
    html = search_by_uf(session, cfg, uf_key)
    sql = _extract_planilha_sql(html)
    payload, content_type = download_planilha(session, cfg, sql)
    rows = parse_planilha(payload, content_type)
    for row in rows:
        if not row.get("uf"):
            row["uf"] = uf_key
    deduped = dedupe_by_protocolo(rows)
    logger.info(
        "CRM nocclaro UF=%s raw=%d deduped=%d content_type=%s bytes=%d",
        uf_key,
        len(rows),
        len(deduped),
        content_type,
        len(payload),
    )
    return deduped
