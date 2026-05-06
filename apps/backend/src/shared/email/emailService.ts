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
  subject: string;
  html: string;
  text: string;
};

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const from = process.env["SMTP_FROM"];
  await getTransporter().sendMail({
    from: `"Combustibles Molins" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
