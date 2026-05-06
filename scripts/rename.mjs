#!/usr/bin/env node
/**
 * Guided project rename for this template.
 *
 * The script collects product context, suggests a project/database name,
 * and updates project files so app identity is consistent everywhere.
 *
 * Uses only Node.js built-ins — no extra dependencies required.
 */

import { createInterface } from "node:readline/promises";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMPLATE_NAME = "ai-base-app";
const TEMPLATE_DISPLAY_NAME = "AI Base App";

/** All files that may contain project identity references. */
const TARGET_FILES = [
  "package.json",
  "apps/backend/package.json",
  "apps/backend/docker-compose.yml",
  "apps/backend/.env.example",
  "apps/backend/.env",
  "apps/frontend/index.html",
  "apps/frontend/src/App.tsx",
  ".github/workflows/backend-ci.yml",
  ".github/workflows/frontend-ci.yml",
  ".claude/agents/setup.md",
  "readme.md",
];

const DISPLAY_TARGET_FILES = [
  "apps/frontend/index.html",
  "apps/frontend/src/App.tsx",
  "readme.md",
];

const TEXT_SCAN_EXTENSIONS = [
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".js",
  ".json",
  ".yml",
  ".yaml",
  ".env",
  ".example",
  ".html",
];

function isValidSlug(name) {
  return /^[a-z][a-z0-9-]{1,49}$/.test(name);
}

function isValidDbName(name) {
  return /^[a-z][a-z0-9-]{1,62}$/.test(name);
}

function toKebabCase(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toDisplayName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(resolve(ROOT, filePath), "utf-8"));
}

function readCurrentName() {
  try {
    return readJson("package.json").name ?? TEMPLATE_NAME;
  } catch {
    return TEMPLATE_NAME;
  }
}

function readCurrentDbName() {
  const envExamplePath = resolve(ROOT, "apps/backend/.env.example");
  if (!existsSync(envExamplePath)) return "app";

  const content = readFileSync(envExamplePath, "utf-8");
  const m = content.match(/^DATABASE_URL=.*\/([^\n?#]+).*$/m);
  if (!m?.[1]) return "app";
  return m[1].trim();
}

function replaceLiteral(content, from, to) {
  if (!from || from === to) return { updated: content, count: 0 };
  const count = content.split(from).length - 1;
  return {
    updated: count > 0 ? content.replaceAll(from, to) : content,
    count,
  };
}

function replaceRegex(content, regex, replacement) {
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;
  if (count === 0) return { updated: content, count: 0 };
  return { updated: content.replace(regex, replacement), count };
}

function updateFile(relPath, updater) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return { changed: false, count: 0 };

  const original = readFileSync(abs, "utf-8");
  const { updated, count } = updater(original);

  if (count > 0 && updated !== original) {
    writeFileSync(abs, updated, "utf-8");
    return { changed: true, count };
  }

  return { changed: false, count: 0 };
}

function shouldScanFile(relPath) {
  return TEXT_SCAN_EXTENSIONS.some((ext) => relPath.endsWith(ext));
}

function findPlaceholderHits() {
  const ignorePaths = new Set([
    "scripts/bootstrap.mjs",
    "scripts/rename.mjs",
  ]);

  const hits = [];
  for (const relPath of TARGET_FILES) {
    if (ignorePaths.has(relPath)) continue;
    if (!shouldScanFile(relPath)) continue;

    const abs = resolve(ROOT, relPath);
    if (!existsSync(abs)) continue;

    const content = readFileSync(abs, "utf-8");
    if (content.includes(TEMPLATE_NAME)) {
      hits.push(relPath);
    }
  }

  return hits;
}

async function askRequired(rl, prompt) {
  while (true) {
    const answer = (await rl.question(prompt)).trim();
    if (answer.length > 0) return answer;
    console.log("  Please enter a value.");
  }
}

async function askWithDefault(rl, prompt, defaultValue) {
  const answer = (await rl.question(`${prompt}\n  [${defaultValue}]: `)).trim();
  return answer.length > 0 ? answer : defaultValue;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const currentName = readCurrentName();
    const currentDbName = readCurrentDbName();

    console.log("\n" + "-".repeat(62));
    console.log("  Project Rename Interview");
    console.log("-".repeat(62));

    if (currentName !== TEMPLATE_NAME) {
      console.log(`\n  Current project name: \"${currentName}\"`);
      const again = await rl.question("  Rename it again with a guided interview? (y/N): ");
      if (!["y", "yes"].includes(again.trim().toLowerCase())) {
        console.log("  No changes made.\n");
        return;
      }
    } else {
      console.log(`\n  This project still uses the template name \"${TEMPLATE_NAME}\".`);
      console.log("  We will ask a few questions, suggest names, and apply updates.");
    }

    console.log("\n  Let's define what you are building:\n");

    const productNameInput = await askRequired(
      rl,
      "  1) What should this application be called?\n  > "
    );
    const whatItDoes = await askRequired(
      rl,
      "  2) In one sentence, what does the app do?\n  > "
    );
    const primaryUsers = await askRequired(
      rl,
      "  3) Who are the primary users?\n  > "
    );
    const purpose = await askRequired(
      rl,
      "  4) What is the main purpose or outcome for users?\n  > "
    );
    const domain = await askRequired(
      rl,
      "  5) What domain or industry is this for?\n  > "
    );
    const tone = await askRequired(
      rl,
      "  6) What tone should the product feel like (e.g., practical, premium, playful)?\n  > "
    );
    const keywords = await askRequired(
      rl,
      "  7) List 3-6 keywords that describe the app (comma-separated).\n  > "
    );

    const baseSlug = toKebabCase(productNameInput);
    const suggestedSlug = isValidSlug(baseSlug) ? baseSlug : "my-app";

    console.log("\n  Suggested identity based on your answers:");
    console.log(`    App slug: ${suggestedSlug}`);
    console.log(`    Display name: ${toDisplayName(suggestedSlug)}`);
    console.log(`    Database name: ${suggestedSlug}`);

    let newSlug = "";
    while (!isValidSlug(newSlug)) {
      const candidate = toKebabCase(
        await askWithDefault(
          rl,
          "\n  Confirm app slug (lowercase letters, numbers, hyphens)",
          suggestedSlug
        )
      );

      if (isValidSlug(candidate)) {
        newSlug = candidate;
      } else {
        console.log("  Invalid slug. Use lowercase letters, numbers, and hyphens.");
      }
    }

    const suggestedDisplay = toDisplayName(newSlug);
    let displayName = await askWithDefault(rl, "  Confirm display name", suggestedDisplay);
    if (!displayName.trim()) {
      displayName = suggestedDisplay;
    }

    let dbName = "";
    while (!isValidDbName(dbName)) {
      const candidate = toKebabCase(
        await askWithDefault(rl, "  Confirm database name", newSlug)
      );

      if (isValidDbName(candidate)) {
        dbName = candidate;
      } else {
        console.log("  Invalid database name. Use lowercase letters, numbers, and hyphens.");
      }
    }

    const fromSlug = currentName;
    const fromDisplay = currentName === TEMPLATE_NAME ? TEMPLATE_DISPLAY_NAME : toDisplayName(currentName);

    if (newSlug === fromSlug && dbName === currentDbName && displayName === fromDisplay) {
      console.log("\n  Name and database are unchanged. No files updated.\n");
      return;
    }

    console.log("\n  Summary of planned updates:");
    console.log(`    App slug: ${fromSlug} -> ${newSlug}`);
    console.log(`    Display name: ${fromDisplay} -> ${displayName}`);
    console.log(`    Database name: ${currentDbName} -> ${dbName}`);
    console.log("\n  Product context saved for this rename session:");
    console.log(`    What it does: ${whatItDoes}`);
    console.log(`    Primary users: ${primaryUsers}`);
    console.log(`    Purpose: ${purpose}`);
    console.log(`    Domain: ${domain}`);
    console.log(`    Tone: ${tone}`);
    console.log(`    Keywords: ${keywords}`);

    const apply = await rl.question("\n  Apply these changes now? (y/N): ");
    if (!["y", "yes"].includes(apply.trim().toLowerCase())) {
      console.log("  Cancelled. No files changed.\n");
      return;
    }

    const touched = [];
    let total = 0;

    for (const relPath of TARGET_FILES) {
      const result = updateFile(relPath, (content) => replaceLiteral(content, fromSlug, newSlug));
      if (result.changed) {
        touched.push({ file: relPath, count: result.count });
        total += result.count;
      }
    }

    for (const relPath of DISPLAY_TARGET_FILES) {
      const result = updateFile(relPath, (content) => replaceLiteral(content, fromDisplay, displayName));
      if (result.changed) {
        touched.push({ file: relPath, count: result.count });
        total += result.count;
      }
    }

    const composeResult = updateFile("apps/backend/docker-compose.yml", (content) =>
      replaceRegex(content, /^(\s*POSTGRES_DB:\s*).*$/m, `$1${dbName}`)
    );
    if (composeResult.changed) {
      touched.push({ file: "apps/backend/docker-compose.yml", count: composeResult.count });
      total += composeResult.count;
    }

    const envResult = updateFile("apps/backend/.env.example", (content) =>
      replaceRegex(
        content,
        /^DATABASE_URL=.*$/m,
        `DATABASE_URL=postgresql://app:app@localhost:5432/${dbName}`
      )
    );
    if (envResult.changed) {
      touched.push({ file: "apps/backend/.env.example", count: envResult.count });
      total += envResult.count;
    }

    const localEnvResult = updateFile("apps/backend/.env", (content) =>
      replaceRegex(
        content,
        /^DATABASE_URL=.*$/m,
        `DATABASE_URL=postgresql://app:app@localhost:5432/${dbName}`
      )
    );
    if (localEnvResult.changed) {
      touched.push({ file: "apps/backend/.env", count: localEnvResult.count });
      total += localEnvResult.count;
    }

    const readmeResult = updateFile("readme.md", (content) =>
      replaceRegex(
        content,
        /DATABASE_URL=postgresql:\/\/app:app@localhost:5432\/[^\n]+/g,
        `DATABASE_URL=postgresql://app:app@localhost:5432/${dbName}`
      )
    );
    if (readmeResult.changed) {
      touched.push({ file: "readme.md", count: readmeResult.count });
      total += readmeResult.count;
    }

    const uniqueTouched = [...new Map(touched.map((t) => [t.file, t])).values()];

    console.log("\n  Updated files:");
    for (const item of uniqueTouched) {
      const label = item.count === 1 ? "1 change" : `${item.count} changes`;
      console.log(`    ${item.file} (${label})`);
    }

    const placeholderHits = findPlaceholderHits();
    if (placeholderHits.length > 0) {
      console.log("\n  Remaining template references detected in managed files:");
      for (const file of placeholderHits) {
        console.log(`    ${file}`);
      }
      console.log("\n  Please review the files above and rerun rename if needed.\n");
      process.exit(1);
    }

    const fileWord = uniqueTouched.length === 1 ? "file" : "files";
    const changeWord = total === 1 ? "change" : "changes";
    console.log(`\n✓ Rename complete: ${total} ${changeWord} across ${uniqueTouched.length} ${fileWord}.\n`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("\n✗ Rename failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
