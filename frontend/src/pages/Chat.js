import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import { connectSocket, getSocket } from '../services/socket';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const I = {
    search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
    send:   "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    check:  "M20 6L9 17l-5-5",
    chat:   "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    user:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
.chat-page { display:flex; height:100%; min-height:520px; background:var(--surface, #fff); overflow:hidden; font-family:'Inter','Outfit',sans-serif; }

/* Sidebar */
.chat-sidebar { width:320px; flex-shrink:0; border-right:1px solid var(--border, #e2e8f0); display:flex; flex-direction:column; background:var(--surface2, #f8fafc); }
.chat-sidebar-hdr { padding:16px 18px; border-bottom:1px solid var(--border, #e2e8f0); }
.chat-sidebar-title { font-weight:700; font-size:16px; margin-bottom:10px; color:var(--text, #1e293b); }
.chat-search { display:flex; align-items:center; gap:8px; background:var(--surface, #fff); border:1px solid var(--border, #e2e8f0); border-radius:10px; padding:8px 12px; }
.chat-search input { background:none; border:none; outline:none; flex:1; font-size:13px; font-family:inherit; color:var(--text, #1e293b); }
.chat-search input::placeholder { color:var(--muted, #94a3b8); }

.chat-contacts { flex:1; overflow-y:auto; }
.chat-contact { display:flex; align-items:center; gap:12px; padding:12px 18px; cursor:pointer; border-bottom:1px solid var(--border, #e2e8f0); transition:background .1s; position:relative; }
.chat-contact:hover  { background:var(--surface, #fff); }
.chat-contact.active { background:rgba(59,130,246,.08); border-left:3px solid var(--accent, #3b82f6); padding-left:15px; }
.chat-contact-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,var(--accent, #3b82f6),#2563eb); color:#fff; display:grid; place-items:center; font-weight:700; font-size:14px; flex-shrink:0; overflow:hidden; }
.chat-contact-avatar img { width:100%; height:100%; object-fit:cover; }
.chat-contact-body { flex:1; min-width:0; }
.chat-contact-top  { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.chat-contact-name { font-weight:600; font-size:13.5px; color:var(--text, #1e293b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.chat-contact-time { font-size:10.5px; color:var(--muted, #94a3b8); flex-shrink:0; }
.chat-contact-bottom { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:3px; }
.chat-contact-msg  { font-size:12px; color:var(--muted, #94a3b8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
.chat-contact-badge { background:#ef4444; color:#fff; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:99px; display:grid; place-items:center; padding:0 5px; flex-shrink:0; }
.chat-presence-dot { position:absolute; bottom:14px; left:46px; width:10px; height:10px; border-radius:50%; background:#888; border:2px solid var(--surface2, #f8fafc); }
.chat-presence-dot.online { background:#22c55e; }

.chat-empty-contacts { padding:40px 20px; text-align:center; color:var(--muted, #94a3b8); font-size:13px; }
.chat-empty-contacts-icon { opacity:.3; margin-bottom:8px; }

/* Main panel */
.chat-main { flex:1; display:flex; flex-direction:column; background:var(--surface, #fff); min-width:0; }
.chat-main-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--muted, #94a3b8); }
.chat-main-empty-icon { opacity:.25; margin-bottom:6px; }

.chat-main-hdr { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid var(--border, #e2e8f0); background:var(--surface2, #f8fafc); }
.chat-main-hdr-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,var(--accent, #3b82f6),#2563eb); color:#fff; display:grid; place-items:center; font-weight:700; font-size:13px; overflow:hidden; }
.chat-main-hdr-avatar img { width:100%; height:100%; object-fit:cover; }
.chat-main-hdr-info { flex:1; min-width:0; }
.chat-main-hdr-name { font-weight:700; font-size:14px; color:var(--text, #1e293b); }
.chat-main-hdr-status { font-size:11px; color:var(--muted, #94a3b8); }
.chat-main-hdr-status.typing { color:var(--accent, #3b82f6); font-style:italic; }
.chat-main-hdr-status.online { color:#22c55e; }

.chat-messages { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:6px; background:var(--surface, #fff); }
.chat-day-sep { text-align:center; font-size:11px; color:var(--muted, #94a3b8); margin:14px 0 8px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }

.chat-msg { max-width:72%; padding:9px 13px; border-radius:14px; font-size:13.5px; line-height:1.4; word-wrap:break-word; position:relative; }
.chat-msg.mine  { align-self:flex-end; background:var(--accent, #3b82f6); color:#fff; border-bottom-right-radius:4px; }
.chat-msg.other { align-self:flex-start; background:var(--surface2, #f1f5f9); border:1px solid var(--border, #e2e8f0); color:var(--text, #1e293b); border-bottom-left-radius:4px; }
.chat-msg-meta  { font-size:10px; margin-top:4px; opacity:.7; display:flex; align-items:center; gap:4px; justify-content:flex-end; }
.chat-msg.other .chat-msg-meta { color:var(--muted, #94a3b8); }
.chat-msg-check { font-size:11px; }
.chat-msg-check.read { color:#a5d8ff; }

.chat-typing { align-self:flex-start; padding:10px 14px; background:var(--surface2, #f1f5f9); border:1px solid var(--border, #e2e8f0); border-radius:14px; border-bottom-left-radius:4px; display:flex; gap:4px; }
.chat-typing span { width:6px; height:6px; border-radius:50%; background:var(--muted, #94a3b8); animation:chatBounce 1.2s infinite; }
.chat-typing span:nth-child(2) { animation-delay:.2s; }
.chat-typing span:nth-child(3) { animation-delay:.4s; }
@keyframes chatBounce { 0%,60%,100% { transform:translateY(0); opacity:.4 } 30% { transform:translateY(-5px); opacity:1 } }

.chat-input-bar { display:flex; align-items:flex-end; gap:8px; padding:14px 18px; border-top:1px solid var(--border, #e2e8f0); background:var(--surface2, #f8fafc); }
.chat-input { flex:1; background:var(--surface, #fff); border:1px solid var(--border, #e2e8f0); border-radius:18px; padding:10px 14px; outline:none; font-size:13px; font-family:inherit; resize:none; max-height:100px; min-height:38px; color:var(--text, #1e293b); transition:border-color .15s; }
.chat-input:focus { border-color:var(--accent, #3b82f6); }
.chat-send { width:38px; height:38px; border-radius:50%; border:none; background:var(--accent, #3b82f6); color:#fff; display:grid; place-items:center; cursor:pointer; transition:all .15s; flex-shrink:0; }
.chat-send:hover:not(:disabled) { background:#2563eb; transform:scale(1.05); }
.chat-send:disabled { opacity:.4; cursor:not-allowed; }

.chat-loading { padding:30px; text-align:center; color:var(--muted, #94a3b8); font-size:12px; }

.chat-page ::-webkit-scrollbar { width:5px; }
.chat-page ::-webkit-scrollbar-thumb { background:var(--border, #e2e8f0); border-radius:3px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (prenom, nom) => `${(prenom||'')[0]||''}${(nom||'')[0]||''}`.toUpperCase() || '?';
const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '';
const fmtDay   = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    const yest  = new Date(); yest.setDate(today.getDate() - 1);
    const isSameDay = (a, b) => a.toDateString() === b.toDateString();
    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, yest))  return 'Hier';
    return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
};
const fmtSidebar = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now  = new Date();
    if (date.toDateString() === now.toDateString()) return fmtTime(d);
    const diffDays = Math.floor((now - date) / 86400000);
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday:'short' });
    return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' });
};

const getCurrentUser = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch { return null; }
};

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════
const Chat = () => {
    const me = getCurrentUser();
    const [contacts,    setContacts]    = useState([]);
    const [activeId,    setActiveId]    = useState(null);
    const [messages,    setMessages]    = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [draft,       setDraft]       = useState('');
    const [search,      setSearch]      = useState('');
    const [typingFrom,  setTypingFrom]  = useState(null);
    const [online,      setOnline]      = useState(new Set());

    const scrollRef = useRef(null);
    const typingTO  = useRef(null);
    const inputRef  = useRef(null);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await API.get('/messages/contacts');
            setContacts(res.data.data || []);
        } catch (e) { console.error('Erreur contacts:', e); }
    }, []);

    const fetchMessages = useCallback(async (userId) => {
        if (!userId) return;
        setLoadingMsgs(true);
        try {
            const res = await API.get(`/messages/conversation/${userId}`);
            setMessages(res.data.data || []);
            setContacts(prev => prev.map(c => c.id === userId ? { ...c, unread_count: 0 } : c));
        } catch (e) {
            console.error('Erreur messages:', e);
            setMessages([]);
        } finally { setLoadingMsgs(false); }
    }, []);

    const activeIdRef = useRef(activeId);
    useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

    useEffect(() => {
        fetchContacts();
        const sock = connectSocket();
        if (!sock) return;

        const onNewMessage = (msg) => {
            const otherId = msg.id_expediteur === me?.id ? msg.id_destinataire : msg.id_expediteur;

            if (activeIdRef.current === otherId) {
                setMessages(prev => [...prev, msg]);
                if (msg.id_destinataire === me?.id) {
                    API.put(`/messages/${otherId}/read`).catch(() => {});
                }
            } else if (msg.id_destinataire === me?.id) {
                setContacts(prev => prev.map(c =>
                    c.id === msg.id_expediteur
                        ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: msg.contenu, last_date: msg.date_envoi }
                        : c
                ));
            }

            setContacts(prev => {
                const next = prev.map(c =>
                    c.id === otherId
                        ? { ...c, last_message: msg.contenu, last_date: msg.date_envoi }
                        : c
                );
                return next.sort((a, b) => {
                    if (!a.last_date && !b.last_date) return 0;
                    if (!a.last_date) return 1;
                    if (!b.last_date) return -1;
                    return new Date(b.last_date) - new Date(a.last_date);
                });
            });
        };

        const onMessageRead = ({ reader_id }) => {
            setMessages(prev => prev.map(m =>
                m.id_destinataire === reader_id ? { ...m, lu: true } : m
            ));
        };

        const onTypingStart = ({ from }) => {
            if (activeIdRef.current === from) setTypingFrom(from);
        };
        const onTypingStop = ({ from }) => {
            setTypingFrom(prev => prev === from ? null : prev);
        };

        const onPresence = ({ userId, online: isOn }) => {
            setOnline(prev => {
                const next = new Set(prev);
                if (isOn) next.add(userId); else next.delete(userId);
                return next;
            });
        };

        sock.on('message:new',   onNewMessage);
        sock.on('message:read',  onMessageRead);
        sock.on('typing:start',  onTypingStart);
        sock.on('typing:stop',   onTypingStop);
        sock.on('presence',      onPresence);

        return () => {
            sock.off('message:new',  onNewMessage);
            sock.off('message:read', onMessageRead);
            sock.off('typing:start', onTypingStart);
            sock.off('typing:stop',  onTypingStop);
            sock.off('presence',     onPresence);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeId) fetchMessages(activeId);
    }, [activeId, fetchMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typingFrom]);

    const send = async () => {
        const content = draft.trim();
        if (!content || !activeId) return;
        setDraft('');
        getSocket()?.emit('typing:stop', { to: activeId });
        try {
            await API.post('/messages', { id_destinataire: activeId, contenu: content });
        } catch (e) {
            console.error('Erreur envoi:', e);
            setDraft(content);
        }
    };

    const handleDraftChange = (val) => {
        setDraft(val);
        if (!activeId) return;
        const sock = getSocket();
        if (!sock) return;
        sock.emit('typing:start', { to: activeId });
        clearTimeout(typingTO.current);
        typingTO.current = setTimeout(() => {
            sock.emit('typing:stop', { to: activeId });
        }, 1500);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const filteredContacts = contacts.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${c.prenom} ${c.nom}`.toLowerCase().includes(q);
    });

    const activeContact = contacts.find(c => c.id === activeId);

    const grouped = [];
    let lastDay = null;
    messages.forEach(m => {
        const day = fmtDay(m.date_envoi);
        if (day !== lastDay) {
            grouped.push({ type: 'day', day, key: `d-${day}` });
            lastDay = day;
        }
        grouped.push({ type: 'msg', msg: m, key: `m-${m.id}` });
    });

    return (
        <>
            <style>{styles}</style>
            <div className="chat-page">
                <aside className="chat-sidebar">
                    <div className="chat-sidebar-hdr">
                        <div className="chat-sidebar-title">Messages</div>
                        <div className="chat-search">
                            <Icon d={I.search} size={14} />
                            <input
                                placeholder="Rechercher un contact..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="chat-contacts">
                        {filteredContacts.length === 0 ? (
                            <div className="chat-empty-contacts">
                                <div className="chat-empty-contacts-icon">
                                    <Icon d={I.user} size={32} />
                                </div>
                                {search ? 'Aucun résultat' : 'Aucun contact disponible'}
                            </div>
                        ) : filteredContacts.map(c => (
                            <div
                                key={c.id}
                                className={`chat-contact ${activeId === c.id ? 'active' : ''}`}
                                onClick={() => setActiveId(c.id)}
                            >
                                <div className="chat-contact-avatar">
                                    {c.avatar
                                        ? <img src={c.avatar} alt="" />
                                        : initials(c.prenom, c.nom)
                                    }
                                </div>
                                <div className={`chat-presence-dot ${online.has(c.id) ? 'online' : ''}`} />
                                <div className="chat-contact-body">
                                    <div className="chat-contact-top">
                                        <div className="chat-contact-name">{c.prenom} {c.nom}</div>
                                        {c.last_date && (
                                            <div className="chat-contact-time">{fmtSidebar(c.last_date)}</div>
                                        )}
                                    </div>
                                    <div className="chat-contact-bottom">
                                        <div className="chat-contact-msg">
                                            {c.last_message || <em style={{ opacity:.6 }}>Aucun message</em>}
                                        </div>
                                        {c.unread_count > 0 && (
                                            <div className="chat-contact-badge">
                                                {c.unread_count > 99 ? '99+' : c.unread_count}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="chat-main">
                    {!activeContact ? (
                        <div className="chat-main-empty">
                            <div className="chat-main-empty-icon">
                                <Icon d={I.chat} size={48} />
                            </div>
                            <div style={{ fontSize:14, fontWeight:600 }}>Sélectionnez une conversation</div>
                            <div style={{ fontSize:12 }}>Choisissez un contact à gauche pour commencer.</div>
                        </div>
                    ) : (
                        <>
                            <div className="chat-main-hdr">
                                <div className="chat-main-hdr-avatar">
                                    {activeContact.avatar
                                        ? <img src={activeContact.avatar} alt="" />
                                        : initials(activeContact.prenom, activeContact.nom)
                                    }
                                </div>
                                <div className="chat-main-hdr-info">
                                    <div className="chat-main-hdr-name">
                                        {activeContact.prenom} {activeContact.nom}
                                    </div>
                                    <div className={`chat-main-hdr-status ${
                                        typingFrom === activeContact.id ? 'typing'
                                            : online.has(activeContact.id) ? 'online' : ''
                                    }`}>
                                        {typingFrom === activeContact.id
                                            ? "en train d'écrire…"
                                            : online.has(activeContact.id) ? 'en ligne' : 'hors ligne'}
                                    </div>
                                </div>
                            </div>

                            <div className="chat-messages" ref={scrollRef}>
                                {loadingMsgs ? (
                                    <div className="chat-loading">Chargement…</div>
                                ) : messages.length === 0 ? (
                                    <div className="chat-loading">Aucun message. Commencez la conversation !</div>
                                ) : grouped.map(g => g.type === 'day' ? (
                                    <div key={g.key} className="chat-day-sep">{g.day}</div>
                                ) : (() => {
                                    const m = g.msg;
                                    const mine = m.id_expediteur === me?.id;
                                    return (
                                        <div key={g.key} className={`chat-msg ${mine ? 'mine' : 'other'}`}>
                                            {m.contenu}
                                            <div className="chat-msg-meta">
                                                {fmtTime(m.date_envoi)}
                                                {mine && (
                                                    <span className={`chat-msg-check ${m.lu ? 'read' : ''}`}>
                                                        {m.lu ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })())}
                                {typingFrom === activeContact.id && (
                                    <div className="chat-typing">
                                        <span /><span /><span />
                                    </div>
                                )}
                            </div>

                            <div className="chat-input-bar">
                                <textarea
                                    ref={inputRef}
                                    className="chat-input"
                                    rows={1}
                                    placeholder="Écrire un message..."
                                    value={draft}
                                    onChange={e => handleDraftChange(e.target.value)}
                                    onKeyDown={handleKey}
                                />
                                <button
                                    className="chat-send"
                                    onClick={send}
                                    disabled={!draft.trim()}
                                    title="Envoyer"
                                >
                                    <Icon d={I.send} size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </>
    );
};

export default Chat;