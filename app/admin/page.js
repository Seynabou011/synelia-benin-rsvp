'use client';

import { useEffect, useState } from 'react';

const ATELIER_LABEL = {
  atelier1: 'Atelier 1 — Accélérer',
  atelier2: 'Atelier 2 — Renforcer',
};

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(!!d.isAdmin);
        setChecking(false);
        if (d.isAdmin) loadRows();
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
          <button className="btn" onClick={loadRows} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button className="btn primary" onClick={exportExcel} disabled={exporting || rows.length === 0}>
            {exporting ? 'Export…' : 'Export Excel'}
          </button>
          <button className="btn" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>

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
