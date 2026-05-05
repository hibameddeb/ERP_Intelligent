import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

@keyframes pmFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes pmSlideUp { from{transform:translateY(30px) scale(0.96);opacity:0} to{transform:none;opacity:1} }
@keyframes pmSpin    { to{transform:rotate(360deg)} }
@keyframes pmPulse   { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes pmBounce  { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes pmBar     { from{width:0} to{width:100%} }
@keyframes pmFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

.pm-overlay {
  position:fixed;inset:0;background:rgba(8,24,29,0.72);
  display:flex;align-items:center;justify-content:center;
  z-index:3000;animation:pmFadeIn 0.2s ease;padding:12px;backdrop-filter:blur(12px);
}
.pm-modal {
  background:#F0EEEB;border-radius:24px;
  width:1080px;max-width:100%;height:88vh;max-height:760px;
  display:flex;flex-direction:column;
  border:1px solid #C4BFB9;overflow:hidden;
  animation:pmSlideUp 0.28s cubic-bezier(0.16,1,0.3,1);
  box-shadow:0 32px 80px rgba(8,24,29,0.28);
}

/* Header */
.pm-header {
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 28px;
  background:linear-gradient(135deg,#0E2931 0%,#12484C 100%);
  flex-shrink:0;
}
.pm-header-left { display:flex;align-items:center;gap:14px; }
.pm-header-icon {
  width:46px;height:46px;border-radius:13px;
  background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.pm-header-title { font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.03em; }
.pm-header-sub   { font-size:12.5px;color:rgba(255,255,255,0.5);margin-top:2px; }
.pm-header-right { display:flex;align-items:center;gap:10px; }
.pm-sandbox-badge {
  display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;
  background:rgba(255,255,255,0.10);color:rgba(255,255,255,0.85);
  font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,0.15);
}
.pm-sandbox-dot { width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;animation:pmPulse 2s ease-in-out infinite; }
.pm-close-btn {
  width:34px;height:34px;border-radius:10px;
  border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);
  color:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:17px;transition:all 0.15s;flex-shrink:0;
}
.pm-close-btn:hover{color:#fff;background:rgba(255,255,255,0.18);}

/* Body */
.pm-body { display:flex;flex:1;overflow:hidden;min-height:0; }

/* Left */
.pm-left {
  width:340px;min-width:340px;background:#fff;
  border-right:1px solid #D6D2CE;
  display:flex;flex-direction:column;overflow-y:auto;
}
.pm-amount-hero {
  padding:28px 24px 24px;
  background:linear-gradient(160deg,#2B7574 0%,#0E2931 100%);
  position:relative;overflow:hidden;flex-shrink:0;
}
.pm-amount-hero::after {
  content:'';position:absolute;width:180px;height:180px;border-radius:50%;
  background:rgba(255,255,255,0.04);right:-50px;bottom:-60px;pointer-events:none;
}
.pm-amount-eyebrow {
  font-size:10px;font-weight:600;color:rgba(255,255,255,0.55);
  text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;
  font-family:'Plus Jakarta Sans',sans-serif;position:relative;
}
.pm-amount-row   { display:flex;align-items:baseline;gap:8px;position:relative; }
.pm-amount-value { font-family:'Plus Jakarta Sans',sans-serif;font-size:42px;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1; }
.pm-amount-currency { font-size:20px;font-weight:600;color:rgba(255,255,255,0.65); }
.pm-amount-sub   { font-size:11.5px;color:rgba(255,255,255,0.45);margin-top:8px;position:relative; }
.pm-amount-chips { display:flex;gap:6px;flex-wrap:wrap;margin-top:16px;position:relative; }
.pm-amount-chip  {
  padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;
  background:rgba(255,255,255,0.10);color:rgba(255,255,255,0.75);
  border:1px solid rgba(255,255,255,0.12);
}
.pm-left-body    { padding:20px 24px;display:flex;flex-direction:column;gap:20px; }
.pm-section-label {
  font-size:10px;font-weight:700;color:#7a98a4;
  text-transform:uppercase;letter-spacing:0.12em;
  font-family:'Plus Jakarta Sans',sans-serif;margin-bottom:10px;
}
.pm-fournisseur-card {
  display:flex;align-items:center;gap:12px;padding:14px;
  background:#F6F4F1;border:1px solid #E8E4E0;border-radius:12px;
}
.pm-avatar {
  width:42px;height:42px;border-radius:11px;
  background:linear-gradient(135deg,#2B7574,#0E2931);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-weight:700;font-size:15px;flex-shrink:0;
  box-shadow:0 4px 12px rgba(43,117,116,0.25);
}
.pm-fournisseur-name { font-weight:700;font-size:13.5px;color:#0E2931;font-family:'Plus Jakarta Sans',sans-serif; }
.pm-fournisseur-meta { font-size:11.5px;color:#7a98a4;margin-top:2px; }
.pm-info-card    { background:#F6F4F1;border:1px solid #E8E4E0;border-radius:12px;overflow:hidden; }
.pm-info-row     { display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-bottom:1px solid #EDEAE7; }
.pm-info-row:last-child { border-bottom:none; }
.pm-info-label   { color:#7a98a4;font-size:12px;font-weight:500; }
.pm-info-value   { color:#0E2931;font-weight:600;font-size:12px;text-align:right; }
.pm-info-mono    { font-family:'JetBrains Mono',monospace;font-size:11px; }
.pm-info-badge   {
  padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:700;
  background:rgba(160,107,26,0.10);color:#a06b1a;
  border:1px solid rgba(160,107,26,0.2);
}
.pm-stamp {
  display:flex;align-items:center;gap:10px;padding:10px 12px;
  background:#F6F4F1;border:1px solid #E8E4E0;border-radius:10px;
  font-size:12px;color:#3d6372;font-weight:500;margin-bottom:8px;
}
.pm-stamp:last-child { margin-bottom:0; }

/* Right */
.pm-right { flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;background:#F6F4F1; }

/* Method bar */
.pm-method-bar   { padding:22px 28px 0;flex-shrink:0; }
.pm-method-bar-title { font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#0E2931;margin-bottom:16px;letter-spacing:-0.02em; }
.pm-methods      { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px; }
.pm-method-btn {
  display:flex;align-items:flex-start;gap:12px;padding:18px;border-radius:16px;
  border:2px solid #D6D2CE;background:#fff;
  cursor:pointer;transition:all 0.18s;text-align:left;position:relative;overflow:hidden;
}
.pm-method-btn:hover { border-color:#2B7574;transform:translateY(-2px);box-shadow:0 8px 24px rgba(43,117,116,0.14); }
.pm-method-btn.active {
  border-color:#2B7574;background:#fff;
  box-shadow:0 0 0 3px rgba(43,117,116,0.12),0 10px 28px rgba(43,117,116,0.16);
  transform:translateY(-2px);
}
.pm-method-icon  { width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px; }
.pm-method-texts { flex:1;min-width:0; }
.pm-method-name  { font-weight:700;font-size:14px;color:#0E2931;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-0.01em; }
.pm-method-desc  { font-size:12px;color:#7a98a4;margin-top:3px;line-height:1.4; }
.pm-method-tag   { font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;white-space:nowrap;margin-top:8px;display:inline-block;letter-spacing:0.03em; }
.pm-tag-live     { background:rgba(43,117,116,0.10);color:#2B7574;border:1px solid rgba(43,117,116,0.2); }
.pm-tag-demo     { background:rgba(160,107,26,0.10);color:#a06b1a;border:1px solid rgba(160,107,26,0.2); }
.pm-method-check {
  position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;
  background:#2B7574;display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity 0.15s;
}
.pm-method-btn.active .pm-method-check { opacity:1; }

/* Content */
.pm-content {
  flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;
  margin:0 28px 24px;background:#fff;border-radius:18px;border:1px solid #D6D2CE;
}

/* Center states */
.pm-center {
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:18px;padding:40px 32px;text-align:center;
}
.pm-spinner {
  width:56px;height:56px;border:3.5px solid #E8E4E0;
  border-top-color:#2B7574;border-radius:50%;animation:pmSpin 0.75s linear infinite;
}
.pm-success-circle {
  width:86px;height:86px;border-radius:50%;
  background:linear-gradient(135deg,rgba(18,72,76,0.12),rgba(43,117,116,0.07));
  display:flex;align-items:center;justify-content:center;
  animation:pmBounce 0.55s cubic-bezier(0.16,1,0.3,1);
  border:2px solid rgba(18,72,76,0.18);box-shadow:0 0 0 10px rgba(18,72,76,0.05);
}
.pm-error-circle {
  width:86px;height:86px;border-radius:50%;
  background:rgba(134,18,17,0.08);display:flex;align-items:center;justify-content:center;
  animation:pmBounce 0.55s cubic-bezier(0.16,1,0.3,1);
  border:2px solid rgba(134,18,17,0.18);box-shadow:0 0 0 10px rgba(134,18,17,0.04);
}
.pm-center-title { font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px;letter-spacing:-0.03em;color:#0E2931; }
.pm-center-sub   { font-size:13.5px;color:#7a98a4;line-height:1.7;max-width:380px; }
.pm-success-pill {
  padding:11px 22px;border-radius:11px;font-size:13.5px;font-weight:700;
  background:rgba(18,72,76,0.08);color:#12484C;
  border:1px solid rgba(18,72,76,0.15);
}

/* Email sent box */
.pm-email-box {
  background:#F6F4F1;border:1px solid #D6D2CE;border-radius:14px;
  padding:20px 24px;text-align:center;max-width:400px;
}
.pm-email-icon {
  width:64px;height:64px;border-radius:50%;
  background:rgba(43,117,116,0.10);border:2px solid rgba(43,117,116,0.18);
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 14px;font-size:28px;
  animation:pmBounce 0.55s cubic-bezier(0.16,1,0.3,1);
}
.pm-email-title  { font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px;color:#0E2931;margin-bottom:6px;letter-spacing:-0.02em; }
.pm-email-addr   {
  display:inline-flex;align-items:center;gap:6px;
  background:#fff;border:1px solid #D6D2CE;border-radius:8px;
  padding:7px 14px;font-family:'JetBrains Mono',monospace;font-size:12px;
  color:#2B7574;font-weight:600;margin:10px 0;
}
.pm-email-note   { font-size:12px;color:#7a98a4;line-height:1.6; }

/* Demo */
.pm-demo-wrap    { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:16px; }
.pm-demo-card    { width:100%;max-width:480px;background:#fff;border:1px solid #D6D2CE;border-radius:18px;overflow:hidden; }
.pm-demo-card-header {
  padding:22px 26px;background:linear-gradient(135deg,#2B7574 0%,#0E2931 100%);
  text-align:center;position:relative;overflow:hidden;
}
.pm-demo-card-header::after {
  content:'🧪';position:absolute;right:22px;top:50%;transform:translateY(-50%);
  font-size:34px;opacity:0.25;animation:pmFloat 3s ease-in-out infinite;
}
.pm-demo-card-title  { font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px;color:#fff;letter-spacing:-0.02em; }
.pm-demo-card-sub    { font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px; }
.pm-demo-card-body   { padding:26px; }
.pm-demo-amount-box  {
  background:#F6F4F1;border:1px solid #E8E4E0;border-radius:13px;
  padding:22px;text-align:center;margin-bottom:22px;
}
.pm-demo-amount-label { font-size:11px;font-weight:600;color:#7a98a4;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px; }
.pm-demo-amount-val   { font-size:38px;font-weight:800;color:#0E2931;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-0.04em; }
.pm-demo-amount-curr  { font-size:18px;font-weight:600;color:#7a98a4;margin-left:5px; }
.pm-demo-warning {
  display:flex;align-items:flex-start;gap:10px;
  background:rgba(160,107,26,0.07);border:1px solid rgba(160,107,26,0.18);
  border-radius:11px;padding:13px 15px;margin-bottom:22px;
  font-size:12.5px;color:#a06b1a;line-height:1.55;
}
.pm-demo-confirm-btn {
  width:100%;padding:17px;border-radius:13px;
  background:linear-gradient(135deg,#2B7574,#12484C);color:#fff;border:none;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  gap:8px;transition:all 0.18s;letter-spacing:-0.02em;
  box-shadow:0 4px 16px rgba(43,117,116,0.30);
}
.pm-demo-confirm-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(43,117,116,0.38);}
.pm-demo-confirm-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;}

.pm-progress-bar { width:280px;height:5px;background:#E8E4E0;border-radius:99px;overflow:hidden; }
.pm-progress-fill { height:100%;background:linear-gradient(90deg,#2B7574,#4ade80);border-radius:99px;animation:pmBar 2.2s cubic-bezier(0.4,0,0.2,1) forwards; }

.pm-back-link {
  background:none;border:none;color:#7a98a4;font-size:12.5px;
  cursor:pointer;display:flex;align-items:center;gap:4px;transition:color 0.15s;padding:4px 0;
}
.pm-back-link:hover{color:#0E2931;}
.pm-retry-btn {
  padding:12px 32px;border-radius:11px;background:#2B7574;color:#fff;border:none;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;
  cursor:pointer;transition:all 0.15s;box-shadow:0 4px 14px rgba(43,117,116,0.25);
}
.pm-retry-btn:hover{background:#12484C;transform:translateY(-1px);}

/* Polling bar */
.pm-polling-bar {
  display:flex;align-items:center;gap:10px;padding:10px 20px;
  background:#F6F4F1;border-top:1px solid #D6D2CE;
  font-size:12px;color:#7a98a4;flex-shrink:0;border-radius:0 0 18px 18px;
}
.pm-dot { width:8px;height:8px;border-radius:50%;background:#2B7574;flex-shrink:0;animation:pmPulse 1.4s ease-in-out infinite; }

/* Footer */
.pm-footer {
  padding:11px 28px;font-size:11px;color:#7a98a4;
  text-align:center;border-top:1px solid #D6D2CE;background:#fff;
  display:flex;align-items:center;justify-content:center;gap:16px;flex-shrink:0;
}
.pm-footer-dot { color:#C4BFB9; }

@media(max-width:800px){
  .pm-body{flex-direction:column;}
  .pm-left{width:100%;min-width:0;border-right:none;border-bottom:1px solid #D6D2CE;max-height:280px;}
  .pm-methods{grid-template-columns:1fr;}
  .pm-modal{border-radius:18px;height:96vh;max-height:none;}
  .pm-amount-value{font-size:30px;}
  .pm-method-bar,.pm-content{margin-left:16px;margin-right:16px;}
}
`;

// ─── SVG helpers ──────────────────────────────────────────────────────────────
const CheckSvg = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#12484C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const XSvg = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#861211" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SmCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const ConfirmCheck = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentModal({ facture, onPaid, onClose }) {
  const [step, setStep]               = useState("choose");
  const [activeMethod, setActiveMethod] = useState(null);
  const [sentEmail, setSentEmail]     = useState("");
  const [errMsg, setErrMsg]           = useState("");
  const [showBar, setShowBar]         = useState(false);
  const pollingRef = useRef(null);

  const initiales = `${facture?.fournisseur_prenom?.[0] || ""}${facture?.fournisseur_nom?.[0] || ""}`.toUpperCase() || "F";

  useEffect(() => () => clearInterval(pollingRef.current), []);

  // ══════════════════════════════════════════════════════════════════════════
  // ✅ VRAI FLUX : Admin clique "Payer via Konnect"
  //    → Backend génère lien → Envoie EMAIL au fournisseur
  //    → Admin voit "✅ Email envoyé à fournisseur@..."
  //    → Fournisseur reçoit email → clique lien → saisit SES coordonnées
  //    → Webhook confirme → facture = payée
  // ══════════════════════════════════════════════════════════════════════════
  const handleKonnect = async () => {
    setActiveMethod("konnect");
    setStep("sending"); // Affiche spinner "Envoi en cours..."
    try {
      const res = await API.post(`/payment/facture/${facture.id}/initier`);
      // Backend a généré le lien ET envoyé l'email au fournisseur
      setSentEmail(res.data.email || facture?.fournisseur_email);
      setStep("email_sent"); // Affiche "✅ Lien envoyé !"

      // Polling pour détecter quand le fournisseur a payé
      pollingRef.current = setInterval(async () => {
        try {
          const r = await API.get(`/payment/facture/${facture.id}/verifier`);
          if (r.data.statut === "payée") {
            clearInterval(pollingRef.current);
            setStep("paid");
            setTimeout(() => { onPaid?.(); onClose?.(); }, 2800);
          }
        } catch (_) {}
      }, 5000); // Vérifier toutes les 5 secondes

    } catch (err) {
      setErrMsg(err.response?.data?.message || "Erreur lors de l'envoi du lien.");
      setStep("error");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 🧪 SIMULATION PFE — Marque directement payée en DB
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = async () => {
    setStep("processing");
    setShowBar(true);
    try {
      await API.post(`/payment/facture/${facture.id}/simuler`);
      setTimeout(() => {
        setStep("paid");
        setTimeout(() => { onPaid?.(); onClose?.(); }, 2800);
      }, 2400);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Erreur simulation.");
      setStep("error");
    }
  };

  const handleRetry = () => {
    clearInterval(pollingRef.current);
    setStep("choose"); setActiveMethod(null); setSentEmail(""); setErrMsg(""); setShowBar(false);
  };

  const handleClose = () => { clearInterval(pollingRef.current); onClose?.(); };

  return (
    <>
      <style>{CSS}</style>
      <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="pm-modal">

          {/* ══ HEADER ══ */}
          <div className="pm-header">
            <div className="pm-header-left">
              <div className="pm-header-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B7574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <div className="pm-header-title">Paiement sécurisé</div>
                <div className="pm-header-sub">
                  Facture {facture?.num_facture} · {facture?.fournisseur_prenom} {facture?.fournisseur_nom}
                </div>
              </div>
            </div>
            <div className="pm-header-right">
              <span className="pm-sandbox-badge">
                <span className="pm-sandbox-dot" /> Sandbox · Test
              </span>
              <button className="pm-close-btn" onClick={handleClose}>✕</button>
            </div>
          </div>

          {/* ══ BODY ══ */}
          <div className="pm-body">

            {/* ── GAUCHE : Détails facture ── */}
            <div className="pm-left">
              <div className="pm-amount-hero">
                <div className="pm-amount-eyebrow">Montant total à régler</div>
                <div className="pm-amount-row">
                  <span className="pm-amount-value">{parseFloat(facture?.total_ttc || 0).toFixed(3)}</span>
                  <span className="pm-amount-currency">DT</span>
                </div>
                <div className="pm-amount-sub">TTC · toutes taxes comprises</div>
                <div className="pm-amount-chips">
                  <span className="pm-amount-chip">HT : {parseFloat(facture?.total_ht || 0).toFixed(3)} DT</span>
                  {parseFloat(facture?.tva || 0) > 0 && (
                    <span className="pm-amount-chip">TVA : {parseFloat(facture?.tva || 0).toFixed(3)} DT</span>
                  )}
                </div>
              </div>

              <div className="pm-left-body">
                {/* Fournisseur */}
                <div>
                  <div className="pm-section-label">Bénéficiaire</div>
                  <div className="pm-fournisseur-card">
                    <div className="pm-avatar">{initiales}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pm-fournisseur-name">{facture?.fournisseur_prenom} {facture?.fournisseur_nom}</div>
                      {facture?.fournisseur_societe && <div className="pm-fournisseur-meta">{facture.fournisseur_societe}</div>}
                      {facture?.fournisseur_email   && <div className="pm-fournisseur-meta">{facture.fournisseur_email}</div>}
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div>
                  <div className="pm-section-label">Détails de la facture</div>
                  <div className="pm-info-card">
                    {[
                      { label: "N° Facture", value: facture?.num_facture, mono: true },
                      { label: "Total HT",   value: `${parseFloat(facture?.total_ht || 0).toFixed(3)} DT`, mono: true },
                      { label: "TVA",        value: `${parseFloat(facture?.tva      || 0).toFixed(3)} DT`, mono: true },
                      { label: "FODEC",      value: `${parseFloat(facture?.fodec    || 0).toFixed(3)} DT`, mono: true },
                      { label: "Échéance",   value: facture?.date_echeance ? new Date(facture.date_echeance).toLocaleDateString("fr-FR") : "—" },
                    ].map(({ label, value, mono }) => (
                      <div className="pm-info-row" key={label}>
                        <span className="pm-info-label">{label}</span>
                        <span className={`pm-info-value ${mono ? "pm-info-mono" : ""}`}>{value}</span>
                      </div>
                    ))}
                    <div className="pm-info-row">
                      <span className="pm-info-label">Statut</span>
                      <span className="pm-info-badge">{facture?.statut}</span>
                    </div>
                  </div>
                </div>

                {/* Garanties */}
                <div>
                  <div className="pm-section-label">Garanties</div>
                  {[
                    { icon: "🔒", text: "Chiffrement SSL 256-bit" },
                    { icon: "🏦", text: "Certifié PCI-DSS Level 1" },
                    { icon: "🇹🇳", text: "Agréé Banque Centrale Tunisie" },
                  ].map((s) => (
                    <div className="pm-stamp" key={s.text}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span> {s.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DROITE : Zone paiement ── */}
            <div className="pm-right">

              {/* Sélection méthode */}
              {step === "choose" && (
                <div className="pm-method-bar">
                  <div className="pm-method-bar-title">Choisir une méthode de paiement</div>
                  <div className="pm-methods">

                    {/* ✅ Konnect — vrai flux email */}
                    <button className={`pm-method-btn ${activeMethod === "konnect" ? "active" : ""}`} onClick={handleKonnect}>
                      <div className="pm-method-icon" style={{ background: "rgba(43,117,116,0.10)" }}>💳</div>
                      <div className="pm-method-texts">
                        <div className="pm-method-name">Konnect Gateway</div>
                        <div className="pm-method-desc">
                          Génère un lien de paiement<br/>envoyé par email au fournisseur
                        </div>
                        <span className="pm-method-tag pm-tag-live">Sandbox</span>
                      </div>
                      <div className="pm-method-check"><SmCheck /></div>
                    </button>

                    {/* 🧪 Simulation PFE */}
                    <button className={`pm-method-btn ${activeMethod === "demo" ? "active" : ""}`}
                      onClick={() => { setActiveMethod("demo"); setStep("demo"); }}>
                      <div className="pm-method-icon" style={{ background: "rgba(160,107,26,0.10)" }}>🧪</div>
                      <div className="pm-method-texts">
                        <div className="pm-method-name">Simulation démo</div>
                        <div className="pm-method-desc">
                          Marque la facture payée<br/>directement pour la démo PFE
                        </div>
                        <span className="pm-method-tag pm-tag-demo">Démo</span>
                      </div>
                      <div className="pm-method-check"><SmCheck /></div>
                    </button>

                  </div>
                </div>
              )}

              {/* Zone contenu */}
              <div className="pm-content">

                {/* Idle */}
                {step === "choose" && (
                  <div className="pm-center">
                    <div style={{ fontSize: 56, animation: "pmFloat 3s ease-in-out infinite" }}>💳</div>
                    <div className="pm-center-title" style={{ fontSize: 19 }}>Sélectionnez une méthode</div>
                    <div className="pm-center-sub">
                      Choisissez comment régler la facture <strong>{facture?.num_facture}</strong>.
                    </div>
                  </div>
                )}

                {/* Envoi en cours */}
                {step === "sending" && (
                  <div className="pm-center">
                    <div className="pm-spinner" />
                    <div className="pm-center-title">Génération du lien…</div>
                    <div className="pm-center-sub">
                      Préparation du lien de paiement sécurisé et envoi par email au fournisseur.
                    </div>
                  </div>
                )}

                {/* ✅ EMAIL ENVOYÉ — Le vrai affichage selon le diagramme */}
                {step === "email_sent" && (
                  <div className="pm-center">
                    <div className="pm-email-box">
                      <div className="pm-email-icon">✉️</div>
                      <div className="pm-email-title">Lien de paiement envoyé !</div>
                      <p style={{ fontSize: 13, color: "#7a98a4", margin: "6px 0 10px" }}>
                        Un email a été envoyé au fournisseur :
                      </p>
                      <div className="pm-email-addr">
                        📧 {sentEmail}
                      </div>
                      <p className="pm-email-note">
                        Le fournisseur recevra un email avec un lien sécurisé pour saisir
                        ses propres coordonnées bancaires et effectuer le paiement.<br/><br/>
                        <strong>Ce lien est valable 60 minutes.</strong>
                      </p>
                    </div>

                    <div className="pm-polling-bar" style={{ borderRadius: 12, border: "1px solid #D6D2CE", marginTop: 4 }}>
                      <div className="pm-dot" />
                      En attente du paiement par le fournisseur…
                      <button onClick={handleRetry} className="pm-back-link" style={{ marginLeft: "auto" }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Demo */}
                {step === "demo" && (
                  <div className="pm-demo-wrap">
                    <div className="pm-demo-card">
                      <div className="pm-demo-card-header">
                        <div className="pm-demo-card-title">Simulation de paiement</div>
                        <div className="pm-demo-card-sub">Mode démonstration PFE</div>
                      </div>
                      <div className="pm-demo-card-body">
                        <div className="pm-demo-amount-box">
                          <div className="pm-demo-amount-label">Montant à simuler</div>
                          <div>
                            <span className="pm-demo-amount-val">{parseFloat(facture?.total_ttc || 0).toFixed(3)}</span>
                            <span className="pm-demo-amount-curr">DT</span>
                          </div>
                        </div>
                        <div className="pm-demo-warning">
                          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                          <span>
                            Mode démonstration — aucun vrai paiement. La facture{" "}
                            <strong>{facture?.num_facture}</strong> sera marquée <strong>payée</strong> en base de données.
                          </span>
                        </div>
                        <button className="pm-demo-confirm-btn" onClick={lancerSimulation}>
                          <ConfirmCheck /> Confirmer le paiement simulé
                        </button>
                      </div>
                    </div>
                    <button className="pm-back-link" onClick={handleRetry}>← Changer de méthode</button>
                  </div>
                )}

                {/* Processing */}
                {step === "processing" && (
                  <div className="pm-center">
                    <div className="pm-spinner" />
                    <div className="pm-center-title">Traitement en cours…</div>
                    <div className="pm-center-sub">
                      Simulation du paiement de <strong>{parseFloat(facture?.total_ttc || 0).toFixed(3)} DT</strong>
                    </div>
                    {showBar && <div className="pm-progress-bar"><div className="pm-progress-fill" /></div>}
                  </div>
                )}

                {/* Succès */}
                {step === "paid" && (
                  <div className="pm-center">
                    <div className="pm-success-circle"><CheckSvg /></div>
                    <div className="pm-center-title" style={{ color: "#12484C" }}>Paiement confirmé !</div>
                    <div className="pm-center-sub">
                      La facture <strong>{facture?.num_facture}</strong> est maintenant réglée.<br />
                      Fermeture automatique dans quelques secondes…
                    </div>
                    <div className="pm-success-pill">
                      ✓ {parseFloat(facture?.total_ttc || 0).toFixed(3)} DT réglés avec succès
                    </div>
                  </div>
                )}

                {/* Erreur */}
                {step === "error" && (
                  <div className="pm-center">
                    <div className="pm-error-circle"><XSvg /></div>
                    <div className="pm-center-title" style={{ color: "#861211" }}>Erreur</div>
                    <div className="pm-center-sub">{errMsg}</div>
                    <button className="pm-retry-btn" onClick={handleRetry}>Réessayer</button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ══ FOOTER ══ */}
          <div className="pm-footer">
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              SSL sécurisé
            </span>
            <span className="pm-footer-dot">·</span>
            <span>🏦 Powered by <strong>Konnect</strong></span>
            <span className="pm-footer-dot">·</span>
            <span>🇹🇳 Agréé Banque Centrale de Tunisie</span>
            <span className="pm-footer-dot">·</span>
            <span style={{ color: "#a06b1a" }}>⚠️ Mode Sandbox</span>
          </div>

        </div>
      </div>
    </>
  );
}