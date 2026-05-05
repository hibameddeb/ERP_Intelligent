import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Tiny icon helper ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const Ic = {
  invoice:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  cart:         "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  search:       "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  close:        "M18 6L6 18M6 6l12 12",
  eye:          "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  arrowLeft:    "M19 12H5M12 19l-7-7 7-7",
  package:      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  check:        "M20 6L9 17l-5-5",
  clock:        "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  calendar:     "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  hash:         "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  wallet:       "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5",
  tag:          "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  receipt:      "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM9 7h6M9 11h6M9 15h4",
  download:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  user:         "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  building:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  refresh:      "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  send:         "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  ban:          "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  inbox:        "M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, dec = 3) =>
  Number(n || 0).toLocaleString("fr-TN", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const isOverdue = (dateEcheance, statut) => {
  if (!dateEcheance || statut === "payée" || statut === "annulée") return false;
  return new Date(dateEcheance) < new Date();
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  brouillon: { cls: "muted", label: "Brouillon", dot: "#7a98a4" },
  envoyée:   { cls: "amber", label: "Envoyée",   dot: "#a06b1a" },
  reçue:     { cls: "blue",  label: "Reçue",     dot: "#2B7574" },
  payée:     { cls: "teal",  label: "Payée",     dot: "#12484C" },
  annulée:   { cls: "rose",  label: "Annulée",   dot: "#861211" },
};

const StatusBadge = ({ statut, overdue = false }) => {
  const s = STATUS_MAP[statut] || STATUS_MAP.brouillon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: overdue
          ? "rgba(134,18,17,0.08)"
          : `var(--${s.cls}-dim, rgba(0,0,0,0.06))`,
        color: overdue ? "var(--rose)" : `var(--${s.cls === "muted" ? "text-2" : s.cls})`,
        border: `1px solid ${overdue ? "rgba(134,18,17,0.2)" : "transparent"}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: overdue ? "var(--rose)" : s.dot,
          flexShrink: 0,
        }}
      />
      {overdue ? "En retard" : s.label}
    </span>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, dim, icon, mono }) => (
  <div className="erp-stat-card">
    <div className="erp-stat-icon" style={{ background: dim, color }}>
      <Icon d={icon} size={16} />
    </div>
    <div className="erp-stat-label">{label}</div>
    <div
      className="erp-stat-value"
      style={{
        color,
        fontSize: mono ? 22 : 28,
        fontFamily: mono
          ? "'JetBrains Mono', monospace"
          : "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {value}
    </div>
    <div className="erp-stat-sub">{sub}</div>
  </div>
);

// ─── Invoice detail drawer ────────────────────────────────────────────────────
const FactureDrawer = ({ id, type, onClose, onRefresh, showToast, autoDownload = false }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setData(null);
    const url = type === "vente" ? `/factures/${id}` : `/factures-achat/${id}`;
    API.get(url)
      .then((r) => setData(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, type]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoDownload && data && !loading) {
      setTimeout(() => {
        downloadInvoicePDF();
        onClose?.();
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, data, loading]);

  const facture = data?.facture;
  const details = data?.details || [];
  const overdue = facture && isOverdue(facture.date_echeance, facture.statut);

  const partyName =
    type === "vente"
      ? facture ? `${facture.client_prenom || ""} ${facture.client_nom || ""}`.trim() : "—"
      : facture ? `${facture.fournisseur_prenom || ""} ${facture.fournisseur_nom || ""}`.trim() : "—";

  const commercialName = facture
    ? `${facture.commercial_prenom || ""} ${facture.commercial_nom || ""}`.trim() || "—"
    : "—";

  const doAction = async (endpoint, label) => {
    setActing(true);
    try {
      await API.patch(endpoint);
      showToast?.(`${label} effectué avec succès.`, "success");
      load();
      onRefresh?.();
    } catch (err) {
      showToast?.(err?.response?.data?.message || `Erreur lors de ${label}.`, "error");
    } finally {
      setActing(false);
    }
  };

  const downloadInvoicePDF = () => {
    if (!facture) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const margin = 14;
    const colRight = W / 2 + 2;
    const teal = [43, 117, 116];
    const lightGray = [245, 246, 248];
    const borderGray = [220, 225, 230];
    const textDark = [30, 40, 50];
    const textMid = [90, 100, 115];

    const infoRow = (label, value, x, y, w) => {
      doc.setFontSize(7.5);
      doc.setTextColor(...textMid);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, y);
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.text(String(value || "—"), x + w * 0.45, y);
    };

    doc.setFillColor(...teal);
    doc.rect(0, 0, W, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("TUNISIE TRADENET", margin, 8);
    const typeLabel = type === "vente" ? "FACTURE DE VENTE" : "FACTURE D'ACHAT";
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(typeLabel, W - margin, 8, { align: "right" });

    let y = 17;
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, (W / 2) - margin - 3, 38, 2, 2, "F");
    doc.setDrawColor(...borderGray);
    doc.roundedRect(margin, y, (W / 2) - margin - 3, 38, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text("Émetteur", margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textMid);
    const compLines = [
      "Rue du Lac Malaren, Lotissement El Khalij",
      "Les Berges du Lac, 1053-Tunis, Tunisie",
      "Tél : 71 86 17 12  |  Fax : 71 86 11 41",
      "www.tradenet.com.tn",
      "Code TVA : 736202XAM000",
    ];
    compLines.forEach((line, i) => { doc.text(line, margin + 4, y + 12 + i * 5); });

    const partyLabel = type === "vente" ? "Client" : "Fournisseur";
    doc.setFillColor(...lightGray);
    doc.roundedRect(colRight, y, W - colRight - margin, 38, 2, 2, "F");
    doc.setDrawColor(...borderGray);
    doc.roundedRect(colRight, y, W - colRight - margin, 38, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(partyLabel, colRight + 4, y + 6);
    const partyInfoW = W - colRight - margin;
    const partyRows = type === "vente"
      ? [
          ["Nom", partyName || "—"],
          ["Identifiant", facture.client_identifiant || "—"],
          ["Commercial", commercialName || "—"],
          ["Code client", facture.client_code || "—"],
          ["Matricule fiscal", facture.client_matricule_fiscal || "—"],
        ]
      : [
          ["Nom", partyName || "—"],
          ["Email", facture.fournisseur_email || "—"],
          ["Code fournisseur", facture.fournisseur_code || "—"],
        ];
    partyRows.forEach(([label, val], i) => {
      infoRow(label, val, colRight + 4, y + 12 + i * 5, partyInfoW - 8);
    });

    y = 60;
    doc.setFillColor(...teal);
    doc.rect(margin, y, W - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const metaCols = [
      { label: "N° Facture", val: facture.num_facture || "—" },
      { label: "Date création", val: fmtDate(facture.date_creation) },
      { label: "Échéance", val: fmtDate(facture.date_echeance) },
      { label: "Statut", val: (STATUS_MAP[facture.statut] || STATUS_MAP.brouillon).label },
    ];
    const metaColW = (W - margin * 2) / metaCols.length;
    metaCols.forEach(({ label, val }, i) => {
      const cx = margin + i * metaColW + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(200, 235, 235);
      doc.text(label, cx, y + 3.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(val), cx, y + 7);
    });

    y += 12;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...textMid);
    doc.text(`Référence Unique : ${facture.reference_unique || facture.num_facture || "—"}`, margin, y);

    y += 5;
    const tableHead = [["Code", "Désignation", "Qté", "TVA %", "P.U.H.T.", "Total H.T."]];
    const tableBody = details.map((d) => [
      d.code_produit || d.id_produit_entreprise || d.id_produit_fournisseur || "—",
      d.nom_produit || "—",
      String(d.quantite || 0),
      `${d.tva_taux || 12} %`,
      `${fmt(d.prix_unitaire_ht_ap ?? d.prix_unitaire_ht)} TND`,
      `${fmt(d.total_ht_ligne)} TND`,
    ]);
    if (tableBody.length === 0) tableBody.push(["—", "Aucune ligne", "—", "—", "—", "—"]);

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
      headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: lightGray },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 28, halign: "right" },
        5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      },
      tableLineColor: borderGray,
      tableLineWidth: 0.1,
    });

    y = doc.lastAutoTable.finalY + 6;
    const leftSumX = margin;
    const rightSumX = W / 2 + 10;
    const sumW = W / 2 - margin - 10;

    autoTable(doc, {
      startY: y,
      head: [["Taux (%)", "Base H.T.", "Montant TVA"]],
      body: [
        ["12 %", `${fmt(facture.total_ht)} TND`, `${fmt(facture.tva, 2)} TND`],
        ["Total", `${fmt(facture.total_ht)} TND`, `${fmt(facture.tva, 2)} TND`],
      ],
      margin: { left: leftSumX, right: W / 2 + 4 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [90, 110, 125], textColor: 255, fontStyle: "bold", fontSize: 7 },
      tableLineColor: borderGray,
      tableLineWidth: 0.1,
    });

    const totalsY = y;
    const totalsRows = [
      ["Total H.T.V.A.", fmt(facture.total_ht) + " TND"],
      ["Montant TVA",    fmt(facture.tva, 2)   + " TND"],
      ["FODEC",         fmt(facture.fodec, 2)  + " TND"],
      ["Droit de Timbre", fmt(facture.droit_timbre ?? 0.5, 3) + " TND"],
    ];
    doc.setFillColor(...lightGray);
    doc.roundedRect(rightSumX, totalsY, sumW, 4 + totalsRows.length * 7 + 10, 2, 2, "F");
    doc.setDrawColor(...borderGray);
    doc.roundedRect(rightSumX, totalsY, sumW, 4 + totalsRows.length * 7 + 10, 2, 2, "S");
    totalsRows.forEach(([label, val], i) => {
      const rowY = totalsY + 6 + i * 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...textMid);
      doc.text(label, rightSumX + 4, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text(val, rightSumX + sumW - 4, rowY, { align: "right" });
      if (i < totalsRows.length - 1) {
        doc.setDrawColor(...borderGray);
        doc.line(rightSumX + 2, rowY + 2, rightSumX + sumW - 2, rowY + 2);
      }
    });

    const ttcY = totalsY + 6 + totalsRows.length * 7 + 1;
    doc.setFillColor(...teal);
    doc.roundedRect(rightSumX, ttcY, sumW, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Total T.T.C.", rightSumX + 4, ttcY + 6);
    doc.text(fmt(facture.total_ttc) + " TND", rightSumX + sumW - 4, ttcY + 6, { align: "right" });

    y = Math.max(doc.lastAutoTable.finalY, ttcY + 14) + 6;
    doc.setFillColor(250, 252, 255);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(margin, y, W - margin * 2, 10, 2, 2, "FD");
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(`Arrêtée à la somme de : ${fmt(facture.total_ttc)} TND`, margin + 4, y + 6.5);

    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMid);
    doc.text("A régler exclusivement au niveau des bureaux postaux sur présentation de la facture.", margin, y);

    doc.setFillColor(...teal);
    doc.rect(0, 290, W, 7, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("SA au capital de 2 000 000 DT — Code TVA 736202XAM000", W / 2, 294.5, { align: "center" });

    doc.save(`Facture_${facture.num_facture || id}.pdf`);
  };

  const renderActions = () => {
    if (!facture) return null;
    const s = facture.statut;
    const buttons = [];

    if (type === "vente") {
      if (s === "brouillon") {
        buttons.push(
          <button key="emettre" className="erp-btn erp-btn-primary" disabled={acting}
            onClick={() => doAction(`/factures/${id}/emettre`, "Émission")}
            style={{ background: "var(--blue)", color: "#fff", border: "none" }}>
            <Icon d={Ic.send} size={13} /> Émettre
          </button>
        );
      }
      if (s === "envoyée") {
        buttons.push(
          <button key="payer" className="erp-btn erp-btn-primary" disabled={acting}
            onClick={() => doAction(`/factures/${id}/payer`, "Paiement")}
            style={{ background: "var(--teal)", color: "#fff", border: "none" }}>
            <Icon d={Ic.check} size={13} /> Marquer payée
          </button>
        );
      }
      if (s !== "payée" && s !== "annulée") {
        buttons.push(
          <button key="annuler" className="erp-btn erp-btn-ghost" disabled={acting}
            onClick={() => doAction(`/factures/${id}/annuler`, "Annulation")}
            style={{ color: "var(--rose)", borderColor: "rgba(134,18,17,0.25)" }}>
            <Icon d={Ic.ban} size={13} /> Annuler
          </button>
        );
      }
    } else {
      if (s === "brouillon") {
        buttons.push(
          <button key="recevoir" className="erp-btn erp-btn-primary" disabled={acting}
            onClick={() => doAction(`/factures-achat/${id}/recevoir`, "Réception")}
            style={{ background: "var(--blue)", color: "#fff", border: "none" }}>
            <Icon d={Ic.inbox} size={13} /> Marquer reçue
          </button>
        );
      }
      if (s === "reçue") {
        buttons.push(
          <button key="payer" className="erp-btn erp-btn-primary" disabled={acting}
            onClick={() => doAction(`/factures-achat/${id}/payer`, "Paiement")}
            style={{ background: "var(--teal)", color: "#fff", border: "none" }}>
            <Icon d={Ic.check} size={13} /> Marquer payée
          </button>
        );
      }
      if (s !== "payée" && s !== "annulée") {
        buttons.push(
          <button key="annuler" className="erp-btn erp-btn-ghost" disabled={acting}
            onClick={() => doAction(`/factures-achat/${id}/annuler`, "Annulation")}
            style={{ color: "var(--rose)", borderColor: "rgba(134,18,17,0.25)" }}>
            <Icon d={Ic.ban} size={13} /> Annuler
          </button>
        );
      }
    }

    if (!buttons.length) return null;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {buttons.map((b) => <React.Fragment key={b.key}>{b}</React.Fragment>)}
      </div>
    );
  };

  const dateRows = facture
    ? type === "vente"
      ? [
          { label: "Création",   val: facture.date_creation },
          { label: "Validation", val: facture.date_validation },
          { label: "Envoi",      val: facture.date_envoi },
          { label: "Échéance",   val: facture.date_echeance, warn: overdue },
          { label: "Paiement",   val: facture.date_paiement },
        ]
      : [
          { label: "Création",   val: facture.date_creation },
          { label: "Réception",  val: facture.date_reception },
          { label: "Échéance",   val: facture.date_echeance, warn: overdue },
          { label: "Paiement",   val: facture.date_paiement },
        ]
    : [];

  return (
    <>
      <div className="erp-drawer-overlay" onClick={onClose} />
      <aside className="erp-drawer" style={{ width: 520 }}>
        <div className="erp-drawer-header">
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center" }} onClick={onClose}>
            <Icon d={Ic.arrowLeft} size={16} />
          </button>
          <span className="erp-drawer-title">
            {loading ? "Chargement…" : `Facture ${facture?.num_facture || `#${id}`}`}
          </span>
          {facture && <StatusBadge statut={facture.statut} overdue={overdue} />}
          {facture && (
            <button title="Télécharger la facture PDF" onClick={downloadInvoicePDF}
              style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--blue-dim)"; e.currentTarget.style.color = "var(--blue)"; e.currentTarget.style.borderColor = "var(--blue)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <Icon d={Ic.download} size={13} /> PDF
            </button>
          )}
        </div>

        <div className="erp-drawer-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <span className="erp-spin" style={{ width: 28, height: 28 }} />
            </div>
          ) : !facture ? (
            <div className="erp-empty">
              <div className="erp-empty-icon"><Icon d={Ic.invoice} size={22} /></div>
              <p>Impossible de charger la facture.</p>
            </div>
          ) : (
            <>
              <div style={{ background: type === "vente" ? "var(--blue-dim)" : "var(--amber-dim)", border: `1px solid ${type === "vente" ? "rgba(43,117,116,0.2)" : "rgba(160,107,26,0.2)"}`, borderRadius: "var(--r-lg)", padding: "18px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: type === "vente" ? "var(--blue)" : "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>
                    {type === "vente" ? "Facture Vente" : "Facture Achat"}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {facture.num_facture}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Total TTC
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {fmt(facture.total_ttc)}{" "}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>TND</span>
                  </div>
                </div>
              </div>

              {overdue && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--rose-dim)", border: "1px solid rgba(134,18,17,0.2)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "var(--rose)", fontWeight: 500 }}>
                  <Icon d={Ic.clock} size={14} />
                  Échéance dépassée — due le {fmtDate(facture.date_echeance)}
                </div>
              )}

              {renderActions()}

              <div className="erp-drawer-section">
                <div className="erp-drawer-section-label">{type === "vente" ? "Client" : "Fournisseur"}</div>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "4px 14px" }}>
                  <div className="erp-info-row">
                    <span className="erp-info-row-icon"><Icon d={Ic.user} size={14} /></span>
                    <span className="erp-info-row-label">Nom</span>
                    <span className="erp-info-row-value">{partyName || "—"}</span>
                  </div>
                  {type === "vente" && (
                    <>
                      <div className="erp-info-row">
                        <span className="erp-info-row-icon"><Icon d={Ic.building} size={14} /></span>
                        <span className="erp-info-row-label">Identifiant</span>
                        <span className="erp-info-row-value" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{facture.client_identifiant || "—"}</span>
                      </div>
                      <div className="erp-info-row">
                        <span className="erp-info-row-icon"><Icon d={Ic.user} size={14} /></span>
                        <span className="erp-info-row-label">Commercial</span>
                        <span className="erp-info-row-value">{commercialName}</span>
                      </div>
                    </>
                  )}
                  {type === "achat" && (
                    <div className="erp-info-row">
                      <span className="erp-info-row-icon"><Icon d={Ic.building} size={14} /></span>
                      <span className="erp-info-row-label">Email</span>
                      <span className="erp-info-row-value">{facture.fournisseur_email || "—"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="erp-drawer-section">
                <div className="erp-drawer-section-label">Dates</div>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "4px 14px" }}>
                  {dateRows.map(({ label, val, warn }) => (
                    <div className="erp-info-row" key={label}>
                      <span className="erp-info-row-icon"><Icon d={Ic.calendar} size={14} /></span>
                      <span className="erp-info-row-label">{label}</span>
                      <span className="erp-info-row-value" style={warn ? { color: "var(--rose)", fontWeight: 700 } : {}}>{fmtDate(val)}</span>
                    </div>
                  ))}
                  {facture.trimestre && (
                    <div className="erp-info-row">
                      <span className="erp-info-row-icon"><Icon d={Ic.hash} size={14} /></span>
                      <span className="erp-info-row-label">Trimestre</span>
                      <span className="erp-info-row-value">T{facture.trimestre}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="erp-drawer-section">
                <div className="erp-drawer-section-label">Détail financier</div>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                  {[
                    { label: "Total HT", val: fmt(facture.total_ht) },
                    { label: "FODEC",    val: fmt(facture.fodec, 2) },
                    { label: "TVA",      val: fmt(facture.tva, 2) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)" }}>
                      <span>{label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{val} TND</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-3)", fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text)" }}>
                    <span>Total TTC</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5 }}>{fmt(facture.total_ttc)} TND</span>
                  </div>
                </div>
              </div>

              {details.length > 0 && (
                <div className="erp-drawer-section">
                  <div className="erp-drawer-section-label">Lignes ({details.length})</div>
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                    {details.map((d, i) => (
                      <div key={i} style={{ padding: "11px 14px", borderBottom: i < details.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {d.nom_produit || `Produit #${d.id_produit_entreprise || d.id_produit_fournisseur}`}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                            Qté {d.quantite} × {fmt(d.prix_unitaire_ht_ap ?? d.prix_unitaire_ht)} TND
                          </div>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                          {fmt(d.total_ht_ligne)} TND
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, label }) => (
  <div className="erp-empty">
    <div className="erp-empty-icon"><Icon d={icon} size={22} /></div>
    <p>{label}</p>
  </div>
);

// ─── Main FacturesPage component ──────────────────────────────────────────────
const Factures = ({ showToast }) => {
  const [tab, setTab]                       = useState("vente");
  const [venteFacs, setVenteFacs]           = useState([]);
  const [achatFacs, setAchatFacs]           = useState([]);
  const [loadingV, setLoadingV]             = useState(true);
  const [loadingA, setLoadingA]             = useState(true);
  const [search, setSearch]                 = useState("");
  const [statutFilter, setStatutFilter]     = useState("");
  const [commercialFilter, setCommercialFilter] = useState(""); // ← nouveau
  const [drawerInfo, setDrawerInfo]         = useState(null);

  const fetchVente = useCallback(() => {
    setLoadingV(true);
    API.get("/factures")
      .then((r) => setVenteFacs(r.data?.data || []))
      .catch(() => showToast("Erreur chargement factures vente.", "error"))
      .finally(() => setLoadingV(false));
  }, [showToast]);

  const fetchAchat = useCallback(() => {
    setLoadingA(true);
    API.get("/factures-achat")
      .then((r) => setAchatFacs(r.data?.data || []))
      .catch(() => showToast("Erreur chargement factures achat.", "error"))
      .finally(() => setLoadingA(false));
  }, [showToast]);

  useEffect(() => { fetchVente(); fetchAchat(); }, [fetchVente, fetchAchat]);

  // ── Liste dédupliquée des commerciaux (factures vente uniquement) ──────────
  const commerciaux = useMemo(() => {
    const seen = new Set();
    return venteFacs
      .filter((f) => {
        const name = `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((f) => ({
        key: `${f.commercial_prenom || ""}_${f.commercial_nom || ""}`,
        label: `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [venteFacs]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const applyFilters = (rows) =>
    rows.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (f.num_facture || "").toLowerCase().includes(q) ||
        (f.client_nom || "").toLowerCase().includes(q) ||
        (f.client_prenom || "").toLowerCase().includes(q) ||
        (f.fournisseur_nom || "").toLowerCase().includes(q) ||
        (f.fournisseur_prenom || "").toLowerCase().includes(q);
      const matchStatut = !statutFilter || f.statut === statutFilter;
      // filtre commercial : uniquement en mode vente
      const matchCommercial =
        tab !== "vente" ||
        !commercialFilter ||
        `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim() === commercialFilter;
      return matchSearch && matchStatut && matchCommercial;
    });

  const filteredVente = applyFilters(venteFacs);
  const filteredAchat = applyFilters(achatFacs);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalVente    = venteFacs.reduce((s, f) => s + Number(f.total_ttc || 0), 0);
  const payeesVente   = venteFacs.filter((f) => f.statut === "payée").length;
  const overdueVente  = venteFacs.filter((f) => isOverdue(f.date_echeance, f.statut)).length;
  const totalAchatTTC = achatFacs.reduce((s, f) => s + Number(f.total_ttc || 0), 0);

  const statsVente = [
    { label: "Factures Vente",  value: venteFacs.length,  sub: `${filteredVente.length} après filtre`, color: "var(--blue)",  dim: "var(--blue-dim)",  icon: Ic.invoice },
    { label: "Total TTC Vente", value: `${fmt(totalVente, 0)} TND`, sub: "cumul toutes factures", color: "var(--teal)", dim: "var(--teal-dim)", icon: Ic.wallet, mono: true },
    { label: "Payées",          value: payeesVente,        sub: `${venteFacs.filter((f) => f.statut === "envoyée").length} en attente`, color: "#12484C", dim: "var(--teal-dim)", icon: Ic.check },
    { label: "En retard",       value: overdueVente,       sub: "dépassé l'échéance", color: "var(--rose)", dim: "var(--rose-dim)", icon: Ic.clock },
  ];

  const statsAchat = [
    { label: "Factures Achat",  value: achatFacs.length,  sub: `${filteredAchat.length} après filtre`, color: "var(--amber)", dim: "var(--amber-dim)", icon: Ic.cart },
    { label: "Total TTC Achat", value: `${fmt(totalAchatTTC, 0)} TND`, sub: "cumul toutes factures", color: "#a06b1a", dim: "var(--amber-dim)", icon: Ic.wallet, mono: true },
    { label: "Reçues",          value: achatFacs.filter((f) => f.statut === "reçue").length,  sub: "en attente de paiement", color: "var(--blue)", dim: "var(--blue-dim)", icon: Ic.package },
    { label: "Payées",          value: achatFacs.filter((f) => f.statut === "payée").length,  sub: `${achatFacs.filter((f) => f.statut === "brouillon").length} brouillons`, color: "var(--teal)", dim: "var(--teal-dim)", icon: Ic.check },
  ];

  const activeStats = tab === "vente" ? statsVente : statsAchat;
  const activeRows  = tab === "vente" ? filteredVente : filteredAchat;
  const isLoading   = tab === "vente" ? loadingV : loadingA;
  const refresh     = tab === "vente" ? fetchVente : fetchAchat;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Tab switcher */}
      <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 4, marginBottom: 22, gap: 4 }}>
        {[
          { key: "vente", label: "Factures Vente", icon: Ic.invoice },
          { key: "achat", label: "Factures Achat", icon: Ic.cart },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(""); setStatutFilter(""); setCommercialFilter(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s", background: tab === key ? (key === "vente" ? "var(--blue)" : "var(--amber)") : "transparent", color: tab === key ? "#fff" : "var(--text-2)", boxShadow: tab === key ? "0 1px 6px rgba(0,0,0,0.15)" : "none" }}
          >
            <Icon d={icon} size={14} />
            {label}
            <span style={{ background: tab === key ? "rgba(255,255,255,0.25)" : "var(--surface-3)", color: tab === key ? "#fff" : "var(--muted)", borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
              {key === "vente" ? venteFacs.length : achatFacs.length}
            </span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="erp-stats-grid" style={{ marginBottom: 22 }}>
        {activeStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div className="erp-toolbar-left">
          <span className="erp-section-title">
            {tab === "vente" ? "Factures de Vente" : "Factures d'Achat"}
            <span className="erp-section-count">({activeRows.length})</span>
          </span>
        </div>
        <div className="erp-toolbar-right">
          <div className="erp-search">
            <Icon d={Ic.search} size={14} />
            <input
              placeholder={tab === "vente" ? "Numéro, client…" : "Numéro, fournisseur…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="erp-select" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            {tab === "vente" && <option value="envoyée">Envoyée</option>}
            {tab === "achat"  && <option value="reçue">Reçue</option>}
            <option value="payée">Payée</option>
            <option value="annulée">Annulée</option>
          </select>

          {/* ── Filtre commercial (vente uniquement) ── */}
          {tab === "vente" && (
            <select className="erp-select" value={commercialFilter} onChange={(e) => setCommercialFilter(e.target.value)}>
              <option value="">Tous les commerciaux</option>
              {commerciaux.map((c) => (
                <option key={c.key} value={c.label}>{c.label}</option>
              ))}
            </select>
          )}

          <button className="erp-btn erp-btn-ghost" onClick={refresh} title="Actualiser">
            <Icon d={Ic.refresh} size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>{tab === "vente" ? "Client" : "Fournisseur"}</th>
              {tab === "vente" && <th>Commercial</th>}
              <th>Statut</th>
              <th>Total HT</th>
              <th>TVA</th>
              <th>Total TTC</th>
              <th>Date création</th>
              <th>Échéance</th>
              <th style={{ width: 60 }}>Détail</th>
              <th style={{ width: 60 }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={tab === "vente" ? 11 : 10}>
                  <div className="erp-empty">
                    <span className="erp-spin" style={{ width: 24, height: 24 }} />
                  </div>
                </td>
              </tr>
            ) : activeRows.length === 0 ? (
              <tr>
                <td colSpan={tab === "vente" ? 11 : 10}>
                  <EmptyState
                    icon={tab === "vente" ? Ic.invoice : Ic.cart}
                    label={
                      search || statutFilter || commercialFilter
                        ? "Aucune facture correspond aux filtres."
                        : `Aucune facture ${tab === "vente" ? "de vente" : "d'achat"} trouvée.`
                    }
                  />
                </td>
              </tr>
            ) : (
              activeRows.map((f) => {
                const overdue = isOverdue(f.date_echeance, f.statut);
                const partyName =
                  tab === "vente"
                    ? `${f.client_prenom || ""} ${f.client_nom || ""}`.trim()
                    : `${f.fournisseur_prenom || ""} ${f.fournisseur_nom || ""}`.trim();

                return (
                  <tr key={f.id} className="clickable-row" onClick={() => setDrawerInfo({ id: f.id, type: tab })} style={overdue ? { background: "rgba(134,18,17,0.03)" } : {}}>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--surface-3)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
                        {f.num_facture}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{partyName || "—"}</div>
                      {tab === "vente" && f.client_ville && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{f.client_ville}</div>
                      )}
                      {tab === "achat" && f.fournisseur_email && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{f.fournisseur_email}</div>
                      )}
                    </td>
                    {tab === "vente" && (
                      <td style={{ color: "var(--text-2)", fontSize: 13 }}>
                        {`${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim() || "—"}
                      </td>
                    )}
                    <td><StatusBadge statut={f.statut} overdue={overdue} /></td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--text-2)" }}>{fmt(f.total_ht)}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--text-2)" }}>{fmt(f.tva, 2)}</td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{fmt(f.total_ttc)}</span>
                    </td>
                    <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{fmtDate(f.date_creation)}</td>
                    <td style={{ fontSize: 12.5, fontWeight: overdue ? 700 : 400, color: overdue ? "var(--rose)" : "var(--text-2)" }}>{fmtDate(f.date_echeance)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="erp-act-btn erp-act-view" title="Voir les détails" onClick={() => setDrawerInfo({ id: f.id, type: tab })}>
                        <Icon d={Ic.eye} size={13} />
                      </button>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="erp-act-btn" title="Télécharger PDF" style={{ color: "var(--blue)" }}
                        onClick={() => setDrawerInfo({ id: f.id, type: tab, autoDownload: true })}>
                        <Icon d={Ic.download} size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {activeRows.length > 0 && !isLoading && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "flex-end", gap: 28, fontSize: 12.5, color: "var(--text-2)" }}>
            <span><strong style={{ color: "var(--text)" }}>{activeRows.length}</strong> facture(s)</span>
            <span>Total HT : <strong style={{ color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(activeRows.reduce((s, f) => s + Number(f.total_ht || 0), 0))} TND</strong></span>
            <span>Total TTC : <strong style={{ color: tab === "vente" ? "var(--blue)" : "var(--amber)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(activeRows.reduce((s, f) => s + Number(f.total_ttc || 0), 0))} TND</strong></span>
          </div>
        )}
      </div>

      {drawerInfo && (
        <FactureDrawer
          id={drawerInfo.id}
          type={drawerInfo.type}
          autoDownload={!!drawerInfo.autoDownload}
          onClose={() => setDrawerInfo(null)}
          onRefresh={refresh}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default Factures;