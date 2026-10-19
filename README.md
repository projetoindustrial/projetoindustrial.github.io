# Projeto Industrial

Site estático (GitHub Pages) com layout híbrido + catálogo O&G Offshore.

## Páginas

| Arquivo | Função |
|---------|--------|
| `index.html` | Home (layout híbrido) |
| `recursos.html` | Catálogo completo (350 recursos, busca e filtros) |
| `carreiras.html` | Carreiras, bolsas e portais |
| `tema.html?t=<chave>` | Página temática única (manutencao-pcm, hse-seguranca, dados-regulacao, normas-certificacao, subsea-integridade, portos-logistica, petroquimica, vagas-comunidades) |
| `manutencao.html`, `hse.html`, `dados.html`, `normas.html`, `subsea.html`, `portos.html`, `petroquimica.html`, `vagas-comunidades.html` | Redirecionam para `tema.html?t=…` (mantêm meta/og para links antigos) |

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

Substitua `data/recursos-og-offshore.json`. As páginas de tema filtram sozinhas. Para um tema novo, adicione a chave em `paginas_tematicas` do JSON e em `TEMAS` no `js/tema.js`.

## Auditoria (18/10/2026)

- Sidebars unificadas em todas as 11 páginas
- Links internos verificados (sem páginas quebradas)
- JSON válido (350 registros)
- JS com sintaxe OK
- Filtros temáticos ajustados
- Tema claro/escuro + menu mobile em todas as páginas

## Ajuste (18/10/2026)

- 8 páginas temáticas quase idênticas viraram `tema.html` (parâmetro `t`); as URLs antigas redirecionam.
- Seção repetida de comunidades removida de `carreiras.html` (atalho para `tema.html?t=vagas-comunidades`).
- Testado em jsdom: os cards de cada tema saem idênticos aos das páginas antigas.
