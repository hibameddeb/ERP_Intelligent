import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const styles = `
.nb-wrap { position: relative; }
.nb-btn {
    width: 38px; height: 38px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-2, #3d6372); display: grid; place-items: center;
    cursor: pointer; transition: all .15s; position: relative;
}
.nb-btn:hover { border-color: var(--accent); color: var(--accent); }
.nb-badge {
    position: absolute; top: -5px; right: -5px;
    background: #861211; color: #fff; font-size: 10px; font-weight: 700;
    border-radius: 99px; min-width: 18px; height: 18px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; border: 2px solid var(--surface);
    animation: nbPop .2s ease;
}
@keyframes nbPop { from { transform: scale(0) } to { transform: scale(1) } }
.nb-panel {
    position: absolute; top: calc(100% + 10px); right: 0;
    width: 380px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px;
    box-shadow: 0 12px 40px rgba(14,41,49,.15);
    z-index: 999; animation: nbSlide .2s ease; overflow: hidden;
}
@keyframes nbSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
.nb-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.nb-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; }
.nb-header-actions { display: flex; align-items: center; gap: 10px; }
.nb-mark-all {
    font-size: 11px; color: var(--accent); background: none;
    border: none; cursor: pointer; font-weight: 600; padding: 0;
}
.nb-mark-all:hover { text-decoration: underline; }

/* ── Filter tabs ── */
.nb-tabs {
    display: flex; gap: 4px; padding: 10px 14px;
    border-bottom: 1px solid var(--border); background: var(--surface2);
}
.nb-tab {
    padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); cursor: pointer; transition: all .15s;
}
.nb-tab:hover { border-color: var(--accent); color: var(--accent); }
.nb-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.nb-list { max-height: 360px; overflow-y: auto; }
.nb-item {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    transition: background .1s; cursor: default;
}
.nb-item:last-child { border-bottom: none; }
.nb-item.unread { background: rgba(43,117,116,.04); }
.nb-item:hover { background: var(--surface2); }
.nb-dot {
    width: 36px; height: 36px; border-radius: 50%;
    display: grid; place-items: center; flex-shrink: 0; font-size: 17px;
}
.nb-dot.rupture { background: rgba(134,18,17,.12); }
.nb-dot.faible  { background: rgba(160,107,26,.12); }
.nb-dot.demande { background: rgba(43,117,116,.12); }
.nb-dot.info    { background: rgba(14,41,49,.08);   }

/* ── Unread indicator ── */
.nb-item-body { flex: 1; min-width: 0; }
.nb-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.nb-unread-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent); flex-shrink: 0; margin-top: 5px;
}
.nb-item-msg { font-size: 13px; line-height: 1.45; color: var(--text); }
.nb-item-time { font-size: 11px; color: var(--muted); margin-top: 3px; }
.nb-item-actions { display: flex; gap: 6px; margin-top: 7px; }
.nb-action-btn {
    font-size: 11px; padding: 2px 9px; border-radius: 6px;
    border: 1px solid var(--border); background: var(--surface2);
    color: var(--muted); cursor: pointer; transition: all .15s;
}
.nb-action-btn:hover { border-color: var(--accent); color: var(--accent); }
.nb-action-btn.del:hover { border-color: #861211; color: #861211; }

.nb-empty { padding: 44px 20px; text-align: center; color: var(--muted); font-size: 13px; }
.nb-empty-icon { font-size: 32px; margin-bottom: 8px; }
.nb-footer {
    padding: 10px 18px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
}
.nb-footer-count { font-size: 11px; color: var(--muted); }
`;

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
    STOCK_RUPTURE:    { cls: 'rupture', emoji: '🚨', label: 'Rupture' },
    STOCK_FAIBLE:     { cls: 'faible',  emoji: '⚠️', label: 'Stock'   },
    DEMANDE_ADHESION: { cls: 'demande', emoji: '📋', label: 'Demande' },
};

const getConfig = (type) => TYPE_CONFIG[type] || { cls: 'info', emoji: 'ℹ️', label: 'Info' };

// ── Time formatter ────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return "À l'instant";
    if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const NotificationBell = () => {
    const [open,      setOpen]      = useState(false);
    const [notifs,    setNotifs]    = useState([]);
    const [count,     setCount]     = useState(0);
    const [tab,       setTab]       = useState('all'); // 'all' | 'STOCK_RUPTURE' | 'STOCK_FAIBLE' | 'DEMANDE_ADHESION'
    const ref = useRef();

    const fetchCount = useCallback(async () => {
        try {
            const res = await API.get('/notifications/unread');
            setCount(res.data.count);
        } catch {}
    }, []);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await API.get('/notifications');
            setNotifs(res.data);
        } catch {}
    }, []);

    // Poll every 30s
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen(o => !o);
        if (!open) fetchNotifs();
    };

    const markRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
            setCount(c => Math.max(0, c - 1));
        } catch {}
    };

    const markAll = async () => {
        try {
            await API.put('/notifications/read-all');
            setNotifs(n => n.map(x => ({ ...x, is_read: true })));
            setCount(0);
        } catch {}
    };

    const remove = async (id, wasUnread) => {
        try {
            await API.delete(`/notifications/${id}`);
            setNotifs(n => n.filter(x => x.id !== id));
            if (wasUnread) setCount(c => Math.max(0, c - 1));
        } catch {}
    };

    // ── Filter ────────────────────────────────────────────────────────────────
    const filtered = tab === 'all' ? notifs : notifs.filter(n => n.type === tab);

    // Count per type for tab badges
    const countByType = (type) => notifs.filter(n => n.type === type && !n.is_read).length;

    const TABS = [
        { key: 'all',              label: 'Tout'    },
        { key: 'DEMANDE_ADHESION', label: '📋 Demandes' },
        { key: 'STOCK_RUPTURE',    label: '🚨 Rupture'  },
        { key: 'STOCK_FAIBLE',     label: '⚠️ Stock'    },
    ];

    return (
        <>
            <style>{styles}</style>
            <div className="nb-wrap" ref={ref}>

                {/* ── Bell button ── */}
                <button className="nb-btn" onClick={handleOpen} title="Notifications">
                    <BellIcon />
                    {count > 0 && (
                        <span className="nb-badge">{count > 99 ? '99+' : count}</span>
                    )}
                </button>

                {/* ── Panel ── */}
                {open && (
                    <div className="nb-panel">

                        {/* Header */}
                        <div className="nb-header">
                            <span className="nb-title">
                                Notifications {count > 0 && `(${count})`}
                            </span>
                            <div className="nb-header-actions">
                                {count > 0 && (
                                    <button className="nb-mark-all" onClick={markAll}>
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="nb-tabs">
                            {TABS.map(t => {
                                const unread = t.key === 'all' ? count : countByType(t.key);
                                return (
                                    <button
                                        key={t.key}
                                        className={`nb-tab ${tab === t.key ? 'active' : ''}`}
                                        onClick={() => setTab(t.key)}
                                    >
                                        {t.label}
                                        {unread > 0 && ` · ${unread}`}
                                    </button>
                                );
                            })}
                        </div>

                        {/* List */}
                        <div className="nb-list">
                            {filtered.length === 0 ? (
                                <div className="nb-empty">
                                    <div className="nb-empty-icon">🎉</div>
                                    Aucune notification
                                </div>
                            ) : filtered.map(n => {
                                const { cls, emoji } = getConfig(n.type);
                                return (
                                    <div key={n.id} className={`nb-item ${!n.is_read ? 'unread' : ''}`}>
                                        <div className={`nb-dot ${cls}`}>{emoji}</div>
                                        <div className="nb-item-body">
                                            <div className="nb-item-top">
                                                <div className="nb-item-msg">{n.message}</div>
                                                {!n.is_read && <span className="nb-unread-dot" />}
                                            </div>
                                            <div className="nb-item-time">{timeAgo(n.created_at)}</div>
                                            <div className="nb-item-actions">
                                                {!n.is_read && (
                                                    <button className="nb-action-btn" onClick={() => markRead(n.id)}>
                                                        Marquer lu
                                                    </button>
                                                )}
                                                <button
                                                    className="nb-action-btn del"
                                                    onClick={() => remove(n.id, !n.is_read)}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        {notifs.length > 0 && (
                            <div className="nb-footer">
                                <span className="nb-footer-count">
                                    {filtered.length} notification{filtered.length > 1 ? 's' : ''}
                                    {tab !== 'all' && ` · filtre actif`}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationBell;