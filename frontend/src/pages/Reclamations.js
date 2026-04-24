import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Ic = {
  send:    "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  chat:    "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z",
  declare: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  check:   "M20 6L9 17l-5-5",
  close:   "M18 6L6 18M6 6l12 12",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  chevron: "M9 18l6-6-6-6",
  building:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  empty:   "M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4",
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
const PRIO = {
  basse:   { color: "var(--teal)",  bg: "var(--teal-dim)"  },
  moyenne: { color: "var(--blue)",  bg: "var(--blue-dim)"  },
  haute:   { color: "var(--amber)", bg: "var(--amber-dim)" },
  urgente: { color: "var(--rose)",  bg: "var(--rose-dim)"  },
};

const fournisseurName = (f) =>
  f ? (f.nom_societe || `${f.prenom || ""} ${f.nom || ""}`.trim() || "Fournisseur") : "";

const initials = (name = "") =>
  (name || "?").split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};
const formatDay = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Shared tiny components ───────────────────────────────────────────────────
const Avatar = ({ name, size = 36, style: s = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.28),
    background: "linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%)",
    display: "grid", placeItems: "center",
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
    color: "#fff", fontSize: Math.round(size * 0.36), flexShrink: 0,
    letterSpacing: "-0.02em", ...s,
  }}>
    {initials(name)}
  </div>
);

const PrioBadge = ({ p }) => {
  const c = PRIO[p] || PRIO.basse;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 700,
      fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: "capitalize",
    }}>{p}</span>
  );
};

const TypeBadge = ({ t }) => (
  <span style={{
    background: "var(--violet-dim)", color: "var(--violet)",
    border: "1px solid rgba(14,41,49,0.15)",
    padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  }}>{TYPE_LABELS[t] || t}</span>
);

// ─── Fournisseur list — left column ──────────────────────────────────────────
const FournisseurList = ({ fournisseurs, selected, onSelect, loading }) => {
  const [search, setSearch] = useState("");
  const filtered = fournisseurs.filter(f =>
    fournisseurName(f).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 240, minWidth: 240, flexShrink: 0,
      background: "var(--surface)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: 13, color: "var(--text)", marginBottom: 10,
        }}>
          Fournisseurs
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "var(--surface-3)", border: "1px solid var(--border)",
          borderRadius: "var(--r)", padding: "6px 10px",
        }}>
          <Icon d={Ic.search} size={13} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: 12.5, color: "var(--text)", width: "100%",
              fontFamily: "'DM Sans',sans-serif",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <span className="erp-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--muted)", fontSize: 12.5 }}>
            Aucun fournisseur
          </div>
        ) : filtered.map(f => {
          const fid     = f.id_utilisateur || f.id;
          const sid     = selected ? (selected.id_utilisateur || selected.id) : null;
          const isActive = sid === fid;
          const name    = fournisseurName(f);
          return (
            <button key={fid} onClick={() => onSelect(f)} style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "8px 9px", border: "none",
              borderRadius: "var(--r)", cursor: "pointer", textAlign: "left",
              transition: "all 0.14s", marginBottom: 2, position: "relative",
              background: isActive ? "var(--blue-dim)" : "transparent",
            }}>
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: "20%", bottom: "20%",
                  width: 3, borderRadius: "0 3px 3px 0", background: "var(--blue)",
                }} />
              )}
              <Avatar name={name} size={32} s={{
                background: isActive
                  ? "linear-gradient(135deg, var(--blue) 0%, var(--teal) 100%)"
                  : "linear-gradient(135deg, #3d6372 0%, var(--violet) 100%)",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 12.5,
                  color: isActive ? "var(--blue)" : "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{name}</div>
                {f.email && (
                  <div style={{
                    fontSize: 11, color: "var(--muted)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1,
                  }}>{f.email}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Right panel sub-tabs ─────────────────────────────────────────────────────
const RightTabs = ({ active, onChange }) => (
  <div style={{
    display: "flex", borderBottom: "1px solid var(--border)",
    flexShrink: 0, background: "var(--surface)",
  }}>
    {[
      { id: "chat",         label: "Chat",         icon: Ic.chat    },
      { id: "declarations", label: "Déclarations", icon: Ic.declare },
    ].map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "11px 20px", border: "none", cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
        transition: "all 0.15s", background: "transparent",
        color: active === t.id ? "var(--blue)" : "var(--muted)",
        borderBottom: active === t.id ? "2px solid var(--blue)" : "2px solid transparent",
        marginBottom: -1,
      }}>
        <Icon d={t.icon} size={14} />
        {t.label}
      </button>
    ))}
  </div>
);

// ─── Chat view ────────────────────────────────────────────────────────────────
const ChatView = ({ fournisseur, currentUser, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [newMsg, setNewMsg]     = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);
  const contactId = fournisseur ? (fournisseur.id_utilisateur || fournisseur.id) : null;

  const fetchMessages = useCallback(async (silent = false) => {
    if (!contactId) return;
    if (!silent) setLoading(true);
    try {
      const res = await API.get(`/support/messages/${contactId}`);
      setMessages(res.data || []);
      return true; // success
    } catch (err) {
      if (!silent) showToast("Erreur chargement messages.", "error");
      return false; // failure — caller can stop polling
    } finally {
      if (!silent) setLoading(false);
    }
  }, [contactId, showToast]);

  useEffect(() => {
    setMessages([]);
    if (!contactId) return;
    let stopped = false;
    fetchMessages().then(ok => {
      if (!ok || stopped) return; // don't start polling if first fetch failed
      pollRef.current = setInterval(async () => {
        const ok2 = await fetchMessages(true);
        if (!ok2) { clearInterval(pollRef.current); } // stop on server error
      }, 5000);
    });
    return () => {
      stopped = true;
      clearInterval(pollRef.current);
    };
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
      date_envoi: new Date().toISOString(),
      _pending: true,
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

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Group messages by day
  const grouped = messages.reduce((acc, msg, i) => {
    const day = msg.date_envoi ? new Date(msg.date_envoi).toDateString() : "?";
    if (i === 0 || new Date(messages[i - 1].date_envoi).toDateString() !== day) {
      acc.push({ type: "sep", label: formatDay(msg.date_envoi), key: `sep-${i}` });
    }
    acc.push({ type: "msg", msg, key: String(msg.id) });
    return acc;
  }, []);

  const isMe = msg => msg.id_expediteur === currentUser?.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 2,
        background: "var(--bg)",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <span className="erp-spin" style={{ width: 22, height: 22 }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: 10, color: "var(--muted)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "grid", placeItems: "center",
            }}>
              <Icon d={Ic.chat} size={20} />
            </div>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Aucun message — démarrez !</span>
          </div>
        ) : grouped.map(item => {
          if (item.type === "sep") return (
            <div key={item.key} style={{
              textAlign: "center", padding: "10px 0",
              fontSize: 11, color: "var(--muted)", fontWeight: 600,
              textTransform: "capitalize",
            }}>
              <span style={{
                background: "var(--surface-3)", padding: "3px 12px",
                borderRadius: 99, border: "1px solid var(--border)",
              }}>{item.label}</span>
            </div>
          );
          const { msg } = item;
          const mine = isMe(msg);
          return (
            <div key={item.key} style={{
              display: "flex", justifyContent: mine ? "flex-end" : "flex-start",
              marginBottom: 2,
            }}>
              <div style={{
                maxWidth: "68%", padding: "9px 13px",
                borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: mine ? "var(--blue)" : "var(--surface-2)",
                border: mine ? "none" : "1px solid var(--border)",
                color: mine ? "#fff" : "var(--text)",
                fontSize: 13.5, lineHeight: 1.55,
                opacity: msg._pending ? 0.65 : 1,
                transition: "opacity 0.2s",
                boxShadow: mine ? "0 2px 8px var(--blue-glow)" : "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                {msg.contenu}
                <div style={{
                  fontSize: 10, marginTop: 4, textAlign: "right",
                  color: mine ? "rgba(255,255,255,0.55)" : "var(--muted)",
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
        display: "flex", gap: 8, alignItems: "flex-end",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          rows={1}
          style={{
            flex: 1, resize: "none", border: "1px solid var(--border)",
            borderRadius: "var(--r)", padding: "9px 13px",
            fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
            color: "var(--text)", background: "var(--surface-2)",
            outline: "none", transition: "border-color 0.15s",
            lineHeight: 1.5, maxHeight: 110, overflowY: "auto",
          }}
          onFocus={e => e.target.style.borderColor = "var(--blue)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMsg.trim()}
          style={{
            width: 40, height: 40, borderRadius: "var(--r)", border: "none",
            background: newMsg.trim() ? "var(--blue)" : "var(--surface-3)",
            color: newMsg.trim() ? "#fff" : "var(--muted)",
            display: "grid", placeItems: "center",
            cursor: newMsg.trim() ? "pointer" : "default",
            transition: "all 0.15s", flexShrink: 0,
            boxShadow: newMsg.trim() ? "0 2px 8px var(--blue-glow)" : "none",
          }}>
          {sending
            ? <span className="erp-spin" style={{ width: 14, height: 14 }} />
            : <Icon d={Ic.send} size={15} />}
        </button>
      </div>
    </div>
  );
};

// ─── Declarations view ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  sujet: "", description: "", type_litige: "autre",
  priorite: "moyenne", id_commande: "",
};

const SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%237a98a4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

const DeclarationsView = ({ fournisseur, showToast }) => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [expandedId, setExpandedId]     = useState(null);
  const [editingId, setEditingId]       = useState(null);
  const formRef = useRef(null);

  const contactId = fournisseur ? (fournisseur.id_utilisateur || fournisseur.id) : null;

  const fetchDeclarations = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await API.get("/support/reclamations/admin");
      const mine = (res.data || []).filter(d =>
        String(d.id_destinataire) === String(contactId) ||
        String(d.id_emetteur)    === String(contactId)
      );
      setDeclarations(mine);
    } catch {
      showToast("Erreur chargement déclarations.", "error");
    } finally {
      setLoading(false);
    }
  }, [contactId, showToast]);

  useEffect(() => {
    setDeclarations([]);
    setShowForm(false);
    setEditingId(null);
    setExpandedId(null);
    fetchDeclarations();
  }, [contactId, fetchDeclarations]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openEdit = d => {
    setEditingId(d.id);
    setForm({
      sujet:       d.sujet       || "",
      description: d.description || "",
      type_litige: d.type_litige || "autre",
      priorite:    d.priorite    || "moyenne",
      id_commande: d.id_commande || "",
    });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.sujet.trim() || !form.description.trim()) {
      showToast("Sujet et description sont obligatoires.", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await API.put(`/support/reclamations/${editingId}`, form);
        showToast("Déclaration mise à jour.", "success");
      } else {
        await API.post("/support/reclamations", {
          ...form,
          id_destinataire: contactId,
          id_commande: form.id_commande || null,
        });
        showToast("Déclaration envoyée.", "success");
      }
      cancelForm();
      fetchDeclarations();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: "var(--r)", padding: "8px 12px",
    fontFamily: "'DM Sans',sans-serif", fontSize: 13,
    color: "var(--text)", outline: "none", width: "100%",
    transition: "border-color 0.15s",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: SELECT_ARROW,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: 28, cursor: "pointer",
  };

  const labelStyle = {
    fontSize: 11.5, fontWeight: 600, color: "var(--text-2)",
    marginBottom: 5, display: "block",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  const focusBlue  = e => e.target.style.borderColor = "var(--blue)";
  const blurBorder = e => e.target.style.borderColor = "var(--border)";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", background: "var(--bg)" }}>

        {/* ── Inline form ── */}
        {showForm ? (
          <div ref={formRef} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)", padding: "18px 18px 14px", marginBottom: 16,
            boxShadow: "0 2px 12px rgba(14,41,49,0.07)",
          }}>
            {/* Form header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
                fontSize: 14, color: "var(--text)",
              }}>
                {editingId ? "Modifier la déclaration" : "Nouvelle déclaration"}
              </div>
              <button onClick={cancelForm} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", display: "grid", placeItems: "center",
                padding: 4, borderRadius: 6, transition: "color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
              >
                <Icon d={Ic.close} size={15} />
              </button>
            </div>

            {/* Sujet */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>
                Sujet <span style={{ color: "var(--rose)" }}>*</span>
              </label>
              <input
                style={inputStyle}
                placeholder="Objet de la déclaration…"
                value={form.sujet}
                onChange={set("sujet")}
                onFocus={focusBlue} onBlur={blurBorder}
              />
            </div>

            {/* Type + Priorité + Commande */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Type de litige</label>
                <select style={selectStyle} value={form.type_litige} onChange={set("type_litige")}
                  onFocus={focusBlue} onBlur={blurBorder}>
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priorité</label>
                <select style={selectStyle} value={form.priorite} onChange={set("priorite")}
                  onFocus={focusBlue} onBlur={blurBorder}>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>N° Commande</label>
                <input style={inputStyle} placeholder="ex: 10042"
                  value={form.id_commande} onChange={set("id_commande")}
                  onFocus={focusBlue} onBlur={blurBorder} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Description <span style={{ color: "var(--rose)" }}>*</span>
              </label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: 90 }}
                placeholder="Décrivez le problème en détail…"
                value={form.description}
                onChange={set("description")}
                rows={4}
                onFocus={focusBlue} onBlur={blurBorder}
              />
            </div>

            {/* Form actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={cancelForm} className="erp-btn erp-btn-ghost erp-btn-sm">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="erp-btn erp-btn-primary erp-btn-sm">
                {submitting
                  ? <span className="erp-spin" style={{ width: 13, height: 13 }} />
                  : <Icon d={editingId ? Ic.check : Ic.send} size={13} />}
                {editingId ? "Enregistrer" : "Envoyer"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Add button ── */
          <button onClick={openNew} style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "10px 14px", marginBottom: 14,
            border: "1.5px dashed var(--border-2)", borderRadius: "var(--r-lg)",
            background: "transparent", cursor: "pointer",
            color: "var(--text-2)", fontSize: 13, fontWeight: 500,
            transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--blue)";
              e.currentTarget.style.color = "var(--blue)";
              e.currentTarget.style.background = "var(--blue-dim)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border-2)";
              e.currentTarget.style.color = "var(--text-2)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon d={Ic.plus} size={15} />
            Nouvelle déclaration
          </button>
        )}

        {/* ── Declaration cards ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <span className="erp-spin" style={{ width: 22, height: 22 }} />
          </div>
        ) : declarations.length === 0 && !showForm ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 10, padding: "36px 20px", color: "var(--muted)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "grid", placeItems: "center",
            }}>
              <Icon d={Ic.empty} size={20} />
            </div>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>
              Aucune déclaration avec ce fournisseur
            </span>
          </div>
        ) : declarations.map(d => {
          const isExpanded = expandedId === d.id;
          return (
            <div key={d.id} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)", marginBottom: 10, overflow: "hidden",
              transition: "border-color 0.15s, box-shadow 0.15s",
              boxShadow: isExpanded ? "0 2px 12px rgba(14,41,49,0.07)" : "none",
            }}>
              {/* Card header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", cursor: "pointer",
                }}
              >
                {/* Priority accent */}
                <div style={{
                  width: 3, height: 36, borderRadius: 99, flexShrink: 0,
                  background: (PRIO[d.priorite] || PRIO.basse).color,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 13, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 5,
                  }}>
                    {d.sujet}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <PrioBadge p={d.priorite} />
                    <TypeBadge t={d.type_litige} />
                    {d.id_commande && (
                      <span style={{
                        fontSize: 10.5, color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}>
                        #{d.id_commande}
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, color: "var(--muted)", marginLeft: "auto" }}>
                      {formatDate(d.created_at)}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <span style={{
                  color: "var(--muted)", transition: "transform 0.2s",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  display: "grid", placeItems: "center",
                }}>
                  <Icon d={Ic.chevron} size={14} />
                </span>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div style={{
                  borderTop: "1px solid var(--border)",
                  padding: "12px 14px 14px",
                  background: "var(--surface-2)",
                }}>
                  <p style={{
                    fontSize: 13, color: "var(--text-2)", lineHeight: 1.75,
                    marginBottom: 12,
                    borderLeft: "3px solid var(--border-2)",
                    paddingLeft: 12, margin: "0 0 12px",
                  }}>
                    {d.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(d)}
                      className="erp-btn erp-btn-ghost erp-btn-sm">
                      <Icon d={Ic.edit} size={12} /> Modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Right panel ─────────────────────────────────────────────────────────────
const RightPanel = ({ fournisseur, currentUser, showToast }) => {
  const [tab, setTab] = useState("chat");
  const name = fournisseurName(fournisseur);

  // Reset tab when switching fournisseur
  useEffect(() => { setTab("chat"); }, [fournisseur]);

  if (!fournisseur) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 14, color: "var(--muted)", background: "var(--bg)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "grid", placeItems: "center",
        }}>
          <Icon d={Ic.building} size={28} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 14.5, fontWeight: 600, color: "var(--text-2)",
            fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4,
          }}>
            Sélectionnez un fournisseur
          </div>
          <div style={{ fontSize: 12.5 }}>pour accéder au chat et aux déclarations</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Fournisseur header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 18px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <Avatar name={name} size={36}
          s={{ background: "linear-gradient(135deg, var(--blue) 0%, var(--teal) 100%)" }} />
        <div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
            fontSize: 14.5, color: "var(--text)", letterSpacing: "-0.01em",
          }}>
            {name}
          </div>
          {fournisseur.email && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
              {fournisseur.email}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <RightTabs active={tab} onChange={setTab} />

      {/* Content */}
      {tab === "chat" && (
        <ChatView
          fournisseur={fournisseur}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
      {tab === "declarations" && (
        <DeclarationsView
          fournisseur={fournisseur}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// ─── SupportPage root ─────────────────────────────────────────────────────────
const SupportPage = ({ showToast }) => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loadingF, setLoadingF]         = useState(true);
  const [selected, setSelected]         = useState(null);

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  });

  const toast = useCallback(
    (msg, type = "success") => { if (typeof showToast === "function") showToast(msg, type); },
    [showToast]
  );

  useEffect(() => {
    setLoadingF(true);
    API.get("/users/fournisseurs")
      .then(res => setFournisseurs(res.data || []))
      .catch(() => toast("Impossible de charger les fournisseurs.", "error"))
      .finally(() => setLoadingF(false));
  }, [toast]);

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - var(--topbar-h))",
      margin: "-28px",
      overflow: "hidden",
      borderTop: "1px solid var(--border)",
    }}>
      <FournisseurList
        fournisseurs={fournisseurs}
        selected={selected}
        onSelect={setSelected}
        loading={loadingF}
      />
      <RightPanel
        fournisseur={selected}
        currentUser={currentUser}
        showToast={toast}
      />
    </div>
  );
};

export default SupportPage;