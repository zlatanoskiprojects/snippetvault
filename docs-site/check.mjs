import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PAGES = [
  "index",
  "first-workspace",
  "workspaces-and-projects",
  "snippets",
  "tags",
  "version-history",
  "comments",
  "search",
  "public-sharing",
  "members-and-roles",
  "invitations",
  "account",
  "self-host",
];

const BANNED = [/collaborators?/i, /\brejects?(?:ed|ing|ion)?\b/i, /share[\s-]+tokens?/i, /collections?/i];

export function check(dir) {
  const errors = [];
  const { navigation } = JSON.parse(readFileSync(join(dir, "docs.json"), "utf8"));
  const nav = new Set(navigation.groups.flatMap((g) => g.pages));

  for (const page of PAGES) {
    if (!existsSync(join(dir, `${page}.mdx`))) errors.push(`missing page: ${page}.mdx`);
    if (!nav.has(page)) errors.push(`page not in navigation: ${page}`);
  }
  for (const entry of nav) {
    if (!existsSync(join(dir, `${entry}.mdx`))) errors.push(`navigation entry has no page: ${entry}`);
  }
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const text = readFileSync(join(dir, file), "utf8");
    for (const re of BANNED) {
      const m = text.match(re);
      if (m) errors.push(`banned term "${m[0].toLowerCase()}" in ${file}`);
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = check(dirname(fileURLToPath(import.meta.url)));
  errors.forEach((e) => console.error(e));
  if (errors.length) process.exit(1);
  console.log("docs check passed");
}
