import { clientIp, forwardErrors } from './http';
import { AttemptLimiter } from './rate-limit';
import {
  ContactFields,
  ContactPayload,
  escapeHtml,
  isHoneypotTripped,
  validatePayload,
} from './contact.validation';

/** Cinco mensajes por hora y por IP: de sobra para una persona, poco para un script. */
export const CONTACT_MAX_SUBMISSIONS = 5;
export const CONTACT_WINDOW_MS = 60 * 60 * 1000;

/** Si Resend no contesta a tiempo, el visitante recibe un error en vez de una espera eterna. */
const RESEND_TIMEOUT_MS = 10000;

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
        // El asunto es una sola línea: un salto de línea en el nombre no tiene
        // por qué llegar a una cabecera del correo.
        subject: `Nuevo contacto — ${fields.name.replace(/[\r\n]+/g, ' ')}`,
        html: buildEmailHtml(fields),
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Endpoint POST /api/contact: valida el formulario y envía el email
 * vía la API HTTP de Resend (sin dependencia npm adicional).
 * Requiere las env vars RESEND_API_KEY y CONTACT_TO_EMAIL.
 * Los envíos se cuentan donde diga `submissions`: en Redis, si está.
 */
export function createContactHandler(submissions: AttemptLimiter) {
  return forwardErrors(async (req, res) => {
    const payload = req.body as ContactPayload;

    // Al bot se le responde éxito: si supiera que fue detectado, probaría otra cosa.
    if (isHoneypotTripped(payload)) {
      res.status(204).end();
      return;
    }

    if (!(await submissions.tryConsume(clientIp(req)))) {
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
  });
}
