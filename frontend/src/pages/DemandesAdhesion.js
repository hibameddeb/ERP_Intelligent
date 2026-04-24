import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const Icons = {
    check:    "M20 6L9 17l-5-5",
    close:    "M18 6L6 18M6 6l12 12",
    search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
    eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    rne:      "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
    user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    score:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
};

// Extra styles scoped to this component only (supplements global DS)
const localStyles = `
.dem-section {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 18px 20px; margin-bottom: 14px;
}
.dem-section-hdr {
    display: flex; align-items: center; gap: 8px;
    font-size: 10.5px; font-weight: 700; color: var(--muted);
    letter-spacing: .09em; text-transform: uppercase; margin-bottom: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
}
.dem-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dem-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.dem-field label { font-size: 11px; color: var(--muted); font-weight: 500; display: block; margin-bottom: 3px; }
.dem-field span  { font-size: 13.5px; color: var(--text); word-break: break-all; }
.dem-full { grid-column: 1 / -1; }
.dem-rne-box {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 14px 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    margin-bottom: 14px;
}
.dem-rne-label { font-size: 13px; font-weight: 600; margin-bottom: 3px; color: var(--text); }
.dem-rne-status { font-size: 12px; color: var(--muted); }
.dem-rne-status.ok  { color: var(--teal); font-weight: 600; }
.dem-rne-status.err { color: var(--rose); font-weight: 600; }
.dem-score-row { display: flex; align-items: center; gap: 14px; }
.dem-score-row input[type=range] { flex: 1; accent-color: var(--blue); }
.dem-score-val { min-width: 44px; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 20px; }
`;

const fmt     = (v) => v || '—';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '—';

const StatutBadge = ({ statut }) => {
    const map = {
        EN_ATTENTE: { cls: 'erp-badge-amber', label: 'En attente' },
        VALIDEE:    { cls: 'erp-badge-teal',  label: 'Validée' },
        REJETEE:    { cls: 'erp-badge-rose',  label: 'Rejetée' },
    };
    const { cls, label } = map[statut] || map.EN_ATTENTE;
    return (
        <span className={`erp-badge ${cls}`}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
            {label}
        </span>
    );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ demande: d, commerciaux, onClose, onValidated, toast }) => {
    const [rneStatus,    setRneStatus]    = useState('idle');
    const [rneData,      setRneData]      = useState(null);
    const [idCommercial, setIdCommercial] = useState('');
    const [score,        setScore]        = useState(50);
    const [submitting,   setSubmitting]   = useState(false);

    const scoreColor = score >= 70 ? 'var(--teal)' : score >= 40 ? 'var(--amber)' : 'var(--rose)';
    const isEditable = !d.statut || d.statut === 'EN_ATTENTE';

    // ✅ Filtrer les commerciaux par région du client
    const commerciauxFiltres = commerciaux.filter(c => c.region === d.region);

    const consulterRNE = async () => {
        setRneStatus('loading');
        try {
            const res = await API.get(`/demandes/rne/${d.identifiant}`);
            setRneData(res.data.data); setRneStatus('ok');
        } catch { setRneStatus('error'); }
    };

    const handleValider = async () => {
        if (!idCommercial) { toast('Veuillez assigner un commercial.', 'error'); return; }
        setSubmitting(true);
        try {
            await API.post(`/demandes/valider/${d.id}`, { id_commercial: idCommercial, score_solvabilite_ia: score });
            toast('Client créé avec succès !', 'success');
            onValidated(); onClose();
        } catch (err) { toast(err.response?.data?.message || 'Erreur lors de la validation.', 'error'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="erp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="erp-modal erp-modal-wide">
                <div className="erp-modal-header">
                    <div>
                        <div className="erp-modal-title">Dossier #{d.id}</div>
                        <div className="erp-modal-sub" style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                            <StatutBadge statut={d.statut} />
                        </div>
                    </div>
                    <button className="erp-modal-close" onClick={onClose}><Icon d={Icons.close} size={14}/></button>
                </div>

                <div className="dem-section">
                    <div className="dem-section-hdr"><Icon d={Icons.user} size={13}/> Identité du demandeur</div>
                    <div className="dem-grid2">
                        <div className="dem-field"><label>Nom</label><span>{fmt(d.nom)}</span></div>
                        <div className="dem-field"><label>Prénom</label><span>{fmt(d.prenom)}</span></div>
                        <div className="dem-field"><label>Email</label><span>{fmt(d.email)}</span></div>
                        <div className="dem-field"><label>Téléphone</label><span>{fmt(d.num_tlp)}</span></div>
                        <div className="dem-field"><label>Date de demande</label><span>{fmtDate(d.date_demande)}</span></div>
                    </div>
                </div>

                <div className="dem-section">
                    <div className="dem-section-hdr"><Icon d={Icons.building} size={13}/> Informations entreprise</div>
                    <div className="dem-grid2">
                        <div className="dem-field"><label>Type identifiant</label><span>{fmt(d.type_identifiant)}</span></div>
                        <div className="dem-field"><label>Identifiant</label><span style={{fontFamily:'monospace',letterSpacing:1}}>{fmt(d.identifiant)}</span></div>
                        {/* ✅ Région affichée ici */}
                        <div className="dem-field"><label>Région</label><span>{fmt(d.region)}</span></div>
                        <div className="dem-field dem-full"><label>Activité</label><span>{fmt(d.activite)}</span></div>
                        <div className="dem-field"><label>Adresse</label><span>{fmt(d.adresse)}</span></div>
                        <div className="dem-field"><label>Rue</label><span>{fmt(d.rue)}</span></div>
                        <div className="dem-field"><label>Ville</label><span>{fmt(d.ville)}</span></div>
                    </div>
                </div>

                <div className="dem-section">
                    <div className="dem-section-hdr"><Icon d={Icons.file} size={13}/> Autorisation & Établissement</div>
                    <div className="dem-grid3">
                        <div className="dem-field"><label>N° autorisation</label><span style={{fontFamily:'monospace'}}>{fmt(d.num_autorisation)}</span></div>
                        <div className="dem-field"><label>Date autorisation</label><span>{fmtDate(d.date_autorisation)}</span></div>
                        <div className="dem-field"><label>N° établissement</label><span style={{fontFamily:'monospace'}}>{fmt(d.num_etablissement)}</span></div>
                    </div>
                </div>

                <div className="dem-rne-box">
                    <div>
                        <div className="dem-rne-label">Vérification RNE officielle</div>
                        {rneStatus === 'idle'    && <div className="dem-rne-status">Non consulté — cliquez pour vérifier le matricule</div>}
                        {rneStatus === 'loading' && <div className="dem-rne-status">Consultation en cours...</div>}
                        {rneStatus === 'ok'      && <div className="dem-rne-status ok">✓ Matricule vérifié — {rneData?.activite || 'Activité confirmée'}</div>}
                        {rneStatus === 'error'   && <div className="dem-rne-status err">✗ Matricule introuvable sur le RNE officiel</div>}
                    </div>
                    <button className="erp-btn erp-btn-ghost erp-btn-sm" onClick={consulterRNE} disabled={rneStatus==='loading'} style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                        {rneStatus === 'loading' ? <span className="erp-spin" style={{width:14,height:14}}/> : <Icon d={Icons.rne} size={14}/>}
                        {rneStatus === 'loading' ? 'Vérification...' : 'Consulter RNE'}
                    </button>
                </div>

                {isEditable && (
                    <div className="dem-section">
                        <div className="dem-section-hdr"><Icon d={Icons.score} size={13}/> Paramètres de validation</div>
                        <div className="erp-form-group" style={{marginBottom:14}}>
                            <label className="erp-form-label">
                                Assigner un commercial <span style={{color:'var(--rose)'}}>*</span>
                                {/* ✅ Badge région pour contexte */}
                                {d.region && (
                                    <span style={{
                                        marginLeft:8, fontSize:11, fontWeight:600,
                                        background:'var(--blue-dim)', color:'var(--blue)',
                                        padding:'2px 8px', borderRadius:99
                                    }}>
                                        Région : {d.region}
                                    </span>
                                )}
                            </label>

                            {/* ✅ Message si aucun commercial disponible dans cette région */}
                            {commerciauxFiltres.length === 0 ? (
                                <div style={{
                                    fontSize:12, color:'var(--rose)', padding:'8px 12px',
                                    background:'var(--rose-dim)', borderRadius:6, marginTop:4
                                }}>
                                    Aucun commercial disponible dans la région « {d.region} ».
                                </div>
                            ) : (
                                <select
                                    className="erp-input erp-form-select"
                                    value={idCommercial}
                                    onChange={e => setIdCommercial(e.target.value)}
                                >
                                    <option value="">— Sélectionner un commercial —</option>
                                    {commerciauxFiltres.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.prenom} {c.nom}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="erp-form-group">
                            <label className="erp-form-label">Score de solvabilité IA (0 → 100)</label>
                            <div className="dem-score-row">
                                <input type="range" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} />
                                <div className="dem-score-val" style={{color:scoreColor}}>{score}</div>
                            </div>
                            <div style={{fontSize:11,color:scoreColor,marginTop:4}}>
                                {score >= 70 ? '✓ Solvabilité élevée' : score >= 40 ? '⚠ Solvabilité moyenne' : '✗ Risque élevé'}
                            </div>
                        </div>
                        <div className="erp-modal-footer">
                            <button className="erp-btn erp-btn-ghost" onClick={onClose}>Annuler</button>
                            <button
                                className="erp-btn erp-btn-primary"
                                onClick={handleValider}
                                disabled={submitting || commerciauxFiltres.length === 0}
                            >
                                {submitting ? <span className="erp-spin"/> : <Icon d={Icons.check} size={14}/>}
                                {submitting ? 'Validation...' : 'Valider et créer le client'}
                            </button>
                        </div>
                    </div>
                )}
                {!isEditable && (
                    <div className="erp-modal-footer">
                        <button className="erp-btn erp-btn-ghost" onClick={onClose}>Fermer</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ demande, onClose, onConfirm, loading }) => (
    <div className="erp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="erp-modal erp-confirm">
            <div className="erp-confirm-icon danger"><Icon d={Icons.trash} size={22}/></div>
            <h3>Rejeter la demande ?</h3>
            <p>La demande de <strong>{demande.prenom} {demande.nom}</strong> sera définitivement supprimée.</p>
            <div className="erp-confirm-btns">
                <button className="erp-btn erp-btn-ghost" onClick={onClose}>Annuler</button>
                <button className="erp-btn erp-btn-danger" onClick={onConfirm} disabled={loading}>
                    {loading ? <span className="erp-spin"/> : <Icon d={Icons.trash} size={14}/>}
                    Rejeter la demande
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DemandesAdhesion = ({ showToast }) => {
    const [demandes,      setDemandes]      = useState([]);
    const [commerciaux,   setCommerciaux]   = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [search,        setSearch]        = useState('');
    const [selected,      setSelected]      = useState(null);
    const [toReject,      setToReject]      = useState(null);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [toast,         setToast]         = useState(null);

    const toast_ = useCallback((msg, type='success') => setToast({ msg, type }), []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, cRes] = await Promise.all([
                API.get('/demandes'),
                API.get('/users?roleFilter=COMMERCIAL'),
            ]);
            setDemandes(dRes.data);
            setCommerciaux(cRes.data);
        } catch { showToast('Erreur lors du chargement des demandes.', 'error'); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleReject = async () => {
        setRejectLoading(true);
        try {
            await API.delete(`/demandes/${toReject.id}`);
            toast_('Demande rejetée et supprimée.', 'success');
            setToReject(null); fetchAll();
        } catch { toast_('Erreur lors du rejet.', 'error'); }
        finally { setRejectLoading(false); }
    };

    const filtered = demandes.filter(d => {
        const q = search.toLowerCase();
        return !q || `${d.nom} ${d.prenom} ${d.email} ${d.identifiant} ${d.ville}`.toLowerCase().includes(q);
    });

    const enAttente = demandes.filter(d => !d.statut || d.statut === 'EN_ATTENTE').length;
    const validees  = demandes.filter(d => d.statut === 'VALIDEE').length;
    const rejetees  = demandes.filter(d => d.statut === 'REJETEE').length;

    const stats = [
        { label:'Total demandes', value:demandes.length, color:'var(--blue)',  dim:'var(--blue-dim)' },
        { label:'En attente',     value:enAttente,        color:'var(--amber)', dim:'var(--amber-dim)' },
        { label:'Validées',       value:validees,         color:'var(--teal)',  dim:'var(--teal-dim)' },
        { label:'Rejetées',       value:rejetees,         color:'var(--rose)',  dim:'var(--rose-dim)' },
    ];

    return (
        <>
            <style>{localStyles}</style>

            <div className="erp-stats-grid">
                {stats.map(s => (
                    <div key={s.label} className="erp-stat-card">
                        <div className="erp-stat-label">{s.label}</div>
                        <div className="erp-stat-value" style={{color:s.color}}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="erp-toolbar">
                <div className="erp-toolbar-left">
                    <span className="erp-section-title">
                        Demandes d'adhésion <span className="erp-section-count">({filtered.length})</span>
                    </span>
                </div>
                <div className="erp-toolbar-right">
                    <div className="erp-search">
                        <Icon d={Icons.search} size={14}/>
                        <input placeholder="Nom, email, identifiant, ville..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="erp-btn erp-btn-ghost" onClick={fetchAll} title="Rafraîchir">
                        <Icon d={Icons.refresh} size={15}/>
                    </button>
                </div>
            </div>

            <div className="erp-table-container">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Demandeur</th><th>Identifiant</th><th>Activité</th>
                            <th>Ville</th><th>N° Autorisation</th><th>Date</th>
                            <th>Statut</th><th style={{width:90}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8}><div className="erp-empty"><span className="erp-spin" style={{width:24,height:24}}/></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8}><div className="erp-empty"><div className="erp-empty-icon"><Icon d={Icons.eye} size={22}/></div><p>Aucune demande trouvée</p></div></td></tr>
                        ) : filtered.map(d => (
                            <tr key={d.id}>
                                <td>
                                    <div className="erp-user-cell">
                                        <div className="erp-avatar md">{d.prenom?.[0]}{d.nom?.[0]}</div>
                                        <div>
                                            <div className="erp-user-name">{d.prenom} {d.nom}</div>
                                            <div className="erp-user-id">{d.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{fontFamily:'monospace',fontSize:12,color:'var(--text-2)',letterSpacing:0.5}}>{fmt(d.identifiant)}</td>
                                <td style={{color:'var(--text-2)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fmt(d.activite)}</td>
                                <td style={{color:'var(--text-2)'}}>{fmt(d.ville)}</td>
                                <td style={{fontFamily:'monospace',fontSize:12,color:'var(--muted)'}}>{fmt(d.num_autorisation)}</td>
                                <td style={{color:'var(--muted)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(d.date_demande)}</td>
                                <td><StatutBadge statut={d.statut}/></td>
                                <td>
                                    <div className="erp-actions">
                                        <button className="erp-act-btn erp-act-view" title="Voir le dossier" onClick={() => setSelected(d)}><Icon d={Icons.eye} size={13}/></button>
                                        {(!d.statut || d.statut === 'EN_ATTENTE') && (
                                            <button className="erp-act-btn erp-act-del" title="Rejeter" onClick={() => setToReject(d)}><Icon d={Icons.close} size={13}/></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && <DetailModal demande={selected} commerciaux={commerciaux} onClose={() => setSelected(null)} onValidated={fetchAll} toast={toast_}/>}
            {toReject  && <RejectModal demande={toReject} onClose={() => setToReject(null)} onConfirm={handleReject} loading={rejectLoading}/>}
            {toast     && <div className={`erp-toast ${toast.type}`}><div className="erp-toast-icon"><Icon d={toast.type==='success'?Icons.check:Icons.close} size={13}/></div>{toast.msg}</div>}
        </>
    );
};

export default DemandesAdhesion;