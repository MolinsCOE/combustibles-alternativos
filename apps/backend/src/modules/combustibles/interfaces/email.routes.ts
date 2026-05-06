import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { sendMail } from "../../../shared/email/emailService.js";

const router = Router();

// ---------------------------------------------------------------------------
// Zod schema — validates the incoming request body
// ---------------------------------------------------------------------------

const viajesSchema = z.object({
  l: z.number().int().nonnegative(),
  m: z.number().int().nonnegative(),
  x: z.number().int().nonnegative(),
  j: z.number().int().nonnegative(),
  v: z.number().int().nonnegative(),
  s: z.number().int().nonnegative(),
  d: z.number().int().nonnegative(),
});

const enviarCorreoBodySchema = z.object({
  to: z.string().email(),
  proveedorNom: z.string().min(1),
  materialNom: z.string().min(1),
  semana: z.string().min(1),
  transportistaNom: z.string().min(1),
  viajes: viajesSchema,
  confirmUrl: z.string().url(),
});

type EnviarCorreoBody = z.infer<typeof enviarCorreoBodySchema>;

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

function buildHtml(body: EnviarCorreoBody): string {
  const { proveedorNom, materialNom, semana, transportistaNom, viajes, confirmUrl } = body;
  const total = viajes.l + viajes.m + viajes.x + viajes.j + viajes.v + viajes.s + viajes.d;

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#003E39;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:1.2rem">Cementos Molins — Combustibles Alternativos</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Estimado/a <strong>${proveedorNom}</strong>,</p>
    <p>Os confirmamos la planificación de viajes para la semana <strong>${semana}</strong>:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f3f4f6">
        <th style="padding:8px;text-align:left;border:1px solid #e5e7eb">Material</th>
        <td style="padding:8px;border:1px solid #e5e7eb">${materialNom}</td>
      </tr>
      <tr>
        <th style="padding:8px;text-align:left;border:1px solid #e5e7eb">Transportista</th>
        <td style="padding:8px;border:1px solid #e5e7eb">${transportistaNom}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;text-align:center">
      <tr style="background:#003E39;color:#fff">
        <th style="padding:8px;border:1px solid #005c55">L</th>
        <th style="padding:8px;border:1px solid #005c55">M</th>
        <th style="padding:8px;border:1px solid #005c55">X</th>
        <th style="padding:8px;border:1px solid #005c55">J</th>
        <th style="padding:8px;border:1px solid #005c55">V</th>
        <th style="padding:8px;border:1px solid #005c55">S</th>
        <th style="padding:8px;border:1px solid #005c55">D</th>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.l}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.m}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.x}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.j}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.v}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.s}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${viajes.d}</td>
      </tr>
    </table>
    <p>Total semana: <strong>${total} viajes</strong></p>
    <div style="margin:24px 0;text-align:center">
      <a href="${confirmUrl}" style="background:#003E39;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
        Confirmar / Rechazar planificación
      </a>
    </div>
    <p style="font-size:0.85rem;color:#6b7280">También puedes añadir comentarios desde el mismo enlace.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:0.8rem;color:#9ca3af">Cementos Molins, S.A. — Dept. Compras</p>
  </div>
</div>`.trim();
}

function buildText(body: EnviarCorreoBody): string {
  const { proveedorNom, materialNom, semana, transportistaNom, viajes, confirmUrl } = body;
  const total = viajes.l + viajes.m + viajes.x + viajes.j + viajes.v + viajes.s + viajes.d;
  return (
    `Estimado/a ${proveedorNom},\n\n` +
    `Os confirmamos la planificación de viajes para la semana ${semana}:\n\n` +
    `Material: ${materialNom}\n` +
    `Transportista: ${transportistaNom}\n` +
    `Viajes: L${viajes.l} M${viajes.m} X${viajes.x} J${viajes.j} V${viajes.v} S${viajes.s} D${viajes.d}\n` +
    `Total semana: ${total} viajes\n\n` +
    `Para confirmar o rechazar la planificación accede al siguiente enlace:\n` +
    `${confirmUrl}\n\n` +
    `Saludos,\nDept. Compras — Cementos Molins, S.A.`
  );
}

// ---------------------------------------------------------------------------
// POST /api/combustibles/enviar-correo
// ---------------------------------------------------------------------------

router.post(
  "/api/combustibles/enviar-correo",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = enviarCorreoBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Datos de entrada incorrectos",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const body = parsed.data;
    const subject = `Planificación de viajes — ${body.materialNom} — ${body.semana}`;
    // Durante la fase de pruebas todos los correos van a este buzón
    const recipient = "arnau.guitart@molins.es";

    try {
      await sendMail({
        to: recipient,
        subject,
        html: buildHtml(body),
        text: buildText(body),
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      res.status(500).json({ code: "SMTP_ERROR", message });
    }
  }
);

export { router as combustiblesEmailRouter };
