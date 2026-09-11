'use client';

import { useEffect, useState } from 'react';

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
  atelier2_desc: 'Cloud, données et cybersécurité : bâtir une infrastructure souveraine et résiliente',
  date_debut: '',
  date_fin: '',
  pas_ouvert_titre: "Le formulaire n'est pas encore ouvert",
  pas_ouvert_message: 'Merci de revenir un peu plus tard pour confirmer votre présence.',
  ferme_titre: 'Le formulaire de confirmation est fermé',
  ferme_message:
    "La période de confirmation est terminée. Merci de contacter l'organisation si vous avez une question.",
};

function isFormOpen(settings, now = new Date()) {
  const parse = (s) => (s ? new Date(s + ':00+01:00') : null);
  const debut = parse(settings?.date_debut);
  const fin = parse(settings?.date_fin);
  if (debut && now < debut) return { open: false, reason: 'pas-encore-ouvert' };
  if (fin && now > fin) return { open: false, reason: 'ferme' };
  return { open: true, reason: null };
}

// Rendu simple d'un texte pouvant contenir du **gras** défini depuis le back office.
function Rich({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Home() {
  const [nom, setNom] = useState('');
  const [fonction, setFonction] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [present, setPresent] = useState(true);
  const [accompagnants, setAccompagnants] = useState('0');
  const [atelier, setAtelier] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!nom.trim()) {
      setError('Merci de renseigner votre nom.');
      return;
    }
    if (!email.trim() && !telephone.trim()) {
      setError('Merci de renseigner un email ou un numéro de téléphone.');
      return;
    }
    if (present && !atelier) {
      setError("Merci de choisir l'atelier de l'après-midi auquel vous participerez.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          fonction: fonction.trim(),
          organisation: organisation.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          present,
          accompagnants: present ? parseInt(accompagnants, 10) || 0 : 0,
          atelier: present ? atelier : '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Une erreur est survenue, réessayez.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch (e) {
      setError('Impossible d’envoyer votre réponse. Vérifiez votre connexion et réessayez.');
      setSubmitting(false);
    }
  }

  const ATELIERS = [
    { value: 'atelier1', title: settings.atelier1_titre, desc: settings.atelier1_desc },
    { value: 'atelier2', title: settings.atelier2_titre, desc: settings.atelier2_desc },
  ];

  const { open: formOpen, reason: closedReason } = isFormOpen(settings);

  if (!done && !formOpen) {
    return (
      <div className="page">
        <div className="header-title">
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1><Rich text={settings.titre} /></h1>
            <p className="subtitle"><Rich text={settings.sous_titre} /></p>
          </div>
        </div>
        <div className="event-meta">
          📍 {settings.lieu} &nbsp;·&nbsp; 📅 {settings.date_evenement}
        </div>
        <div className="card form-success">
          <h2>
            <Rich
              text={
                closedReason === 'pas-encore-ouvert'
                  ? settings.pas_ouvert_titre
                  : settings.ferme_titre
              }
            />
          </h2>
          <p>
            <Rich
              text={
                closedReason === 'pas-encore-ouvert'
                  ? settings.pas_ouvert_message
                  : settings.ferme_message
              }
            />
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <div className="header-title">
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1><Rich text={settings.titre} /></h1>
            <p className="subtitle"><Rich text={settings.sous_titre} /></p>
          </div>
        </div>
        <div className="event-meta">
          📍 {settings.lieu} &nbsp;·&nbsp; 📅 {settings.date_evenement}
        </div>
        <div className="card form-success">
          <div className="fs-icon">✓</div>
          <h2>{present ? 'Merci pour votre confirmation !' : 'Merci pour votre réponse'}</h2>
          <p>
            {present
              ? 'Votre présence a bien été enregistrée. Nous avons hâte de vous accueillir.'
              : "Nous avons bien noté que vous ne pourrez pas être présent(e). Merci de nous en avoir informés."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header-title">
        <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
        <div>
          <h1><Rich text={settings.titre} /></h1>
          <p className="subtitle"><Rich text={settings.sous_titre} /></p>
        </div>
      </div>
      <div className="event-meta">
        📍 {settings.lieu} &nbsp;·&nbsp; 📅 {settings.date_evenement}
      </div>
      <p className="intro-text"><Rich text={settings.intro} /></p>

      <form className="card" onSubmit={handleSubmit}>
        <label className="required">Serez-vous présent(e) ?</label>
        <div className="presence-toggle">
          <div
            className={'presence-btn' + (present ? ' active yes' : '')}
            onClick={() => setPresent(true)}
          >
            Je confirme ma présence
          </div>
          <div
            className={'presence-btn' + (!present ? ' active no' : '')}
            onClick={() => setPresent(false)}
          >
            Je ne pourrai pas être présent(e)
          </div>
        </div>

        <label className="required">Nom et prénom</label>
        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Aïcha Kouassi" />

        <label>Fonction</label>
        <input type="text" value={fonction} onChange={(e) => setFonction(e.target.value)} placeholder="Ex : Directrice des systèmes d'information" />

        <label>Organisation</label>
        <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Ex : Ministère du Numérique" />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />

        <label>Téléphone</label>
        <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+229 ..." />

        {present && (
          <>
            <label>Nombre d'accompagnateurs</label>
            <input
              type="number"
              min="0"
              value={accompagnants}
              onChange={(e) => setAccompagnants(e.target.value)}
            />

            <label className="required">Atelier de l'après-midi</label>
            <div className="radio-row">
              {ATELIERS.map((a) => (
                <label
                  key={a.value}
                  className={'radio-option' + (atelier === a.value ? ' checked' : '')}
                  style={{ margin: 0, fontWeight: 'normal' }}
                >
                  <input
                    type="radio"
                    name="atelier"
                    checked={atelier === a.value}
                    onChange={() => setAtelier(a.value)}
                  />
                  <div>
                    <div className="ro-title"><Rich text={a.title} /></div>
                    <div className="ro-desc"><Rich text={a.desc} /></div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Envoi en cours…' : 'Envoyer ma réponse'}
        </button>
      </form>
    </div>
  );
}
