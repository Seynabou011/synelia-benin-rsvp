// Envoi de l'email de confirmation (avec invitation calendrier .ics en pièce jointe)
// via l'API HTTP de Resend (https://resend.com). Aucune dépendance npm requise.
//
// Configuration nécessaire (variables d'environnement Vercel, à ajouter par un humain
// dans le dashboard Vercel - jamais par ce code) :
//   RESEND_API_KEY : clé API du compte Resend
//   RESEND_FROM    : adresse d'expédition, ex "Synelia Bénin <rsvp@votre-domaine-verifie.com>"
//
// Tant que RESEND_API_KEY n'est pas configurée, l'envoi est silencieusement ignoré :
// la confirmation de présence continue de fonctionner normalement, seul l'email
// ne part pas encore.

function icsEscape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Bénin (Afrique de l'Ouest) est fixe en UTC+1 toute l'année (pas de changement d'heure).
function beninLocalToDate(s) {
  if (!s) return null;
  return new Date(s + ':00+01:00');
}

function buildIcs({ uid, summary, description, location, start, end }) {
  const now = toIcsUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Synelia Bénin//RSVP//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function toBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

// Liens "Ajouter à mon agenda" en un clic (Google / Outlook), en plus de la pièce jointe .ics
// (nécessaire pour Apple Calendar et les autres clients mail qui ne proposent pas ces liens).
function buildCalendarLinks({ summary, description, location, start, end }) {
  const startUtc = toIcsUtc(start);
  const endUtc = toIcsUtc(end);
  const startIso = start.toISOString().split('.')[0] + 'Z';
  const endIso = end.toISOString().split('.')[0] + 'Z';

  const googleUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(summary)}` +
    `&dates=${startUtc}/${endUtc}` +
    `&details=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(location)}`;

  const outlookUrl =
    'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
    `&subject=${encodeURIComponent(summary)}` +
    `&startdt=${encodeURIComponent(startIso)}` +
    `&enddt=${encodeURIComponent(endIso)}` +
    `&body=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(location)}`;

  return { googleUrl, outlookUrl };
}

// Charte graphique Synelia (cf. app/globals.css) reprise pour l'email.
const BRAND = {
  night: '#2E2751',   // Violet Nuit — bandeau d'en-tête
  primary: '#6759A2',
  dark: '#453A78',
  mist: '#EDEAF6',    // fond du bloc infos pratiques
  text: '#1C1B2E',
  textMuted: '#6E6985',
};

// Construit le HTML complet de l'email à partir de la charte graphique Synelia :
// bandeau avec logo, bloc "infos pratiques", boutons agenda, signature.
function buildEmailHtml({ nom, bodyIntro, settings, calendarLinksHtml }) {
  const infoLines = [
    settings.date_evenement ? `📅 ${settings.date_evenement}` : '',
    settings.horaires ? `🕒 ${settings.horaires}${settings.accueil ? ' ' + settings.accueil : ''}` : '',
    settings.lieu ? `📍 ${settings.lieu}` : '',
  ].filter(Boolean);

  const infoBlock = infoLines.length
    ? `<div style="background:${BRAND.mist};border-radius:10px;padding:16px 20px;margin:0 0 24px;font-size:14px;line-height:2;color:${BRAND.text};">${infoLines.join('<br/>')}</div>`
    : '';

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F8;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;font-family:Calibri,'Segoe UI',Arial,sans-serif;color:${BRAND.text};">
        <tr>
          <td style="background:${BRAND.night};padding:28px 32px;text-align:center;">
            <img src="https://rsvp.synelia.tech/synelia-logo-white.png" alt="Synelia" style="height:26px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;">Bonjour ${nom || ''},</p>
            <p style="margin:0 0 20px;font-size:15px;">${bodyIntro}</p>
            ${infoBlock}
            ${calendarLinksHtml}
            <p style="margin:24px 0 0;font-size:15px;">Au plaisir de vous accueillir.<br/>À très bientôt,<br/><strong>Synelia Bénin</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// settings : l'objet settings complet (lib/db.js)
// rsvp : { nom, email }
export async function sendConfirmationEmail({ settings, nom, email }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    // Pas encore configuré : on n'envoie rien, sans faire échouer la confirmation.
    return { sent: false, reason: 'not-configured' };
  }

  const start = beninLocalToDate(settings.event_start);
  const end = beninLocalToDate(settings.event_end) || (start ? new Date(start.getTime() + 4 * 60 * 60 * 1000) : null);

  const subject = settings.email_subject || 'Confirmation de votre présence';
  const bodyIntro = settings.email_body || 'Merci pour votre confirmation, nous avons hâte de vous accueillir.';

  let calendarLinksHtml = '';
  if (start) {
    const { googleUrl, outlookUrl } = buildCalendarLinks({
      summary: settings.titre || subject,
      description: bodyIntro,
      location: settings.lieu || '',
      start,
      end,
    });
    calendarLinksHtml =
      `<p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${BRAND.dark};">Ajouter l'événement à votre agenda :</p>` +
      '<p style="margin:0 0 12px;">' +
      `<a href="${googleUrl}" style="display:inline-block;margin:0 10px 10px 0;padding:11px 20px;background:${BRAND.primary};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">+ Google Agenda</a>` +
      `<a href="${outlookUrl}" style="display:inline-block;margin:0 10px 10px 0;padding:11px 20px;background:#ffffff;color:${BRAND.primary};text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;border:1.5px solid ${BRAND.primary};">+ Outlook</a>` +
      '</p>' +
      `<p style="margin:0 0 4px;font-size:12px;color:${BRAND.textMuted};">Vous pouvez également ouvrir la pièce jointe invitation.ics pour ajouter l'événement à Apple Calendar ou à tout autre agenda compatible.</p>`;
  }

  const payload = {
    from,
    to: email,
    subject,
    html: buildEmailHtml({ nom, bodyIntro, settings, calendarLinksHtml }),
  };

  if (start) {
    const ics = buildIcs({
      uid: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2)}@synelia.tech`,
      summary: settings.titre || subject,
      description: bodyIntro,
      location: settings.lieu || '',
      start,
      end,
    });
    payload.attachments = [
      { filename: 'invitation.ics', content: toBase64(ics) },
    ];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${detail}`);
  }

  return { sent: true };
}
