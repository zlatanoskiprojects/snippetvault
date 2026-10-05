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

Content check (page inventory, navigation, banned terms; needs only Node):

```bash
node check.mjs
node --test check.test.mjs
```

- `node check.mjs` fails if an inventory page is missing, a page is not in the navigation, a navigation entry has no page, or a banned term appears (collaborator, reject, share token, collection)
- `node --test check.test.mjs` is the self-check that proves each failure mode is detected
