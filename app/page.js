'use client';

import { useEffect, useState } from 'react';

const DEFAULT_SETTINGS = {
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

function Hero({ settings }) {
  return (
    <div className="hero">
      <div className="hero-inner">
        <img src="/synelia-logo-white.png" alt="Synelia" className="brand-logo" />
        <p className="hero-eyebrow"><Rich text={settings.sous_titre} /></p>
        <h1 className="hero-title"><Rich text={settings.titre} /></h1>
        <div className="hero-divider" />
        <div className="hero-meta">
          <div className="hero-meta-item">
            <div className="hero-meta-label">Date</div>
            <div className="hero-meta-value">{settings.date_evenement}</div>
          </div>
          <div className="hero-meta-item">
            <div className="hero-meta-label">Lieu</div>
            <div className="hero-meta-value">{settings.lieu}</div>
          </div>
          <div className="hero-meta-item">
            <div className="hero-meta-label">Horaires</div>
            <div className="hero-meta-value">{settings.horaires}</div>
            {settings.accueil && <div className="hero-meta-sub">{settings.accueil}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteFooter({ settings }) {
  return <p className="site-footer">{settings.footer_text}</p>;
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
  const [delegationNote, setDelegationNote] = useState('');
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
    if (!fonction.trim()) {
      setError('Merci de renseigner votre fonction.');
      return;
    }
    if (!organisation.trim()) {
      setError('Merci de renseigner votre organisation.');
      return;
    }
    if (!email.trim()) {
      setError('Merci de renseigner votre email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Merci de renseigner un email valide.');
      return;
    }
    if (present && !telephone.trim()) {
      setError('Merci de renseigner votre numéro de téléphone.');
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
          delegation_note: !present ? delegationNote.trim() : '',
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
      <>
        <Hero settings={settings} />
        <div className="page">
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
        <SiteFooter settings={settings} />
      </>
    );
  }

  if (done) {
    return (
      <>
        <Hero settings={settings} />
        <div className="page">
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
        <SiteFooter settings={settings} />
      </>
    );
  }

  return (
    <>
      <Hero settings={settings} />
      <div className="page">
        <section className="programme-section">
          <h2>Le programme en deux temps</h2>
          <div className="programme-row">
            <div className="programme-label">Matin</div>
            <div className="programme-content">
              <div className="programme-title"><Rich text={settings.programme_matin_titre} /></div>
              <div className="programme-desc"><Rich text={settings.programme_matin_desc} /></div>
            </div>
          </div>
          <div className="programme-row">
            <div className="programme-label">Après-midi</div>
            <div className="programme-content">
              <div className="programme-title"><Rich text={settings.programme_am_titre} /></div>
              <div className="programme-desc"><Rich text={settings.programme_am_desc} /></div>
            </div>
          </div>
        </section>

        <form className="card" onSubmit={handleSubmit}>
          <p className="card-intro"><Rich text={settings.intro} /></p>

          <label className="required">Serez-vous présent(e) ?</label>
          <div className="presence-toggle">
            <div
              className={'presence-btn' + (present ? ' active yes' : '')}
              onClick={() => setPresent(true)}
            >
              Oui, je serai présent(e)
            </div>
            <div
              className={'presence-btn' + (!present ? ' active no' : '')}
              onClick={() => setPresent(false)}
            >
              Non, je ne pourrai pas venir
            </div>
          </div>

          <div className="field-grid">
            <div>
              <label className="required">Nom et prénom</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Aïcha Kouassi" />
            </div>
            <div>
              <label className="required">Fonction</label>
              <input type="text" value={fonction} onChange={(e) => setFonction(e.target.value)} placeholder="Ex : Directrice des systèmes d'information" />
            </div>
          </div>

          <label className="required">Organisation</label>
          <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Ex : Ministère du Numérique" />

          <div className="field-grid">
            <div>
              <label className="required">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className={present ? 'required' : ''}>Téléphone</label>
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+229 01 ..." />
            </div>
          </div>

          {present && (
            <>
              <label className="required">
                Atelier de l'après-midi <span className="hint">(un seul choix)</span>
              </label>
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

              <label>Accompagnateurs</label>
              <input
                type="number"
                min="0"
                max="3"
                value={accompagnants}
                onChange={(e) => setAccompagnants(e.target.value)}
              />
              <p className="field-hint">
                Jusqu'à trois personnes de votre organisation. Nous vous demanderons leurs noms dans l'e-mail de confirmation.
              </p>
            </>
          )}

          {!present && (
            <>
              <label>Souhaitez-vous être représenté(e) ou recevoir la synthèse ?</label>
              <textarea
                rows={3}
                value={delegationNote}
                onChange={(e) => setDelegationNote(e.target.value)}
                placeholder="Ex : Mme X assistera à ma place / Merci de m'envoyer le compte rendu"
              />
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : present ? 'Confirmer ma présence' : 'Envoyer ma réponse'}
          </button>

          <p className="privacy-note"><Rich text={settings.privacy_note} /></p>
        </form>
      </div>
      <SiteFooter settings={settings} />
    </>
  );
}
