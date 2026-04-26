import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

const fmt = (n) => parseFloat(n || 0).toFixed(3);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-TN") : "—";
const fullName = (...parts) => parts.filter(Boolean).join(" ") || "—";
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const jsonHeaders = () => ({ ...getHeaders(), "Content-Type": "application/json" });

const STATUT_MAP = {
  brouillon:  { bg: "#F1EFE8", color: "#5F5E5A", label: "Brouillon" },
  en_attente: { bg: "#FAEEDA", color: "#854F0B", label: "En attente" },
  "validée":  { bg: "#EAF3DE", color: "#3B6D11", label: "Validée" },
  "envoyée":  { bg: "#E6F1FB", color: "#185FA5", label: "Envoyée" },
  "payée":    { bg: "#E1F5EE", color: "#0F6E56", label: "Payée" },
  "reçue":    { bg: "#E1F5EE", color: "#0F6E56", label: "Reçue" },
  "annulée":  { bg: "#FCEBEB", color: "#A32D2D", label: "Annulée" },
};

const ELEC_MAP = {
  pending:   { bg: "#FAEEDA", color: "#854F0B", label: "En attente TTN" },
  submitted: { bg: "#E6F1FB", color: "#185FA5", label: "Soumise à TTN" },
  accepted:  { bg: "#EAF3DE", color: "#3B6D11", label: "Acceptée TTN" },
  rejected:  { bg: "#FCEBEB", color: "#A32D2D", label: "Rejetée TTN" },
};

const TABS = [
  { key: "facturesAchat", label: "Factures d'achat" },
  { key: "commandes",     label: "Commandes de vente" },
  { key: "facturesVente", label: "Factures de vente" },
];

/* ── Atoms ───────────────────────────────────────────────────── */

const Badge = ({ statut, map = STATUT_MAP }) => {
  const s = map[statut] || { bg: "#F1EFE8", color: "#5F5E5A", label: statut || "—" };
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 5, whiteSpace: "nowrap" }}>{s.label}</span>;
};

const IABadge = ({ score, alerte }) => {
  if (score == null) return <span style={{ color: "#b4b2a9", fontSize: 12 }}>—</span>;
  const pct = Math.round(score * 100);
  return <span style={{ background: alerte ? "#FCEBEB" : "#EAF3DE", color: alerte ? "#A32D2D" : "#3B6D11", fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 5 }}>{alerte ? `Alerte ${pct}%` : `OK ${pct}%`}</span>;
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  return <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: toast.type === "error" ? "#FCEBEB" : "#EAF3DE", color: toast.type === "error" ? "#A32D2D" : "#27500A", border: `0.5px solid ${toast.type === "error" ? "#F09595" : "#97C459"}` }}>{toast.msg}</div>;
};

const KpiCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "0.5px solid #e0dfd8", borderRadius: 10, padding: "16px 20px" }}>
    <div style={{ fontSize: 12, color: "#888780", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 500, color }}>{value ?? "—"}</div>
  </div>
);

const Th = ({ children }) => <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#888780", whiteSpace: "nowrap", borderBottom: "0.5px solid #e0dfd8" }}>{children}</th>;
const Td = ({ children, style }) => <td style={{ padding: "10px 14px", fontSize: 13, color: "#1a1a18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180, ...style }}>{children}</td>;

const Btn = ({ children, onClick, disabled, variant = "default", small }) => {
  const variants = {
    default: { background: "#fff",    color: "#1a1a18", borderColor: "#c0bfb8" },
    primary: { background: "#E6F1FB", color: "#0C447C", borderColor: "#85B7EB" },
    success: { background: "#EAF3DE", color: "#27500A", borderColor: "#97C459" },
    purple:  { background: "#F0EDFB", color: "#5B21B6", borderColor: "#C4B5FD" },
    orange:  { background: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" },
    danger:  { background: "#FCEBEB", color: "#A32D2D", borderColor: "#F09595" },
  };
  const v = variants[variant];
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? "5px 10px" : "7px 16px", border: `0.5px solid ${v.borderColor}`, borderRadius: 7, background: v.background, color: v.color, fontSize: small ? 11 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>{children}</button>;
};

/* ── Modal ───────────────────────────────────────────────────── */

const Modal = ({ onClose, children }) => (
  <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}>
    <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 700, margin: "0 16px 40px", padding: 24 }}>{children}</div>
  </div>
);

const ModalHead = ({ title, badges, onClose }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
    <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{badges}<button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888780", padding: "2px 6px" }}>✕</button></div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #f0efe8" }}>
    <span style={{ fontSize: 13, color: "#888780" }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: ".04em", margin: "18px 0 8px" }}>{children}</div>
);

const LignesTable = ({ cols, rows }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
    <thead><tr style={{ borderBottom: "0.5px solid #e0dfd8" }}>{cols.map(c => <th key={c} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: "#888780", fontSize: 12 }}>{c}</th>)}</tr></thead>
    <tbody>
      {rows.length === 0 && <tr><td colSpan={cols.length} style={{ padding: "20px 10px", color: "#b4b2a9", textAlign: "center" }}>Aucune ligne</td></tr>}
      {rows.map((row, i) => <tr key={i} style={{ borderBottom: "0.5px solid #f0efe8" }}>{row.map((cell, j) => <td key={j} style={{ padding: "8px 10px" }}>{cell}</td>)}</tr>)}
    </tbody>
  </table>
);

/* ── Modal Facture Achat ─────────────────────────────────────── */

const ModalFactureAchat = ({ data, onClose }) => {
  const { facture: f, details = [] } = data;
  return (
    <Modal onClose={onClose}>
      <ModalHead title={f.num_facture} badges={<Badge statut={f.statut} />} onClose={onClose} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <DetailRow label="Fournisseur"    value={fullName(f.fournisseur_nom, f.fournisseur_prenom)} />
          <DetailRow label="Date création"  value={fmtDate(f.date_creation)} />
          <DetailRow label="Date réception" value={fmtDate(f.date_reception)} />
          <DetailRow label="Date échéance"  value={fmtDate(f.date_echeance)} />
        </div>
        <div>
          <DetailRow label="Total HT"  value={`${fmt(f.total_ht)} DT`} />
          <DetailRow label="TVA"       value={`${fmt(f.tva)} DT`} />
          <DetailRow label="FODEC"     value={`${fmt(f.fodec)} DT`} />
          <DetailRow label="Total TTC" value={`${fmt(f.total_ttc)} DT`} />
        </div>
      </div>
      <SectionLabel>Lignes de détail</SectionLabel>
      <LignesTable cols={["Produit", "Qté", "Prix HT", "Total HT"]} rows={details.map(d => [d.nom_produit || "—", d.quantite, `${fmt(d.prix_unitaire_ht)} DT`, `${fmt(d.total_ht_ligne)} DT`])} />
    </Modal>
  );
};

/* ── Modal Commande ──────────────────────────────────────────── */

const ModalCommande = ({ data, onClose, onValider }) => {
  const { commande: c, details = [] } = data;
  const [loading, setLoading] = useState(false);

  const handleValider = async () => {
    setLoading(true);
    await onValider(c.id);
    setLoading(false);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHead title={c.num_ordre} badges={<><IABadge score={c.score_ia_confiance} alerte={c.alerte_fraude_ia} /><Badge statut={c.statut} /></>} onClose={onClose} />
      {c.alerte_fraude_ia && <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", color: "#A32D2D", fontSize: 13, marginBottom: 16 }}>Alerte fraude IA — vérifier les prix et quantités avant validation.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <DetailRow label="Client"          value={fullName(c.client_nom, c.client_prenom) || c.client_identifiant || "—"} />
          <DetailRow label="Commercial"      value={fullName(c.commercial_nom, c.commercial_prenom)} />
          <DetailRow label="Date création"   value={fmtDate(c.date_creation)} />
          <DetailRow label="Date validation" value={fmtDate(c.date_validation)} />
        </div>
        <div>
          <DetailRow label="Total HT"  value={`${fmt(c.total_ht)} DT`} />
          <DetailRow label="TVA"       value={`${fmt(c.tva)} DT`} />
          <DetailRow label="FODEC"     value={`${fmt(c.fodec)} DT`} />
          <DetailRow label="Total TTC" value={`${fmt(c.total_ttc)} DT`} />
        </div>
      </div>
      <SectionLabel>Lignes</SectionLabel>
      <LignesTable cols={["Produit", "Qté", "Prix HT", "Total HT"]} rows={details.map(d => [d.nom_produit || "—", d.quantite, `${fmt(d.prix_unitaire_ht_ap)} DT`, `${fmt(d.total_ht_ligne)} DT`])} />
      {c.statut === "en_attente" && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "0.5px solid #e0dfd8" }}>
          <Btn variant="success" onClick={handleValider} disabled={loading}>{loading ? "Validation..." : "Valider la commande"}</Btn>
        </div>
      )}
    </Modal>
  );
};

/* ── Modal Facture Vente ─────────────────────────────────────── */

const ModalFactureVente = ({ data, onClose, showToast, onRefresh }) => {
  const { facture: f, details = [] } = data;

  const [xmlSans,     setXmlSans]     = useState(null);
  const [xmlAvec,     setXmlAvec]     = useState(null);
  const [loadingSans, setLoadingSans] = useState(false);
  const [loadingAvec, setLoadingAvec] = useState(false);
  const [loadingSign, setLoadingSign] = useState(false);
  const [loadingTTN,  setLoadingTTN]  = useState(false);
  const [loadingStat, setLoadingStat] = useState(false);
  const [signed,      setSigned]      = useState(!!f.signature_tunstrust);
  const [elecStatus,  setElecStatus]  = useState(f.status_electronique);
  const [ttnMsg,      setTtnMsg]      = useState(f.tnn_message || null);

  const estPayee = f.statut === "payée";

  const download = (xml, suffix) => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `facture_teif_${f.num_facture}_${suffix}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  const genererSansSignature = async () => {
    setLoadingSans(true);
    try {
      const res  = await fetch(`${API}/factures/${f.id}/xml`, { headers: getHeaders() });
      setXmlSans(await res.text());
    } catch { showToast("Erreur génération XML", "error"); }
    finally { setLoadingSans(false); }
  };

  const genererAvecSignature = async () => {
    setLoadingAvec(true);
    try {
      const res = await fetch(`${API}/factures/${f.id}/xml/signed`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json(); showToast(e.message || "Erreur", "error"); return; }
      setXmlAvec(await res.text());
    } catch { showToast("Erreur génération XML signé", "error"); }
    finally { setLoadingAvec(false); }
  };

  const signerFacture = async () => {
    setLoadingSign(true);
    try {
      const res  = await fetch(`${API}/factures/${f.id}/signer`, { method: "POST", headers: getHeaders() });
      const data = await res.json();
      if (data.success) { setSigned(true); setElecStatus("pending"); showToast(`Facture signée`); onRefresh(); }
      else showToast(data.message || "Erreur signature", "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setLoadingSign(false); }
  };

  // ── Envoyer à TTN ──
  const envoyerTTN = async () => {
    setLoadingTTN(true);
    try {
      const res  = await fetch(`${API}/factures/${f.id}/envoyer-ttn`, { method: "POST", headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setElecStatus("submitted");
        setTtnMsg(data.ttnMessage || null);
        showToast(`Facture envoyée à TTN — idSaveEfact: ${data.idSaveEfact || "—"}`);
        onRefresh();
      } else {
        showToast(data.message || "Erreur envoi TTN", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setLoadingTTN(false); }
  };

  // ── Vérifier statut TTN ──
  const verifierStatutTTN = async () => {
    setLoadingStat(true);
    try {
      const res  = await fetch(`${API}/factures/${f.id}/statut-ttn`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setElecStatus(data.status);
        showToast(`Statut TTN : ${data.status}`);
        onRefresh();
      } else {
        showToast(data.message || "Erreur statut", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setLoadingStat(false); }
  };

  const peutSigner    = estPayee && !signed;
  const peutEnvoyer   = estPayee && signed && (!elecStatus || elecStatus === "pending");
  const peutVerifier  = elecStatus === "submitted";

  return (
    <Modal onClose={onClose}>
      <ModalHead
        title={f.num_facture}
        badges={
          <>
            <Badge statut={f.statut} />
            {elecStatus && <Badge statut={elecStatus} map={ELEC_MAP} />}
            {signed && <span style={{ background: "#F0EDFB", color: "#5B21B6", fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 5 }}>Signée</span>}
          </>
        }
        onClose={onClose}
      />

      {/* Détails */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <DetailRow label="Client"        value={fullName(f.client_nom, f.client_prenom) || "—"} />
          <DetailRow label="Commercial"    value={fullName(f.commercial_nom, f.commercial_prenom)} />
          <DetailRow label="Date création" value={fmtDate(f.date_creation)} />
          <DetailRow label="Date envoi"    value={fmtDate(f.date_envoi)} />
        </div>
        <div>
          <DetailRow label="Total HT"  value={`${fmt(f.total_ht)} DT`} />
          <DetailRow label="TVA"       value={`${fmt(f.tva)} DT`} />
          <DetailRow label="FODEC"     value={`${fmt(f.fodec)} DT`} />
          <DetailRow label="Total TTC" value={`${fmt(f.total_ttc)} DT`} />
        </div>
      </div>

      {/* Lignes */}
      <SectionLabel>Lignes</SectionLabel>
      <LignesTable
        cols={["Produit", "Qté", "Prix HT", "TVA %", "Total HT"]}
        rows={details.map(d => [d.nom_produit || "—", d.quantite, `${fmt(d.prix_unitaire_ht_ap)} DT`, `${d.taux_tva ?? "—"}%`, `${fmt(d.total_ht_ligne)} DT`])}
      />

      {/* ── Actions disponibles seulement si payée ── */}
      {!estPayee && (
        <div style={{ marginTop: 20, padding: "10px 14px", background: "#F1EFE8", borderRadius: 8, fontSize: 13, color: "#888780" }}>
          La signature, génération XML et envoi TTN sont disponibles uniquement pour les factures <strong>payées</strong>.
        </div>
      )}

      {estPayee && (
        <>
          {/* ── Signature TunTrust ── */}
          <SectionLabel>Signature électronique TunTrust</SectionLabel>
          {peutSigner ? (
            <>
              <div style={{ background: "#F0EDFB", border: "0.5px solid #C4B5FD", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#5B21B6" }}>
                Branchez la clé USB TunTrust avant de signer.
              </div>
              <Btn variant="purple" onClick={signerFacture} disabled={loadingSign}>
                {loadingSign ? "Signature en cours..." : "Signer avec TunTrust"}
              </Btn>
            </>
          ) : (
            <div style={{ background: "#EAF3DE", border: "0.5px solid #97C459", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#3B6D11" }}>
              Facture signée via TunTrust.
            </div>
          )}

          {/* ── Envoi TTN ── */}
          <SectionLabel>Envoi à TTN (elfatoora)</SectionLabel>

          {/* Statut TTN actuel */}
          {elecStatus && (
            <div style={{ background: ELEC_MAP[elecStatus]?.bg || "#F1EFE8", border: `0.5px solid ${elecStatus === "accepted" ? "#97C459" : elecStatus === "rejected" ? "#F09595" : "#FCD34D"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: ELEC_MAP[elecStatus]?.color || "#5F5E5A" }}>
              Statut TTN : <strong>{ELEC_MAP[elecStatus]?.label || elecStatus}</strong>
              {ttnMsg && <div style={{ fontSize: 11, marginTop: 4, opacity: .8 }}>{ttnMsg}</div>}
            </div>
          )}

          {/* Bouton Envoyer à TTN */}
          {peutEnvoyer && (
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <Btn variant="orange" onClick={envoyerTTN} disabled={loadingTTN}>
                {loadingTTN ? "Envoi en cours..." : "Envoyer à TTN"}
              </Btn>
            </div>
          )}

          {/* Bouton Vérifier statut */}
          {peutVerifier && (
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <Btn variant="primary" onClick={verifierStatutTTN} disabled={loadingStat}>
                {loadingStat ? "Vérification..." : "Vérifier statut TTN"}
              </Btn>
            </div>
          )}

          {/* Message si acceptée ou rejetée */}
          {elecStatus === "accepted" && (
            <div style={{ background: "#EAF3DE", border: "0.5px solid #97C459", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#3B6D11", marginTop: 8 }}>
              Facture acceptée par TTN — réf: <strong>{f.code_qr || "—"}</strong>
            </div>
          )}
          {elecStatus === "rejected" && (
            <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D", marginTop: 8 }}>
              Facture rejetée par TTN — voir les acquittements pour les erreurs.
            </div>
          )}

          {/* ── Génération XML ── */}
          <SectionLabel>Génération XML TEIF</SectionLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="primary" onClick={genererSansSignature} disabled={loadingSans}>
              {loadingSans ? "Génération..." : "XML sans signature"}
            </Btn>
            <Btn variant="purple" onClick={genererAvecSignature} disabled={loadingAvec}>
              {loadingAvec ? "Signature + génération..." : "XML avec signature"}
            </Btn>
          </div>

          {xmlSans && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#888780", fontWeight: 500 }}>XML SANS SIGNATURE</span>
                <Btn variant="default" small onClick={() => download(xmlSans, "sans_signature")}>Télécharger</Btn>
              </div>
              <pre style={{ background: "#f9f9f7", border: "0.5px solid #e0dfd8", borderRadius: 8, padding: 12, fontSize: 11, overflowX: "auto", maxHeight: 180, margin: 0, color: "#185FA5", fontFamily: "monospace" }}>{xmlSans}</pre>
            </div>
          )}

          {xmlAvec && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#5B21B6", fontWeight: 500 }}>XML AVEC SIGNATURE TUNTRUST</span>
                <Btn variant="default" small onClick={() => download(xmlAvec, "avec_signature")}>Télécharger</Btn>
              </div>
              <pre style={{ background: "#F0EDFB", border: "0.5px solid #C4B5FD", borderRadius: 8, padding: 12, fontSize: 11, overflowX: "auto", maxHeight: 180, margin: 0, color: "#5B21B6", fontFamily: "monospace" }}>{xmlAvec}</pre>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

/* ── Main Dashboard ──────────────────────────────────────────── */

export default function DashboardComptable() {
  const [tab,     setTab]     = useState("facturesAchat");
  const [data,    setData]    = useState({ facturesAchat: [], commandes: [], facturesVente: [] });
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const [fa, fv, cmd] = await Promise.all([
        fetch(`${API}/factures/achat`,  { headers }).then(r => r.json()),
        fetch(`${API}/factures`,        { headers }).then(r => r.json()),
        fetch(`${API}/commandes`,       { headers }).then(r => r.json()),
      ]);
      setData({ facturesAchat: fa.data || [], facturesVente: fv.data || [], commandes: cmd.data || [] });
    } catch { showToast("Erreur chargement", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openFactureAchat = async (row) => {
    const res = await fetch(`${API}/factures/achat/${row.id}`, { headers: getHeaders() }).then(r => r.json());
    setModal({ type: "factureAchat", data: res.data });
  };

  const openCommande = async (row) => {
    const res = await fetch(`${API}/commandes/${row.id}`, { headers: getHeaders() }).then(r => r.json());
    setModal({ type: "commande", data: res.data });
  };

  const openFactureVente = async (row) => {
    const res = await fetch(`${API}/factures/${row.id}`, { headers: getHeaders() }).then(r => r.json());
    setModal({ type: "factureVente", data: res.data });
  };

  const validerCommande = async (id) => {
    try {
      const res = await fetch(`${API}/commandes/${id}/valider`, { method: "POST", headers: getHeaders() }).then(r => r.json());
      if (res.success) { showToast("Commande validée — facture créée"); setModal(null); fetchAll(); }
      else showToast(res.message || "Erreur", "error");
    } catch { showToast("Erreur réseau", "error"); }
  };

  const alertes = data.commandes.filter(c => c.alerte_fraude_ia).length;
  const trStyle = { borderBottom: "0.5px solid #f0efe8", cursor: "pointer" };
  const onHover = (e, on) => { e.currentTarget.style.background = on ? "#f9f9f7" : ""; };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f3", fontFamily: "system-ui, sans-serif", color: "#1a1a18" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#fff", borderRight: "0.5px solid #e0dfd8", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", fontSize: 15, fontWeight: 500, borderBottom: "0.5px solid #e0dfd8", marginBottom: 16 }}>
          ERP <span style={{ color: "#185FA5" }}>Comptable</span>
        </div>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer", fontSize: 13, color: tab === t.key ? "#185FA5" : "#5F5E5A", fontWeight: tab === t.key ? 500 : 400, background: tab === t.key ? "#E6F1FB" : "transparent", borderLeft: `2px solid ${tab === t.key ? "#185FA5" : "transparent"}` }}>
            {t.label}
            {t.key === "commandes" && alertes > 0 && <span style={{ marginLeft: "auto", background: "#FCEBEB", color: "#A32D2D", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10 }}>{alertes}</span>}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28, overflowX: "hidden" }}>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>{TABS.find(t => t.key === tab)?.label}</div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <KpiCard label="Factures d'achat"   value={data.facturesAchat.length} color="#185FA5" />
          <KpiCard label="Commandes de vente" value={data.commandes.length}     color="#0F6E56" />
          <KpiCard label="Factures de vente"  value={data.facturesVente.length} color="#854F0B" />
          <KpiCard label="Alertes fraude IA"  value={alertes}                   color="#A32D2D" />
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid #e0dfd8", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #e0dfd8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{TABS.find(t => t.key === tab)?.label}</span>
            <button onClick={fetchAll} disabled={loading} style={{ padding: "6px 12px", border: "0.5px solid #c0bfb8", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12 }}>{loading ? "..." : "↻ Actualiser"}</button>
          </div>
          <div style={{ overflowX: "auto" }}>

            {tab === "facturesAchat" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>N° Facture</Th><Th>Fournisseur</Th><Th>Total TTC</Th><Th>Date</Th><Th>Échéance</Th><Th>Statut</Th></tr></thead>
                <tbody>
                  {!data.facturesAchat.length && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#b4b2a9" }}>Aucune facture d'achat</td></tr>}
                  {data.facturesAchat.map(r => (
                    <tr key={r.id} style={trStyle} onClick={() => openFactureAchat(r)} onMouseEnter={e => onHover(e, true)} onMouseLeave={e => onHover(e, false)}>
                      <Td>{r.num_facture || "—"}</Td><Td>{fullName(r.fournisseur_nom, r.fournisseur_prenom)}</Td>
                      <Td>{fmt(r.total_ttc)} DT</Td><Td>{fmtDate(r.date_creation)}</Td>
                      <Td>{fmtDate(r.date_echeance)}</Td><Td><Badge statut={r.statut} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "commandes" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>N° Ordre</Th><Th>Client</Th><Th>Commercial</Th><Th>Total TTC</Th><Th>Statut</Th><Th>Score IA</Th><Th>Date</Th></tr></thead>
                <tbody>
                  {!data.commandes.length && <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#b4b2a9" }}>Aucune commande</td></tr>}
                  {data.commandes.map(r => (
                    <tr key={r.id} style={{ ...trStyle, background: r.alerte_fraude_ia ? "#fffaf9" : "" }} onClick={() => openCommande(r)} onMouseEnter={e => onHover(e, true)} onMouseLeave={e => { e.currentTarget.style.background = r.alerte_fraude_ia ? "#fffaf9" : ""; }}>
                      <Td>{r.num_ordre || "—"}</Td><Td>{fullName(r.client_nom, r.client_prenom) || r.client_identifiant || "—"}</Td>
                      <Td>{fullName(r.commercial_nom, r.commercial_prenom)}</Td><Td>{fmt(r.total_ttc)} DT</Td>
                      <Td><Badge statut={r.statut} /></Td><Td><IABadge score={r.score_ia_confiance} alerte={r.alerte_fraude_ia} /></Td>
                      <Td>{fmtDate(r.date_creation)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "facturesVente" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>N° Facture</Th><Th>Client</Th><Th>Total TTC</Th><Th>Statut</Th><Th>TTN</Th><Th>Signée</Th><Th>Date</Th></tr></thead>
                <tbody>
                  {!data.facturesVente.length && <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#b4b2a9" }}>Aucune facture de vente</td></tr>}
                  {data.facturesVente.map(r => (
                    <tr key={r.id} style={trStyle} onClick={() => openFactureVente(r)} onMouseEnter={e => onHover(e, true)} onMouseLeave={e => onHover(e, false)}>
                      <Td>{r.num_facture || "—"}</Td>
                      <Td>{fullName(r.client_nom, r.client_prenom)}</Td>
                      <Td>{fmt(r.total_ttc)} DT</Td>
                      <Td><Badge statut={r.statut} /></Td>
                      <Td>{r.status_electronique ? <Badge statut={r.status_electronique} map={ELEC_MAP} /> : <span style={{ color: "#b4b2a9", fontSize: 12 }}>—</span>}</Td>
                      <Td>{r.signature_tunstrust ? <span style={{ color: "#5B21B6", fontSize: 11, fontWeight: 500 }}>✓</span> : <span style={{ color: "#b4b2a9", fontSize: 12 }}>—</span>}</Td>
                      <Td>{fmtDate(r.date_creation)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {modal?.type === "factureAchat" && <ModalFactureAchat data={modal.data} onClose={() => setModal(null)} />}
      {modal?.type === "commande"     && <ModalCommande     data={modal.data} onClose={() => setModal(null)} onValider={validerCommande} />}
      {modal?.type === "factureVente" && <ModalFactureVente data={modal.data} onClose={() => setModal(null)} showToast={showToast} onRefresh={fetchAll} />}

      <Toast toast={toast} />
    </div>
  );
}