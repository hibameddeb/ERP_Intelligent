import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";

/* ── Embedded styles ─────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .gf-root {
    --bg:          #E8E6E3;
    --surface:     #F6F4F1;
    --surface2:    #FFFFFF;
    --border:      #D6D2CE;
    --border-lit:  #C4BFB9;
    --accent:      #2B7574;
    --accent-dim:  rgba(43,117,116,0.10);
    --accent-glow: rgba(43,117,116,0.22);
    --green:       #12484C;
    --green-dim:   rgba(18,72,76,0.10);
    --amber:       #a06b1a;
    --amber-dim:   rgba(160,107,26,0.10);
    --teal:        #12484C;
    --teal-dim:    rgba(18,72,76,0.10);
    --red:         #861211;
    --red-dim:     rgba(134,18,17,0.10);
    --muted:       #7a98a4;
    --text:        #0E2931;
    --text-dim:    #3d6372;
    --radius:      12px;
    --radius-lg:   18px;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
  }

  .gf-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* Page shell */
  .gf-page {
    padding: 36px 40px;
    max-width: 1280px;
    margin: 0 auto;
    animation: gf-fadein .35s ease both;
  }
  @keyframes gf-fadein { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

  /* Header */
  .gf-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 20px;
    flex-wrap: wrap;
  }
  .gf-header-left {}
  .gf-eyebrow {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .gf-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -.01em;
    line-height: 1;
  }
  .gf-subtitle {
    font-size: 13.5px;
    color: var(--text-dim);
    margin-top: 7px;
  }
  .gf-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Search */
  .gf-search {
    display: flex;
    align-items: center;
    gap: 9px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0 14px;
    height: 40px;
    transition: border-color .2s, box-shadow .2s;
    width: 240px;
  }
  .gf-search:focus-within {
    border-color: var(--border-lit);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .gf-search svg { color: var(--muted); flex-shrink: 0; }
  .gf-search input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-family: inherit;
    font-size: 13.5px;
    width: 100%;
  }
  .gf-search input::placeholder { color: var(--muted); }

  /* Buttons */
  .gf-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 18px;
    height: 40px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    transition: all .18s ease;
    white-space: nowrap;
  }
  .gf-btn:disabled { opacity: .5; cursor: not-allowed; }

  .gf-btn-primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 18px var(--accent-glow);
  }
  .gf-btn-primary:hover:not(:disabled) {
    background: #6ba3f9;
    box-shadow: 0 6px 24px var(--accent-glow);
    transform: translateY(-1px);
  }
  .gf-btn-ghost {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .gf-btn-ghost:hover:not(:disabled) {
    background: var(--surface2);
    color: var(--text);
    border-color: var(--border-lit);
  }
  .gf-btn-secondary {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
  }
  .gf-btn-secondary:hover:not(:disabled) { background: #21263a; border-color: var(--border-lit); }

  .gf-btn-icon {
    padding: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    justify-content: center;
  }

  /* Stats strip */
  .gf-stats {
    display: flex;
    gap: 14px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .gf-stat {
    flex: 1;
    min-width: 140px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: border-color .2s;
  }
  .gf-stat:hover { border-color: var(--border-lit); }
  .gf-stat-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .gf-stat-body {}
  .gf-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: var(--text);
  }
  .gf-stat-label {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 3px;
  }

  /* Table card */
  .gf-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .gf-table-wrap { overflow-x: auto; }
  table.gf-table {
    width: 100%;
    border-collapse: collapse;
  }
  .gf-table thead tr {
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  .gf-table th {
    padding: 13px 18px;
    text-align: left;
    font-family: 'Syne', sans-serif;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }
  .gf-table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background .15s;
  }
  .gf-table tbody tr:last-child { border-bottom: none; }
  .gf-table tbody tr:hover { background: var(--surface2); }
  .gf-table td {
    padding: 15px 18px;
    font-size: 13.5px;
    color: var(--text);
    vertical-align: middle;
  }

  /* Avatar cell */
  .gf-avatar-cell {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .gf-avatar {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: var(--accent-dim);
    border: 1px solid rgba(79,142,247,0.25);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
  }
  .gf-cell-main { font-weight: 500; color: var(--text); line-height: 1.2; }
  .gf-cell-sub  { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

  .gf-email-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 4px 11px;
    font-size: 12.5px;
    color: var(--text-dim);
    font-family: 'DM Mono', monospace;
  }

  /* Badges */
  .gf-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 500;
    font-family: 'Syne', sans-serif;
    letter-spacing: .02em;
  }
  .gf-badge-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
  .gf-badge-invite  { background: var(--amber-dim); color: var(--amber);  border: 1px solid rgba(160,107,26,.2); }
  .gf-badge-rempli  { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(43,117,116,.2); }
  .gf-badge-valide  { background: var(--teal-dim);   color: var(--teal);   border: 1px solid rgba(18,72,76,.2); }
  .gf-badge-default { background: var(--surface2);   color: var(--muted);  border: 1px solid var(--border); }

  /* ID chip */
  .gf-id-chip {
    display: inline-flex;
    align-items: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 9px;
    font-size: 11.5px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    color: var(--muted);
  }

  /* Society chip */
  .gf-society {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text);
  }
  .gf-society-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }

  /* Empty state */
  .gf-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 20px;
  }
  .gf-empty-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .gf-empty-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--text-dim); }
  .gf-empty-sub   { font-size: 13px; color: var(--muted); }

  /* Spinner */
  .gf-spinner-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 14px;
    color: var(--text-dim);
    font-size: 13.5px;
  }
  .gf-spinner {
    width: 30px; height: 30px;
    border: 2.5px solid var(--border-lit);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: gf-spin .7s linear infinite;
  }
  @keyframes gf-spin { to { transform: rotate(360deg) } }

  /* Modal */
  .gf-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    animation: gf-fadein .2s ease both;
  }
  .gf-modal {
    background: var(--surface);
    border: 1px solid var(--border-lit);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 440px;
    box-shadow: 0 30px 80px rgba(0,0,0,.6);
    animation: gf-modal-in .22s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes gf-modal-in {
    from { opacity:0; transform:scale(.94) translateY(10px) }
    to   { opacity:1; transform:scale(1) translateY(0) }
  }
  .gf-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
  }
  .gf-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
  }
  .gf-modal-subtitle {
    font-size: 12.5px;
    color: var(--text-dim);
    margin-top: 4px;
  }
  .gf-modal-close-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-dim);
    transition: all .15s;
    flex-shrink: 0;
  }
  .gf-modal-close-btn:hover { background: var(--red-dim); color: var(--red); border-color: rgba(248,113,113,.2); }

  .gf-modal-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; }

  .gf-field { display: flex; flex-direction: column; gap: 7px; }
  .gf-label {
    font-size: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .gf-input {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 0 14px;
    height: 42px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color .18s, box-shadow .18s;
    width: 100%;
  }
  .gf-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .gf-input::placeholder { color: var(--muted); }

  .gf-modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 0 24px 24px;
  }

  /* Divider in modal */
  .gf-divider {
    height: 1px;
    background: var(--border);
    margin: 0 24px;
  }

  /* Refresh btn anim */
  .gf-btn-refresh:hover svg { animation: gf-spin .6s linear; }
`;

/* ── SVG Icon ──────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard = ({ value, label, iconD, color, bg }) => (
  <div className="gf-stat">
    <div className="gf-stat-icon" style={{ background: bg }}>
      <Icon d={iconD} size={17} color={color} />
    </div>
    <div className="gf-stat-body">
      <div className="gf-stat-value">{value}</div>
      <div className="gf-stat-label">{label}</div>
    </div>
  </div>
);

/* ── Status Badge ──────────────────────────────────────────────────────────── */
const Badge = ({ statut }) => {
  const map = {
    INVITE: { cls: "gf-badge-invite", label: "Invité" },
    REMPLI: { cls: "gf-badge-rempli", label: "Rempli" },
    VALIDE: { cls: "gf-badge-valide", label: "Validé" },
  };
  const { cls, label } = map[statut] || {
    cls: "gf-badge-default",
    label: statut || "—",
  };
  return (
    <span className={`gf-badge ${cls}`}>
      <span className="gf-badge-dot" />
      {label}
    </span>
  );
};

/* ── Initials Avatar ───────────────────────────────────────────────────────── */
const Avatar = ({ nom, prenom }) => {
  const initials = `${(nom?.[0] || "").toUpperCase()}${(prenom?.[0] || "").toUpperCase()}`;
  return <div className="gf-avatar">{initials || "?"}</div>;
};

/* ── Main Component ────────────────────────────────────────────────────────── */
const GestionFournisseurs = ({ toast }) => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: "", prenom: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchFournisseurs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/fournisseurs");
      setFournisseurs(res.data);
    } catch {
      toast?.("Erreur lors du chargement des fournisseurs.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

  const handleAdd = async () => {
    if (
      !formData.nom.trim() ||
      !formData.prenom.trim() ||
      !formData.email.trim()
    ) {
      toast?.("Veuillez remplir tous les champs.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/users", { ...formData, role: "FOURNISSEUR" });
      toast?.("Invitation envoyée au fournisseur.", "success");
      setShowModal(false);
      setFormData({ nom: "", prenom: "", email: "" });
      fetchFournisseurs();
    } catch (err) {
      toast?.(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = fournisseurs.filter((f) =>
    [f.nom, f.prenom, f.email, f.nom_societe].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const stats = {
    total: fournisseurs.length,
    valide: fournisseurs.filter((f) => f.statut_inscription === "VALIDE")
      .length,
    rempli: fournisseurs.filter((f) => f.statut_inscription === "REMPLI")
      .length,
    invite: fournisseurs.filter((f) => f.statut_inscription === "INVITE")
      .length,
  };

  return (
    <div className="gf-root">
      <style>{styles}</style>

      <div className="gf-page">
        {/* Header */}
        <div className="gf-header">
          <div className="gf-header-right">
            <button
              className="gf-btn gf-btn-ghost gf-btn-refresh"
              onClick={fetchFournisseurs}
              title="Rafraîchir"
            >
              <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              Rafraîchir
            </button>
            <div className="gf-search">
              <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="gf-btn gf-btn-primary"
              onClick={() => setShowModal(true)}
            >
              <Icon d="M12 4v16m8-8H4" size={14} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="gf-stats">
          <StatCard
            value={stats.total}
            label="Total fournisseurs"
            iconD="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
            color="#2B7574"
            bg="rgba(43,117,116,0.10)"
          />
          <StatCard
            value={stats.valide}
            label="Validés"
            iconD="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
            color="#12484C"
            bg="rgba(18,72,76,0.10)"
          />
          <StatCard
            value={stats.rempli}
            label="Remplis"
            iconD="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"
            color="#2B7574"
            bg="rgba(43,117,116,0.10)"
          />
          <StatCard
            value={stats.invite}
            label="En attente"
            iconD="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
            color="#a06b1a"
            bg="rgba(160,107,26,0.10)"
          />
        </div>

        {/* Table */}
        <div className="gf-card">
          {loading ? (
            <div className="gf-spinner-wrap">
              <div className="gf-spinner" />
              Chargement des fournisseurs…
            </div>
          ) : (
            <div className="gf-table-wrap">
              <table className="gf-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fournisseur</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Société</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="gf-id-chip">#{f.id}</span>
                      </td>
                      <td>
                        <div className="gf-avatar-cell">
                          <Avatar nom={f.nom} prenom={f.prenom} />
                          <div>
                            <div className="gf-cell-main">
                              {f.nom} {f.prenom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="gf-email-chip">
                          <Icon
                            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
                            size={12}
                          />
                          {f.email}
                        </span>
                      </td>
                      <td>
                        <Badge statut={f.statut_inscription} />
                      </td>
                      <td>
                        {f.nom_societe ? (
                          <span className="gf-society">
                            <span className="gf-society-dot" />
                            {f.nom_societe}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 13 }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="gf-btn gf-btn-ghost gf-btn-icon"
                          title="Voir détails"
                        >
                          <Icon
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                            size={14}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="gf-empty">
                          <div className="gf-empty-icon">
                            <Icon
                              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
                              size={22}
                            />
                          </div>
                          <div className="gf-empty-title">
                            Aucun fournisseur trouvé
                          </div>
                          <div className="gf-empty-sub">
                            {search
                              ? `Aucun résultat pour "${search}"`
                              : "Commencez par ajouter un fournisseur"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              marginTop: 14,
              fontSize: 12.5,
              color: "var(--muted)",
              textAlign: "right",
            }}
          >
            {filtered.length} fournisseur{filtered.length > 1 ? "s" : ""}{" "}
            affiché{filtered.length > 1 ? "s" : ""}
            {search && ` · filtrés sur ${fournisseurs.length}`}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="gf-overlay" onClick={() => setShowModal(false)}>
          <div className="gf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div>
                <div className="gf-modal-title">Nouveau Fournisseur</div>
                <div className="gf-modal-subtitle">
                  Une invitation sera envoyée par email
                </div>
              </div>
              <button
                className="gf-modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <Icon d="M18 6L6 18M6 6l12 12" size={15} />
              </button>
            </div>

            <div className="gf-modal-body">
              <div className="gf-field">
                <label className="gf-label">Nom</label>
                <input
                  className="gf-input"
                  type="text"
                  placeholder="ex: Ben Ali"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
              </div>
              <div className="gf-field">
                <label className="gf-label">Prénom</label>
                <input
                  className="gf-input"
                  type="text"
                  placeholder="ex: Mohamed"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                />
              </div>
              <div className="gf-field">
                <label className="gf-label">Email</label>
                <input
                  className="gf-input"
                  type="email"
                  placeholder="ex: contact@societe.tn"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="gf-divider" />

            <div className="gf-modal-footer">
              <button
                className="gf-btn gf-btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                className="gf-btn gf-btn-primary"
                onClick={handleAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "gf-spin .7s linear infinite",
                      }}
                    />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Icon
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
                      size={13}
                    />
                    Envoyer l'invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFournisseurs;
