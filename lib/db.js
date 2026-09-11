import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

let schemaReady = false;

const DEFAULT_SETTINGS = {
  titre: 'Kwabo',
  sous_titre: 'sur le formulaire de confirmation pour le lancement officiel de Synelia Bénin',
  lieu: 'Golden Tulip, Cotonou',
  date_evenement: '22 octobre 2026',
  intro:
    "Bonjour à tous,\n\nL'évènement se déroulera en 2 étapes : la table ronde en matinée et les ateliers l'après-midi.\n\nAfin d'organiser au mieux cet événement et de préparer un accueil optimal, merci de confirmer votre présence en remplissant ce formulaire.\n\nNous avons hâte d'échanger avec vous autour du thème : Du code du numérique à l'IA — accélérer la transformation numérique du Bénin en renforçant sa souveraineté.",
  atelier1_titre: 'Atelier 1 — Accélérer',
  atelier1_desc:
    "L'IA en action : cas d'usage concrets pour les banques, l'administration et les entreprises",
  atelier2_titre: 'Atelier 2 — Renforcer',
  atelier2_desc:
    'Cloud, données et cybersécurité : bâtir une infrastructure souveraine et résiliente',
  date_debut: '',
  date_fin: '',
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
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
  await sql`
    UPDATE benin_rsvp_settings SET
      atelier1_titre = ${DEFAULT_SETTINGS.atelier1_titre},
      atelier1_desc = ${DEFAULT_SETTINGS.atelier1_desc},
      atelier2_titre = ${DEFAULT_SETTINGS.atelier2_titre},
      atelier2_desc = ${DEFAULT_SETTINGS.atelier2_desc}
    WHERE id = 1 AND atelier1_titre = ''
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
      date_fin = ${next.date_fin}
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
