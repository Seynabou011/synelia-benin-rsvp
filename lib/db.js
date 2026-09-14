import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

let schemaReady = false;

const DEFAULT_SETTINGS = {
  // Bandeau d'en-tête (fond sombre)
  titre: "Du Code du numérique à l'IA : accélérer la transformation numérique du Bénin en renforçant sa souveraineté",
  sous_titre: 'Lancement officiel de Synelia Bénin',
  lieu: 'Golden Tulip, Cotonou',
  date_evenement: '22 octobre 2026',
  horaires: '8h30 – 16h30',
  accueil: 'Accueil dès 8h00',
  // Programme en deux temps
  programme_matin_titre: 'Table ronde',
  programme_matin_desc:
    "Transformation numérique à l'ère de l'IA et du cloud : comment concilier innovation et souveraineté à la lumière du Code du numérique au Bénin ?",
  programme_am_titre: 'Deux ateliers au choix',
  programme_am_desc:
    'Accélérer (IA) ou Renforcer (cloud, données, cybersécurité) — vous choisissez ci-dessous.',
  // Carte du formulaire
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
  // Fenêtre d'ouverture
  date_debut: '',
  date_fin: '',
  pas_ouvert_titre: "Le formulaire n'est pas encore ouvert",
  pas_ouvert_message: 'Merci de revenir un peu plus tard pour confirmer votre présence.',
  ferme_titre: 'Le formulaire de confirmation est fermé',
  ferme_message:
    "La période de confirmation est terminée. Merci de contacter l'organisation si vous avez une question.",
};

export async function ensureSchema() {
  if (schemaReady) return;
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
    VALUES (1, ${DEFAULT_SETTINGS.titre}, ${DEFAULT_SETTINGS.sous_titre}, ${DEFAULT_SETTINGS.lieu}, ${DEFAULT_SETTINGS.date_evenement}, ${DEFAULT_SETTINGS.intro})
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS atelier1_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS atelier1_desc TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS atelier2_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS atelier2_desc TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS date_debut TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS date_fin TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS pas_ouvert_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS pas_ouvert_message TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS ferme_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS ferme_message TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS horaires TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS accueil TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS programme_matin_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS programme_matin_desc TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS programme_am_titre TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS programme_am_desc TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS privacy_note TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE benin_rsvp_settings ADD COLUMN IF NOT EXISTS footer_text TEXT NOT NULL DEFAULT ''`;
  await sql`
    UPDATE benin_rsvp_settings SET
      atelier1_titre = ${DEFAULT_SETTINGS.atelier1_titre},
      atelier1_desc = ${DEFAULT_SETTINGS.atelier1_desc},
      atelier2_titre = ${DEFAULT_SETTINGS.atelier2_titre},
      atelier2_desc = ${DEFAULT_SETTINGS.atelier2_desc}
    WHERE id = 1 AND atelier1_titre = ''
  `;
  await sql`
    UPDATE benin_rsvp_settings SET
      pas_ouvert_titre = ${DEFAULT_SETTINGS.pas_ouvert_titre},
      pas_ouvert_message = ${DEFAULT_SETTINGS.pas_ouvert_message},
      ferme_titre = ${DEFAULT_SETTINGS.ferme_titre},
      ferme_message = ${DEFAULT_SETTINGS.ferme_message}
    WHERE id = 1 AND ferme_titre = ''
  `;
  schemaReady = true;
}

export async function getSettings() {
  noStore();
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM benin_rsvp_settings WHERE id = 1`;
  return rows[0] || DEFAULT_SETTINGS;
}

export async function updateSettings(partial) {
  noStore();
  await ensureSchema();
  const current = await getSettings();
  const next = { ...current, ...partial };
  await sql`
    UPDATE benin_rsvp_settings SET
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
      footer_text = ${next.footer_text}
    WHERE id = 1
  `;
  return next;
}

// Bénin (Afrique de l'Ouest) est fixe en UTC+1 toute l'année (pas de changement d'heure).
// On interprète date_debut/date_fin (format "YYYY-MM-DDTHH:mm") comme des heures locales du Bénin.
export function isFormOpen(settings, now = new Date()) {
  const parse = (s) => (s ? new Date(s + ':00+01:00') : null);
  const debut = parse(settings?.date_debut);
  const fin = parse(settings?.date_fin);
  if (debut && now < debut) return { open: false, reason: 'pas-encore-ouvert' };
  if (fin && now > fin) return { open: false, reason: 'ferme' };
  return { open: true, reason: null };
}
