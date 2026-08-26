import type { Request, Response } from 'express';
import { SlidingWindowRateLimiter } from './rate-limit';
import {
  ContactFields,
  ContactPayload,
  escapeHtml,
  isHoneypotTripped,
  validatePayload,
} from './contact.validation';

const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const rateLimiter = new SlidingWindowRateLimiter(MAX_SUBMISSIONS, WINDOW_MS);

function buildEmailHtml(fields: ContactFields): string {
  const companyLine = fields.company ? `<p><b>Empresa:</b> ${escapeHtml(fields.company)}</p>` : '';

  return `
    <h2>Nuevo mensaje desde bytektechnology.com</h2>
    <p><b>Nombre:</b> ${escapeHtml(fields.name)}</p>
    <p><b>Email:</b> ${escapeHtml(fields.email)}</p>
    ${companyLine}
    <p><b>Mensaje:</b></p>
    <p>${escapeHtml(fields.message).replace(/\n/g, '<br>')}</p>
  `;
}

async function sendEmail(fields: ContactFields, apiKey: string, to: string): Promise<boolean> {
  // Declarada en blanco no es lo mismo que ausente, y en blanco es justo como
  // queda una variable que todavía no se completó: `??` la dejaba pasar y el
  // envío salía sin remitente, que Resend rechaza. El respaldo de prueba sólo
  // entrega a la casilla dueña de la cuenta; para el resto hace falta un
  // dominio verificado.
  const from = process.env['CONTACT_FROM_EMAIL']?.trim() || 'Bytek <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: fields.email,
        subject: `Nuevo contacto — ${fields.name}`,
        html: buildEmailHtml(fields),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** IP del cliente detrás del proxy de Vercel, con la conexión directa como respaldo. */
function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

/**
 * Endpoint POST /api/contact: valida el formulario y envía el email
 * vía la API HTTP de Resend (sin dependencia npm adicional).
 * Requiere las env vars RESEND_API_KEY y CONTACT_TO_EMAIL.
 */
export async function handleContact(req: Request, res: Response): Promise<void> {
  const payload = req.body as ContactPayload;

  // Al bot se le responde éxito: si supiera que fue detectado, probaría otra cosa.
  if (isHoneypotTripped(payload)) {
    res.status(204).end();
    return;
  }

  if (!rateLimiter.tryConsume(clientIp(req))) {
    res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
    return;
  }

  const validation = validatePayload(payload);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const apiKey = process.env['RESEND_API_KEY'];
  const to = process.env['CONTACT_TO_EMAIL'];
  if (!apiKey || !to) {
    res.status(503).json({ error: 'EMAIL_NOT_CONFIGURED' });
    return;
  }

  const sent = await sendEmail(validation.fields, apiKey, to);
  if (!sent) {
    res.status(502).json({ error: 'EMAIL_SEND_FAILED' });
    return;
  }

  res.status(204).end();
}
