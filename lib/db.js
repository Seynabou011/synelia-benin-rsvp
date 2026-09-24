import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

let schemaReady = false;

// Valeurs historiques de l'événement Synelia Bénin — utilisées uniquement pour
// migrer une fois les anciennes tables (benin_rsvp / benin_rsvp_settings) vers
// le nouveau modèle multi-événements (rsvp_events / rsvp_settings / rsvp_submissions).
const BENIN_DEFAULT_SETTINGS = {
  titre: "Du Code du numérique à l'IA : accélérer la transformation numérique du Bénin en renforçant sa souveraineté",
  sous_titre: 'Lancement officiel de Synelia Bénin',
  lieu: 'Golden Tulip, Cotonou',
  date_evenement: '22 octobre 2026',
  horaires: '8h30 – 16h30',
  accueil: 'Accueil dès 8h00',
  programme_matin_titre: 'Table ronde',
  programme_matin_desc:
    "Transformation numérique à l'ère de l'IA et du cloud : comment concilier innovation et souveraineté à la lumière du Code du numérique au Bénin ?",
  programme_am_titre: 'Deux ateliers au choix',
  programme_am_desc:
    'Accélérer (IA) ou Renforcer (cloud, données, cybersécurité) — vous choisissez ci-dessous.',
  intro: "Une minute suffit. Vous recevrez une confirmation par e-mail avec l'invitation agenda.",
  atelier1_titre: 'Atelier 1 — Accélérer',
  atelier1_desc:
    "L'IA au service de la transformation numérique : des cas d'usage concrets pour les organisations publiques et privées",
  atelier2_titre: 'Atelier 2 — Renforcer',
  atelier2_desc:
    'Cloud, données et cybersécurité : bâtir une transformation numérique souveraine et résiliente',
  privacy_note:
    "Vos coordonnées servent uniquement à l'organisation de cet événement et ne sont pas transmises à des tiers.",
  footer_text: 'Groupe Synelia · Abidjan · Cotonou · Ouagadougou · Lomé · Monrovia · Lisbonne',
  date_debut: '',
  date_fin: '',
  pas_ouvert_titre: "Le formulaire n'est pas encore ouvert",
  pas_ouvert_message: 'Merci de revenir un peu plus tard pour confirmer votre présence.',
  ferme_titre: 'Le formulaire de confirmation est fermé',
  ferme_message:
    "La période de confirmation est terminée. Merci de contacter l'organisation si vous avez une question.",
  event_start: '',
  event_end: '',
  email_subject: 'Confirmation de votre présence — Lancement officiel de Synelia Bénin',
  email_body: 'Nous vous remercions pour votre confirmation et sommes ravis de vous compter parmi nos invités.',
};

// Valeurs par défaut pour tout NOUVEL événement créé depuis le back office.
export const GENERIC_DEFAULT_SETTINGS = {
  titre: '',
  sous_titre: '',
  lieu: '',
  date_evenement: '',
  horaires: '',
  accueil: '',
  programme_matin_titre: '',
  programme_matin_desc: '',
  programme_am_titre: '',
  programme_am_desc: '',
  intro: 'Merci de confirmer votre présence.',
  atelier1_titre: '',
  atelier1_desc: '',
  atelier2_titre: '',
  atelier2_desc: '',
  privacy_note:
    "Vos coordonnées servent uniquement à l'organisation de cet événement et ne sont pas transmises à des tiers.",
  footer_text: 'Groupe Synelia · Abidjan · Cotonou · Ouagadougou · Lomé · Monrovia · Lisbonne',
  date_debut: '',
  date_fin: '',
  pas_ouvert_titre: "Le formulaire n'est pas encore ouvert",
  pas_ouvert_message: 'Merci de revenir un peu plus tard pour confirmer votre présence.',
  ferme_titre: 'Le formulaire de confirmation est fermé',
  ferme_message:
    "La période de confirmation est terminée. Merci de contacter l'organisation si vous avez une question.",
  event_start: '',
  event_end: '',
  email_subject: 'Confirmation de votre présence',
  email_body: 'Nous vous remercions pour votre confirmation et sommes ravis de vous compter parmi nos invités.',
};

const SETTINGS_COLUMNS = Object.keys(GENERIC_DEFAULT_SETTINGS);

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 60);
}

export async function ensureSchema() {
  if (schemaReady) return;

  // --- Anciennes tables (historique Bénin, conservées telles quelles) ---
  await sql`
    CREATE TABLE IF NOT EXISTS benin_rsvp (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL DEFAULT '',
      fonction TEXT NOT NULL DEFAULT '',
      organisation TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      telephone TEXT NOT NULL DEFAULT '',
      present BOOLEAN NOT NULL DEFAULT true,
      accompagnants INTEGER NOT NULL DEFAULT 0,
      atelier TEXT NOT NULL DEFAULT '',
      delegation_note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE benin_rsvp ADD COLUMN IF NOT EXISTS delegation_note TEXT NOT NULL DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS benin_rsvp_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      titre TEXT NOT NULL DEFAULT '',
      sous_titre TEXT NOT NULL DEFAULT '',
      lieu TEXT NOT NULL DEFAULT '',
      date_evenement TEXT NOT NULL DEFAULT '',
      intro TEXT NOT NULL DEFAULT '',
      CHECK (id = 1)
    )
  `;
  await sql`
    INSERT INTO benin_rsvp_settings (id, titre, sous_titre, lieu, date_evenement, intro)
    VALUES (1, ${BENIN_DEFAULT_SETTINGS.titre}, ${BENIN_DEFAULT_SETTINGS.sous_titre}, ${BENIN_DEFAULT_SETTINGS.lieu}, ${BENIN_DEFAULT_SETTINGS.date_evenement}, ${BENIN_DEFAULT_SETTINGS.intro})
    ON CONFLICT (id) DO NOTHING
  `;
  for (const col of [
    'atelier1_titre', 'atelier1_desc', 'atelier2_titre', 'atelier2_desc',
    'date_debut', 'date_fin', 'pas_ouvert_titre', 'pas_ouvert_message',
    'ferme_titre', 'ferme_message', 'horaires', 'accueil',
    'programme_matin_titre', 'programme_matin_desc', 'programme_am_titre', 'programme_am_desc',
    'privacy_note', 'footer_text', 'event_start', 'event_end', 'email_subject', 'email_body',
  ]) {
    await sql.query(`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS ${col} TEXT NOT NULL DEFAULT ''`);
  }
  await sql`
    UPDATE benin_rsvp_settings SET
      email_subject = ${BENIN_DEFAULT_SETTINGS.email_subject},
      email_body = ${BENIN_DEFAULT_SETTINGS.email_body}
    WHERE id = 1 AND email_subject = ''
  `;
  await sql`
    UPDATE benin_rsvp_settings SET
      atelier1_titre = ${BENIN_DEFAULT_SETTINGS.atelier1_titre},
      atelier1_desc = ${BENIN_DEFAULT_SETTINGS.atelier1_desc},
      atelier2_titre = ${BENIN_DEFAULT_SETTINGS.atelier2_titre},
      atelier2_desc = ${BENIN_DEFAULT_SETTINGS.atelier2_desc}
    WHERE id = 1 AND atelier1_titre = ''
  `;
  await sql`
    UPDATE benin_rsvp_settings SET
      pas_ouvert_titre = ${BENIN_DEFAULT_SETTINGS.pas_ouvert_titre},
      pas_ouvert_message = ${BENIN_DEFAULT_SETTINGS.pas_ouvert_message},
      ferme_titre = ${BENIN_DEFAULT_SETTINGS.ferme_titre},
      ferme_message = ${BENIN_DEFAULT_SETTINGS.ferme_message}
    WHERE id = 1 AND ferme_titre = ''
  `;

  // --- Nouveau modèle multi-événements ---
  await sql`
    CREATE TABLE IF NOT EXISTS rsvp_events (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rsvp_settings (
      event_id INTEGER PRIMARY KEY REFERENCES rsvp_events(id) ON DELETE CASCADE,
      titre TEXT NOT NULL DEFAULT '',
      sous_titre TEXT NOT NULL DEFAULT '',
      lieu TEXT NOT NULL DEFAULT '',
      date_evenement TEXT NOT NULL DEFAULT '',
      intro TEXT NOT NULL DEFAULT '',
      atelier1_titre TEXT NOT NULL DEFAULT '',
      atelier1_desc TEXT NOT NULL DEFAULT '',
      atelier2_titre TEXT NOT NULL DEFAULT '',
      atelier2_desc TEXT NOT NULL DEFAULT '',
      date_debut TEXT NOT NULL DEFAULT '',
      date_fin TEXT NOT NULL DEFAULT '',
      pas_ouvert_titre TEXT NOT NULL DEFAULT '',
      pas_ouvert_message TEXT NOT NULL DEFAULT '',
      ferme_titre TEXT NOT NULL DEFAULT '',
      ferme_message TEXT NOT NULL DEFAULT '',
      horaires TEXT NOT NULL DEFAULT '',
      accueil TEXT NOT NULL DEFAULT '',
      programme_matin_titre TEXT NOT NULL DEFAULT '',
      programme_matin_desc TEXT NOT NULL DEFAULT '',
      programme_am_titre TEXT NOT NULL DEFAULT '',
      programme_am_desc TEXT NOT NULL DEFAULT '',
      privacy_note TEXT NOT NULL DEFAULT '',
      footer_text TEXT NOT NULL DEFAULT '',
      event_start TEXT NOT NULL DEFAULT '',
      event_end TEXT NOT NULL DEFAULT '',
      email_subject TEXT NOT NULL DEFAULT '',
      email_body TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rsvp_submissions (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES rsvp_events(id) ON DELETE CASCADE,
      nom TEXT NOT NULL DEFAULT '',
      fonction TEXT NOT NULL DEFAULT '',
      organisation TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      telephone TEXT NOT NULL DEFAULT '',
      present BOOLEAN NOT NULL DEFAULT true,
      accompagnants INTEGER NOT NULL DEFAULT 0,
      atelier TEXT NOT NULL DEFAULT '',
      delegation_note TEXT NOT NULL DEFAULT '',
      accompagnants_noms TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE rsvp_submissions ADD COLUMN IF NOT EXISTS accompagnants_noms TEXT NOT NULL DEFAULT '[]'`;

  // --- Migration ponctuelle : événement "benin" à partir des anciennes tables ---
  const { rows: existingBenin } = await sql`SELECT id FROM rsvp_events WHERE slug = 'benin'`;
  let beninId = existingBenin[0]?.id;
  if (!beninId) {
    const { rows } = await sql`
      INSERT INTO rsvp_events (slug, name) VALUES ('benin', 'Lancement officiel de Synelia Bénin')
      RETURNING id
    `;
    beninId = rows[0].id;
  }

  const { rows: hasSettings } = await sql`SELECT 1 FROM rsvp_settings WHERE event_id = ${beninId}`;
  if (hasSettings.length === 0) {
    const { rows: legacy } = await sql`SELECT * FROM benin_rsvp_settings WHERE id = 1`;
    const s = legacy[0] || BENIN_DEFAULT_SETTINGS;
    await sql`
      INSERT INTO rsvp_settings (
        event_id, titre, sous_titre, lieu, date_evenement, intro,
        atelier1_titre, atelier1_desc, atelier2_titre, atelier2_desc,
        date_debut, date_fin, pas_ouvert_titre, pas_ouvert_message, ferme_titre, ferme_message,
        horaires, accueil, programme_matin_titre, programme_matin_desc, programme_am_titre, programme_am_desc,
        privacy_note, footer_text, event_start, event_end, email_subject, email_body
      ) VALUES (
        ${beninId}, ${s.titre}, ${s.sous_titre}, ${s.lieu}, ${s.date_evenement}, ${s.intro},
        ${s.atelier1_titre}, ${s.atelier1_desc}, ${s.atelier2_titre}, ${s.atelier2_desc},
        ${s.date_debut}, ${s.date_fin}, ${s.pas_ouvert_titre}, ${s.pas_ouvert_message}, ${s.ferme_titre}, ${s.ferme_message},
        ${s.horaires}, ${s.accueil}, ${s.programme_matin_titre}, ${s.programme_matin_desc}, ${s.programme_am_titre}, ${s.programme_am_desc},
        ${s.privacy_note}, ${s.footer_text}, ${s.event_start}, ${s.event_end}, ${s.email_subject}, ${s.email_body}
      )
      ON CONFLICT (event_id) DO NOTHING
    `;
  }

  schemaReady = true;
}

export async function listEvents() {
  noStore();
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM rsvp_events ORDER BY created_at DESC`;
  return rows;
}

export async function getEventBySlug(slug) {
  noStore();
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM rsvp_events WHERE slug = ${slug}`;
  return rows[0] || null;
}

export async function createEvent({ slug, name }) {
  noStore();
  await ensureSchema();
  const finalSlug = slugify(slug || name);
  if (!finalSlug) throw new Error("Nom d'événement invalide.");
  const { rows } = await sql`
    INSERT INTO rsvp_events (slug, name) VALUES (${finalSlug}, ${name || finalSlug})
    ON CONFLICT (slug) DO NOTHING
    RETURNING *
  `;
  const event = rows[0];
  if (!event) {
    throw new Error('Ce lien (slug) existe déjà, choisis-en un autre.');
  }
  const d = GENERIC_DEFAULT_SETTINGS;
  await sql`
    INSERT INTO rsvp_settings (
      event_id, titre, sous_titre, lieu, date_evenement, intro,
      atelier1_titre, atelier1_desc, atelier2_titre, atelier2_desc,
      date_debut, date_fin, pas_ouvert_titre, pas_ouvert_message, ferme_titre, ferme_message,
      horaires, accueil, programme_matin_titre, programme_matin_desc, programme_am_titre, programme_am_desc,
      privacy_note, footer_text, event_start, event_end, email_subject, email_body
    ) VALUES (
      ${event.id}, ${d.titre}, ${d.sous_titre}, ${d.lieu}, ${d.date_evenement}, ${d.intro},
      ${d.atelier1_titre}, ${d.atelier1_desc}, ${d.atelier2_titre}, ${d.atelier2_desc},
      ${d.date_debut}, ${d.date_fin}, ${d.pas_ouvert_titre}, ${d.pas_ouvert_message}, ${d.ferme_titre}, ${d.ferme_message},
      ${d.horaires}, ${d.accueil}, ${d.programme_matin_titre}, ${d.programme_matin_desc}, ${d.programme_am_titre}, ${d.programme_am_desc},
      ${d.privacy_note}, ${d.footer_text}, ${d.event_start}, ${d.event_end}, ${d.email_subject}, ${d.email_body}
    )
  `;
  return event;
}

export async function getEventSettings(eventId) {
  noStore();
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM rsvp_settings WHERE event_id = ${eventId}`;
  return rows[0] || { ...GENERIC_DEFAULT_SETTINGS, event_id: eventId };
}

export async function updateEventSettings(eventId, partial) {
  noStore();
  await ensureSchema();
  const current = await getEventSettings(eventId);
  const next = { ...current, ...partial };
  await sql`
    UPDATE rsvp_settings SET
      titre = ${next.titre},
      sous_titre = ${next.sous_titre},
      lieu = ${next.lieu},
      date_evenement = ${next.date_evenement},
      intro = ${next.intro},
      atelier1_titre = ${next.atelier1_titre},
      atelier1_desc = ${next.atelier1_desc},
      atelier2_titre = ${next.atelier2_titre},
      atelier2_desc = ${next.atelier2_desc},
      date_debut = ${next.date_debut},
      date_fin = ${next.date_fin},
      pas_ouvert_titre = ${next.pas_ouvert_titre},
      pas_ouvert_message = ${next.pas_ouvert_message},
      ferme_titre = ${next.ferme_titre},
      ferme_message = ${next.ferme_message},
      horaires = ${next.horaires},
      accueil = ${next.accueil},
      programme_matin_titre = ${next.programme_matin_titre},
      programme_matin_desc = ${next.programme_matin_desc},
      programme_am_titre = ${next.programme_am_titre},
      programme_am_desc = ${next.programme_am_desc},
      privacy_note = ${next.privacy_note},
      footer_text = ${next.footer_text},
      event_start = ${next.event_start},
      event_end = ${next.event_end},
      email_subject = ${next.email_subject},
      email_body = ${next.email_body}
    WHERE event_id = ${eventId}
  `;
  return next;
}

export async function insertSubmission(eventId, f) {
  await ensureSchema();
  const accompagnantsNoms = JSON.stringify(Array.isArray(f.accompagnants_noms) ? f.accompagnants_noms : []);
  await sql`
    INSERT INTO rsvp_submissions (event_id, nom, fonction, organisation, email, telephone, present, accompagnants, atelier, delegation_note, accompagnants_noms)
    VALUES (${eventId}, ${f.nom}, ${f.fonction}, ${f.organisation}, ${f.email}, ${f.telephone}, ${f.present}, ${f.accompagnants}, ${f.atelier}, ${f.delegation_note}, ${accompagnantsNoms})
  `;
}

export async function listSubmissions(eventId) {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM rsvp_submissions WHERE event_id = ${eventId} ORDER BY created_at DESC`;
  return rows;
}

// Scopé à l'événement pour ne jamais permettre de supprimer une réponse d'un autre événement.
export async function deleteSubmission(eventId, id) {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM rsvp_submissions WHERE event_id = ${eventId} AND id = ${id}`;
  return rowCount > 0;
}

export async function deleteEvent(eventId) {
  await ensureSchema();
  await sql`DELETE FROM rsvp_events WHERE id = ${eventId}`;
}

// Bénin (Afrique de l'Ouest) est fixe en UTC+1 toute l'année (pas de changement d'heure).
// On interprète date_debut/date_fin (format "YYYY-MM-DDTHH:mm") comme des heures locales du Bénin.
// (Les autres événements Synelia utilisent la même convention horaire pour simplifier.)
export function isFormOpen(settings, now = new Date()) {
  const parse = (s) => (s ? new Date(s + ':00+01:00') : null);
  const debut = parse(settings?.date_debut);
  const fin = parse(settings?.date_fin);
  if (debut && now < debut) return { open: false, reason: 'pas-encore-ouvert' };
  if (fin && now > fin) return { open: false, reason: 'ferme' };
  return { open: true, reason: null };
}

// --- Rétro-compatibilité : anciennes fonctions single-tenant, redirigées vers l'événement "benin" ---
export async function getSettings() {
  await ensureSchema();
  const event = await getEventBySlug('benin');
  return getEventSettings(event.id);
}

export async function updateSettings(partial) {
  await ensureSchema();
  const event = await getEventBySlug('benin');
  return updateEventSettings(event.id, partial);
}
