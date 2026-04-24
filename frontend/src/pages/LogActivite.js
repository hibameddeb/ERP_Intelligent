import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const Icons = {
    search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
    refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2",
    close:    "M18 6L6 18M6 6l12 12",
    clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    back:     "M19 12H5M12 19l-7-7 7-7",
    users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    chevron:  "M9 18l6-6-6-6",
    log:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
};

const ACTION_STYLES = {
    CONNEXION:           { color: 'var(--blue)',   bg: 'var(--blue-dim)',   label: 'Connexion' },
    RESET_PASSWORD:      { color: 'var(--violet)', bg: 'var(--violet-dim)', label: 'Réinitialisation MDP' },
    ADMIN_CREATE_STAFF:  { color: 'var(--teal)',   bg: 'var(--teal-dim)',   label: 'Création staff' },
    ADMIN_DELETE_USER:   { color: 'var(--rose)',   bg: 'var(--rose-dim)',   label: 'Suppression utilisateur' },
    ADMIN_UPDATE:        { color: 'var(--amber)',  bg: 'var(--amber-dim)',  label: 'Modification utilisateur' },
    ADMIN_ACTIVATION:    { color: 'var(--teal)',   bg: 'var(--teal-dim)',   label: 'Activation compte' },
    ADMIN_DESACTIVATION: { color: 'var(--rose)',   bg: 'var(--rose-dim)',   label: 'Désactivation compte' },
    UPDATE_PRODUCT:      { color: 'var(--amber)',  bg: 'var(--amber-dim)',  label: 'Modification produit' },
    VIEW_USERS:          { color: 'var(--muted)',  bg: 'rgba(77,90,122,0.10)', label: 'Consultation utilisateurs' },
    DEFAULT:             { color: 'var(--text-2)', bg: 'rgba(77,90,122,0.10)', label: 'Action' },
};

const ROLE_BADGE = {
    ADMIN:      'erp-badge-blue',
    COMMERCIAL: 'erp-badge-amber',
    COMPTABLE:  'erp-badge-violet',
    CLIENT:     'erp-badge-teal',
};

const ROLE_COLOR = {
    ADMIN:      'var(--blue)',
    COMMERCIAL: 'var(--amber)',
    COMPTABLE:  'var(--violet)',
    CLIENT:     'var(--teal)',
};

const getActionStyle = (action) => ACTION_STYLES[action] || ACTION_STYLES.DEFAULT;
const formatDate     = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const formatTime     = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
const formatRelative = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Il y a ${hrs}h`;
    return `Il y a ${Math.floor(hrs / 24)}j`;
};

// ─── User History View ────────────────────────────────────────────────────────
const UserHistoryView = ({ user, logs, onBack }) => {
    const [search, setSearch]             = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const userLogs   = logs.filter(l => l.nom === user.nom && l.prenom === user.prenom);
    const filtered   = userLogs.filter(log => {
        const q = search.toLowerCase();
        return (
            (!q || `${log.action} ${log.description}`.toLowerCase().includes(q)) &&
            (!actionFilter || log.action === actionFilter)
        );
    });

    const allActions = [...new Set(userLogs.map(l => l.action))].sort();
    const roleColor  = ROLE_COLOR[user.role] || 'var(--text-2)';
    const roleCls    = ROLE_BADGE[user.role]  || 'erp-badge-muted';
    const today      = new Date().toDateString();
    const todayCount = userLogs.filter(l => new Date(l.date_heure).toDateString() === today).length;
    const lastLog    = userLogs[0];

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(12px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .history-view { animation: fadeUp .22s ease; }
                .history-timeline { position:relative; padding-left:24px; }
                .history-timeline::before {
                    content:''; position:absolute;
                    left:8px; top:0; bottom:0;
                    width:2px; background:var(--border);
                }
                .h-item {
                    position:relative; margin-bottom:12px;
                    animation: fadeUp .25s ease both;
                }
                .h-item::before {
                    content:''; position:absolute;
                    left:-18px; top:16px;
                    width:9px; height:9px; border-radius:50%;
                    background:var(--dot-color, var(--muted));
                    box-shadow:0 0 0 2px var(--surface);
                    z-index:1;
                }
                .h-card {
                    background:var(--surface-2);
                    border:1px solid var(--border);
                    border-radius:var(--r);
                    padding:12px 14px;
                    transition:border-color .15s, box-shadow .15s;
                }
                .h-card:hover {
                    border-color:var(--dot-color, var(--border));
                    box-shadow:0 2px 8px rgba(0,0,0,.07);
                }
                .date-sep {
                    display:flex; align-items:center; gap:10px;
                    margin:20px 0 10px;
                }
            `}</style>

            <div className="history-view">
                {/* Back + user identity */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, flexWrap:'wrap' }}>
                    <button
                        onClick={onBack}
                        className="erp-btn erp-btn-ghost"
                        style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}
                    >
                        <Icon d={Icons.back} size={14}/> Retour
                    </button>

                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                            width:46, height:46, borderRadius:'50%',
                            background:`${roleColor}20`, border:`2px solid ${roleColor}`,
                            display:'grid', placeItems:'center',
                            color:roleColor, fontSize:15, fontWeight:700,
                            fontFamily:"'Plus Jakarta Sans', sans-serif", flexShrink:0,
                        }}>
                            {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>
                                {user.prenom} {user.nom}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                                <span className={`erp-badge ${roleCls}`}>{user.role}</span>
                                {lastLog && (
                                    <span style={{ fontSize:11, color:'var(--muted)' }}>
                                        Dernière activité {formatRelative(lastLog.date_heure)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap' }}>
                        {[
                            { label:'Total',          value: userLogs.length,                             color:'var(--blue)'   },
                            { label:"Aujourd'hui",     value: todayCount,                                  color:'var(--teal)'   },
                            { label:'Types actions',  value: new Set(userLogs.map(l => l.action)).size,   color:'var(--violet)' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background:'var(--surface-2)', border:'1px solid var(--border)',
                                borderRadius:'var(--r)', padding:'8px 14px', textAlign:'center', minWidth:64,
                            }}>
                                <div style={{ fontSize:18, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                    <div className="erp-search" style={{ flex:1, minWidth:200 }}>
                        <Icon d={Icons.search} size={14}/>
                        <input
                            placeholder="Rechercher dans l'historique..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="erp-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="">Toutes les actions</option>
                        {allActions.map(a => (
                            <option key={a} value={a}>{getActionStyle(a).label || a}</option>
                        ))}
                    </select>
                    {(search || actionFilter) && (
                        <button className="erp-btn erp-btn-ghost" onClick={() => { setSearch(''); setActionFilter(''); }}>
                            <Icon d={Icons.close} size={13}/> Réinitialiser
                        </button>
                    )}
                </div>

                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
                    {filtered.length} activité{filtered.length !== 1 ? 's' : ''}
                    {(search || actionFilter) ? ` filtrée${filtered.length !== 1 ? 's' : ''} sur ${userLogs.length}` : ''}
                </div>

                {/* Timeline */}
                {filtered.length === 0 ? (
                    <div className="erp-empty">
                        <div className="erp-empty-icon"><Icon d={Icons.activity} size={22}/></div>
                        <p>Aucune activité trouvée</p>
                    </div>
                ) : (
                    <div className="history-timeline">
                        {(() => {
                            let lastDate = null;
                            return filtered.map((log, i) => {
                                const date    = formatDate(log.date_heure);
                                const style   = getActionStyle(log.action);
                                const showSep = date !== lastDate;
                                lastDate = date;
                                return (
                                    <React.Fragment key={log.id}>
                                        {showSep && (
                                            <div className="date-sep">
                                                <div style={{
                                                    fontSize:11, fontWeight:700, color:'var(--muted)',
                                                    letterSpacing:'.07em', textTransform:'uppercase',
                                                    background:'var(--surface-2)', border:'1px solid var(--border)',
                                                    padding:'3px 10px', borderRadius:99, whiteSpace:'nowrap',
                                                    fontFamily:"'Plus Jakarta Sans', sans-serif",
                                                }}>{date}</div>
                                                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                                            </div>
                                        )}
                                        <div
                                            className="h-item"
                                            style={{ '--dot-color': style.color, animationDelay:`${i * 0.03}s` }}
                                        >
                                            <div className="h-card">
                                                <div style={{
                                                    display:'flex', alignItems:'center',
                                                    justifyContent:'space-between',
                                                    marginBottom: log.description ? 8 : 0,
                                                }}>
                                                    <span style={{
                                                        display:'inline-flex', alignItems:'center', gap:5,
                                                        padding:'3px 9px', borderRadius:6,
                                                        background:style.bg, color:style.color,
                                                        fontSize:11, fontWeight:600, letterSpacing:'.03em',
                                                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                                                    }}>
                                                        {style.label || log.action}
                                                    </span>
                                                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', fontSize:11 }}>
                                                        <Icon d={Icons.clock} size={11}/>
                                                        {formatTime(log.date_heure)}
                                                        <span style={{ fontFamily:'monospace', opacity:.6 }}>#{log.id}</span>
                                                    </div>
                                                </div>
                                                {log.description && (
                                                    <div style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.55 }}>
                                                        {log.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        </>
    );
};

// ─── Users List View ──────────────────────────────────────────────────────────
const UsersListView = ({ logs, onSelectUser }) => {
    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const usersMap = {};
    logs.forEach(log => {
        const key = `${log.nom}__${log.prenom}`;
        if (!usersMap[key]) {
            usersMap[key] = { nom:log.nom, prenom:log.prenom, role:log.role, logs:[] };
        }
        usersMap[key].logs.push(log);
    });
    const users = Object.values(usersMap);

    const today    = new Date().toDateString();
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (
            (!q || `${u.nom} ${u.prenom}`.toLowerCase().includes(q)) &&
            (!roleFilter || u.role === roleFilter)
        );
    });

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(10px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .user-card {
                    background: var(--surface-2);
                    border: 1px solid var(--border);
                    border-radius: var(--r-lg);
                    padding: 16px 18px;
                    cursor: pointer;
                    transition: border-color .15s, box-shadow .15s, transform .15s;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    animation: fadeUp .2s ease both;
                }
                .user-card:hover {
                    border-color: var(--role-color, var(--blue));
                    box-shadow: 0 4px 16px rgba(0,0,0,.08);
                    transform: translateY(-1px);
                }
                .users-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 12px;
                }
            `}</style>

            <div className="erp-toolbar" style={{ marginBottom:16 }}>
                <div className="erp-toolbar-left">
                    <span className="erp-section-title">
                        Utilisateurs <span className="erp-section-count">({filtered.length})</span>
                    </span>
                </div>
                <div className="erp-toolbar-right">
                    <div className="erp-search">
                        <Icon d={Icons.search} size={14}/>
                        <input
                            placeholder="Rechercher un utilisateur..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="erp-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">Tous les rôles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="COMPTABLE">Comptable</option>
                        <option value="CLIENT">Client</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="erp-empty">
                    <div className="erp-empty-icon"><Icon d={Icons.users} size={22}/></div>
                    <p>Aucun utilisateur trouvé</p>
                </div>
            ) : (
                <div className="users-grid">
                    {filtered.map((u, i) => {
                        const roleColor  = ROLE_COLOR[u.role] || 'var(--text-2)';
                        const roleCls    = ROLE_BADGE[u.role]  || 'erp-badge-muted';
                        const lastLog    = u.logs[0];
                        const todayCount = u.logs.filter(l => new Date(l.date_heure).toDateString() === today).length;

                        return (
                            <div
                                key={`${u.nom}__${u.prenom}`}
                                className="user-card"
                                style={{ '--role-color': roleColor, animationDelay:`${i * 0.04}s` }}
                                onClick={() => onSelectUser(u)}
                            >
                                <div style={{
                                    width:46, height:46, borderRadius:'50%',
                                    background:`${roleColor}18`, border:`2px solid ${roleColor}`,
                                    display:'grid', placeItems:'center',
                                    color:roleColor, fontSize:15, fontWeight:700,
                                    fontFamily:"'Plus Jakarta Sans', sans-serif", flexShrink:0,
                                }}>
                                    {u.prenom?.[0]}{u.nom?.[0]}
                                </div>

                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4 }}>
                                        {u.prenom} {u.nom}
                                    </div>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                        <span className={`erp-badge ${roleCls}`}>{u.role}</span>
                                        {lastLog && (
                                            <span style={{ fontSize:11, color:'var(--muted)' }}>
                                                {formatRelative(lastLog.date_heure)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ textAlign:'right', flexShrink:0 }}>
                                    <div style={{ fontSize:20, fontWeight:700, color:roleColor, lineHeight:1 }}>
                                        {u.logs.length}
                                    </div>
                                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>
                                        activité{u.logs.length !== 1 ? 's' : ''}
                                    </div>
                                    {todayCount > 0 && (
                                        <div style={{ fontSize:10, color:'var(--teal)', marginTop:2, fontWeight:600 }}>
                                            +{todayCount} auj.
                                        </div>
                                    )}
                                </div>

                                <Icon d={Icons.chevron} size={14}/>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

// ─── Log Row ──────────────────────────────────────────────────────────────────
const LogRow = ({ log, prev, onClick }) => {
    const style   = getActionStyle(log.action);
    const roleCls = ROLE_BADGE[log.role] || 'erp-badge-muted';
    const date    = formatDate(log.date_heure);
    const showDateSep = !prev || formatDate(prev.date_heure) !== date;

    return (
        <>
            {showDateSep && (
                <tr>
                    <td colSpan={6} style={{ padding:'16px 16px 6px', background:'transparent' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{
                                fontSize:11, fontWeight:700, color:'var(--muted)',
                                letterSpacing:'.07em', textTransform:'uppercase',
                                background:'var(--surface-2)', border:'1px solid var(--border)',
                                padding:'3px 10px', borderRadius:99,
                                fontFamily:"'Plus Jakarta Sans', sans-serif",
                            }}>{date}</div>
                            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                        </div>
                    </td>
                </tr>
            )}
            <tr onClick={() => onClick(log)} style={{ cursor:'pointer' }}>
                <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:style.color, flexShrink:0 }}/>
                        <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--muted)' }}>
                            {formatTime(log.date_heure)}
                        </div>
                    </div>
                </td>
                <td>
                    <span style={{
                        display:'inline-flex', alignItems:'center', gap:5,
                        padding:'3px 9px', borderRadius:6,
                        background:style.bg, color:style.color,
                        fontSize:11, fontWeight:600, letterSpacing:'.03em',
                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                    }}>
                        {style.label || log.action}
                    </span>
                </td>
                <td>
                    <div className="erp-user-cell">
                        <div className="erp-avatar sm circle">{log.prenom?.[0]}{log.nom?.[0]}</div>
                        <div>
                            <div style={{ fontWeight:500, fontSize:13 }}>{log.prenom} {log.nom}</div>
                            <span className={`erp-badge ${roleCls}`} style={{ fontSize:10, padding:'1px 6px' }}>{log.role}</span>
                        </div>
                    </div>
                </td>
                <td style={{ color:'var(--text-2)', fontSize:13, maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {log.description || '—'}
                </td>
                <td style={{ color:'var(--muted)', fontSize:12, whiteSpace:'nowrap' }}>{formatRelative(log.date_heure)}</td>
                <td style={{ color:'var(--muted)', fontSize:12, fontFamily:'monospace' }}>#{log.id}</td>
            </tr>
        </>
    );
};

// ─── Log Detail Modal ─────────────────────────────────────────────────────────
const LogDetailModal = ({ log, onClose }) => {
    if (!log) return null;
    const style   = getActionStyle(log.action);
    const roleCls = ROLE_BADGE[log.role] || 'erp-badge-muted';

    return (
        <div className="erp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="erp-modal" style={{ width:480 }}>
                <div className="erp-modal-header">
                    <div className="erp-modal-title">Détail de l'activité</div>
                    <button className="erp-modal-close" onClick={onClose}><Icon d={Icons.close} size={14}/></button>
                </div>

                <div style={{
                    display:'flex', alignItems:'center', gap:12,
                    background:style.bg, border:`1px solid ${style.color}33`,
                    borderRadius:'var(--r-lg)', padding:'12px 16px', marginBottom:18,
                }}>
                    <div style={{
                        width:36, height:36, borderRadius:'var(--r)',
                        background:`${style.color}22`, display:'grid', placeItems:'center',
                        color:style.color, flexShrink:0,
                    }}>
                        <Icon d={Icons.activity} size={16}/>
                    </div>
                    <div>
                        <div style={{ fontWeight:600, color:style.color, fontSize:14 }}>{style.label || log.action}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, fontFamily:'monospace' }}>{log.action}</div>
                    </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    {[
                        { label:'Utilisateur', value:`${log.prenom} ${log.nom}` },
                        { label:'Rôle',        value:log.role, isRole:true },
                        { label:'Date',        value:formatDate(log.date_heure) },
                        { label:'Heure',       value:formatTime(log.date_heure) },
                        { label:'ID Log',      value:`#${log.id}`, mono:true },
                        { label:'Il y a',      value:formatRelative(log.date_heure) },
                    ].map(item => (
                        <div key={item.label} style={{
                            background:'var(--surface-2)', border:'1px solid var(--border)',
                            borderRadius:'var(--r)', padding:'10px 14px',
                        }}>
                            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{item.label}</div>
                            {item.isRole ? (
                                <span className={`erp-badge ${roleCls}`}>{item.value}</span>
                            ) : (
                                <div style={{ fontSize:13, fontWeight:500, fontFamily:item.mono?'monospace':'inherit' }}>{item.value}</div>
                            )}
                        </div>
                    ))}
                </div>

                {log.description && (
                    <div style={{
                        background:'var(--surface-2)', border:'1px solid var(--border)',
                        borderRadius:'var(--r)', padding:'12px 14px',
                    }}>
                        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Description</div>
                        <div style={{ fontSize:13, lineHeight:1.6, color:'var(--text)' }}>{log.description}</div>
                    </div>
                )}

                <div className="erp-modal-footer">
                    <button className="erp-btn erp-btn-ghost" onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LogActivite = ({ showToast }) => {
    const [logs, setLogs]                 = useState([]);
    const [loading, setLoading]           = useState(true);
    const [tab, setTab]                   = useState('logs');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLog, setSelectedLog]   = useState(null);
    const [search, setSearch]             = useState('');
    const [roleFilter, setRoleFilter]     = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [autoRefresh, setAutoRefresh]   = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/auth/admin/activity-logs');
            setLogs(res.data);
        } catch { showToast('Erreur lors du chargement des logs.', 'error'); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const filtered = logs.filter(log => {
        const q = search.toLowerCase();
        return (
            (!q || `${log.nom} ${log.prenom} ${log.action} ${log.description}`.toLowerCase().includes(q)) &&
            (!roleFilter   || log.role === roleFilter) &&
            (!actionFilter || log.action === actionFilter)
        );
    });

    const today         = new Date().toDateString();
    const todayLogs     = logs.filter(l => new Date(l.date_heure).toDateString() === today);
    const uniqueUsers   = new Set(logs.map(l => l.nom + l.prenom)).size;
    const uniqueActions = new Set(logs.map(l => l.action)).size;
    const allActions    = [...new Set(logs.map(l => l.action))].sort();

    const stats = [
        { label:"Total événements",   value:logs.length,      color:'var(--blue)',   dim:'var(--blue-dim)',   sub:'toutes actions' },
        { label:"Aujourd'hui",         value:todayLogs.length, color:'var(--teal)',   dim:'var(--teal-dim)',   sub:'activités du jour' },
        { label:"Utilisateurs actifs", value:uniqueUsers,      color:'var(--amber)',  dim:'var(--amber-dim)',  sub:'ont généré des logs' },
        { label:"Types d'actions",     value:uniqueActions,    color:'var(--violet)', dim:'var(--violet-dim)', sub:'actions distinctes' },
    ];

    // Full-page user history
    if (selectedUser) {
        return (
            <UserHistoryView
                user={selectedUser}
                logs={logs}
                onBack={() => setSelectedUser(null)}
            />
        );
    }

    return (
        <>
            <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

            <div className="erp-stats-grid">
                {stats.map(s => (
                    <div key={s.label} className="erp-stat-card">
                        <div className="erp-stat-icon" style={{ background:s.dim, color:s.color }}>
                            <Icon d={Icons.activity} size={16}/>
                        </div>
                        <div className="erp-stat-label">{s.label}</div>
                        <div className="erp-stat-value" style={{ color:s.color }}>{s.value}</div>
                        <div className="erp-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
                {[
                    { key:'logs',  label:"Journal d'activité", icon:Icons.log   },
                    { key:'users', label:'Par utilisateur',    icon:Icons.users },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        display:'flex', alignItems:'center', gap:7,
                        padding:'9px 16px', background:'none', border:'none',
                        borderBottom: tab === t.key ? '2px solid var(--blue)' : '2px solid transparent',
                        color: tab === t.key ? 'var(--blue)' : 'var(--muted)',
                        fontWeight: tab === t.key ? 600 : 400,
                        fontSize:13, cursor:'pointer',
                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                        transition:'color .15s', marginBottom:'-1px',
                    }}>
                        <Icon d={t.icon} size={14}/> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab: Users grid */}
            {tab === 'users' && (
                <UsersListView logs={logs} onSelectUser={setSelectedUser}/>
            )}

            {/* Tab: Logs table */}
            {tab === 'logs' && (
                <>
                    <div className="erp-toolbar">
                        <div className="erp-toolbar-left">
                            <span className="erp-section-title">
                                Journal <span className="erp-section-count">({filtered.length})</span>
                            </span>
                            <button onClick={() => setAutoRefresh(r => !r)} style={{
                                display:'flex', alignItems:'center', gap:6,
                                padding:'4px 10px', borderRadius:99, border:'none', cursor:'pointer',
                                background: autoRefresh ? 'var(--teal-dim)' : 'var(--surface-2)',
                                color: autoRefresh ? 'var(--teal)' : 'var(--muted)',
                                fontSize:11, fontWeight:600, transition:'all .15s',
                            }}>
                                <span style={{
                                    width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block',
                                    animation: autoRefresh ? 'livePulse 1.5s infinite' : 'none',
                                }}/>
                                {autoRefresh ? 'Live' : 'Auto-refresh'}
                            </button>
                        </div>
                        <div className="erp-toolbar-right">
                            <div className="erp-search">
                                <Icon d={Icons.search} size={14}/>
                                <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
                            </div>
                            <select className="erp-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                                <option value="">Tous les rôles</option>
                                <option value="ADMIN">Admin</option>
                                <option value="COMMERCIAL">Commercial</option>
                                <option value="COMPTABLE">Comptable</option>
                                <option value="CLIENT">Client</option>
                            </select>
                            <select className="erp-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                                <option value="">Toutes les actions</option>
                                {allActions.map(a => <option key={a} value={a}>{getActionStyle(a).label || a}</option>)}
                            </select>
                            <button className="erp-btn erp-btn-ghost" onClick={fetchLogs}>
                                <Icon d={Icons.refresh} size={14}/> Rafraîchir
                            </button>
                        </div>
                    </div>

                    {(search || roleFilter || actionFilter) && (
                        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                            <Icon d={Icons.filter} size={12}/>
                            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {logs.length}
                            <button onClick={() => { setSearch(''); setRoleFilter(''); setActionFilter(''); }}
                                style={{ background:'none', border:'none', color:'var(--blue)', cursor:'pointer', fontSize:12, padding:0, fontFamily:'inherit' }}>
                                Réinitialiser
                            </button>
                        </div>
                    )}

                    <div className="erp-table-container">
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Heure</th><th>Action</th><th>Utilisateur</th>
                                    <th>Description</th><th>Il y a</th><th>ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6}><div className="erp-empty"><span className="erp-spin" style={{ width:24, height:24 }}/></div></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6}><div className="erp-empty"><div className="erp-empty-icon"><Icon d={Icons.activity} size={22}/></div><p>Aucune activité trouvée</p></div></td></tr>
                                ) : filtered.map((log, i) => (
                                    <LogRow key={log.id} log={log} prev={i > 0 ? filtered[i-1] : null} onClick={setSelectedLog}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)}/>}
        </>
    );
};

export default LogActivite;