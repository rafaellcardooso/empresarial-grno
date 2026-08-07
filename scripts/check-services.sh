#!/usr/bin/env bash
# Lista estado das units systemd do empresarial (Next + workers).
# Perfil lab/prod: auto (pelo que estiver enabled) ou --lab / --prod.
set -euo pipefail

PROFILE="auto"
SHOW_LEGACY=1
ISSUES=0

usage() {
  cat <<'EOF'
Uso: scripts/check-services.sh [--lab|--prod|--auto] [--no-legacy] [-h]

  --auto      Detecta lab vs prod pelas units enabled (padrão)
  --lab       Força perfil lab (*-lab)
  --prod      Força perfil produção
  --no-legacy Não lista avisos de units do outro perfil
  -h          Ajuda

Exit: 0 se units esperadas estão active; 1 se alguma falha.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lab) PROFILE=lab; shift ;;
    --prod) PROFILE=prod; shift ;;
    --auto) PROFILE=auto; shift ;;
    --no-legacy) SHOW_LEGACY=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

unit_enabled_p() {
  local st
  st="$(systemctl is-enabled "$1" 2>/dev/null || true)"
  case "$st" in
    enabled|enabled-runtime|static|indirect|generated) return 0 ;;
    *) return 1 ;;
  esac
}

count_enabled() {
  local n=0 u
  for u in "$@"; do
    if unit_enabled_p "$u"; then
      n=$((n + 1))
    fi
  done
  echo "$n"
}

LAB_DETECT=(
  empresarial-next-lab
  sir-ingest-ral-lab
  sir-ingest-rec-lab
  sir-telegram-ops-lab
  sir-telegram-datacenter-lab
  tmip-ingest-lab.timer
  bsod-ingest-lab.timer
)
PROD_DETECT=(
  empresarial-next
  sir-ingest-ral
  sir-ingest-rec
  sir-telegram-ops
  sir-telegram-datacenter
  tmip-ingest.timer
  bsod-ingest.timer
)

detect_profile() {
  local lab_n prod_n
  lab_n="$(count_enabled "${LAB_DETECT[@]}")"
  prod_n="$(count_enabled "${PROD_DETECT[@]}")"
  if [[ "$lab_n" -gt "$prod_n" ]]; then
    echo lab
  elif [[ "$prod_n" -gt "$lab_n" ]]; then
    echo prod
  elif [[ "$lab_n" -eq 0 && "$prod_n" -eq 0 ]]; then
    echo unknown
  else
    echo mixed
  fi
}

if [[ "$PROFILE" == "auto" ]]; then
  DETECTED="$(detect_profile)"
  case "$DETECTED" in
    lab|prod) PROFILE="$DETECTED" ;;
    mixed)
      PROFILE=lab
      echo "AVISO: lab e prod com units enabled — exibindo lab; use --prod se preferir." >&2
      ;;
    unknown)
      PROFILE=lab
      echo "AVISO: nenhuma unit do catálogo enabled — assumindo lab. Use --lab/--prod." >&2
      ;;
  esac
fi

EXPECTED_LAB=(
  "empresarial-next-lab|svc|Next.js (dev, porta 3003)"
  "sir-ingest-ral-lab|svc|Scrape RAL → SIR"
  "sir-ingest-rec-lab|svc|Scrape REC → SIR"
  "sir-telegram-ops-lab|svc|Bot Telegram ops"
  "sir-telegram-datacenter-lab|svc|Bot Telegram datacenter"
  "tmip-ingest-lab.timer|timer|TMIP/SDH a cada ~10 min"
  "bsod-ingest-lab.timer|timer|BSOD/PME → SIR"
)

EXPECTED_PROD=(
  "empresarial-next|svc|Next.js (start, porta 3003)"
  "sir-ingest-ral|svc|Scrape RAL → SIR"
  "sir-ingest-rec|svc|Scrape REC → SIR"
  "sir-telegram-ops|svc|Bot Telegram ops"
  "sir-telegram-datacenter|svc|Bot Telegram datacenter"
  "tmip-ingest.timer|timer|TMIP/SDH a cada ~10 min"
  "bsod-ingest.timer|timer|BSOD/PME → SIR"
)

OTHER_PROFILE_LAB=(empresarial-next sir-ingest-ral sir-ingest-rec tmip-ingest.timer bsod-ingest.timer)
OTHER_PROFILE_PROD=(empresarial-next-lab sir-ingest-ral-lab sir-ingest-rec-lab tmip-ingest-lab.timer bsod-ingest-lab.timer)

timer_next() {
  systemctl list-timers --all --no-pager --no-legend 2>/dev/null \
    | awk -v u="$1" '$0 ~ u { print $1, $2, $3; exit }' \
    || true
}

print_header() {
  printf '%-48s %-6s %-12s %-14s %s\n' "UNIT" "KIND" "ACTIVE" "ENABLED" "PAPEL / NOTA"
  printf '%-48s %-6s %-12s %-14s %s\n' "----" "----" "------" "-------" "-----------"
}

check_expected() {
  local unit="$1" kind="$2" role="$3"
  local active enabled note="" next=""

  if ! systemctl cat "$unit" &>/dev/null; then
    active="not-found"
    enabled="n/a"
    note="unit ausente em /etc (copiar de deploy/systemd)"
    ISSUES=$((ISSUES + 1))
  else
    # is-active / is-enabled imprimem o estado e saem != 0 quando inativo/desabilitado.
    active="$(systemctl is-active "$unit" 2>/dev/null || true)"
    enabled="$(systemctl is-enabled "$unit" 2>/dev/null || true)"
    [[ -z "$active" ]] && active=unknown
    [[ -z "$enabled" ]] && enabled=unknown
    if [[ "$kind" == "timer" ]]; then
      next="$(timer_next "$unit")"
      [[ -n "$next" ]] && note="next≈ ${next}"
    fi
    if [[ "$active" != "active" ]]; then
      ISSUES=$((ISSUES + 1))
      note="${note:+$note; }ESPERADO active"
    fi
  fi
  printf '%-48s %-6s %-12s %-14s %s\n' "$unit" "$kind" "$active" "$enabled" "${role}${note:+ — $note}"
}

echo "=== Empresarial — serviços systemd (perfil: $PROFILE) ==="
echo

EXPECTED=()
if [[ "$PROFILE" == "lab" ]]; then
  EXPECTED=("${EXPECTED_LAB[@]}")
else
  EXPECTED=("${EXPECTED_PROD[@]}")
fi

print_header
for row in "${EXPECTED[@]}"; do
  IFS='|' read -r unit kind role <<<"$row"
  check_expected "$unit" "$kind" "$role"
done

if [[ "$SHOW_LEGACY" -eq 1 ]]; then
  echo
  echo "--- misturas lab/prod ---"
  MIXED=0
  if [[ "$PROFILE" == "lab" ]]; then
    for u in "${OTHER_PROFILE_LAB[@]}"; do
      if unit_enabled_p "$u" || [[ "$(systemctl is-active "$u" 2>/dev/null || true)" == "active" ]]; then
        printf '  AVISO: unit de PRODUÇÃO presente/ativa: %s\n' "$u"
        MIXED=1
        ISSUES=$((ISSUES + 1))
      fi
    done
  else
    for u in "${OTHER_PROFILE_PROD[@]}"; do
      if unit_enabled_p "$u" || [[ "$(systemctl is-active "$u" 2>/dev/null || true)" == "active" ]]; then
        printf '  AVISO: unit de LAB presente/ativa: %s\n' "$u"
        MIXED=1
        ISSUES=$((ISSUES + 1))
      fi
    done
  fi
  [[ "$MIXED" -eq 0 ]] && echo "  nenhuma mistura detectada"
fi

echo
if [[ "$ISSUES" -eq 0 ]]; then
  echo "OK — todas as units esperadas estão active."
  echo
  echo "HFC SLS (Monitor/bots): /usr/local/hfc-sls/scripts/ops/check_services.sh"
  exit 0
fi
echo "FALHAS: $ISSUES problema(s). Ver colunas ACTIVE/not-found."
echo
echo "HFC SLS (Monitor/bots): /usr/local/hfc-sls/scripts/ops/check_services.sh"
exit 1
