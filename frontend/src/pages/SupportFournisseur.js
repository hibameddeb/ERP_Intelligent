import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const I = {
  send:    "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  chat:    "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z",
  declare: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  plus:    "M12 5v14M5 12h14",
  close:   "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  chevron: "M9 18l6-6-6-6",
  empty:   "M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4",
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES  = ["basse", "moyenne", "haute", "urgente"];
const TYPES       = ["litige_livraison", "litige_qualite", "litige_paiement", "autre"];
const TYPE_LABELS = {
  litige_livraison: "Litige livraison",
  litige_qualite:   "Litige qualité",
  litige_paiement:  "Litige paiement",
  autre:            "Autre",
};
const PRIO_CFG = {
  basse:   { color: "var(--accent)",  bg: "var(--accent-l)",  border: "rgba(0,223,162,0.25)"   },
  moyenne: { color: "var(--blue)",    bg: "var(--blue-l)",    border: "rgba(110,168,254,0.25)" },
  haute:   { color: "var(--warning)", bg: "var(--warning-l)", border: "rgba(255,179,64,0.25)"  },
  urgente: { color: "var(--danger)",  bg: "var(--danger-l)",  border: "rgba(255,92,122,0.25)"  },
};
const TYPE_CFG = {
  litige_livraison: { color: "var(--blue)",    bg: "var(--blue-l)"    },
  litige_qualite:   { color: "var(--warning)", bg: "var(--warning-l)" },
  litige_paiement:  { color: "var(--danger)",  bg: "var(--danger-l)"  },
  autre:            { color: "var(--accent)",  bg: "var(--accent-l)"  },
};

const formatTime = iso => iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
const formatDay  = iso => iso ? new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
const formatDate = iso => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const adminInitials = a => a ? `${a.prenom?.[0] || ""}${a.nom?.[0] || ""}`.toUpperCase() || "A" : "A";

// ─── Badges ───────────────────────────────────────────────────────────────────
const PrioBadge = ({ p }) => {
  const c = PRIO_CFG[p] || PRIO_CFG.basse;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 800,
      fontFamily: "'Sora',sans-serif", textTransform: "capitalize",
    }}>{p}</span>
  );
};
const TypeBadge = ({ t }) => {
  const c = TYPE_CFG[t] || TYPE_CFG.autre;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700,
      fontFamily: "'Sora',sans-serif",
    }}>{TYPE_LABELS[t] || t}</span>
  );
};

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────
const SubTabs = ({ active, onChange }) => (
  <div style={{
    display: "flex", borderBottom: "1px solid var(--border)",
    flexShrink: 0, background: "var(--surface)",
  }}>
    {[
      { id: "chat",         label: "Chat",             icon: I.chat    },
      { id: "declarations", label: "Mes déclarations", icon: I.declare },
    ].map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "12px 22px", border: "none", cursor: "pointer",
        fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 700,
        transition: "all 0.15s", background: "transparent",
        color: active === t.id ? "var(--accent)" : "var(--text3)",
        borderBottom: active === t.id ? "2px solid var(--accent)" : "2px solid transparent",
        marginBottom: -1,
      }}>
        <Icon d={t.icon} size={14} />
        {t.label}
      </button>
    ))}
  </div>
);

// ─── Admin list — left column ─────────────────────────────────────────────────
const AdminList = ({ admins, selected, onSelect, loading }) => {
  const [search, setSearch] = useState("");
  const filtered = admins.filter(a =>
    `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 230, minWidth: 230, flexShrink: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 13px 11px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Sora',sans-serif", fontWeight: 700,
          fontSize: 12.5, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.01em",
        }}>
          Administrateurs
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "var(--surface2)", border: "1px solid var(--border2)",
          borderRadius: "var(--r)", padding: "6px 10px",
        }}>
          <Icon d={I.search} size={12} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: 12, color: "var(--text)", width: "100%",
              fontFamily: "'Nunito',sans-serif",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <span className="f-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 10px", color: "var(--text3)", fontSize: 12 }}>
            Aucun administrateur
          </div>
        ) : filtered.map(a => {
          const isActive = selected?.id === a.id;
          return (
            <button key={a.id} onClick={() => onSelect(a)} style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "9px 10px", border: "none",
              borderRadius: "var(--r)", cursor: "pointer", textAlign: "left",
              transition: "all 0.14s", marginBottom: 3, position: "relative",
              background: isActive ? "var(--accent-l)" : "transparent",
              boxShadow: isActive ? "inset 0 0 0 1px rgba(0,223,162,0.15)" : "none",
            }}>
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: "20%", bottom: "20%",
                  width: 3, borderRadius: "0 3px 3px 0", background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                }} />
              )}
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: isActive
                  ? "linear-gradient(135deg, var(--accent), #008F66)"
                  : "linear-gradient(135deg, #1F3A5F, #152B45)",
                display: "grid", placeItems: "center",
                fontFamily: "'Sora',sans-serif", fontWeight: 800,
                fontSize: 12, color: isActive ? "#0C1015" : "var(--text2)",
                boxShadow: isActive ? "0 0 0 2px var(--accent-l)" : "none",
                border: isActive ? "none" : "1px solid var(--border2)",
              }}>
                {adminInitials(a)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 12.5,
                  color: isActive ? "var(--accent)" : "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'Sora',sans-serif",
                }}>
                  {a.prenom} {a.nom}
                </div>
                <div style={{
                  fontSize: 10.5, color: isActive ? "var(--accent2)" : "var(--text3)",
                  fontWeight: 600, marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  Administrateur
                </div>
              </div>
              {/* Online dot */}
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent)",
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Empty state — no admin selected ─────────────────────────────────────────
const NoneSelected = () => (
  <div style={{
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 14, background: "var(--bg)",
  }}>
    <div style={{
      width: 60, height: 60, borderRadius: 18,
      background: "var(--surface2)", border: "1px solid var(--border)",
      display: "grid", placeItems: "center", color: "var(--text3)",
    }}>
      <Icon d={I.chat} size={26} />
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: "var(--text2)",
        fontFamily: "'Sora',sans-serif", marginBottom: 5,
      }}>
        Sélectionnez un administrateur
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text3)" }}>
        pour ouvrir la conversation
      </div>
    </div>
  </div>
);

// ─── Chat conversation ────────────────────────────────────────────────────────
const Conversation = ({ admin, currentUser, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [newMsg, setNewMsg]     = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);
  const contactId = admin?.id;

  const fetchMessages = useCallback(async (silent = false) => {
    if (!contactId) return true;
    if (!silent) setLoading(true);
    try {
      const res = await API.get(`/support/messages/${contactId}`);
      setMessages(res.data || []);
      return true;
    } catch {
      if (!silent) showToast("Erreur chargement messages.", "error");
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [contactId, showToast]);

  useEffect(() => {
    setMessages([]);
    if (!contactId) return;
    let stopped = false;
    fetchMessages().then(ok => {
      if (!ok || stopped) return;
      pollRef.current = setInterval(async () => {
        const ok2 = await fetchMessages(true);
        if (!ok2) clearInterval(pollRef.current);
      }, 5000);
    });
    return () => { stopped = true; clearInterval(pollRef.current); };
  }, [contactId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || !contactId) return;
    setSending(true);
    const tempId = Date.now();
    setMessages(m => [...m, {
      id: tempId, contenu: text,
      id_expediteur: currentUser?.id,
      date_envoi: new Date().toISOString(), _pending: true,
    }]);
    setNewMsg("");
    try {
      await API.post("/support/messages", { id_destinataire: contactId, contenu: text });
      fetchMessages(true);
    } catch {
      setMessages(m => m.filter(x => x.id !== tempId));
      setNewMsg(text);
      showToast("Erreur d'envoi.", "error");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const isMe = msg => msg.id_expediteur === currentUser?.id;

  const grouped = messages.reduce((acc, msg, i) => {
    const day = msg.date_envoi ? new Date(msg.date_envoi).toDateString() : "?";
    if (i === 0 || new Date(messages[i - 1].date_envoi).toDateString() !== day) {
      acc.push({ type: "sep", label: formatDay(msg.date_envoi), key: `sep-${i}` });
    }
    acc.push({ type: "msg", msg, key: String(msg.id) });
    return acc;
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Admin header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 18px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, var(--accent), #008F66)",
          display: "grid", placeItems: "center",
          fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, color: "#0C1015",
          boxShadow: "0 0 0 2px var(--accent-l)",
        }}>
          {adminInitials(admin)}
        </div>
        <div>
          <div style={{
            fontFamily: "'Sora',sans-serif", fontWeight: 700,
            fontSize: 14, color: "var(--text)", letterSpacing: "-0.01em",
          }}>
            {admin.prenom} {admin.nom}
          </div>
          <div style={{
            fontSize: 11, color: "var(--accent)", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4, marginTop: 1,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", boxShadow: "0 0 5px var(--accent)" }} />
            Administrateur · En ligne
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "var(--accent-l)", color: "var(--accent)",
            border: "1px solid rgba(0,223,162,0.2)",
            padding: "3px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700,
            fontFamily: "'Sora',sans-serif",
          }}>
            <Icon d={I.shield} size={10} /> Administration
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "18px 22px",
        display: "flex", flexDirection: "column", gap: 2, background: "var(--bg)",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <span className="f-spinner" style={{ width: 22, height: 22 }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: 12,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "var(--surface2)", border: "1px solid var(--border)",
              display: "grid", placeItems: "center", color: "var(--text3)",
            }}>
              <Icon d={I.chat} size={22} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text2)", fontFamily: "'Sora',sans-serif" }}>
                Aucun message
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                Démarrez la conversation avec {admin.prenom}
              </div>
            </div>
          </div>
        ) : grouped.map(item => {
          if (item.type === "sep") return (
            <div key={item.key} style={{
              textAlign: "center", padding: "10px 0",
              fontSize: 10.5, color: "var(--text3)", fontWeight: 700,
              textTransform: "capitalize",
            }}>
              <span style={{
                background: "var(--surface2)", padding: "3px 14px",
                borderRadius: 99, border: "1px solid var(--border)",
              }}>{item.label}</span>
            </div>
          );
          const { msg } = item;
          const mine = isMe(msg);
          return (
            <div key={item.key} style={{
              display: "flex", justifyContent: mine ? "flex-end" : "flex-start",
              alignItems: "flex-end", gap: 8, marginBottom: 3,
            }}>
              {/* Admin avatar for received */}
              {!mine && (
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, var(--accent), #008F66)",
                  display: "grid", placeItems: "center",
                  fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 10, color: "#0C1015",
                }}>
                  {adminInitials(admin)}
                </div>
              )}
              <div style={{
                maxWidth: "66%", padding: "9px 14px",
                borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: mine
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "var(--surface2)",
                border: mine ? "none" : "1px solid var(--border2)",
                color: mine ? "#0C1015" : "var(--text)",
                fontSize: 13.5, lineHeight: 1.55, fontFamily: "'Nunito',sans-serif",
                opacity: msg._pending ? 0.6 : 1,
                fontWeight: mine ? 700 : 500,
                boxShadow: mine
                  ? "0 4px 16px rgba(0,223,162,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {msg.contenu}
                <div style={{
                  fontSize: 10, marginTop: 4, textAlign: "right",
                  color: mine ? "rgba(12,16,21,0.55)" : "var(--text3)",
                }}>
                  {msg._pending ? "Envoi…" : formatTime(msg.date_envoi)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid var(--border)",
        display: "flex", gap: 10, alignItems: "flex-end",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Écrire à ${admin.prenom}… (Entrée pour envoyer)`}
          rows={1}
          style={{
            flex: 1, resize: "none",
            background: "var(--surface2)", border: "1px solid var(--border2)",
            borderRadius: "var(--r)", padding: "9px 13px",
            fontFamily: "'Nunito',sans-serif", fontSize: 13.5,
            color: "var(--text)", outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            lineHeight: 1.5, maxHeight: 110, overflowY: "auto",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-l)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMsg.trim()}
          style={{
            width: 42, height: 42, borderRadius: "var(--r)", border: "none", flexShrink: 0,
            background: newMsg.trim() ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--surface2)",
            color: newMsg.trim() ? "#0C1015" : "var(--text3)",
            display: "grid", placeItems: "center",
            cursor: newMsg.trim() ? "pointer" : "default",
            transition: "all 0.15s",
            boxShadow: newMsg.trim() ? "0 4px 16px rgba(0,223,162,0.3)" : "none",
          }}>
          {sending
            ? <span className="f-spinner" style={{ width: 14, height: 14 }} />
            : <Icon d={I.send} size={15} />}
        </button>
      </div>
    </div>
  );
};

// ─── Chat tab (admin list + conversation) ─────────────────────────────────────
const ChatTab = ({ currentUser, showToast }) => {
  const [admins, setAdmins]       = useState([]);
  const [loadingA, setLoadingA]   = useState(true);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    setLoadingA(true);
    API.get("/support/admins")
      .then(res => setAdmins(res.data || []))
      .catch(() => showToast("Impossible de charger les administrateurs.", "error"))
      .finally(() => setLoadingA(false));
  }, [showToast]);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <AdminList
        admins={admins}
        selected={selected}
        onSelect={setSelected}
        loading={loadingA}
      />
      {selected
        ? <Conversation admin={selected} currentUser={currentUser} showToast={showToast} />
        : <NoneSelected />
      }
    </div>
  );
};

// ─── Declarations tab ─────────────────────────────────────────────────────────
const EMPTY_FORM = { sujet: "", description: "", type_litige: "autre", priorite: "moyenne", id_commande: "" };
const SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234E6480' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

const DeclarationsTab = ({ currentUser, showToast }) => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [expandedId, setExpandedId]     = useState(null);
  const [editingId, setEditingId]       = useState(null);
  const formRef = useRef(null);
  const myId = currentUser?.id;

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/support/reclamations/mes-reclamations");
      setDeclarations(res.data || []);
    } catch {
      try {
        const res2 = await API.get("/support/reclamations/admin");
        setDeclarations((res2.data || []).filter(d => String(d.id_emetteur) === String(myId)));
      } catch {
        showToast("Erreur chargement déclarations.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [myId, showToast]);

  useEffect(() => { fetchDeclarations(); }, [fetchDeclarations]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    setEditingId(null); setForm(EMPTY_FORM); setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const openEdit = d => {
    setEditingId(d.id);
    setForm({ sujet: d.sujet||"", description: d.description||"", type_litige: d.type_litige||"autre", priorite: d.priorite||"moyenne", id_commande: d.id_commande||"" });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async () => {
    if (!form.sujet.trim() || !form.description.trim()) { showToast("Sujet et description sont obligatoires.", "error"); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await API.put(`/support/reclamations/${editingId}`, form);
        showToast("Déclaration mise à jour.", "success");
      } else {
        await API.post("/support/reclamations", { ...form, id_commande: form.id_commande || null });
        showToast("Déclaration envoyée à l'administration.", "success");
      }
      cancelForm(); fetchDeclarations();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur.", "error");
    } finally { setSubmitting(false); }
  };

  const inStyle = {
    background: "var(--surface2)", border: "1px solid var(--border2)",
    borderRadius: "var(--r)", padding: "9px 13px",
    fontFamily: "'Nunito',sans-serif", fontSize: 13,
    color: "var(--text)", outline: "none", width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const selStyle = { ...inStyle, appearance: "none", backgroundImage: SELECT_ARROW, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28, cursor: "pointer" };
  const onFocus = e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-l)"; e.target.style.background = "var(--surface3)"; };
  const onBlur  = e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--surface2)"; };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "var(--bg)" }}>

      {/* ── Inline form ── */}
      {showForm ? (
        <div ref={formRef} style={{
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: "var(--r-lg)", padding: "20px 20px 16px", marginBottom: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,223,162,0.06)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--accent), transparent)" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14.5, color: "var(--text)" }}>
              {editingId ? "Modifier la déclaration" : "Nouvelle déclaration"}
            </div>
            <button onClick={cancelForm} style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--surface2)", color: "var(--text3)",
              display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-l)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "rgba(255,92,122,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <Icon d={I.close} size={13} />
            </button>
          </div>

          <div className="f-form-group">
            <label className="f-form-label">Sujet <span style={{ color: "var(--danger)" }}>*</span></label>
            <input style={inStyle} placeholder="Objet de la déclaration…" value={form.sujet} onChange={set("sujet")} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="f-form-group" style={{ marginBottom: 0 }}>
              <label className="f-form-label">Type de litige</label>
              <select style={selStyle} value={form.type_litige} onChange={set("type_litige")} onFocus={onFocus} onBlur={onBlur}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="f-form-group" style={{ marginBottom: 0 }}>
              <label className="f-form-label">Priorité</label>
              <select style={selStyle} value={form.priorite} onChange={set("priorite")} onFocus={onFocus} onBlur={onBlur}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p}</option>)}
              </select>
            </div>
            <div className="f-form-group" style={{ marginBottom: 0 }}>
              <label className="f-form-label">N° Commande</label>
              <input style={inStyle} placeholder="ex: 10042" value={form.id_commande} onChange={set("id_commande")} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          <div className="f-form-group">
            <label className="f-form-label">Description <span style={{ color: "var(--danger)" }}>*</span></label>
            <textarea className="f-form-textarea" style={{ minHeight: 100, fontFamily: "'Nunito',sans-serif" }}
              placeholder="Décrivez le problème en détail…" value={form.description} onChange={set("description")}
              rows={4} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={cancelForm} className="f-btn f-btn-ghost f-btn-sm">Annuler</button>
            <button onClick={handleSubmit} disabled={submitting} className="f-btn f-btn-primary f-btn-sm">
              {submitting
                ? <><span className="f-spinner" style={{ width: 13, height: 13 }} /> Envoi…</>
                : <><Icon d={editingId ? I.check : I.send} size={13} />{editingId ? "Enregistrer" : "Envoyer"}</>}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={openNew} style={{
          display: "flex", alignItems: "center", gap: 9,
          width: "100%", padding: "11px 16px", marginBottom: 18,
          border: "1.5px dashed rgba(0,223,162,0.3)", borderRadius: "var(--r-lg)",
          background: "transparent", cursor: "pointer",
          color: "var(--text3)", fontSize: 13, fontWeight: 700,
          transition: "all 0.15s", fontFamily: "'Nunito',sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-l)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,223,162,0.3)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--accent-l)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
            <Icon d={I.plus} size={13} />
          </div>
          Nouvelle déclaration
        </button>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <span className="f-spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : declarations.length === 0 && !showForm ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 20px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--surface2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--text3)" }}>
            <Icon d={I.empty} size={22} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text2)", fontFamily: "'Sora',sans-serif" }}>Aucune déclaration</div>
            <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 4 }}>Vous n'avez soumis aucune déclaration pour le moment</div>
          </div>
        </div>
      ) : declarations.map(d => {
        const isExpanded = expandedId === d.id;
        const prio = PRIO_CFG[d.priorite] || PRIO_CFG.basse;
        return (
          <div key={d.id} style={{
            background: "var(--surface)", border: `1px solid ${isExpanded ? "var(--border2)" : "var(--border)"}`,
            borderRadius: "var(--r-lg)", marginBottom: 12, overflow: "hidden",
            transition: "all 0.18s",
            boxShadow: isExpanded ? "var(--sh-lg), 0 0 0 1px rgba(0,223,162,0.08)" : "var(--sh)",
          }}>
            <div onClick={() => setExpandedId(isExpanded ? null : d.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
              <div style={{
                width: 3, height: 38, borderRadius: 99, flexShrink: 0,
                background: prio.color, boxShadow: `0 0 8px ${prio.color}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5, fontFamily: "'Sora',sans-serif" }}>
                  {d.sujet}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <PrioBadge p={d.priorite} />
                  <TypeBadge t={d.type_litige} />
                  {d.id_commande && <span style={{ fontSize: 10.5, color: "var(--text3)", fontFamily: "monospace" }}>#{d.id_commande}</span>}
                  <span style={{ fontSize: 10.5, color: "var(--text3)", marginLeft: "auto" }}>{formatDate(d.created_at)}</span>
                </div>
              </div>
              <span style={{ color: "var(--text3)", transition: "transform 0.22s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", display: "grid", placeItems: "center" }}>
                <Icon d={I.chevron} size={15} />
              </span>
            </div>
            {isExpanded && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px 16px", background: "var(--surface2)" }}>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.75, margin: "0 0 14px", borderLeft: `3px solid ${prio.color}`, paddingLeft: 12 }}>
                  {d.description}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(d)} className="f-btn f-btn-ghost f-btn-sm">
                    <Icon d={I.edit} size={12} /> Modifier
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const SupportFournisseur = ({ showToast }) => {
  const [tab, setTab] = useState("chat");

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  });

  const toast = useCallback(
    (msg, type = "success") => { if (typeof showToast === "function") showToast(msg, type); },
    [showToast]
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 62px)",
      margin: "-28px",
      overflow: "hidden",
      background: "var(--bg)",
    }}>
      <SubTabs active={tab} onChange={setTab} />

      {tab === "chat" && (
        <ChatTab currentUser={currentUser} showToast={toast} />
      )}
      {tab === "declarations" && (
        <DeclarationsTab currentUser={currentUser} showToast={toast} />
      )}
    </div>
  );
};

export default SupportFournisseur;