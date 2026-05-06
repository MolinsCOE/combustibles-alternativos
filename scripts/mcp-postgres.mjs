#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(rootDir, "apps/backend/.env");
const envExamplePath = resolve(rootDir, "apps/backend/.env.example");

function readDatabaseUrl(filePath) {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = /^DATABASE_URL\s*=\s*(.*)$/.exec(line);

    if (!match) {
      continue;
    }

    const value = match[1].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    return value;
  }

  return undefined;
}

const databaseUrl =
  process.env.DATABASE_URL || readDatabaseUrl(envPath) || readDatabaseUrl(envExamplePath);

if (!databaseUrl) {
  console.error(
    "DATABASE_URL is required. Create apps/backend/.env or set DATABASE_URL in the environment."
  );
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npxCommand, ["-y", "@modelcontextprotocol/server-postgres", databaseUrl], {
  cwd: rootDir,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("error", (error) => {
  console.error(`Failed to start postgres MCP server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 1);
});
