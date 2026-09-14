// Envoi de l'email de confirmation (avec invitation calendrier .ics en pièce jointe)
// via l'API HTTP de Resend (https://resend.com). Aucune dépendance npm requise.
//
// Configuration nécessaire (variables d'environnement Vercel, à ajouter par un humain
// dans le dashboard Vercel — jamais par ce code) :
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

  const htmlLines = [
    `<p>Bonjour ${nom || ''},</p>`,
    `<p>${bodyIntro}</p>`,
    '<p>',
    settings.date_evenement ? `📅 ${settings.date_evenement}<br/>` : '',
    settings.horaires ? `🕒 ${settings.horaires}${settings.accueil ? ' — ' + settings.accueil : ''}<br/>` : '',
    settings.lieu ? `📍 ${settings.lieu}<br/>` : '',
    '</p>',
    start ? "<p>Vous trouverez l'invitation à ajouter à votre agenda en pièce jointe.</p>" : '',
    '<p>À très bientôt,<br/>Synelia Bénin</p>',
  ];

  const payload = {
    from,
    to: email,
    subject,
    html: htmlLines.filter(Boolean).join('\n'),
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
