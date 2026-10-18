# Projeto Industrial

Site estático (GitHub Pages) com layout híbrido + catálogo O&G Offshore.

## Páginas

| Arquivo | Função |
|---------|--------|
| `index.html` | Home (layout híbrido) |
| `recursos.html` | Catálogo completo (350 recursos, busca e filtros) |
| `carreiras.html` | Carreiras, bolsas e portais |
| `vagas-comunidades.html` | Grupos e canais de vagas |
| `manutencao.html` | Manutenção & PCM |
| `hse.html` | HSE & Segurança |
| `dados.html` | Dados & Regulação |
| `normas.html` | Normas & Certificação |
| `subsea.html` | Subsea & Integridade |
| `portos.html` | Portos & Logística |
| `petroquimica.html` | Petroquímica |

## Estrutura

```
css/     styles.css, recursos.css, carreiras.css
js/      main.js, recursos.js, carreiras.js, tema.js
data/    recursos-og-offshore.json  (350 recursos)
```

## GitHub Pages

1. Envie **todo o conteúdo** da pasta para a raiz do repositório (ou mantenha a pasta e configure).
2. Settings → Pages → Deploy from branch `main`.
3. Acesse `/`, `/recursos.html`, `/carreiras.html`, etc.

## Atualizar o catálogo

Substitua `data/recursos-og-offshore.json`. As subpáginas filtram sozinhas.

## Auditoria (18/10/2026)

- Sidebars unificadas em todas as 11 páginas
- Links internos verificados (sem páginas quebradas)
- JSON válido (350 registros)
- JS com sintaxe OK
- Filtros temáticos ajustados
- Tema claro/escuro + menu mobile em todas as páginas
