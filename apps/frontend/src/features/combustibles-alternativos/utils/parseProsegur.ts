/**
 * Parser del fichero de viajes reales de Prosegur.
 *
 * NOTA: El proyecto no tiene SheetJS instalado. Esta implementación acepta CSV
 * (separado por punto y coma o coma) exportado desde Excel.
 * Para aceptar .xlsx directamente, instalar la librería `xlsx` con aprobación del usuario.
 *
 * Columnas esperadas (en orden):
 *   DNI | APELLIDOS Y NOMBRE | FECHA | ORA ENTRADA | TARJETA | TRACTORA |
 *   REMOLQUE | MATERIAL | JLL SEGUIMENT | ORA SALIDA | OBSERVACIONES
 */

import type { Material, Proveedor, Transportista, Asignacion } from "../data/mock.js";

export type FilaProsegurParseada = {
  /** Texto original de la columna MATERIAL */
  materialTextoOriginal: string;
  /** Nombre del material resuelto desde el maestro (null si no se pudo resolver) */
  materialNombre: string | null;
  materialId: string | null;
  /** Nombre del proveedor resuelto */
  proveedorNombre: string | null;
  proveedorId: string | null;
  /** Nombre del transportista resuelto */
  transportistaNombre: string | null;
  transportistaId: string | null;
  /** Fecha en formato ISO yyyy-MM-dd */
  fecha: string;
  /** Hora de entrada original */
  horaEntrada: string;
  /** Hora de salida original */
  horaSalida: string;
  /** Destino de descarga (BÚNKER / QUEMADOR) */
  destino: string;
  /** DNI del conductor */
  dni: string;
  /** Nombre del conductor */
  conductor: string;
  /** true si algún campo no se pudo mapear al maestro */
  noMapeado: boolean;
};

// ---------------------------------------------------------------------------
// Helpers de normalización
// ---------------------------------------------------------------------------

function normalizar(texto: string): string {
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function parseFecha(raw: string): string {
  // Formato esperado: dd/mm/yyyy
  const partes = raw.trim().split("/");
  if (partes.length === 3) {
    const d = partes[0] ?? "";
    const m = partes[1] ?? "";
    const y = partes[2] ?? "";
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Resolución de MATERIAL contra el maestro
// ---------------------------------------------------------------------------

type MaestrosMaterial = {
  materiales: Material[];
  proveedores: Proveedor[];
  transportistas: Transportista[];
  asignaciones: Asignacion[];
};

type ResolucionMaterial = {
  materialNombre: string | null;
  materialId: string | null;
  proveedorNombre: string | null;
  proveedorId: string | null;
  transportistaNombre: string | null;
  transportistaId: string | null;
  noMapeado: boolean;
};

/**
 * Estrategia de resolución (orden de prioridad):
 * 1. Busca si algún nombre de material del maestro es prefijo del texto.
 * 2. Busca si algún nombre de transportista es sufijo del texto.
 * 3. El texto intermedio corresponde al proveedor.
 * 4. Si no encuentra proveedor, lo infiere de las asignaciones del maestro.
 */
export function resolverMaterial(
  textoOriginal: string,
  maestros: MaestrosMaterial
): ResolucionMaterial {
  const textoNorm = normalizar(textoOriginal);

  // Ordenar materiales de mayor a menor longitud de nombre (más específico primero)
  const materialesOrdenados = [...maestros.materiales].sort(
    (a, b) => b.nombre.length - a.nombre.length
  );

  let materialEncontrado: Material | null = null;
  let restoTrasMedia = textoNorm;

  for (const mat of materialesOrdenados) {
    const nomNorm = normalizar(mat.nombre);
    if (textoNorm.startsWith(nomNorm)) {
      materialEncontrado = mat;
      restoTrasMedia = textoNorm.slice(nomNorm.length).trim();
      break;
    }
  }

  // Si no encontró material por prefijo, el texto completo queda sin mapear
  if (!materialEncontrado) {
    return {
      materialNombre: null,
      materialId: null,
      proveedorNombre: null,
      proveedorId: null,
      transportistaNombre: null,
      transportistaId: null,
      noMapeado: true
    };
  }

  // Intentar resolver transportista por sufijo sobre el resto
  const transportistasOrdenados = [...maestros.transportistas].sort(
    (a, b) => b.nombre.length - a.nombre.length
  );

  let transportistaEncontrado: Transportista | null = null;
  let restoTrasTransportista: string = restoTrasMedia;

  for (const tr of transportistasOrdenados) {
    const nomNorm = normalizar(tr.nombre);
    if (restoTrasMedia.endsWith(nomNorm)) {
      transportistaEncontrado = tr;
      restoTrasTransportista = restoTrasMedia.slice(0, restoTrasMedia.length - nomNorm.length).trim();
      break;
    }
  }

  // El texto intermedio restante debería ser el proveedor
  let proveedorEncontrado: Proveedor | null = null;

  if (restoTrasTransportista.length > 0) {
    proveedorEncontrado =
      maestros.proveedores.find(
        (p) => normalizar(p.nombre) === restoTrasTransportista
      ) ?? null;
  }

  // Si no encontramos proveedor por texto, inferir desde el maestro de asignaciones
  if (!proveedorEncontrado && transportistaEncontrado && materialEncontrado) {
    const matId = materialEncontrado.id;
    const trId = transportistaEncontrado.id;
    const asignacion = maestros.asignaciones.find(
      (a) => a.materialId === matId && a.transportistaId === trId
    );
    if (asignacion) {
      proveedorEncontrado =
        maestros.proveedores.find((p) => p.id === asignacion.proveedorId) ?? null;
    }
  }

  // Si no encontramos transportista pero sí tenemos texto, intentar inferir desde asignaciones
  if (!transportistaEncontrado && proveedorEncontrado && materialEncontrado) {
    const matId = materialEncontrado.id;
    const provId = proveedorEncontrado.id;
    const asignacion = maestros.asignaciones.find(
      (a) => a.materialId === matId && a.proveedorId === provId
    );
    if (asignacion) {
      transportistaEncontrado =
        maestros.transportistas.find((t) => t.id === asignacion.transportistaId) ?? null;
    }
  }

  const noMapeado =
    materialEncontrado === null ||
    proveedorEncontrado === null ||
    transportistaEncontrado === null;

  return {
    materialNombre: materialEncontrado?.nombre ?? null,
    materialId: materialEncontrado?.id ?? null,
    proveedorNombre: proveedorEncontrado?.nombre ?? null,
    proveedorId: proveedorEncontrado?.id ?? null,
    transportistaNombre: transportistaEncontrado?.nombre ?? null,
    transportistaId: transportistaEncontrado?.id ?? null,
    noMapeado
  };
}

// ---------------------------------------------------------------------------
// Parser CSV principal
// ---------------------------------------------------------------------------

const INDICES = {
  DNI: 0,
  APELLIDOS_Y_NOMBRE: 1,
  FECHA: 2,
  ORA_ENTRADA: 3,
  // TARJETA: 4  — no se usa
  // TRACTORA: 5 — no se usa
  // REMOLQUE: 6 — no se usa
  MATERIAL: 7,
  // JLL_SEGUIMENT: 8 — ignorar
  ORA_SALIDA: 9,
  OBSERVACIONES: 10
} as const;

/**
 * Detecta el separador usado en el CSV (punto y coma o coma).
 */
function detectarSeparador(linea: string): string {
  const comas = (linea.match(/,/g) ?? []).length;
  const puntosComa = (linea.match(/;/g) ?? []).length;
  return puntosComa >= comas ? ";" : ",";
}

/**
 * Divide una línea CSV respetando campos entre comillas.
 */
function dividirLinea(linea: string, sep: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let enComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      enComillas = !enComillas;
    } else if (c === sep && !enComillas) {
      campos.push(actual.trim().replace(/^"|"$/g, ""));
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual.trim().replace(/^"|"$/g, ""));
  return campos;
}

export type ResultadoParseo = {
  filas: FilaProsegurParseada[];
  /** Número de filas que no se pudieron mapear al maestro */
  noMapeadas: number;
  /** Número de filas omitidas por formato incorrecto */
  omitidas: number;
  error: string | null;
};

/**
 * Parsea el contenido de un fichero CSV exportado desde el Excel de Prosegur.
 */
export function parsearCSVProsegur(
  contenidoCSV: string,
  maestros: MaestrosMaterial
): ResultadoParseo {
  const lineas = contenidoCSV
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) {
    return { filas: [], noMapeadas: 0, omitidas: 0, error: "El fichero está vacío." };
  }

  const primeraLinea0 = lineas[0] ?? "";
  const separador = detectarSeparador(primeraLinea0);

  // Determinar si la primera línea es cabecera: si el campo 0 normalizado contiene "DNI" o es texto
  const primeraLinea = dividirLinea(primeraLinea0, separador);
  const primeroNorm = normalizar(primeraLinea[0] ?? "");
  const esCabecera =
    primeraLinea.length > 0 &&
    (primeroNorm.includes("DNI") || isNaN(Number(primeraLinea[0] ?? "")));

  const filasAModo = esCabecera ? lineas.slice(1) : lineas;

  const filas: FilaProsegurParseada[] = [];
  let omitidas = 0;

  for (const linea of filasAModo) {
    const campos = dividirLinea(linea, separador);

    // Validar que hay suficientes columnas
    if (campos.length < 11) {
      omitidas++;
      continue;
    }

    const materialTexto = campos[INDICES.MATERIAL]?.trim() ?? "";
    if (!materialTexto) {
      omitidas++;
      continue;
    }

    const resolucion = resolverMaterial(materialTexto, maestros);

    filas.push({
      materialTextoOriginal: materialTexto,
      ...resolucion,
      fecha: parseFecha(campos[INDICES.FECHA] ?? ""),
      horaEntrada: campos[INDICES.ORA_ENTRADA]?.trim() ?? "",
      horaSalida: campos[INDICES.ORA_SALIDA]?.trim() ?? "",
      destino: campos[INDICES.OBSERVACIONES]?.trim() ?? "",
      dni: campos[INDICES.DNI]?.trim() ?? "",
      conductor: campos[INDICES.APELLIDOS_Y_NOMBRE]?.trim() ?? ""
    });
  }

  const noMapeadas = filas.filter((f) => f.noMapeado).length;

  return { filas, noMapeadas, omitidas, error: null };
}
