import { sql } from '@vercel/postgres';

let schemaReady = false;

const DEFAULT_SETTINGS = {
  titre: 'Kwabo',
  sous_titre: 'sur le formulaire de confirmation pour le lancement officiel de Synelia Bénin',
  lieu: 'Golden Tulip, Cotonou',
  date_evenement: '22 octobre 2026',
  intro:
    "Bonjour à tous,\n\nL'évènement se déroulera en 2 étapes : la table ronde en matinée et les ateliers l'après-midi.\n\nAfin d'organiser au mieux cet événement et de préparer un accueil optimal, merci de confirmer votre présence en remplissant ce formulaire.\n\nNous avons hâte d'échanger avec vous autour du thème : Du code du numérique à l'IA — accélérer la transformation numérique du Bénin en renforçant sa souveraineté.",
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
  schemaReady = true;
}

export async function getSettings() {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM benin_rsvp_settings WHERE id = 1`;
  return rows[0] || DEFAULT_SETTINGS;
}

export async function updateSettings(partial) {
  await ensureSchema();
  const current = await getSettings();
  const next = { ...current, ...partial };
  await sql`
    UPDATE benin_rsvp_settings SET
      titre = ${next.titre},
      sous_titre = ${next.sous_titre},
      lieu = ${next.lieu},
      date_evenement = ${next.date_evenement},
      intro = ${next.intro}
    WHERE id = 1
  `;
  return next;
}
