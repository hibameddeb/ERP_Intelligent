import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const Icons = {
    user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
    logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    check:    "M20 6L9 17l-5-5",
    close:    "M18 6L6 18M6 6l12 12",
    camera:   "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.38 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 23 17z",
    mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    map:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    eyeOff:   "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
    chevron:  "M9 18l6-6-6-6",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

.par-wrap * { box-sizing: border-box; }
.par-wrap { animation: parPageIn .35s ease both; }
@keyframes parPageIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }

/* ══ HERO ══════════════════════════════════════════════════ */
.par-hero {
    position: relative; border-radius: 20px; overflow: hidden;
    margin-bottom: 24px; background: var(--surface); border: 1px solid var(--border);
}
.par-hero-banner {
    height: 110px;
    background: linear-gradient(135deg, rgba(79,124,255,.3) 0%, rgba(139,92,246,.2) 50%, rgba(16,185,129,.12) 100%);
    position: relative; overflow: hidden;
}
.par-hero-banner::before {
    content:''; position:absolute; inset:0;
    background: repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(255,255,255,.025) 24px, rgba(255,255,255,.025) 48px);
}
.par-hero-banner::after {
    content:''; position:absolute;
    width:280px; height:280px; border-radius:50%;
    background: radial-gradient(circle, rgba(79,124,255,.18), transparent 65%);
    top:-120px; right:-30px;
}
.par-hero-body {
    padding: 0 26px 22px;
    display: flex; align-items: flex-end; gap: 18px;
}

/* Avatar */
.par-avatar-wrap { position: relative; margin-top: -42px; flex-shrink: 0; }
.par-avatar {
    width: 86px; height: 86px; border-radius: 50%;
    border: 4px solid var(--surface);
    background: linear-gradient(135deg, #4f7cff 0%, #a78bfa 100%);
    display: grid; place-items: center;
    font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #fff;
    overflow: hidden; cursor: pointer; position: relative;
    box-shadow: 0 4px 20px rgba(79,124,255,.28);
    transition: box-shadow .2s;
}
.par-avatar img { width:100%; height:100%; object-fit:cover; }
.par-avatar-overlay {
    position:absolute; inset:0; border-radius:50%;
    background: rgba(0,0,0,.55); display:grid; place-items:center;
    color:#fff; opacity:0; transition:opacity .2s;
}
.par-avatar:hover { box-shadow: 0 4px 28px rgba(79,124,255,.45); }
.par-avatar:hover .par-avatar-overlay { opacity:1; }
.par-avatar-hint {
    position:absolute; bottom:-6px; right:-4px;
    background: var(--accent); color:#fff;
    width:22px; height:22px; border-radius:50%;
    border: 2px solid var(--surface);
    display:grid; place-items:center;
    pointer-events:none;
}
.par-avatar-input { display:none; }

/* Hero info */
.par-hero-info { flex:1; padding-bottom:2px; }
.par-hero-name {
    font-family:'Syne',sans-serif; font-size:21px; font-weight:800;
    letter-spacing:-.3px; margin-bottom:6px;
}
.par-hero-meta { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
.par-hero-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:99px;
    font-size:10px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
}
.par-badge-ADMIN      { background:rgba(239,68,68,.12); color:#f87171; }
.par-badge-COMMERCIAL { background:rgba(99,102,241,.12); color:#818cf8; }
.par-badge-CLIENT     { background:rgba(16,185,129,.12); color:#34d399; }
.par-badge-default    { background:rgba(79,124,255,.12); color:var(--accent); }
.par-hero-chip {
    display:inline-flex; align-items:center; gap:5px;
    font-size:12px; color:var(--muted);
}

/* ══ LAYOUT ════════════════════════════════════════════════ */
.par-layout { display:grid; grid-template-columns:230px 1fr; gap:18px; align-items:start; }

/* ══ SIDENAV ═══════════════════════════════════════════════ */
.par-sidenav {
    background:var(--surface); border:1px solid var(--border);
    border-radius:16px; overflow:hidden; position:sticky; top:20px;
}
.par-nav-section {
    font-size:10px; font-weight:700; color:var(--muted);
    letter-spacing:.1em; text-transform:uppercase;
    padding:13px 16px 5px;
}
.par-nav-item {
    display:flex; align-items:center; gap:10px;
    padding:11px 16px; cursor:pointer;
    font-size:13px; font-weight:500; color:var(--muted);
    transition:all .15s; border-left:3px solid transparent;
    user-select:none;
}
.par-nav-item:hover { background:var(--surface2); color:var(--text); }
.par-nav-item.active {
    background:rgba(79,124,255,.08); color:var(--accent);
    border-left-color:var(--accent); font-weight:600;
}
.par-nav-item.danger { color:var(--danger); }
.par-nav-item.danger:hover { background:rgba(239,68,68,.07); }
.par-nav-chevron { margin-left:auto; opacity:.35; }
.par-nav-divider { height:1px; background:var(--border); margin:5px 0; }

/* ══ PANELS ════════════════════════════════════════════════ */
.par-panel {
    background:var(--surface); border:1px solid var(--border);
    border-radius:16px; overflow:hidden;
    animation:parPanelIn .22s ease both;
}
@keyframes parPanelIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }
.par-panel-hdr { padding:20px 24px 16px; border-bottom:1px solid var(--border); }
.par-panel-title {
    font-family:'Syne',sans-serif; font-size:15px; font-weight:700;
    display:flex; align-items:center; gap:8px; margin-bottom:3px;
}
.par-panel-title svg { color:var(--accent); }
.par-panel-sub { font-size:12px; color:var(--muted); }
.par-panel-body { padding:22px 24px; }

/* Info cells */
.par-info-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:1px; background:var(--border);
    border-radius:12px; overflow:hidden; margin-bottom:18px;
}
.par-info-cell {
    background:var(--surface2); padding:14px 16px;
    display:flex; flex-direction:column; gap:4px;
}
.par-info-cell.span2 { grid-column:1/-1; }
.par-info-lbl { font-size:10px; font-weight:700; color:var(--muted); letter-spacing:.08em; text-transform:uppercase; }
.par-info-val { font-size:13px; color:var(--text); font-weight:500; }
.par-info-val.empty { color:var(--muted); font-style:italic; font-weight:400; }

/* Section label */
.par-sec-lbl {
    font-size:10px; font-weight:700; color:var(--muted);
    letter-spacing:.1em; text-transform:uppercase;
    display:flex; align-items:center; gap:7px; margin-bottom:13px;
}
.par-sec-lbl::after { content:''; flex:1; height:1px; background:var(--border); }

/* Form fields */
.par-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:13px; margin-bottom:13px; }
.par-span2 { grid-column:1/-1; }
.par-group { display:flex; flex-direction:column; gap:5px; }
.par-lbl { font-size:11px; font-weight:600; color:var(--muted); letter-spacing:.04em; text-transform:uppercase; }
.par-input {
    background:var(--surface2); border:1px solid var(--border);
    color:var(--text); font-family:'DM Sans',sans-serif;
    font-size:13.5px; padding:10px 13px; border-radius:9px;
    outline:none; transition:border-color .15s,box-shadow .15s; width:100%;
}
.par-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(79,124,255,.1); }
.par-input:disabled { opacity:.4; cursor:not-allowed; }
.par-input::placeholder { color:var(--muted); opacity:.5; }

/* Password */
.par-pw { position:relative; }
.par-pw .par-input { padding-right:42px; }
.par-pw-eye {
    position:absolute; right:11px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:var(--muted);
    display:grid; place-items:center; padding:0; transition:color .15s;
}
.par-pw-eye:hover { color:var(--text); }

/* Strength bar */
.par-str-bars { display:flex; gap:4px; margin-bottom:4px; }
.par-str-bar { flex:1; height:4px; border-radius:99px; transition:background .3s; }

/* Footer */
.par-footer {
    display:flex; align-items:center; justify-content:flex-end; gap:9px;
    margin-top:20px; padding-top:18px; border-top:1px solid var(--border);
}
.par-saved {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:8px;
    background:rgba(34,197,94,.1); color:var(--success);
    font-size:12px; font-weight:600;
    animation:parFadeIn .3s ease;
}
@keyframes parFadeIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }

/* Logout card */
.par-logout-card {
    border:1px solid rgba(239,68,68,.2); border-radius:12px;
    padding:18px 20px; background:rgba(239,68,68,.04);
    display:flex; align-items:center; justify-content:space-between; gap:14px;
}
.par-logout-card h4 { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; margin-bottom:4px; }
.par-logout-card p  { font-size:12.5px; color:var(--muted); line-height:1.5; }
.par-logout-btn {
    flex-shrink:0; padding:10px 16px; border-radius:9px;
    border:1px solid rgba(239,68,68,.3); background:rgba(239,68,68,.1);
    color:var(--danger); font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:600; cursor:pointer;
    display:flex; align-items:center; gap:7px;
    transition:all .15s; white-space:nowrap;
}
.par-logout-btn:hover { background:rgba(239,68,68,.18); transform:translateY(-1px); }

/* Overlay */
.par-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.8);
    display:grid; place-items:center; z-index:1000;
    backdrop-filter:blur(6px); animation:parFadeIn .15s ease;
}
.par-confirm {
    background:var(--surface); border:1px solid var(--border);
    border-radius:20px; padding:36px 30px;
    width:380px; max-width:95vw; text-align:center;
    animation:parSlideUp .22s ease;
}
@keyframes parSlideUp { from{transform:translateY(22px);opacity:0} to{transform:none;opacity:1} }
.par-confirm-icon {
    width:58px; height:58px; border-radius:50%;
    background:rgba(239,68,68,.12); color:var(--danger);
    display:grid; place-items:center; margin:0 auto 16px;
}
.par-confirm h3 { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; margin-bottom:9px; }
.par-confirm p  { color:var(--muted); font-size:13px; line-height:1.6; margin-bottom:24px; }
.par-confirm-btns { display:flex; gap:10px; justify-content:center; }

/* Toast */
.par-toast {
    position:fixed; bottom:26px; right:26px;
    background:var(--surface2); border:1px solid var(--border);
    border-radius:12px; padding:13px 18px;
    display:flex; align-items:center; gap:11px;
    font-size:13.5px; font-weight:500;
    animation:parSlideUp .3s ease; z-index:2000;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
}
.par-toast.success { border-left:3px solid var(--success); }
.par-toast.error   { border-left:3px solid var(--danger); }
.par-toast-icon { width:22px; height:22px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; }
.par-toast.success .par-toast-icon { background:rgba(34,197,94,.15); color:var(--success); }
.par-toast.error   .par-toast-icon { background:rgba(239,68,68,.15); color:var(--danger); }

/* Spinner */
.par-spin {
    display:inline-block; width:14px; height:14px;
    border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
    border-radius:50%; animation:parSpinAnim .6s linear infinite;
}
@keyframes parSpinAnim { to{transform:rotate(360deg)} }

@media(max-width:820px){
    .par-layout{grid-template-columns:1fr;}
    .par-sidenav{position:static;}
    .par-grid2{grid-template-columns:1fr;}
    .par-span2{grid-column:1;}
    .par-info-grid{grid-template-columns:1fr;}
    .par-info-cell.span2{grid-column:1;}
    .par-hero-body{flex-direction:column;align-items:flex-start;}
}
   
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 480;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    outline: none;
    user-select: none;
    background: rgb(43, 117, 116);
    color: white;

}

`;

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt     = v => v || null;
const fmtDate = v => v ? new Date(v).toLocaleDateString('fr-FR') : null;
const InfoVal = ({ v }) => v
    ? <span className="par-info-val">{v}</span>
    : <span className="par-info-val empty">Non renseigné</span>;

const roleBadge = r => {
    if (!r) return 'par-badge-default';
    const u = r.toUpperCase();
    if (u === 'ADMIN') return 'par-badge-ADMIN';
    if (u === 'COMMERCIAL') return 'par-badge-COMMERCIAL';
    if (u === 'CLIENT') return 'par-badge-CLIENT';
    return 'par-badge-default';
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`par-toast ${type}`}>
            <div className="par-toast-icon"><Icon d={type === 'success' ? Icons.check : Icons.close} size={13} /></div>
            {msg}
        </div>
    );
};

// ─── Logout Confirm ───────────────────────────────────────────────────────────
const LogoutModal = ({ onClose, onConfirm }) => (
    <div className="par-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="par-confirm">
            <div className="par-confirm-icon"><Icon d={Icons.logout} size={26} /></div>
            <h3>Se déconnecter ?</h3>
            <p>Votre session sera fermée et vous serez redirigé vers la page de connexion.</p>
            <div className="par-confirm-btns">
                <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                <button className="btn btn-danger" onClick={onConfirm}>Confirmer</button>
            </div>
        </div>
    </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AvatarUpload = ({ initials, url, onUpload }) => {
    const ref = useRef();
    const onChange = e => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { alert('Image max 2 Mo'); return; }
        const r = new FileReader();
        r.onload = () => onUpload(r.result, f);
        r.readAsDataURL(f);
    };
    return (
        <div className="par-avatar-wrap">
            <div className="par-avatar" onClick={() => ref.current.click()}>
                {url ? <img src={url} alt="avatar" /> : initials}
                <div className="par-avatar-overlay"><Icon d={Icons.camera} size={22} /></div>
            </div>
            <div className="par-avatar-hint"><Icon d={Icons.camera} size={11} /></div>
            <input ref={ref} type="file" accept="image/*" className="par-avatar-input" onChange={onChange} />
        </div>
    );
};

// ─── TAB: Mon Profil ──────────────────────────────────────────────────────────
const TabProfil = ({ user, goEdit }) => (
    <div className="par-panel">
        <div className="par-panel-hdr">
            <div className="par-panel-title"><Icon d={Icons.user} size={15} /> Mon profil</div>
            <div className="par-panel-sub">Vos informations enregistrées</div>
        </div>
        <div className="par-panel-body">
            <div className="par-sec-lbl"><Icon d={Icons.user} size={11} /> Identité</div>
            <div className="par-info-grid">
                <div className="par-info-cell">
                    <span className="par-info-lbl">Prénom</span>
                    <InfoVal v={fmt(user?.prenom)} />
                </div>
                <div className="par-info-cell">
                    <span className="par-info-lbl">Nom</span>
                    <InfoVal v={fmt(user?.nom)} />
                </div>
                <div className="par-info-cell">
                    <span className="par-info-lbl">Email</span>
                    <InfoVal v={fmt(user?.email)} />
                </div>
                <div className="par-info-cell">
                    <span className="par-info-lbl">Téléphone</span>
                    <InfoVal v={fmt(user?.num_tlp)} />
                </div>
                <div className="par-info-cell">
                    <span className="par-info-lbl">Rôle</span>
                    <InfoVal v={fmt(user?.role)} />
                </div>
                <div className="par-info-cell">
                    <span className="par-info-lbl">Membre depuis</span>
                    <InfoVal v={fmtDate(user?.created_at)} />
                </div>
            </div>

            {user?.role === 'CLIENT' && (
                <>
                    <div className="par-sec-lbl" style={{ marginTop: 6 }}><Icon d={Icons.building} size={11} /> Entreprise & Adresse</div>
                    <div className="par-info-grid">
                        <div className="par-info-cell span2">
                            <span className="par-info-lbl">Activité</span>
                            <InfoVal v={fmt(user?.activite)} />
                        </div>
                        <div className="par-info-cell">
                            <span className="par-info-lbl">Adresse</span>
                            <InfoVal v={fmt(user?.adresse)} />
                        </div>
                        <div className="par-info-cell">
                            <span className="par-info-lbl">Rue</span>
                            <InfoVal v={fmt(user?.rue)} />
                        </div>
                        <div className="par-info-cell span2">
                            <span className="par-info-lbl">Ville</span>
                            <InfoVal v={fmt(user?.ville)} />
                        </div>
                    </div>
                </>
            )}

            <div className="par-footer" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={goEdit}
                    style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <Icon d={Icons.edit} size={14} /> Modifier le profil
                </button>
            </div>
        </div>
    </div>
);

// ─── TAB: Modifier profil ─────────────────────────────────────────────────────
const TabEditer = ({ user, showToast, onUserUpdate }) => {
    const isClient = user?.role === 'CLIENT';
    const init = () => ({
        nom: user?.nom||'', prenom: user?.prenom||'', num_tlp: user?.num_tlp||'',
        adresse: user?.adresse||'', ville: user?.ville||'', rue: user?.rue||'', activite: user?.activite||''
    });
    const [form, setForm] = useState(init);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const save = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) { showToast('Nom et prénom requis.', 'error'); return; }
    setSaving(true); setSaved(false);
    try {
        const res = await API.put('/auth/profile', form);  
        const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);

        setSaved(true); showToast('Profil mis à jour !', 'success');
        setTimeout(() => setSaved(false), 3000);
    } catch (err) {
        showToast(err.response?.data?.error || 'Erreur lors de la mise à jour.', 'error');
    } finally { setSaving(false); }
};

    return (
        <div className="par-panel">
            <div className="par-panel-hdr">
                <div className="par-panel-title"><Icon d={Icons.edit} size={15} /> Modifier le profil</div>
                <div className="par-panel-sub">Mettez à jour vos informations</div>
            </div>
            <div className="par-panel-body">
                <div className="par-sec-lbl"><Icon d={Icons.user} size={11} /> Identité</div>
                <div className="par-grid2">
                    <div className="par-group">
                        <label className="par-lbl">Prénom *</label>
                        <input className="par-input" value={form.prenom} onChange={set('prenom')} placeholder="Prénom" />
                    </div>
                    <div className="par-group">
                        <label className="par-lbl">Nom *</label>
                        <input className="par-input" value={form.nom} onChange={set('nom')} placeholder="Nom" />
                    </div>
                    <div className="par-group par-span2">
                        <label className="par-lbl">Téléphone</label>
                        <input className="par-input" value={form.num_tlp} onChange={set('num_tlp')} placeholder="+216 XX XXX XXX" />
                    </div>
                </div>

                {isClient && (
                    <>
                        <div className="par-sec-lbl" style={{ marginTop:6 }}><Icon d={Icons.map} size={11} /> Adresse</div>
                        <div className="par-grid2">
                            <div className="par-group par-span2">
                                <label className="par-lbl">Adresse</label>
                                <input className="par-input" value={form.adresse} onChange={set('adresse')} placeholder="Adresse" />
                            </div>
                            <div className="par-group">
                                <label className="par-lbl">Rue</label>
                                <input className="par-input" value={form.rue} onChange={set('rue')} placeholder="Rue" />
                            </div>
                            <div className="par-group">
                                <label className="par-lbl">Ville</label>
                                <input className="par-input" value={form.ville} onChange={set('ville')} placeholder="Ville" />
                            </div>
                        </div>
                        <div className="par-sec-lbl" style={{ marginTop:6 }}><Icon d={Icons.building} size={11} /> Activité</div>
                        <div className="par-group" style={{ marginBottom:13 }}>
                            <label className="par-lbl">Secteur</label>
                            <input className="par-input" value={form.activite} onChange={set('activite')} placeholder="Ex: Commerce" />
                        </div>
                    </>
                )}

                <div className="par-footer">
                    {saved && <span className="par-saved"><Icon d={Icons.check} size={13} /> Enregistré</span>}
                    <button className="btn btn-ghost" onClick={() => setForm(init())}>Réinitialiser</button>
                    <button className="btn btn-primary" onClick={save} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:7 }}>
                        {saving
                            ? <><span className="par-spin" /> Enregistrement...</>
                            : <><Icon d={Icons.check} size={14} /> Enregistrer</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TAB: Sécurité ────────────────────────────────────────────────────────────
const TabSecurite = ({ showToast }) => {
    const [f, setF]     = useState({ cur:'', nxt:'', cfm:'' });
    const [sh, setSh]   = useState({ cur:false, nxt:false, cfm:false });
    const [saving, setSaving] = useState(false);

    const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
    const tog = k => setSh(p => ({ ...p, [k]: !p[k] }));

    const strength = (() => {
        const p = f.nxt; if (!p) return 0;
        return [p.length>=8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    })();
    const strColors = ['#374151','#ef4444','#f59e0b','#22c55e','#10b981'];
    const strLabels = ['','Faible','Moyen','Fort','Très fort'];

    const save = async () => {
        if (!f.cur)          { showToast('Mot de passe actuel requis.', 'error'); return; }
        if (f.nxt.length < 8){ showToast('Minimum 8 caractères.', 'error'); return; }
        if (f.nxt !== f.cfm) { showToast('Les mots de passe ne correspondent pas.', 'error'); return; }
        setSaving(true);
        try {
            await API.put('/auth/password', { currentPassword: f.cur, newPassword: f.nxt });
            showToast('Mot de passe modifié !', 'success');
            setF({ cur:'', nxt:'', cfm:'' });
        } catch (err) {
            showToast(err.response?.data?.error || 'Mot de passe actuel incorrect.', 'error');
        } finally { setSaving(false); }
    };

    const PwInput = ({ k, label, ph }) => (
        <div className="par-group" style={{ marginBottom: 13 }}>
            <label className="par-lbl">{label}</label>
            <div className="par-pw">
                <input className="par-input" type={sh[k] ? 'text' : 'password'} value={f[k]} onChange={set(k)} placeholder={ph} />
                <button className="par-pw-eye" type="button" onClick={() => tog(k)}>
                    <Icon d={sh[k] ? Icons.eyeOff : Icons.eye} size={15} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="par-panel">
            <div className="par-panel-hdr">
                <div className="par-panel-title"><Icon d={Icons.lock} size={15} /> Sécurité</div>
                <div className="par-panel-sub">Changez votre mot de passe</div>
            </div>
            <div className="par-panel-body">
                <div className="par-sec-lbl"><Icon d={Icons.lock} size={11} /> Mot de passe</div>
                <PwInput k="cur" label="Mot de passe actuel *" ph="••••••••" />
                <PwInput k="nxt" label="Nouveau mot de passe *" ph="Min. 8 caractères" />
                {f.nxt && (
                    <div style={{ marginBottom: 13 }}>
                        <div className="par-str-bars">
                            {[0,1,2,3].map(i => (
                                <div key={i} className="par-str-bar"
                                    style={{ background: i < strength ? strColors[strength] : 'var(--border)' }} />
                            ))}
                        </div>
                        {strength > 0 && <div style={{ fontSize:11, color:strColors[strength], fontWeight:600 }}>{strLabels[strength]}</div>}
                    </div>
                )}
                <PwInput k="cfm" label="Confirmer le nouveau mot de passe *" ph="••••••••" />
                <div className="par-footer">
                    <button className="btn btn-ghost" onClick={() => setF({ cur:'', nxt:'', cfm:'' })}>Annuler</button>
                    <button className="btn btn-primary" onClick={save} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:7 }}>
                        {saving ? <><span className="par-spin" /> Modification...</> : <><Icon d={Icons.check} size={14} /> Changer</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TAB: Déconnexion ─────────────────────────────────────────────────────────
const TabDeconnexion = ({ onLogoutRequest }) => (
    <div className="par-panel">
        <div className="par-panel-hdr">
            <div className="par-panel-title"><Icon d={Icons.logout} size={15} /> Déconnexion</div>
            <div className="par-panel-sub">Gérez votre session active</div>
        </div>
        <div className="par-panel-body">
            <div className="par-logout-card">
                <div>
                    <h4>Terminer la session</h4>
                    <p>Vous serez déconnecté et redirigé vers la page de connexion. Vos données restent sauvegardées.</p>
                </div>
                <button className="par-logout-btn" onClick={onLogoutRequest}>
                    <Icon d={Icons.logout} size={15} /> Se déconnecter
                </button>
            </div>
        </div>
    </div>
);

// ─── NAV config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id:'profil',   icon:Icons.user,   label:'Mon profil',      section:'compte' },
    { id:'editer',   icon:Icons.edit,   label:'Modifier profil', section:'compte' },
    { id:'securite', icon:Icons.lock,   label:'Sécurité',        section:'compte' },
    { id:'logout',   icon:Icons.logout, label:'Déconnexion',     section:'session', danger:true },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const Parametres = ({ currentUser, onLogout, onUserUpdate }) => {
    const [tab,        setTab]        = useState('profil');
    const [avatarUrl,  setAvatarUrl]  = useState(currentUser?.avatar || null);
    const [showLogout, setShowLogout] = useState(false);
    const [toast,      setToast]      = useState(null);

    const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

    const initials = `${currentUser?.prenom?.[0]||''}${currentUser?.nom?.[0]||''}`.toUpperCase() || '?';

    const handleAvatarUpload = async (dataUrl, file) => {
        setAvatarUrl(dataUrl);
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            await API.post('/auth/avatar', fd, { headers: { 'Content-Type':'multipart/form-data' } });
            showToast('Photo mise à jour !', 'success');
        } catch {
            showToast("Erreur lors de l'upload.", 'error');
            setAvatarUrl(currentUser?.avatar || null);
        }
    };

    const doLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.clear();
        if (onLogout) onLogout(); else window.location.href = '/login';
    };

    const onNavClick = id => {
        if (id === 'logout') { setShowLogout(true); return; }
        setTab(id);
    };

    const renderPanel = () => {
        if (tab === 'profil')   return <TabProfil    user={currentUser} goEdit={() => setTab('editer')} />;
        if (tab === 'editer') return <TabEditer user={currentUser} showToast={showToast} onUserUpdate={onUserUpdate} />;
        if (tab === 'securite') return <TabSecurite  showToast={showToast} />;
        if (tab === 'logout')   return <TabDeconnexion onLogoutRequest={() => setShowLogout(true)} />;
        return null;
    };

    return (
        <>
            <style>{styles}</style>
            <div className="par-wrap">

                {/* ── Hero ── */}
                <div className="par-hero">
                    <div className="par-hero-banner" />
                    <div className="par-hero-body">
                        <AvatarUpload initials={initials} url={avatarUrl} onUpload={handleAvatarUpload} />
                        <div className="par-hero-info">
                            <div className="par-hero-name">{currentUser?.prenom} {currentUser?.nom}</div>
                            <div className="par-hero-meta">
                                <span className={`par-hero-badge ${roleBadge(currentUser?.role)}`}>
                                    <Icon d={Icons.shield} size={10} />
                                    {currentUser?.role || 'Utilisateur'}
                                </span>
                                {currentUser?.email && (
                                    <span className="par-hero-chip">
                                        <Icon d={Icons.mail} size={12} />
                                        {currentUser.email}
                                    </span>
                                )}
                                {currentUser?.ville && (
                                    <span className="par-hero-chip">
                                        <Icon d={Icons.map} size={12} />
                                        {currentUser.ville}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Layout ── */}
                <div className="par-layout">

                    {/* Sidebar */}
                    <div className="par-sidenav">
                        <div className="par-nav-section">Compte</div>
                        {NAV_ITEMS.filter(n => n.section === 'compte').map(n => (
                            <div key={n.id}
                                className={`par-nav-item ${tab === n.id ? 'active' : ''} ${n.danger ? 'danger' : ''}`}
                                onClick={() => onNavClick(n.id)}
                            >
                                <Icon d={n.icon} size={15} />
                                {n.label}
                                <Icon d={Icons.chevron} size={13} style={{ marginLeft:'auto', opacity:.35 }} />
                            </div>
                        ))}
                        <div className="par-nav-divider" />
                        <div className="par-nav-section">Session</div>
                        {NAV_ITEMS.filter(n => n.section === 'session').map(n => (
                            <div key={n.id}
                                className={`par-nav-item ${n.danger ? 'danger' : ''}`}
                                onClick={() => onNavClick(n.id)}
                            >
                                <Icon d={n.icon} size={15} />
                                {n.label}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div key={tab}>{renderPanel()}</div>
                </div>
            </div>

            {showLogout && <LogoutModal onClose={() => setShowLogout(false)} onConfirm={doLogout} />}
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </>
    );
};

export default Parametres;