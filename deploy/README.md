# Deploy — inventário de units

> Índice: [docs/README.md](../docs/README.md)

Este arquivo **não** é o checklist de instalação. Use:

| Ambiente           | Documento                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| Lab                | [docs/getting-started/development.md](../docs/getting-started/development.md) |
| Produção (install) | [docs/runbooks/production-install.md](../docs/runbooks/production-install.md) |
| Produção (release) | [docs/runbooks/production-release.md](../docs/runbooks/production-release.md) |
| Serviços           | [docs/operations/services.md](../docs/operations/services.md)                 |
| Troubleshooting    | [docs/operations/troubleshooting.md](../docs/operations/troubleshooting.md)   |

## Produção

| Unit                              | Arquivo                                   |
| --------------------------------- | ----------------------------------------- |
| `empresarial-next`                | `deploy/systemd/empresarial-next.service` |
| `sir-ingest-ral` / `rec`          | `workers/sir-ingest/deploy/systemd/`      |
| `sir-telegram-ops` / `datacenter` | `workers/sir-ingest/deploy/systemd/`      |
| `tmip-ingest.timer`               | `workers/tmip/deploy/systemd/`            |

## Lab

Units `*-lab` em `deploy/systemd/lab/` e `workers/*/deploy/systemd/lab/`.

## Comandos úteis

```bash
cd /usr/local/empresarial
npm run deploy:next              # build + restart da unit Next ativa
sudo journalctl -u empresarial-next -f
sudo systemctl list-timers 'tmip-ingest*'
```
