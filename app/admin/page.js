'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function slugPreview(name) {
  return (name || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 60);
}

export default function AdminHome() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(!!d.isAdmin);
        setChecking(false);
        if (d.isAdmin) loadEvents();
      })
      .catch(() => setChecking(false));
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.ok) setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }

  const [deletingSlug, setDeletingSlug] = useState(null);

  async function handleDeleteEvent(ev) {
    const ok = window.confirm(
      `Supprimer l'événement "${ev.name}" ainsi que TOUTES ses réponses enregistrées ? Cette action est irréversible.`
    );
    if (!ok) return;
    setDeletingSlug(ev.slug);
    try {
      const res = await fetch(`/api/events/${ev.slug}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setEvents((prev) => prev.filter((e) => e.slug !== ev.slug));
      } else {
        alert(data.error || 'Erreur lors de la suppression.');
      }
    } finally {
      setDeletingSlug(null);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      loadEvents();
    } else {
      setLoginError('Mot de passe incorrect');
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    setIsAdmin(false);
    setEvents([]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim()) {
      setCreateError("Le nom de l'événement est obligatoire.");
      return;
    }
    setCreateBusy(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCreateError(data.error || 'Erreur');
        setCreateBusy(false);
        return;
      }
      setNewName('');
      setNewSlug('');
      setSlugTouched(false);
      setCreating(false);
      await loadEvents();
    } finally {
      setCreateBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="page">
        <p>Chargement…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="header-title">
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1>Synelia Events</h1>
            <p className="subtitle">Espace administration — confirmations de présence</p>
          </div>
        </div>
        <form className="card login-card" onSubmit={handleLogin}>
          <label className="required">Mot de passe administrateur</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {loginError && <div className="form-error">{loginError}</div>}
          <button type="submit" className="submit-btn">Se connecter</button>
        </form>
      </div>
    );
  }

  const effectiveSlug = slugTouched ? newSlug : slugPreview(newName);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="header-title admin-header">
        <div style={{ display: 'flex', gap: 16 }}>
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1>Événements Synelia</h1>
            <p className="subtitle">Sélectionne un événement pour gérer son formulaire et ses réponses</p>
          </div>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={loadEvents} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button className="btn" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        {!creating ? (
          <button type="button" className="btn primary" onClick={() => setCreating(true)}>
            + Créer un nouvel événement
          </button>
        ) : (
          <form onSubmit={handleCreate}>
            <label className="required">Nom de l'événement</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Synelia Côte d'Ivoire — Journée Cloud"
              autoFocus
            />
            <label>Lien (généré automatiquement, modifiable)</label>
            <input
              type="text"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setNewSlug(slugPreview(e.target.value));
              }}
            />
            <p className="field-hint">
              Le formulaire public sera accessible sur rsvp.synelia.tech/{effectiveSlug || '...'}
            </p>
            {createError && <div className="form-error">{createError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="btn primary" disabled={createBusy}>
                {createBusy ? 'Création…' : "Créer l'événement"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCreating(false);
                  setCreateError('');
                  setNewName('');
                  setNewSlug('');
                  setSlugTouched(false);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Événement</th>
              <th>Lien public</th>
              <th>Créé le</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                  {loading ? 'Chargement…' : 'Aucun événement pour le moment.'}
                </td>
              </tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>rsvp.synelia.tech/{ev.slug}</td>
                <td>{new Date(ev.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <Link href={`/admin/${ev.slug}`} className="btn primary">
                    Gérer
                  </Link>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12, padding: '4px 10px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                    onClick={() => handleDeleteEvent(ev)}
                    disabled={deletingSlug === ev.slug}
                  >
                    {deletingSlug === ev.slug ? '…' : 'Supprimer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="footer-note">Synelia — synelia.tech</p>
    </div>
  );
}
