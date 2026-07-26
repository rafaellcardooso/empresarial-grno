# GRB / Critel — env + build Next

> **Data:** 2026-07-26 · **Escopo:** lab + prod · **Lab:** aplicado · **Prod:** pendente

## Resumo

Telnet GRB (`/grb`), console staff, lookup VPRN Nokia e gráficos Critel (`/grb/critel`) dependem de variáveis novas em `.env.local` e de **build** do Next após pull. Produção sem `GRB_BASE_URL` / credenciais telnet retorna timeout ou 502 nas rotas `/api/grb/*` e `/api/grb/critel/*`.

## Impacto

| Rota / página                       | Chaves necessárias                                           |
| ----------------------------------- | ------------------------------------------------------------ |
| `/grb` (TELNET)                     | `GRB_BASE_URL`, `GRB_TELNET_USERNAME`, `GRB_TELNET_PASSWORD` |
| `/grb/critel`                       | `CRITEL_BASE_URL`                                            |
| `/relatorios`, `/sir`, BSOD filters | Só build (sem env novo)                                      |

Units: **`empresarial-next`** (ou `empresarial-next-lab`).

Worker ingest e bots Telegram **não** usam estas chaves (Telegram usa `EMPRESARIAL_API_URL` no worker `.env`).

## Pré-requisitos

- Código atualizado (`git pull origin main`).
- Rede interna até host GRB (HTTP).
- Migrations de tratativas aplicadas se for usar workflow na mesma janela — ver [2026-07-26-tratativas-migrations.md](2026-07-26-tratativas-migrations.md).

---

## Passos — Lab

Editar `/usr/local/empresarial/.env.local` (espelhar blocos de `.env.example`):

```dotenv
GRB_BASE_URL=http://200.255.253.12/grb/topologia_rede/www
GRB_TELNET_USERNAME=<matricula>
GRB_TELNET_PASSWORD=<troque_me>
CRITEL_BASE_URL=http://200.255.253.12/grb/critel
APP_PUBLIC_URL=http://127.0.0.1:3003
```

```bash
cd /usr/local/empresarial
npm run env:check
npm install
npm run build
sudo systemctl restart empresarial-next-lab
```

---

## Passos — Produção

Editar `.env.local` em `/usr/local/empresarial` — **não** copiar senhas do lab; manter credenciais de produção.

```dotenv
GRB_BASE_URL=http://200.255.253.12/grb/topologia_rede/www
GRB_TELNET_USERNAME=<matricula_prod>
GRB_TELNET_PASSWORD=<senha_prod>
CRITEL_BASE_URL=http://200.255.253.12/grb/critel
APP_PUBLIC_URL=https://<url-real-do-app>
```

```bash
cd /usr/local/empresarial
npm run env:check
npm install
npm run build
sudo systemctl restart empresarial-next
```

---

## Validação

```bash
curl -s http://127.0.0.1:3003/api/saude | jq
# UI autenticada:
#   /grb — ping em equipamento de teste
#   /grb/critel — designação conhecida (ex. itz/ip/01816)
#   /relatorios — hub e export CSV
```

Staff: comandos além de ping em `/grb`; console legado em `/api/grb/console`.

---

## Rollback

Reverter `.env.local` ao backup anterior e `npm run build && sudo systemctl restart empresarial-next`. Código GRB permanece no repo; rotas voltam a falhar até reconfigurar env.

---

## Referências

- [2026-07-26-operacao.md §7–8](../2026-07-26-operacao.md#7-grb--telnet)
- `.env.example` (raiz) — blocos GRB e Critel
