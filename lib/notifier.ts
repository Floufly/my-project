import type { GeneratedSite } from './sites-db';

export type ContactChannel = 'sms' | 'email' | 'whatsapp';

export type ContactResult = {
  success: boolean;
  channel: ContactChannel;
  messageId?: string;
  error?: string;
};

function getSiteBaseUrl() {
  return process.env.SITE_BASE_URL ?? 'http://localhost:3000';
}

// ── SMS via Twilio ─────────────────────────────────────────────────────────────

async function sendSms(to: string, body: string): Promise<ContactResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { success: false, channel: 'sms', error: 'Variables Twilio manquantes (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, channel: 'sms', error: data.message ?? `Twilio error ${res.status}` };
  }
  return { success: true, channel: 'sms', messageId: data.sid };
}

// ── Email via Resend ───────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<ContactResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@votredomaine.fr';

  if (!apiKey) {
    return { success: false, channel: 'email', error: 'RESEND_API_KEY manquante' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, channel: 'email', error: data.message ?? `Resend error ${res.status}` };
  }
  return { success: true, channel: 'email', messageId: data.id };
}

// ── Message templates ──────────────────────────────────────────────────────────

function buildSmsMessage(site: GeneratedSite): string {
  const siteUrl = `${getSiteBaseUrl()}/sites/${site.slug}`;
  return `Bonjour, nous avons créé un site web GRATUIT pour "${site.businessName}" ! 🌐\nDécouvrez-le ici : ${siteUrl}\nEssai gratuit 30 jours, sans engagement.\nPour en savoir plus, répondez à ce message.`;
}

function buildEmailHtml(site: GeneratedSite): string {
  const siteUrl = `${getSiteBaseUrl()}/sites/${site.slug}`;
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f8fafc;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${site.primaryColor};padding:2rem;text-align:center">
      <h1 style="color:white;margin:0;font-size:1.5rem">Votre site web est prêt ! 🎉</h1>
    </div>
    <div style="padding:2rem">
      <p style="font-size:1rem;color:#334155">Bonjour,</p>
      <p style="font-size:1rem;color:#334155;line-height:1.6">
        Nous avons remarqué que <strong>${site.businessName}</strong> n'avait pas encore de site web.<br>
        Alors nous en avons créé un pour vous — <strong>gratuitement</strong> !
      </p>
      <div style="background:${site.secondaryColor};border-left:4px solid ${site.primaryColor};padding:1rem 1.2rem;border-radius:6px;margin:1.5rem 0">
        <p style="margin:0;font-size:0.9rem;color:#475569">Votre site de démonstration :</p>
        <a href="${siteUrl}" style="color:${site.primaryColor};font-weight:700;font-size:1rem;word-break:break-all">${siteUrl}</a>
      </div>
      <p style="font-size:0.95rem;color:#334155;line-height:1.6">Ce que comprend votre site :</p>
      <ul style="color:#475569;font-size:0.9rem;line-height:2">
        ${site.services.slice(0, 4).map((s) => `<li>✓ ${s}</li>`).join('')}
        <li>✓ Votre adresse & téléphone</li>
        <li>✓ Vos avis Google (${site.reviewCount ?? 0} avis)</li>
      </ul>
      <div style="text-align:center;margin:2rem 0">
        <a href="${siteUrl}" style="background:${site.primaryColor};color:white;padding:0.9rem 2rem;border-radius:50px;font-weight:700;font-size:1rem;display:inline-block;text-decoration:none">
          👀 Voir mon site gratuitement
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0">
      <p style="font-size:0.85rem;color:#94a3b8;text-align:center">
        Essai gratuit 30 jours · Sans engagement · Répondez à cet email pour en savoir plus
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailSubject(site: GeneratedSite): string {
  return `${site.businessName} — Votre site web gratuit est prêt !`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function contactBusiness(
  site: GeneratedSite,
  channels: ContactChannel[]
): Promise<ContactResult[]> {
  const results: ContactResult[] = [];

  for (const channel of channels) {
    if (channel === 'sms') {
      if (!site.phone) {
        results.push({ success: false, channel: 'sms', error: 'Pas de numéro de téléphone' });
        continue;
      }
      const msg = buildSmsMessage(site);
      results.push(await sendSms(site.phone, msg));
    }

    if (channel === 'email') {
      // Google Places doesn't return emails — placeholder for when user provides one
      results.push({ success: false, channel: 'email', error: 'Email non disponible via Google Maps' });
    }
  }

  return results;
}
