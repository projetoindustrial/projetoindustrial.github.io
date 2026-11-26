# Catálogo comum — Projeto Industrial (schema v1.2, 2026-11-26)

| Arquivo | O que é |
|---|---|
| `catalog.json` | 15 blocos + 9 datasets (contagens conferidas contra os CSV/JSONL públicos) |
| `items.jsonl` | 1.553 itens: Manutenção 157, Fontes 446, Bancada 569, Recursos O&G 350, Playbooks 31 |
| `catalog.schema.json` | JSON Schema 2020-12 (corrige a chave `properties` duplicada da v1.1) |
| `gerar_catalogo.py` | Regenera os dois arquivos a partir dos dados públicos |
| `validar_catalogo.py` | Schema + unicidade, simetria de `shares_dataset_with`, somas, contagem contra a fonte |

Regras: nada é inventado. Data, contagem ou URL desconhecidos ficam `null`. `license` só vira enum quando o rótulo da fonte é exato (ex.: "MIT", "CC BY 4.0"); o resto é `open-unknown` com o texto original em `license_label`. `verified` aqui significa "enum + URL canônica da licença", **não** confirmação independente na fonte.
Uso: `python3 gerar_catalogo.py <pasta_dados>` e `python3 validar_catalogo.py <pasta_dados>` (requer `pip install jsonschema`).
