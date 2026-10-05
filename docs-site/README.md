# SnippetVault docs

Mintlify site, published from this folder (`docs-site/`) via Git sync. Entry file: `docs.json`; styling: `style.css`.

Requires Node 20.17+.

```bash
npm i -g mint
cd docs-site
mint dev
mint validate
mint broken-links
```

- `mint dev` serves the local preview at http://localhost:3000 (`--port` to change it)
- `mint validate` checks that the site builds
- `mint broken-links` checks that all links resolve
