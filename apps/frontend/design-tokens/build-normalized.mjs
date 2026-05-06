#!/usr/bin/env node
/**
 * Normaliza el export W3C del plugin "Design Tokens" (Lukas Oppermann) a un
 * JSON plano, con alias resueltos y nombres amigables para que los agentes
 * de IA y el codigo frontend puedan consumirlo directamente.
 *
 * Uso:
 *   node apps/frontend/design-tokens/build-normalized.mjs
 *
 * Input:  apps/frontend/design-tokens/molins-ui-kit.w3c.tokens.json
 * Output: apps/frontend/design-tokens/molins-ui-kit.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = resolve(here, "molins-ui-kit.w3c.tokens.json");
const outputPath = resolve(here, "molins-ui-kit.json");

const raw = JSON.parse(readFileSync(inputPath, "utf8"));

// Resuelve referencias tipo {colors.neutrals.900} contra el arbol raiz.
function resolveRef(value, root, seen = new Set()) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{([^}]+)\}$/);
  if (!match) return value;
  const path = match[1];
  if (seen.has(path)) return value;
  seen.add(path);
  const parts = path.split(".");
  let node = root;
  for (const p of parts) {
    if (node && typeof node === "object" && p in node) {
      node = node[p];
    } else {
      return value;
    }
  }
  const inner = node && typeof node === "object" && "value" in node ? node.value : node;
  return resolveRef(inner, root, seen);
}

// Normaliza color hex con alpha #rrggbbaa a {hex, alpha}.
function normHex(v) {
  if (typeof v !== "string") return { hex: v, alpha: 1 };
  const h = v.replace(/^#/, "").toLowerCase();
  if (h.length === 8) {
    const alpha = parseInt(h.slice(6, 8), 16) / 255;
    return { hex: "#" + h.slice(0, 6), alpha: Math.round(alpha * 1000) / 1000 };
  }
  if (h.length === 6) return { hex: "#" + h, alpha: 1 };
  return { hex: v, alpha: 1 };
}

const out = {
  _meta: {
    source: "Molins · Library (Molins · UI Kit)",
    figmaFileUrl:
      "https://www.figma.com/design/rvo1AtV0m41GbQN1JPi8V8/Molins-%C2%B7-Library",
    figmaFileKey: "rvo1AtV0m41GbQN1JPi8V8",
    description: "Design tokens normalizados desde el export W3C (plugin Design Tokens de Lukas Oppermann).",
    lastSyncedAt: new Date().toISOString(),
    syncMethod: "figma_plugin_design_tokens_w3c",
    status: "synced",
    rawFile: "molins-ui-kit.w3c.tokens.json",
    builtBy: "build-normalized.mjs",
  },
  colors: {
    primary: {},
    secondary: {},
    feedback: {},
    neutrals: {},
    semantic: { bg: {}, text: {}, border: {} },
  },
  typography: {
    family: {},
    weight: {},
    size: {},
    lineHeight: {},
    textStyles: { display: {}, heading: {}, label: {}, paragraph: {} },
  },
  size: {
    space: {},
    radius: {},
    stroke: {},
    icons: {},
  },
  effects: {},
  grid: {},
  devices: {},
};

// --- Colores primitivos ---
for (const [family, group] of Object.entries(raw.colors)) {
  const target =
    family === "neutrals"
      ? out.colors.neutrals
      : family === "feedback"
      ? out.colors.feedback
      : family === "primary"
      ? out.colors.primary
      : family === "secondary"
      ? out.colors.secondary
      : null;
  if (!target) continue;

  if (family === "neutrals") {
    for (const [step, token] of Object.entries(group)) {
      target[step] = normHex(resolveRef(token.value, raw)).hex;
    }
    continue;
  }

  for (const [name, scale] of Object.entries(group)) {
    target[name] = {};
    for (const [step, token] of Object.entries(scale)) {
      target[name][step] = normHex(resolveRef(token.value, raw)).hex;
    }
  }
}

// --- Tokens semanticos ---
// Los grupos pueden venir con subgrupos anidados (bg.surface.primary, bg.fill.brand, ...)
// o planos (text.error). Aplanamos a claves tipo "surface.primary".
function flattenSemantic(node, prefix = "") {
  const out = {};
  for (const [key, val] of Object.entries(node)) {
    if (!val || typeof val !== "object") continue;
    if ("type" in val && "value" in val) {
      out[prefix ? `${prefix}.${key}` : key] = val;
    } else {
      Object.assign(out, flattenSemantic(val, prefix ? `${prefix}.${key}` : key));
    }
  }
  return out;
}

for (const kind of ["bg", "text", "border"]) {
  const group = raw["semantic tokens"][kind];
  const flat = flattenSemantic(group);
  for (const [name, token] of Object.entries(flat)) {
    const rawValue = token.value;
    const resolved = resolveRef(rawValue, raw);
    out.colors.semantic[kind][name] = {
      value: normHex(resolved).hex,
      alias: typeof rawValue === "string" && rawValue.startsWith("{") ? rawValue.slice(1, -1) : null,
      description: token.description || null,
    };
  }
}

// --- Tipografia primitiva ---
for (const [name, token] of Object.entries(raw.typography.family)) {
  out.typography.family[name] = token.value;
}
for (const [name, token] of Object.entries(raw.typography.wheight)) {
  out.typography.weight[name] = token.value;
}
for (const [name, token] of Object.entries(raw.typography.size)) {
  out.typography.size[name] = token.value;
}
for (const [name, token] of Object.entries(raw.typography["line height"] || {})) {
  out.typography.lineHeight[name] = token.value;
}

// --- Estilos de texto (display / heading / label / paragraph) ---
for (const category of ["display", "heading", "label", "paragraph"]) {
  const src = raw.font[category] || {};
  for (const [step, token] of Object.entries(src)) {
    const v = token.value;
    out.typography.textStyles[category][step] = {
      fontFamily: v.fontFamily,
      fontSize: v.fontSize,
      lineHeight: v.lineHeight,
      fontWeight: v.fontWeight,
      letterSpacing: v.letterSpacing,
      textCase: v.textCase,
      textDecoration: v.textDecoration,
      description: token.description || null,
    };
  }
  // Alias tambien desde raw.typography[category] si existe (suele tener refs).
  const refs = raw.typography[category];
  if (refs) {
    for (const [step, token] of Object.entries(refs)) {
      if (!out.typography.textStyles[category][step]) {
        out.typography.textStyles[category][step] = {};
      }
      out.typography.textStyles[category][step].aliases = {
        value: token.value,
      };
    }
  }
}

// --- Sizes (space / radius / stroke / icons) ---
for (const kind of ["space", "radius", "stroke", "icons"]) {
  const src = raw.size[kind] || {};
  for (const [name, token] of Object.entries(src)) {
    const resolved = resolveRef(token.value, raw);
    out.size[kind][name] = {
      value: typeof resolved === "number" ? resolved : resolved,
      unit: "px",
      alias: typeof token.value === "string" && token.value.startsWith("{") ? token.value.slice(1, -1) : null,
    };
  }
}

// --- Effects (sombras) ---
// El plugin exporta sombras como:
//  - objeto unico con `value` (shadow-1)
//  - o multiples capas numeradas 0,1,... cada una con su `value` (shadow-2+)
for (const [name, token] of Object.entries(raw.effect || {})) {
  const layers = [];
  if (token.value && typeof token.value === "object" && "shadowType" in token.value) {
    layers.push(token.value);
  } else {
    for (const [k, v] of Object.entries(token)) {
      if (/^\d+$/.test(k) && v && typeof v === "object" && v.value) {
        layers.push(v.value);
      }
    }
  }
  const layersNorm = layers.map((s) => {
    const color = normHex(s.color);
    return {
      type: s.shadowType || "dropShadow",
      x: s.offsetX ?? 0,
      y: s.offsetY ?? 0,
      blur: s.radius ?? 0,
      spread: s.spread ?? 0,
      color: color.hex,
      alpha: color.alpha,
    };
  });
  const css = layersNorm
    .map((s) => {
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r}, ${g}, ${b}, ${s.alpha})`;
    })
    .join(", ");
  out.effects[name] = { layers: layersNorm, css };
}

// --- Grid ---
for (const [name, token] of Object.entries(raw.grid || {})) {
  out.grid[name] = token.value;
}

// --- Devices ---
if (raw.devices?.size) {
  out.devices.size = raw.devices.size.value;
}

writeFileSync(outputPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`[design-tokens] Normalizado -> ${outputPath}`);
console.log(`  colors.primary:   ${Object.keys(out.colors.primary).join(", ")}`);
console.log(`  colors.secondary: ${Object.keys(out.colors.secondary).join(", ")}`);
console.log(`  colors.feedback:  ${Object.keys(out.colors.feedback).join(", ")}`);
console.log(`  neutrals:         ${Object.keys(out.colors.neutrals).length} pasos`);
console.log(`  semantic.bg:      ${Object.keys(out.colors.semantic.bg).length}`);
console.log(`  semantic.text:    ${Object.keys(out.colors.semantic.text).length}`);
console.log(`  semantic.border:  ${Object.keys(out.colors.semantic.border).length}`);
console.log(`  textStyles:       ${["display","heading","label","paragraph"].map(c => c+"="+Object.keys(out.typography.textStyles[c]).length).join(", ")}`);
console.log(`  space/radius/stroke/icons: ${Object.keys(out.size.space).length}/${Object.keys(out.size.radius).length}/${Object.keys(out.size.stroke).length}/${Object.keys(out.size.icons).length}`);
console.log(`  effects:          ${Object.keys(out.effects).join(", ")}`);
console.log(`  grids:            ${Object.keys(out.grid).join(", ")}`);
