import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { DiaKey, HorarioLlegada } from "../store/caStore.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const FRANJAS = [
  "05:00-06:30",
  "07:00-08:30",
  "09:00-10:30",
  "11:00-12:30",
  "13:00-14:30",
  "15:00-16:30",
  "17:00-18:30",
  "18:30-20:00",
] as const;

const DIAS: { key: DiaKey; label: string }[] = [
  { key: "dl", label: "L" },
  { key: "dt", label: "M" },
  { key: "dc", label: "X" },
  { key: "dj", label: "J" },
  { key: "dv", label: "V" },
  { key: "ds", label: "S" },
  { key: "dg", label: "D" },
];

const SILO_CONFIG = {
  silo1: {
    label: "Silo 1",
    bg: "rgba(0,62,57,0.08)",
    bgFilled: "rgba(0,62,57,0.15)",
    border: "rgba(0,62,57,0.3)",
    dot: "var(--c-primary-500, #003e39)",
    text: "var(--c-primary-700, #002e2a)",
  },
  silo2: {
    label: "Silo 2",
    bg: "rgba(202,138,4,0.07)",
    bgFilled: "rgba(202,138,4,0.14)",
    border: "rgba(202,138,4,0.3)",
    dot: "#b45309",
    text: "#92400e",
  },
} as const;

type Silo = "silo1" | "silo2";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type HorarioSlot = {
  id: number;
  dia: DiaKey;
  franja: string;
  silo: Silo;
  materialNom: string;
};

export type HorarioLlegadasGridProps = {
  solicitudId?: number;
  horario?: HorarioLlegada[];
  slots?: HorarioSlot[];
  materiales: string[];
  editable?: boolean;
  onUpsert?: (dia: DiaKey, franja: string, silo: Silo, materialNom: string) => void;
  onDelete?: (slotId: number) => void;
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function findSlot(
  allSlots: HorarioSlot[],
  dia: DiaKey,
  franja: string,
  silo: Silo
): HorarioSlot | undefined {
  return allSlots.find((h) => h.dia === dia && h.franja === franja && h.silo === silo);
}

// ---------------------------------------------------------------------------
// Popover de edición inline
// ---------------------------------------------------------------------------

type EditPopoverProps = {
  materiales: string[];
  current?: string;
  onSave: (materialNom: string) => void;
  onDelete?: () => void;
  onClose: () => void;
};

function EditPopover({ materiales, current, onSave, onDelete, onClose }: EditPopoverProps) {
  const [selected, setSelected] = useState(current ?? "");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          padding: "1.25rem",
          width: "280px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Asignar material</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
            <X size={16} style={{ color: "var(--c-neutral-500)" }} />
          </button>
        </div>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid var(--c-neutral-300)",
            borderRadius: "6px",
            marginBottom: "1rem",
            background: "white",
          }}
        >
          <option value="">— Seleccionar material —</option>
          {materiales.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          {current && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8rem",
                border: "1px solid var(--c-error-300, #fca5a5)",
                borderRadius: "6px",
                background: "var(--c-error-50, #fef2f2)",
                color: "var(--c-error-700, #b91c1c)",
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.8rem",
              border: "1px solid var(--c-neutral-300)",
              borderRadius: "6px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => { if (selected) onSave(selected); }}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.8rem",
              border: "none",
              borderRadius: "6px",
              background: selected ? "var(--c-primary-500, #003e39)" : "var(--c-neutral-200)",
              color: selected ? "white" : "var(--c-neutral-400)",
              cursor: selected ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Celda silo
// ---------------------------------------------------------------------------

type SiloCellProps = {
  silo: Silo;
  slot: HorarioSlot | undefined;
  editable: boolean;
  onEdit: (silo: Silo, current?: string) => void;
};

function SiloCell({ silo, slot, editable, onEdit }: SiloCellProps) {
  const cfg = SILO_CONFIG[silo];

  return (
    <div
      onClick={editable ? () => onEdit(silo, slot?.materialNom) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "3px 6px",
        borderRadius: "4px",
        background: slot ? cfg.bgFilled : cfg.bg,
        border: `1px solid ${cfg.border}`,
        cursor: editable ? "pointer" : "default",
        minHeight: "24px",
        transition: "opacity 0.15s",
        opacity: editable ? 1 : (slot ? 1 : 0.4),
      }}
      title={editable ? (slot ? `Editar: ${slot.materialNom}` : `Asignar ${cfg.label}`) : undefined}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {slot ? (
        <span style={{ fontSize: "0.72rem", color: cfg.text, fontWeight: 500, lineHeight: 1.2 }}>
          {slot.materialNom}
        </span>
      ) : (
        <span style={{ fontSize: "0.68rem", color: cfg.dot, opacity: 0.6 }}>
          {cfg.label}
          {editable ? " +" : ""}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function HorarioLlegadasGrid({
  solicitudId,
  horario,
  slots: slotsProp,
  materiales,
  editable = false,
  onUpsert,
  onDelete,
}: HorarioLlegadasGridProps) {
  const { t } = useTranslation("combustibles");

  // Normalizar: si vienen slots ya normalizados, usarlos; si no, filtrar por solicitudId
  const allSlots: HorarioSlot[] = slotsProp
    ? slotsProp
    : (horario ?? [])
        .filter((h) => solicitudId === undefined || h.solicitudId === solicitudId)
        .map((h) => ({ id: h.id, dia: h.dia, franja: h.franja, silo: h.silo, materialNom: h.materialNom }));

  const [editTarget, setEditTarget] = useState<{
    dia: DiaKey;
    franja: string;
    silo: Silo;
    current?: string;
    slotId?: number;
  } | null>(null);

  const handleEdit = (dia: DiaKey, franja: string, silo: Silo, currentMaterial?: string) => {
    const slot = findSlot(allSlots, dia, franja, silo);
    setEditTarget({ dia, franja, silo, current: currentMaterial, slotId: slot?.id });
  };

  const handleSave = (materialNom: string) => {
    if (!editTarget) return;
    onUpsert?.(editTarget.dia, editTarget.franja, editTarget.silo, materialNom);
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!editTarget?.slotId) return;
    onDelete?.(editTarget.slotId);
    setEditTarget(null);
  };

  return (
    <div>
      {/* Leyenda */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {(["silo1", "silo2"] as Silo[]).map((silo) => {
          const cfg = SILO_CONFIG[silo];
          return (
            <div key={silo} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--c-neutral-600)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
              {cfg.label}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.82rem" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 10px",
                  background: "var(--c-neutral-50)",
                  border: "1px solid var(--c-neutral-200)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  fontSize: "0.75rem",
                  color: "var(--c-neutral-500)",
                  minWidth: "110px",
                }}
              >
                {t("horario.franja", "Franja")}
              </th>
              {DIAS.map((d) => (
                <th
                  key={d.key}
                  style={{
                    padding: "6px 8px",
                    background: "var(--c-neutral-50)",
                    border: "1px solid var(--c-neutral-200)",
                    fontWeight: 700,
                    textAlign: "center",
                    fontSize: "0.78rem",
                    color: "var(--c-neutral-700)",
                    minWidth: "80px",
                  }}
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS.map((franja) => (
              <tr key={franja}>
                <td
                  style={{
                    padding: "6px 10px",
                    border: "1px solid var(--c-neutral-200)",
                    background: "var(--c-neutral-50)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    fontSize: "0.78rem",
                    color: "var(--c-neutral-600)",
                  }}
                >
                  {franja}
                </td>
                {DIAS.map((d) => (
                  <td
                    key={d.key}
                    style={{
                      padding: "4px 6px",
                      border: "1px solid var(--c-neutral-200)",
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <SiloCell
                        silo="silo1"
                        slot={findSlot(allSlots, d.key, franja, "silo1")}
                        editable={editable}
                        onEdit={(silo, current) => handleEdit(d.key, franja, silo, current)}
                      />
                      <SiloCell
                        silo="silo2"
                        slot={findSlot(allSlots, d.key, franja, "silo2")}
                        editable={editable}
                        onEdit={(silo, current) => handleEdit(d.key, franja, silo, current)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditPopover
          materiales={materiales}
          current={editTarget.current}
          onSave={handleSave}
          onDelete={editTarget.slotId ? handleDelete : undefined}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
