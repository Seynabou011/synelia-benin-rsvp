'use client';

import { useEffect, useRef, useState } from 'react';

const ATELIER_LABEL = {
  atelier1: 'Atelier 1 — Accélérer',
  atelier2: 'Atelier 2 — Renforcer',
};

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-primary-lav)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text)',
};

// Champ texte/textarea avec un bouton "G" qui met en gras (**texte**) la portion sélectionnée.
// Le rendu de ce balisage se fait via le composant <Rich> sur le formulaire public.
function BoldField({ label, value, onChange, multiline, rows }) {
  const ref = useRef(null);

  function applyBold() {
    const el = ref.current;
    if (!el) return;
    const val = value || '';
    const start = el.selectionStart ?? val.length;
    const end = el.selectionEnd ?? val.length;
    if (start === end) {
      const placeholder = 'texte en gras';
      const next = val.slice(0, start) + '**' + placeholder + '**' + val.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + 2, start + 2 + placeholder.length);
      });
    } else {
      const selected = val.slice(start, end);
      const next = val.slice(0, start) + '**' + selected + '**' + val.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + 2, end + 2);
      });
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
        <label style={{ margin: 0 }}>{label}</label>
        <button
          type="button"
          onClick={applyBold}
          title="Mettre le texte sélectionné en gras"
          style={{
            fontWeight: 700,
            border: '1px solid var(--color-primary-lav)',
            background: '#fff',
            borderRadius: 6,
            padding: '2px 10px',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-primary-dark)',
          }}
        >
          G
        </button>
      </div>
      {multiline ? (
        <textarea
          ref={ref}
          rows={rows || 4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...fieldStyle, marginTop: 6 }}
        />
      ) : (
        <input
          ref={ref}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginTop: 6 }}
        />
      )}
    </div>
  );
}

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(!!d.isAdmin);
        setChecking(false);
        if (d.isAdmin) {
          loadRows();
          loadSettings();
        }
      })
      .catch(() => setChecking(false));
  }, []);

  async function loadRows() {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp');
      const data = await res.json();
      if (data.ok) setRows(data.rows);
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.ok) setSettings(data.settings);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.ok) {
        setSettings(data.settings);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } finally {
      setSettingsSaving(false);
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
      loadRows();
    } else {
      setLoginError('Mot de passe incorrect');
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    setIsAdmin(false);
    setRows([]);
  }

  async function exportExcel() {
    if (exporting) return;
    setExporting(true);
    try {
      const mod = await import('xlsx');
      const XLSX = mod.utils ? mod : mod.default;
      const data = rows.map((r) => ({
        Nom: r.nom,
        Fonction: r.fonction,
        Organisation: r.organisation,
        Email: r.email,
        'Téléphone': r.telephone,
        'Présence': r.present ? 'Oui' : 'Non',
        Accompagnants: r.accompagnants,
        Atelier: r.atelier ? ATELIER_LABEL[r.atelier] || r.atelier : '',
        'Date de réponse': new Date(r.created_at).toLocaleString('fr-FR'),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RSVP');
      XLSX.writeFile(wb, 'confirmations-benin-' + new Date().toISOString().slice(0, 10) + '.xlsx');
    } catch (e) {
      alert("Erreur pendant l'export Excel. Réessaie dans un instant.");
    } finally {
      setExporting(false);
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
            <h1>Synelia Bénin</h1>
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

  const confirmed = rows.filter((r) => r.present);
  const declined = rows.filter((r) => !r.present);
  const totalAccompagnants = confirmed.reduce((s, r) => s + (r.accompagnants || 0), 0);
  const totalPersonnes = confirmed.length + totalAccompagnants;
  const a1 = confirmed.filter((r) => r.atelier === 'atelier1').length;
  const a2 = confirmed.filter((r) => r.atelier === 'atelier2').length;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="header-title admin-header">
        <div style={{ display: 'flex', gap: 16 }}>
          <img src="/synelia-logo.png" alt="Synelia" className="brand-logo" />
          <div>
            <h1>Synelia Bénin</h1>
            <p className="subtitle">Tableau de bord des confirmations de présence</p>
          </div>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => setSettingsOpen((o) => !o)}>
            {settingsOpen ? 'Fermer les réglages' : 'Réglages du formulaire'}
          </button>
          <button className="btn" onClick={loadRows} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button className="btn primary" onClick={exportExcel} disabled={exporting || rows.length === 0}>
            {exporting ? 'Export…' : 'Export Excel'}
          </button>
          <button className="btn" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>

      {settingsOpen && settings && (
        <form className="card" onSubmit={saveSettings}>
          <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}>
            Réglages du formulaire
          </h2>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Sélectionnez une portion de texte dans un champ puis cliquez sur le bouton <strong>G</strong> pour la mettre en gras sur le formulaire public.
          </p>

          <BoldField
            label="Titre d'accueil (ex : Kwabo)"
            value={settings.titre}
            onChange={(v) => setSettings({ ...settings, titre: v })}
          />
          <BoldField
            label="Message d'accueil"
            value={settings.sous_titre}
            onChange={(v) => setSettings({ ...settings, sous_titre: v })}
          />
          <BoldField
            label="Texte d'introduction (un saut de ligne = un nouveau paragraphe)"
            value={settings.intro}
            onChange={(v) => setSettings({ ...settings, intro: v })}
            multiline
            rows={6}
          />

          <h3 style={{ marginTop: 24, marginBottom: 4, color: 'var(--color-primary-dark)' }}>Ateliers de l'après-midi</h3>

          <BoldField
            label="Atelier 1 — Titre"
            value={settings.atelier1_titre}
            onChange={(v) => setSettings({ ...settings, atelier1_titre: v })}
          />
          <BoldField
            label="Atelier 1 — Description"
            value={settings.atelier1_desc}
            onChange={(v) => setSettings({ ...settings, atelier1_desc: v })}
          />
          <BoldField
            label="Atelier 2 — Titre"
            value={settings.atelier2_titre}
            onChange={(v) => setSettings({ ...settings, atelier2_titre: v })}
          />
          <BoldField
            label="Atelier 2 — Description"
            value={settings.atelier2_desc}
            onChange={(v) => setSettings({ ...settings, atelier2_desc: v })}
          />

          <h3 style={{ marginTop: 24, marginBottom: 4, color: 'var(--color-primary-dark)' }}>Période d'ouverture du formulaire</h3>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Heures locales du Bénin. Laisser vide = pas de limite. Passé la date de fin, le formulaire public affiche le message de fermeture ci-dessous et refuse les nouvelles réponses.
          </p>
          <label>Date/heure d'ouverture</label>
          <input
            type="datetime-local"
            value={settings.date_debut || ''}
            onChange={(e) => setSettings({ ...settings, date_debut: e.target.value })}
          />
          <label>Date/heure de fermeture</label>
          <input
            type="datetime-local"
            value={settings.date_fin || ''}
            onChange={(e) => setSettings({ ...settings, date_fin: e.target.value })}
          />

          <h3 style={{ marginTop: 24, marginBottom: 4, color: 'var(--color-primary-dark)' }}>Message avant ouverture</h3>
          <BoldField
            label="Titre"
            value={settings.pas_ouvert_titre}
            onChange={(v) => setSettings({ ...settings, pas_ouvert_titre: v })}
          />
          <BoldField
            label="Message"
            value={settings.pas_ouvert_message}
            onChange={(v) => setSettings({ ...settings, pas_ouvert_message: v })}
            multiline
            rows={3}
          />

          <h3 style={{ marginTop: 24, marginBottom: 4, color: 'var(--color-primary-dark)' }}>Message après fermeture</h3>
          <BoldField
            label="Titre"
            value={settings.ferme_titre}
            onChange={(v) => setSettings({ ...settings, ferme_titre: v })}
          />
          <BoldField
            label="Message"
            value={settings.ferme_message}
            onChange={(v) => setSettings({ ...settings, ferme_message: v })}
            multiline
            rows={3}
          />

          <button type="submit" className="btn primary" style={{ marginTop: 16 }} disabled={settingsSaving}>
            {settingsSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {settingsSaved && <span style={{ marginLeft: 12, color: 'var(--color-success)', fontSize: 13 }}>Enregistré ✓</span>}
        </form>
      )}

      <div className="stats-row">
        <div className="stat-box">
          <div className="num">{confirmed.length}</div>
          <div className="lbl">Confirmations</div>
        </div>
        <div className="stat-box">
          <div className="num">{totalPersonnes}</div>
          <div className="lbl">Personnes attendues (avec accompagnants)</div>
        </div>
        <div className="stat-box">
          <div className="num">{declined.length}</div>
          <div className="lbl">Ne pourront pas venir</div>
        </div>
        <div className="stat-box">
          <div className="num">{a1}</div>
          <div className="lbl">Atelier 1 — Accélérer</div>
        </div>
        <div className="stat-box">
          <div className="num">{a2}</div>
          <div className="lbl">Atelier 2 — Renforcer</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Fonction</th>
              <th>Organisation</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Présence</th>
              <th>Accomp.</th>
              <th>Atelier</th>
              <th>Reçu le</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                  {loading ? 'Chargement…' : 'Aucune réponse pour le moment.'}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td>{r.fonction}</td>
                <td>{r.organisation}</td>
                <td>{r.email}</td>
                <td>{r.telephone}</td>
                <td>
                  <span className={'pill ' + (r.present ? 'oui' : 'non')}>{r.present ? 'Oui' : 'Non'}</span>
                </td>
                <td>{r.present ? r.accompagnants : '—'}</td>
                <td>{r.atelier ? ATELIER_LABEL[r.atelier] || r.atelier : '—'}</td>
                <td>{new Date(r.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="footer-note">Synelia — synelia.tech</p>
    </div>
  );
}
