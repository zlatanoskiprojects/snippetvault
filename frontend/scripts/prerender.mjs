import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = `${root}dist`
const ssrEntry = `${root}dist-ssr/entry-server.js`
const siteUrl = (process.env.SITE_URL ?? 'https://snippetvault.me').replace(/\/$/, '')
const landingTitle = 'Code snippet manager · SnippetVault'

const shell = await readFile(`${dist}/index.html`, 'utf8')
const jsonLd = /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/

if (!jsonLd.test(shell) || !shell.includes('<div id="root"></div>')) {
  throw new Error('prerender: index.html shell is missing the JSON-LD block or the empty root div')
}

await writeFile(`${dist}/app.html`, shell.replace(jsonLd, ''))

const { render } = await import(ssrEntry)
const landingUrl = `${siteUrl}/`

const landing = shell
  .replace('<title>SnippetVault</title>', `<title>${landingTitle}</title>`)
  .replace('<meta property="og:title" content="SnippetVault" />', `<meta property="og:title" content="${landingTitle}" />`)
  .replace('<meta name="twitter:title" content="SnippetVault" />', `<meta name="twitter:title" content="${landingTitle}" />`)
  .replace('</title>', `</title>\n    <link rel="canonical" href="${landingUrl}" />\n    <meta property="og:url" content="${landingUrl}" />`)
  .replace('<div id="root"></div>', `<div id="root">${render('/')}</div>`)

await writeFile(`${dist}/index.html`, landing)
await rm(`${root}dist-ssr`, { recursive: true, force: true })
