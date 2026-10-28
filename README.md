# IEM — Instituto de Ensino de Matemática

App de estudo só de Matemática do ENEM (PWA, HTML/JS puro, sem build). Meta: sair de 37 para 45 acertos.

- O site fica na raiz do repositório. Para rodar local: `python3 -m http.server` e abrir http://localhost:8000.
- Publicado no GitHub Pages pelo workflow `.github/workflows/pages.yml` a cada push na main: https://enio-123.github.io/IEM/
- `data/` tem as 670 questões de Matemática do ENEM 2009–2023 (texto do projeto enem-api + parâmetros TRI dos microdados do INEP).
- Assunto de cada questão classificado à mão em 14 assuntos: `ferramentas/mt_labels.txt` (mesma ordem de `ferramentas/mt_dump.txt`). Os dados são gerados por `ferramentas/build_mt.py`.
- Rumo ao 45: escada de 6 degraus pelo nível TRI de cada questão (até 700, 700–750, 750–800, 800–850, 850–900, 900+).
- Os dados da aluna ficam no aparelho (IndexedDB, banco `iem`). Backup em Ajustes.
- Nome do app fica em `js/config.js`.
