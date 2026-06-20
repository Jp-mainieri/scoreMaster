# CNPJs de Demo

Estes arquivos contêm dados pré-processados para garantir que a demo nunca quebre por timeout de API.

## Cenários

- `33000167000101.json` — Petrobras: score alto (empresa grande, ativa há décadas)
- `60701190000104.json` — Bradesco: score alto (empresa financeira, estável)
- `07526557000100.json` — Exemplo médio/alerta: score médio com alertas societários

## Uso

O endpoint `/api/score` pode verificar se existe um arquivo de cache em `data/demo-cnpjs/{cnpj}.json`
antes de chamar as APIs externas, útil para apresentações offline.
