#!/usr/bin/env node
/**
 * Bootstrap script for this project template.
 *
 * 1. Installs workspace dependencies (pnpm install).
 * 2. Creates apps/backend/.env from the example if it does not exist.
 * 3. Probes localhost:5432 for an existing PostgreSQL instance.
 *    - If found, asks whether to use it and prompts for a DATABASE_URL.
 *    - If not found (or user declines), starts the project database via
 *      Docker Compose.
 * 4. Pushes the Drizzle schema to the selected database.
 *
 * Uses only Node.js built-ins — no extra dependencies required.
 */

import { createConnection } from "node:net";
import { createInterface } from "node:readline/promises";
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

const ENV_PATH = "apps/backend/.env";
const ENV_EXAMPLE_PATH = "apps/backend/.env.example";
const PG_HOST = "localhost";
const PG_PORT = 5432;
const PROBE_TIMEOUT_MS = 2000;
const DB_READY_WAIT_MS = 3000;
const TEMPLATE_NAME = "ai-base-app";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns true if something is listening on host:port within the timeout. */
function checkPortOpen(host, port, timeoutMs = PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

/** Run a shell command and stream its output to the terminal. */
function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

/** Wait for ms milliseconds. */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Set or replace a KEY=VALUE line in an .env file.
 * Appends the line if the key does not already exist.
 */
function setEnvVar(filePath, key, value) {
  const content = readFileSync(filePath, "utf-8");
  const lineRegex = new RegExp(`^${key}=.*`, "m");
  const updated = lineRegex.test(content)
    ? content.replace(lineRegex, `${key}=${value}`)
    : `${content.trimEnd()}\n${key}=${value}\n`;
  writeFileSync(filePath, updated);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 0: Ensure the project has been renamed ────────────────────────────
  // If the root package.json still uses the template placeholder name, force
  // rename before continuing. Rename is run as a subprocess so it can own
  // stdin/stdout for its interactive prompts.
  const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
  if (rootPkg.name === TEMPLATE_NAME) {
    console.log(`\n⚠  This project is still using the template name "${TEMPLATE_NAME}".`);
    console.log("   Rename is required before bootstrap can continue.");

    const result = spawnSync("node", ["scripts/rename.mjs"], { stdio: "inherit" });
    if (result.status !== 0) {
      console.error('\n✗ Rename did not complete. Run "pnpm rename" and try again.\n');
      process.exit(1);
    }

    const renamedPkg = JSON.parse(readFileSync("package.json", "utf-8"));
    if (renamedPkg.name === TEMPLATE_NAME) {
      console.error("\n✗ Project rename is still incomplete. Bootstrap cannot continue.\n");
      process.exit(1);
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // ── Step 1: Install dependencies ──────────────────────────────────────
    console.log("\n→ Installing dependencies…");
    run("pnpm install");

    // ── Step 2: Copy .env if it does not exist ────────────────────────────
    if (!existsSync(ENV_PATH)) {
      copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
      console.log(`→ Created ${ENV_PATH} from ${ENV_EXAMPLE_PATH}`);
    } else {
      console.log(`→ ${ENV_PATH} already exists, skipping copy`);
    }

    // ── Step 3: Probe for an existing PostgreSQL instance ─────────────────
    console.log(`\n→ Probing ${PG_HOST}:${PG_PORT} for an existing PostgreSQL instance…`);
    const detected = await checkPortOpen(PG_HOST, PG_PORT);

    if (detected) {
      console.log(`  PostgreSQL detected on ${PG_HOST}:${PG_PORT}.`);

      const answer = await rl.question(
        "  Use this existing database instead of starting a new one? (y/N): "
      );
      const useExisting = answer.trim().toLowerCase();

      if (useExisting === "y" || useExisting === "yes") {
        // Prompt for the connection string, defaulting to the postgres superuser.
        const defaultUrl = `postgresql://postgres:postgres@${PG_HOST}:${PG_PORT}/postgres`;
        const input = await rl.question(
          `  DATABASE_URL (press Enter to use default)\n  [${defaultUrl}]: `
        );
        const dbUrl = input.trim() || defaultUrl;

        setEnvVar(ENV_PATH, "DATABASE_URL", dbUrl);
        console.log(`  DATABASE_URL updated in ${ENV_PATH}`);
      } else {
        // User chose not to reuse — start the project's own container.
        console.log(
          "\n  Note: port 5432 is already in use. Docker Compose may fail if it conflicts."
        );
        console.log("→ Starting project database via Docker Compose…");
        run("pnpm db:up");
        console.log(`  Waiting ${DB_READY_WAIT_MS / 1000}s for the database to be ready…`);
        await wait(DB_READY_WAIT_MS);
      }
    } else {
      // Nothing on port 5432 — start fresh.
      console.log("  No existing PostgreSQL detected.");
      console.log("\n→ Starting database via Docker Compose…");
      run("pnpm db:up");
      console.log(`  Waiting ${DB_READY_WAIT_MS / 1000}s for the database to be ready…`);
      await wait(DB_READY_WAIT_MS);
    }

    // ── Step 4: Push the schema ────────────────────────────────────────────
    console.log("\n→ Pushing Drizzle schema to the database…");
    run("pnpm db:push");

    console.log("\n✓ Bootstrap complete.");
    console.log("  Run  pnpm dev  to start the development servers.\n");
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("\n✗ Bootstrap failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
