'use client';

import { useState } from 'react';

const ATELIERS = [
  {
    value: 'atelier1',
    title: 'Atelier 1 — Accélérer',
    desc: "L'IA en action : cas d'usage concrets pour les banques, l'administration et les entreprises",
  },
  {
    value: 'atelier2',
    title: 'Atelier 2 — Renforcer',
    desc: 'Cloud, données et cybersécurité : bâtir une infrastructure souveraine et résiliente',
  },
];

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

  if (done) {
    return (
      <div className="page">
        <div className="header-title">
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1>Synelia Bénin</h1>
            <p className="subtitle">Confirmation de présence</p>
          </div>
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
        <p className="footer-note">Synelia — synelia.tech</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header-title">
        <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
        <div>
          <h1>Synelia Bénin</h1>
          <p className="subtitle">Merci de confirmer votre présence à l'événement</p>
        </div>
      </div>

      <div className="programme">
        <h2>Programme de la journée</h2>
        <div className="theme">
          Thème : Du code du numérique à l'IA — accélérer la transformation numérique du Bénin en renforçant sa souveraineté
        </div>
        <dl>
          <dt>Table ronde</dt>
          <dd>À l'ère de l'IA et du cloud, comment le Bénin peut-il concilier innovation et souveraineté numérique ?</dd>
          <dt>Atelier 1 — Accélérer</dt>
          <dd>L'IA en action : cas d'usage concrets pour les banques, l'administration et les entreprises</dd>
          <dt>Atelier 2 — Renforcer</dt>
          <dd>Cloud, données et cybersécurité : bâtir une infrastructure souveraine et résiliente</dd>
          <dt>Clôture</dt>
          <dd>Restitution croisée : accélérer et renforcer, les deux faces d'une même ambition</dd>
        </dl>
      </div>

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
                    <div className="ro-title">{a.title}</div>
                    <div className="ro-desc">{a.desc}</div>
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

      <p className="footer-note">Synelia — synelia.tech</p>
    </div>
  );
}
