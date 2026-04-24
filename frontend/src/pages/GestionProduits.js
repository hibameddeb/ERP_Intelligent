import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const Icons = {
    plus:    "M12 5v14M5 12h14",
    edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
    close:   "M18 6L6 18M6 6l12 12",
    check:   "M20 6L9 17l-5-5",
    image:   "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19",
    box:     "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
    refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    tag:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    link:    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    invoice: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
    arrowR:  "M5 12h14M12 5l7 7-7 7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (v) => v != null ? `${parseFloat(v).toFixed(3)} DT` : '—';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

:root {
    --accent:       #2B7574;
    --accent2:      #12484C;
    --accent-light: rgba(43,117,116,.08);
    --accent-mid:   rgba(43,117,116,.18);
    --danger:       #861211;
    --success:      #12484C;
    --warning:      #a06b1a;
    --indigo:       #4f46e5;
    --indigo-light: rgba(79,70,229,.08);
    --indigo-mid:   rgba(79,70,229,.18);
}

.btn { display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:10px;border:1px solid transparent;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap; }
.btn-sm { height:30px;padding:0 12px;font-size:12px; }
.btn-primary { background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 1px 4px rgba(43,117,116,.3); }
.btn-primary:hover { background:var(--accent2); }
.btn-primary:disabled { opacity:.55;cursor:not-allowed; }
.btn-ghost { background:var(--surface2,#fff);color:var(--text-2,#3d6372);border-color:var(--border,#e2e8f0); }
.btn-ghost:hover { background:var(--surface3,#f1f5f9); }
.btn-danger { background:rgba(134,18,17,.08);color:var(--danger);border:1px solid rgba(134,18,17,.2); }
.btn-danger:hover { background:rgba(134,18,17,.15); }

/* Stats */
.pe-stats { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px; }
.pe-stat  { background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:20px 22px; }
.pe-stat-label { font-size:11px;color:var(--muted,#94a3b8);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;display:flex;align-items:center;gap:6px; }
.pe-stat-value { font-family:'Syne',sans-serif;font-size:28px;font-weight:700; }
.pe-stat-sub   { font-size:11px;color:var(--muted,#94a3b8);margin-top:3px; }

/* Toolbar */
.pe-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;flex-wrap:wrap; }
.pe-title   { font-family:'Syne',sans-serif;font-weight:700;font-size:16px; }

/* Table */
.pe-table-wrap { background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;overflow:hidden; }
.pe-table { width:100%;border-collapse:collapse; }
.pe-table thead th { padding:12px 18px;text-align:left;font-size:11px;font-weight:600;color:var(--muted,#94a3b8);letter-spacing:.06em;text-transform:uppercase;background:var(--surface2,#f8fafc);border-bottom:1px solid var(--border,#e2e8f0);white-space:nowrap; }
.pe-table tbody tr { border-bottom:1px solid var(--border,#e2e8f0);transition:background .1s; }
.pe-table tbody tr:last-child { border-bottom:none; }
.pe-table tbody tr:hover { background:var(--surface2,#f8fafc); }
.pe-table tbody td { padding:13px 18px;font-size:13.5px;vertical-align:middle; }
.pe-thumb { width:40px;height:40px;border-radius:8px;background:var(--surface2,#f8fafc);border:1px solid var(--border,#e2e8f0);display:flex;align-items:center;justify-content:center;color:var(--muted,#94a3b8);flex-shrink:0;overflow:hidden; }
.pe-thumb img { width:100%;height:100%;object-fit:cover; }
.pe-badge-s { display:inline-flex;align-items:center;gap:4px;background:var(--indigo-light);color:var(--indigo);border:1px solid var(--indigo-mid);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600; }
.pe-icon-btn { width:32px;height:32px;border-radius:7px;border:none;display:grid;place-items:center;cursor:pointer;transition:all .15s; }
.pe-btn-edit { background:var(--accent-light);color:var(--accent); }
.pe-btn-edit:hover { background:var(--accent-mid); }
.pe-btn-del  { background:rgba(134,18,17,.08);color:var(--danger); }
.pe-btn-del:hover  { background:rgba(134,18,17,.18); }
.pe-empty { text-align:center;padding:60px 20px;color:var(--muted,#94a3b8); }
.pe-empty p { margin-top:10px;font-size:14px; }
.search-pe { display:flex;align-items:center;background:var(--surface2,#fff);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:0 14px;height:36px;width:250px;transition:border-color .2s; }
.search-pe:focus-within { border-color:var(--accent); }
.search-pe input { border:none;background:transparent;outline:none;width:100%;margin-left:8px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text,#1e293b); }

/* Overlay */
.pe-overlay { position:fixed;inset:0;background:rgba(10,30,40,.6);display:grid;place-items:center;z-index:1000;backdrop-filter:blur(6px);animation:peIn .15s ease; }
@keyframes peIn { from{opacity:0}to{opacity:1} }
@keyframes peUp  { from{transform:translateY(22px);opacity:0}to{transform:none;opacity:1} }

/* ══ SPLIT MODAL ══ */
.split-modal {
    background:var(--surface,#fff);
    border:1px solid var(--border,#e2e8f0);
    border-radius:20px;
    width:min(960px,96vw);
    max-height:90vh;
    display:grid;
    grid-template-rows:auto 1fr auto;
    overflow:hidden;
    box-shadow:0 32px 80px rgba(10,30,40,.22);
    animation:peUp .22s cubic-bezier(.2,.8,.4,1);
}
.split-hdr {
    padding:22px 28px 16px;
    display:flex;align-items:flex-start;justify-content:space-between;
    border-bottom:1px solid var(--border,#e2e8f0);
}
.split-title { font-family:'Syne',sans-serif;font-size:18px;font-weight:700; }
.split-sub   { font-size:13px;color:var(--muted,#94a3b8);margin-top:3px; }
.split-close { width:34px;height:34px;border-radius:9px;border:1px solid var(--border,#e2e8f0);background:var(--surface2,#f8fafc);display:grid;place-items:center;cursor:pointer;color:var(--muted,#94a3b8);flex-shrink:0; }
.split-close:hover { color:var(--text,#1e293b); }

.split-body {
    display:grid;
    grid-template-columns:1fr 1px 410px;
    overflow:hidden;
    min-height:0;
}

/* Left */
.split-left { display:flex;flex-direction:column;overflow:hidden;padding-top:16px; }
.split-left-top { padding:0 18px 12px;display:flex;align-items:center;gap:10px; }
.split-left-count { font-size:11px;font-weight:700;color:var(--muted,#94a3b8);text-transform:uppercase;letter-spacing:.06em;margin-right:auto; }
.facture-tabs { display:flex;gap:6px;overflow-x:auto;padding:0 18px 12px;scrollbar-width:none; }
.facture-tabs::-webkit-scrollbar { display:none; }
.facture-tab { flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--border,#e2e8f0);background:var(--surface2,#f8fafc);color:var(--muted,#94a3b8);cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px; }
.facture-tab:hover { border-color:var(--accent);color:var(--accent); }
.facture-tab.active { background:var(--accent);border-color:var(--accent);color:#fff; }
.prod-list { flex:1;overflow-y:auto;padding:0 10px 12px; }
.prod-row { display:flex;align-items:center;gap:11px;padding:10px 10px;border-radius:10px;cursor:pointer;transition:all .13s;border:1.5px solid transparent;margin-bottom:3px;user-select:none; }
.prod-row:hover:not(.imported) { background:var(--accent-light);border-color:rgba(43,117,116,.15); }
.prod-row.selected { background:var(--accent-light);border-color:var(--accent);box-shadow:0 0 0 3px rgba(43,117,116,.1); }
.prod-row.imported { opacity:.4;cursor:not-allowed; }
.prod-row-img { width:42px;height:42px;border-radius:8px;border:1px solid var(--border,#e2e8f0);overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--surface2,#f8fafc);flex-shrink:0; }
.prod-row-img img { width:100%;height:100%;object-fit:cover; }
.prod-row-body { flex:1;min-width:0; }
.prod-row-name { font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.prod-row-meta { font-size:11px;color:var(--muted,#94a3b8);margin-top:2px;display:flex;gap:8px;flex-wrap:wrap; }
.prod-row-right { display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0; }
.prod-row-price { font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--accent); }
.prod-row-check { width:20px;height:20px;border-radius:50%;border:2px solid var(--border,#e2e8f0);display:grid;place-items:center;transition:all .15s; }
.prod-row.selected .prod-row-check { background:var(--accent);border-color:var(--accent); }
.imported-tag { font-size:10px;font-weight:700;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent-mid);border-radius:4px;padding:1px 6px; }

/* Divider */
.split-div { background:var(--border,#e2e8f0); }

/* Right */
.split-right { display:flex;flex-direction:column;overflow-y:auto;padding:22px 22px 0; }
.split-right-empty { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted,#94a3b8);text-align:center;gap:12px;padding:20px; }
.split-right-empty p { font-size:13px;line-height:1.6;max-width:200px; }
.src-card { background:linear-gradient(135deg,var(--accent-light),rgba(43,117,116,.03));border:1px solid var(--accent-mid);border-radius:12px;padding:13px 15px;margin-bottom:18px;display:flex;align-items:center;gap:12px; }
.src-card-img { width:42px;height:42px;border-radius:8px;overflow:hidden;border:1px solid var(--accent-mid);flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#fff; }
.src-card-img img { width:100%;height:100%;object-fit:cover; }
.src-card-name { font-weight:700;font-size:13px;color:var(--accent2); }
.src-card-meta { font-size:11px;color:var(--accent);margin-top:2px; }

/* Form */
.rf-group { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
.rf-label { font-size:11px;font-weight:600;color:var(--muted,#94a3b8);text-transform:uppercase;letter-spacing:.06em; }
.rf-input, .rf-textarea { background:var(--surface2,#f8fafc);border:1.5px solid var(--border,#e2e8f0);color:var(--text,#1e293b);font-family:'DM Sans',sans-serif;font-size:13.5px;padding:9px 13px;border-radius:9px;outline:none;transition:border-color .15s;width:100%; }
.rf-input:focus, .rf-textarea:focus { border-color:var(--accent);background:#fff; }
.rf-textarea { resize:vertical;min-height:70px; }
.rf-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.rf-sw { position:relative; }
.rf-sw .rf-input { padding-right:42px; }
.rf-sfx { position:absolute;right:11px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:600;color:var(--muted,#94a3b8);pointer-events:none; }
.rf-hint { font-size:11px;color:var(--muted,#94a3b8);margin-top:4px;display:flex;align-items:center;gap:5px;flex-wrap:wrap; }
.rf-hbtn { background:none;border:none;color:var(--accent);font-size:11px;cursor:pointer;padding:0;font-weight:600;font-family:'DM Sans',sans-serif; }
.rf-hbtn:hover { text-decoration:underline; }
.margin-box { background:var(--surface2,#f8fafc);border:1.5px solid var(--border,#e2e8f0);border-radius:10px;padding:11px 15px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between; }
.margin-label { font-size:11px;font-weight:600;color:var(--muted,#94a3b8);text-transform:uppercase;letter-spacing:.05em; }
.margin-sub   { font-size:11px;color:var(--muted,#94a3b8);margin-top:2px; }
.margin-val   { font-family:'Syne',sans-serif;font-size:18px;font-weight:700; }
.margin-pos { color:var(--success); }
.margin-neg { color:var(--danger); }

/* Footer */
.split-ftr { padding:14px 28px;border-top:1px solid var(--border,#e2e8f0);display:flex;align-items:center;justify-content:space-between;background:var(--surface2,#f8fafc); }
.split-ftr-hint { font-size:12px;color:var(--muted,#94a3b8);display:flex;align-items:center;gap:6px; }

/* Simple modal */
.pe-modal { background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:18px;padding:28px;width:400px;max-width:95vw;animation:peUp .2s ease; }
.pe-modal-hdr { display:flex;align-items:center;justify-content:space-between;margin-bottom:18px; }
.pe-modal-title { font-family:'Syne',sans-serif;font-size:17px;font-weight:700; }
.pe-confirm { text-align:center; }
.pe-confirm-icon { width:50px;height:50px;border-radius:50%;background:rgba(134,18,17,.1);color:var(--danger);display:grid;place-items:center;margin:0 auto 14px; }
.pe-confirm h3 { font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px; }
.pe-confirm p  { color:var(--muted,#94a3b8);font-size:13px;line-height:1.5;margin-bottom:20px; }
.pe-confirm-btns { display:flex;gap:10px;justify-content:center; }

/* Toast */
.pe-toast { position:fixed;bottom:28px;right:28px;background:var(--surface2,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:13px 20px;display:flex;align-items:center;gap:12px;font-size:13.5px;font-weight:500;animation:peUp .3s ease;z-index:2000;box-shadow:0 8px 32px rgba(10,30,40,.14); }
.pe-toast.success { border-left:3px solid var(--success); }
.pe-toast.error   { border-left:3px solid var(--danger); }
.pe-spinner { display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
`;

// ─── Safe Image ───────────────────────────────────────────────────────────────
const Img = ({ src, size = 18 }) => {
    const [err, setErr] = useState(false);
    if (!src || err) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'var(--muted,#94a3b8)' }}><Icon d={Icons.image} size={size} /></div>;
    return <img src={`http://localhost:5000${src}`} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={() => setErr(true)} />;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`pe-toast ${type}`}>
            <div style={{ width:20,height:20,borderRadius:'50%',display:'grid',placeItems:'center',flexShrink:0,background:type==='success'?'rgba(18,72,76,.15)':'rgba(134,18,17,.15)',color:type==='success'?'var(--success)':'var(--danger)' }}>
                <Icon d={type==='success'?Icons.check:Icons.close} size={12} />
            </div>
            {msg}
        </div>
    );
};

// ─── CREATE MODAL (split layout) ─────────────────────────────────────────────
const CreateModal = ({ onClose, onSaved, showToast }) => {
    const [factures,      setFactures]      = useState([]);
    const [activeF,       setActiveF]       = useState(null);
    const [lignes,        setLignes]        = useState([]);
    const [loadingF,      setLoadingF]      = useState(true);
    const [loadingL,      setLoadingL]      = useState(false);
    const [selected,      setSelected]      = useState(null);
    const [searchP,       setSearchP]       = useState('');
    const [submitting,    setSubmitting]    = useState(false);
    const [form, setForm] = useState({ nom_commercial:'', description_interne:'', quantite:'0', prix_vente_ht:'' });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    useEffect(() => {
        API.get('/produits-entreprise/factures')
            .then(r => {
                const data = r.data?.data || [];
                setFactures(data);
                if (data.length) loadLignes(data[0].id);
            })
            .catch(() => {})
            .finally(() => setLoadingF(false));
    }, []);

    const loadLignes = async (id) => {
        setActiveF(id);
        setSelected(null);
        setForm({ nom_commercial:'', description_interne:'', quantite:'0', prix_vente_ht:'' });
        setLoadingL(true);
        try {
            const r = await API.get(`/produits-entreprise/factures/${id}/produits`);
            setLignes(r.data?.data || []);
        } catch { setLignes([]); }
        finally { setLoadingL(false); }
    };

    const [maxQte, setMaxQte] = useState(null);

    const handleSelect = async (ligne) => {
        if (ligne.already_imported) return;
        setSelected(ligne);
        setForm({
            nom_commercial:      ligne.nom_produit_f || '',
            description_interne: ligne.description_f || '',
            quantite:            String(Math.round(ligne.quantite) || 0),
            prix_vente_ht:       '',
        });
        // Fetch the real max (sum across all invoices)
        try {
            const r = await API.get(`/produits-entreprise/max-quantite/${ligne.id_produit_fournisseur}`);
            setMaxQte(r.data?.max_quantite ?? null);
        } catch { setMaxQte(null); }
    };

    const suggested  = selected ? (parseFloat(selected.prix_unitaire_ht) * 1.2).toFixed(3) : null;
    const margin     = selected && form.prix_vente_ht
        ? (parseFloat(form.prix_vente_ht) - parseFloat(selected.prix_unitaire_ht)).toFixed(3)
        : null;
    const qteInvalid = maxQte !== null && parseInt(form.quantite) > maxQte;

    const filteredL = lignes.filter(l =>
        !searchP || l.nom_produit_f?.toLowerCase().includes(searchP.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!form.nom_commercial.trim()) { showToast('Le nom commercial est obligatoire.', 'error'); return; }
        if (!form.prix_vente_ht || isNaN(parseFloat(form.prix_vente_ht))) { showToast('Le prix de vente HT est obligatoire.', 'error'); return; }
        if (qteInvalid) { showToast(`Quantité max : ${maxQte} unité(s) reçues en facture.`, 'error'); return; }
        setSubmitting(true);
        try {
            await API.post('/produits-entreprise', {
                nom_commercial:      form.nom_commercial.trim(),
                description_interne: form.description_interne.trim() || null,
                quantite:            parseInt(form.quantite) || 0,
                prix_vente_ht:       parseFloat(form.prix_vente_ht),
                id_produit_f:        selected?.id_produit_fournisseur || null,
            });
            showToast('Produit ajouté au catalogue ✓', 'success');
            onSaved(); onClose();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur.', 'error');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="pe-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="split-modal">

                {/* Header */}
                <div className="split-hdr">
                    <div>
                        <div className="split-title">Nouveau produit au catalogue</div>
                        <div className="split-sub">Sélectionnez un produit reçu en facture, puis personnalisez-le</div>
                    </div>
                    <button className="split-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
                </div>

                {/* Body */}
                <div className="split-body">

                    {/* ── LEFT: product picker ── */}
                    <div className="split-left">

                        {/* Facture tabs */}
                        {loadingF
                            ? <div style={{ padding:'12px 18px',fontSize:12,color:'var(--muted,#94a3b8)' }}>Chargement…</div>
                            : factures.length === 0
                                ? <div style={{ padding:'12px 18px',fontSize:12,color:'var(--muted,#94a3b8)' }}>Aucune facture reçue</div>
                                : (
                                    <div className="facture-tabs">
                                        {factures.map(f => (
                                            <button key={f.id} className={`facture-tab ${activeF===f.id?'active':''}`} onClick={() => loadLignes(f.id)}>
                                                <Icon d={Icons.invoice} size={11} />
                                                {f.num_facture || `#${f.id}`}
                                                {f.fournisseur_societe ? ` · ${f.fournisseur_societe}` : ''}
                                            </button>
                                        ))}
                                    </div>
                                )
                        }

                        {/* Search + count */}
                        <div className="split-left-top">
                            <span className="split-left-count">
                                {loadingL ? 'Chargement…' : `${filteredL.length} produit${filteredL.length !== 1 ? 's' : ''}`}
                            </span>
                            <div className="search-pe" style={{ width:160,height:30 }}>
                                <Icon d={Icons.search} size={13} />
                                <input placeholder="Filtrer…" value={searchP} onChange={e => setSearchP(e.target.value)} />
                            </div>
                        </div>

                        {/* List */}
                        <div className="prod-list">
                            {loadingL
                                ? <div style={{ padding:'30px 0',textAlign:'center',color:'var(--muted,#94a3b8)',fontSize:13 }}>Chargement…</div>
                                : filteredL.length === 0
                                    ? <div style={{ padding:'30px 0',textAlign:'center',color:'var(--muted,#94a3b8)',fontSize:13 }}>Aucun produit</div>
                                    : filteredL.map(ligne => (
                                        <div
                                            key={ligne.detail_id}
                                            className={`prod-row ${selected?.detail_id===ligne.detail_id?'selected':''} ${ligne.already_imported?'imported':''}`}
                                            onClick={() => handleSelect(ligne)}
                                        >
                                            <div className="prod-row-img"><Img src={ligne.main_image} size={16} /></div>
                                            <div className="prod-row-body">
                                                <div className="prod-row-name">{ligne.nom_produit_f}</div>
                                                <div className="prod-row-meta">
                                                    <span>{ligne.fournisseur_societe || '—'}</span>
                                                    <span>Qté : {Math.round(ligne.quantite)}</span>
                                                    {ligne.taux_tva > 0 && <span>TVA {ligne.taux_tva}%</span>}
                                                </div>
                                            </div>
                                            <div className="prod-row-right">
                                                {ligne.already_imported
                                                    ? <span className="imported-tag">✓ Importé</span>
                                                    : <span className="prod-row-price">{fmtPrice(ligne.prix_unitaire_ht)}</span>
                                                }
                                                {!ligne.already_imported && (
                                                    <div className="prod-row-check">
                                                        {selected?.detail_id === ligne.detail_id && <Icon d={Icons.check} size={11} />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="split-div" />

                    {/* ── RIGHT: form ── */}
                    <div className="split-right">
                        {!selected ? (
                            <div className="split-right-empty">
                                <div style={{ width:54,height:54,borderRadius:14,background:'var(--accent-light)',display:'grid',placeItems:'center',color:'var(--accent)' }}>
                                    <Icon d={Icons.arrowR} size={22} />
                                </div>
                                <p>Sélectionnez un produit à gauche pour le personnaliser et l'ajouter au catalogue</p>
                            </div>
                        ) : (
                            <>
                                {/* Source card */}
                                <div className="src-card">
                                    <div className="src-card-img"><Img src={selected.main_image} size={16} /></div>
                                    <div style={{ flex:1,minWidth:0 }}>
                                        <div className="src-card-name">{selected.nom_produit_f}</div>
                                        <div className="src-card-meta">
                                            {selected.fournisseur_societe} · Prix achat HT : {fmtPrice(selected.prix_unitaire_ht)}
                                        </div>
                                    </div>
                                </div>

                                {/* Nom commercial */}
                                <div className="rf-group">
                                    <label className="rf-label">Nom commercial *</label>
                                    <input className="rf-input" value={form.nom_commercial} onChange={set('nom_commercial')} placeholder="Nom affiché dans le catalogue" />
                                    {form.nom_commercial !== selected.nom_produit_f && (
                                        <div className="rf-hint">
                                            Nom fournisseur : {selected.nom_produit_f}
                                            <button className="rf-hbtn" onClick={() => setForm(f => ({ ...f, nom_commercial: selected.nom_produit_f }))}>Réutiliser</button>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="rf-group">
                                    <label className="rf-label">Description interne</label>
                                    <textarea className="rf-textarea" value={form.description_interne} onChange={set('description_interne')} placeholder="Notes, spécifications, usage…" />
                                </div>

                                {/* Quantité + Prix vente */}
                                <div className="rf-row">
                                    <div className="rf-group">
                                        <label className="rf-label">Quantité *</label>
                                        <div className="rf-sw">
                                            <input
                                                className="rf-input"
                                                type="number" min="0" step="1"
                                                max={maxQte ?? undefined}
                                                value={form.quantite}
                                                onChange={set('quantite')}
                                                style={{ borderColor: qteInvalid ? 'var(--danger)' : undefined }}
                                            />
                                            <span className="rf-sfx">u.</span>
                                        </div>
                                        {maxQte !== null && (
                                            <div className="rf-hint" style={{ color: qteInvalid ? 'var(--danger)' : undefined }}>
                                                {qteInvalid
                                                    ? <><span style={{ fontWeight:700 }}>⚠ Max {maxQte} unité(s) disponibles</span></>
                                                    : <>Stock disponible : <strong>{maxQte}</strong> u.</>
                                                }
                                                <button className="rf-hbtn" onClick={() => setForm(f => ({ ...f, quantite: String(maxQte) }))}>Max</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="rf-group">
                                        <label className="rf-label">Prix vente HT *</label>
                                        <div className="rf-sw">
                                            <input className="rf-input" type="number" min="0" step="0.001" value={form.prix_vente_ht} onChange={set('prix_vente_ht')} placeholder="0.000" />
                                            <span className="rf-sfx">DT</span>
                                        </div>
                                        <div className="rf-hint">
                                            +20% : <button className="rf-hbtn" onClick={() => setForm(f => ({ ...f, prix_vente_ht: suggested }))}>{suggested} DT</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Margin */}
                                {margin !== null && (
                                    <div className="margin-box">
                                        <div>
                                            <div className="margin-label">Marge brute</div>
                                            <div className="margin-sub">{parseFloat(form.prix_vente_ht).toFixed(3)} − {parseFloat(selected.prix_unitaire_ht).toFixed(3)}</div>
                                        </div>
                                        <div className={`margin-val ${parseFloat(margin)>=0?'margin-pos':'margin-neg'}`}>
                                            {parseFloat(margin)>=0?'+':''}{margin} DT
                                        </div>
                                    </div>
                                )}
                                <div style={{ flex:1 }} />
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="split-ftr">
                    <div className="split-ftr-hint">
                        {selected
                            ? <><Icon d={Icons.check} size={13} /> {selected.nom_produit_f} sélectionné</>
                            : <><Icon d={Icons.package} size={13} /> Choisissez un produit à gauche</>
                        }
                    </div>
                    <div style={{ display:'flex',gap:10 }}>
                        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !selected}>
                            {submitting ? <><span className="pe-spinner" /> Enregistrement…</> : <><Icon d={Icons.check} size={14} /> Ajouter au catalogue</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
const EditModal = ({ product, onClose, onSaved, showToast }) => {
    const [form, setForm] = useState({
        nom_commercial:      product.nom_commercial || '',
        description_interne: product.description_interne || '',
        quantite:            String(product.quantite ?? 0),
        prix_vente_ht:       String(product.prix_vente_ht || ''),
    });
    const [submitting, setSubmitting] = useState(false);
    const [maxQte,     setMaxQte]     = useState(null);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    // Fetch max quantity if product is linked to a supplier product
    useEffect(() => {
        if (product.id_produit_f) {
            API.get(`/produits-entreprise/max-quantite/${product.id_produit_f}`)
                .then(r => setMaxQte(r.data?.max_quantite ?? null))
                .catch(() => {});
        }
    }, [product.id_produit_f]);

    const qteInvalid = maxQte !== null && parseInt(form.quantite) > maxQte;

    const handleSubmit = async () => {
        if (!form.nom_commercial.trim()) { showToast('Nom obligatoire.', 'error'); return; }
        if (!form.prix_vente_ht || isNaN(parseFloat(form.prix_vente_ht))) { showToast('Prix obligatoire.', 'error'); return; }
        if (qteInvalid) { showToast(`Quantité max : ${maxQte} unité(s) reçues en facture.`, 'error'); return; }
        setSubmitting(true);
        try {
            await API.put(`/produits-entreprise/${product.id}`, {
                nom_commercial:      form.nom_commercial.trim(),
                description_interne: form.description_interne.trim() || null,
                quantite:            parseInt(form.quantite) || 0,
                prix_vente_ht:       parseFloat(form.prix_vente_ht),
            });
            showToast('Produit mis à jour ✓', 'success');
            onSaved(); onClose();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur.', 'error');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="pe-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="pe-modal">
                <div className="pe-modal-hdr">
                    <span className="pe-modal-title">Modifier le produit</span>
                    <button className="split-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
                </div>
                {product.id_produit_f && (
                    <div style={{ background:'var(--indigo-light)',border:'1px solid var(--indigo-mid)',borderRadius:9,padding:'9px 13px',marginBottom:16,fontSize:12,color:'var(--indigo)',display:'flex',gap:7,alignItems:'center' }}>
                        <Icon d={Icons.link} size={13} />
                        Lié à : <strong>{product.fournisseur_nom_produit || `Produit #${product.id_produit_f}`}</strong>
                        {product.fournisseur_prix_ht && <span style={{ marginLeft:4 }}>· Achat {fmtPrice(product.fournisseur_prix_ht)}</span>}
                    </div>
                )}
                <div className="rf-group">
                    <label className="rf-label">Nom commercial *</label>
                    <input className="rf-input" value={form.nom_commercial} onChange={set('nom_commercial')} />
                </div>
                <div className="rf-group">
                    <label className="rf-label">Description interne</label>
                    <textarea className="rf-textarea" value={form.description_interne} onChange={set('description_interne')} />
                </div>
                <div className="rf-row">
                    <div className="rf-group">
                        <label className="rf-label">Quantité</label>
                        <div className="rf-sw">
                            <input
                                className="rf-input" type="number" min="0"
                                max={maxQte ?? undefined}
                                value={form.quantite} onChange={set('quantite')}
                                style={{ borderColor: qteInvalid ? 'var(--danger)' : undefined }}
                            />
                            <span className="rf-sfx">u.</span>
                        </div>
                        {maxQte !== null && (
                            <div className="rf-hint" style={{ color: qteInvalid ? 'var(--danger)' : undefined }}>
                                {qteInvalid
                                    ? <span style={{ fontWeight:700 }}>⚠ Max {maxQte} u.</span>
                                    : <>Max : <strong>{maxQte}</strong> u.</>
                                }
                                <button className="rf-hbtn" onClick={() => setForm(f => ({ ...f, quantite: String(maxQte) }))}>Max</button>
                            </div>
                        )}
                    </div>
                    <div className="rf-group">
                        <label className="rf-label">Prix vente HT *</label>
                        <div className="rf-sw">
                            <input className="rf-input" type="number" min="0" step="0.001" value={form.prix_vente_ht} onChange={set('prix_vente_ht')} />
                            <span className="rf-sfx">DT</span>
                        </div>
                    </div>
                </div>
                <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:6,paddingTop:16,borderTop:'1px solid var(--border,#e2e8f0)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting || qteInvalid}>
                        {submitting ? <><span className="pe-spinner" />…</> : <><Icon d={Icons.check} size={13} /> Sauvegarder</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
const DeleteModal = ({ product, onClose, onConfirm, loading }) => (
    <div className="pe-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pe-modal pe-confirm">
            <div className="pe-confirm-icon"><Icon d={Icons.trash} size={22} /></div>
            <h3>Retirer du catalogue ?</h3>
            <p>Vous allez retirer <strong>{product.nom_commercial}</strong> du catalogue interne.</p>
            <div className="pe-confirm-btns">
                <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
                <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={loading}>
                    {loading ? 'Suppression…' : 'Supprimer'}
                </button>
            </div>
        </div>
    </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const GestionProduits = () => {
    const [produits,   setProduits]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editProd,   setEditProd]   = useState(null);
    const [toDelete,   setToDelete]   = useState(null);
    const [delLoading, setDelLoading] = useState(false);
    const [toast,      setToast]      = useState(null);

    const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

    const fetchProduits = useCallback(async () => {
        setLoading(true);
        try { const r = await API.get('/produits-entreprise'); setProduits(r.data?.data || []); }
        catch { showToast('Erreur de chargement.', 'error'); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchProduits(); }, [fetchProduits]);

    const handleDelete = async () => {
        setDelLoading(true);
        try {
            await API.delete(`/produits-entreprise/${toDelete.id}`);
            showToast('Produit retiré.', 'success');
            setToDelete(null); fetchProduits();
        } catch (err) { showToast(err.response?.data?.message || 'Erreur.', 'error'); }
        finally { setDelLoading(false); }
    };

    const filtered = produits.filter(p => {
        const q = search.toLowerCase();
        return !q || p.nom_commercial?.toLowerCase().includes(q)
            || p.description_interne?.toLowerCase().includes(q)
            || p.fournisseur_nom_produit?.toLowerCase().includes(q)
            || p.fournisseur_societe?.toLowerCase().includes(q);
    });

    const avgPrice     = produits.length ? (produits.reduce((s,p) => s+parseFloat(p.prix_vente_ht||0),0)/produits.length).toFixed(3) : '0.000';
    const fromSupplier = produits.filter(p => p.id_produit_f).length;
    const totalQty     = produits.reduce((s,p) => s+(parseInt(p.quantite)||0), 0);

    return (
        <>
            <style>{styles}</style>

            {/* Stats */}
            <div className="pe-stats">
                {[
                    { label:'Références',          value:produits.length,  color:'#2B7574', sub:'dans le catalogue' },
                    { label:'Liés fournisseurs',   value:fromSupplier,     color:'#4f46e5', sub:'produits importés' },
                    { label:'Unités en stock',     value:totalQty,         color:'#12484C', sub:'quantité totale' },
                    { label:'Prix vente moy. HT',  value:`${avgPrice} DT`, color:'#a06b1a', sub:'hors taxes' },
                ].map(s => (
                    <div className="pe-stat" key={s.label}>
                        <div className="pe-stat-label"><span style={{ width:7,height:7,borderRadius:'50%',background:s.color,flexShrink:0 }} />{s.label}</div>
                        <div className="pe-stat-value" style={{ color:s.color }}>{s.value}</div>
                        <div className="pe-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="pe-toolbar">
                <span className="pe-title">Catalogue interne</span>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div className="search-pe">
                        <Icon d={Icons.search} size={15} />
                        <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-ghost" style={{ width:36,height:36,padding:0,display:'grid',placeItems:'center' }} onClick={fetchProduits}>
                        <Icon d={Icons.refresh} size={15} />
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Icon d={Icons.plus} size={14} /> Nouveau produit
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="pe-table-wrap">
                <table className="pe-table">
                    <thead>
                        <tr>
                            <th>Produit</th><th>Fournisseur d'origine</th>
                            <th>Prix achat HT</th><th>Prix vente HT</th>
                            <th>Marge</th><th>Qté</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="pe-empty"><p>Chargement…</p></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="pe-empty">
                                <Icon d={Icons.box} size={36} />
                                <p>Catalogue vide — ajoutez votre premier produit</p>
                                <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={() => setShowCreate(true)}>
                                    <Icon d={Icons.plus} size={13} /> Nouveau produit
                                </button>
                            </td></tr>
                        ) : filtered.map(p => {
                            const marge = p.fournisseur_prix_ht != null
                                ? (parseFloat(p.prix_vente_ht) - parseFloat(p.fournisseur_prix_ht)).toFixed(3)
                                : null;
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                                            <div className="pe-thumb"><Img src={p.main_image} size={14} /></div>
                                            <div>
                                                <div style={{ fontWeight:600 }}>{p.nom_commercial}</div>
                                                {p.description_interne && <div style={{ fontSize:11,color:'var(--muted,#94a3b8)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.description_interne}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {p.id_produit_f
                                            ? <div><span className="pe-badge-s"><Icon d={Icons.link} size={10} />{p.fournisseur_societe||'—'}</span><div style={{ fontSize:11,color:'var(--muted,#94a3b8)',marginTop:3 }}>{p.fournisseur_nom_produit}</div></div>
                                            : <span style={{ color:'var(--muted,#94a3b8)',fontSize:12 }}>—</span>
                                        }
                                    </td>
                                    <td style={{ fontFamily:'monospace',color:'var(--muted,#94a3b8)' }}>{p.fournisseur_prix_ht!=null?fmtPrice(p.fournisseur_prix_ht):'—'}</td>
                                    <td style={{ fontFamily:'monospace',fontWeight:700,color:'var(--accent)' }}>{fmtPrice(p.prix_vente_ht)}</td>
                                    <td>
                                        {marge !== null
                                            ? <span style={{ fontFamily:'monospace',fontWeight:600,fontSize:13,color:parseFloat(marge)>=0?'var(--success)':'var(--danger)' }}>{parseFloat(marge)>=0?'+':''}{marge} DT</span>
                                            : '—'}
                                    </td>
                                    <td><span style={{ fontFamily:'monospace',fontWeight:600,color:parseInt(p.quantite)===0?'var(--danger)':parseInt(p.quantite)<=5?'var(--warning)':'var(--success)' }}>{parseInt(p.quantite)||0}</span></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div style={{ display:'flex',gap:6 }}>
                                            <button className="pe-icon-btn pe-btn-edit" onClick={() => setEditProd(p)}><Icon d={Icons.edit} size={14} /></button>
                                            <button className="pe-icon-btn pe-btn-del"  onClick={() => setToDelete(p)}><Icon d={Icons.trash} size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={fetchProduits} showToast={showToast} />}
            {editProd   && <EditModal   product={editProd} onClose={() => setEditProd(null)} onSaved={fetchProduits} showToast={showToast} />}
            {toDelete   && <DeleteModal product={toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={delLoading} />}
            {toast      && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </>
    );
};


export default GestionProduits;