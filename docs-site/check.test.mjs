import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "./check.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function copy() {
  const dir = mkdtempSync(join(tmpdir(), "docs-"));
  cpSync(here, dir, { recursive: true });
  return dir;
}

function editNav(dir, fn) {
  const file = join(dir, "docs.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  fn(json.navigation.groups);
  writeFileSync(file, JSON.stringify(json));
}

test("passes on the scaffold", () => {
  assert.deepEqual(check(here), []);
});

test("fails when a page file is removed", () => {
  const dir = copy();
  rmSync(join(dir, "tags.mdx"));
  const errors = check(dir);
  rmSync(dir, { recursive: true });
  assert.ok(errors.some((e) => e.includes("tags.mdx")));
});

test("fails when a navigation entry is dropped", () => {
  const dir = copy();
  editNav(dir, (g) => {
    g[1].pages = g[1].pages.filter((p) => p !== "search");
  });
  const errors = check(dir);
  rmSync(dir, { recursive: true });
  assert.ok(errors.some((e) => e.includes("search") && e.includes("navigation")));
});

test("fails when navigation points to no page", () => {
  const dir = copy();
  editNav(dir, (g) => g[2].pages.push("ghost"));
  const errors = check(dir);
  rmSync(dir, { recursive: true });
  assert.ok(errors.some((e) => e.includes("ghost")));
});

for (const term of ["collaborator", "reject", "share token", "collection"]) {
  test(`fails on banned term: ${term}`, () => {
    const dir = copy();
    appendFileSync(join(dir, "snippets.mdx"), `\nA ${term} here.\n`);
    const errors = check(dir);
    rmSync(dir, { recursive: true });
    assert.ok(errors.some((e) => e.includes(term) && e.includes("snippets.mdx")));
  });
}
