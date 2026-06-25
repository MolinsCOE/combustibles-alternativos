import nodemailer from "nodemailer";

/**
 * Lazy-initialized transporter. Reads SMTP config from environment variables
 * validated at startup by the Zod env schema.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env["SMTP_HOST"],
    port: Number(process.env["SMTP_PORT"] ?? 587),
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2" as const,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

let _transporter: ReturnType<typeof createTransporter> | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = createTransporter();
  }
  return _transporter;
}

export type SendMailOptions = {
  to: string;
  bcc?: string;
  subject: string;
  html: string;
  text: string;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

/**
 * SMTP transient errors (timeouts, connection drops, temporary 4xx replies)
 * are retried with backoff; permanent errors (bad auth, malformed address)
 * fail fast on the first attempt.
 */
function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  if (code && ["ETIMEDOUT", "ECONNRESET", "ESOCKET", "ECONNREFUSED", "EAI_AGAIN"].includes(code)) {
    return true;
  }
  const responseCode = (err as { responseCode?: number }).responseCode;
  return typeof responseCode === "number" && responseCode >= 400 && responseCode < 500;
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const from = process.env["SMTP_FROM"];
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await getTransporter().sendMail({
        from: `"Combustibles Molins" <${from}>`,
        to: opts.to,
        bcc: opts.bcc,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      return;
    } catch (err) {
      lastError = err;
      // Drop the cached transporter so the next attempt opens a fresh connection
      // instead of reusing one that may be in a broken state.
      _transporter = null;
      if (attempt === MAX_ATTEMPTS || !isTransientError(err)) {
        throw err;
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
}
