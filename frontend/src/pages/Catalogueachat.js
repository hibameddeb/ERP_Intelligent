import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../services/api";

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
const IC = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  cart: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  package:
    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  truck:
    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  spinner:
    "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, d = 3) => Number(n || 0).toFixed(d);
const calcLigne = (prod, qty) => {
  const ht = qty * Number(prod.prix_unitaire_ht);
  const fod = ht * (Number(prod.taux_fodec) / 100);
  const tva = (ht + fod) * (Number(prod.taux_tva) / 100);
  return { ht, fodec: fod, tva, ttc: ht + fod + tva };
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
    <div
      style={{
        width: 32,
        height: 32,
        border: "3px solid #D6D2CE",
        borderTopColor: "#2B7574",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }}
    />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Badge = ({
  children,
  color = "#2B7574",
  bg = "rgba(43,117,116,0.1)",
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      color,
      background: bg,
      border: `1px solid ${color}33`,
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      textTransform: "uppercase",
    }}
  >
    {children}
  </span>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProduitCard = ({ produit, qty, onAdd, onRemove, onView, isGrid }) => {
  const inCart = qty > 0;
  const img = produit.images?.find((i) => i.is_primary) || produit.images?.[0];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1.5px solid ${inCart ? "#2B7574" : "var(--border)"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all .2s",
        display: "flex",
        flexDirection: isGrid ? "column" : "row",
        boxShadow: inCart
          ? "0 0 0 3px rgba(43,117,116,0.12)"
          : "0 1px 4px rgba(14,41,49,0.06)",
        cursor: "default",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = inCart
          ? "0 6px 24px rgba(43,117,116,0.18)"
          : "0 6px 24px rgba(14,41,49,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = inCart
          ? "0 0 0 3px rgba(43,117,116,0.12)"
          : "0 1px 4px rgba(14,41,49,0.06)";
      }}
    >
      {/* Image zone */}
      <div
        style={{
          width: isGrid ? "100%" : 110,
          height: isGrid ? 160 : 110,
          background: "linear-gradient(135deg,#e8f0ee,#d4e4e0)",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {img ? (
          <img
            src={`http://localhost:5000${img.image_url}`}
            alt={produit.nom_produit_f}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ opacity: 0.3, color: "#2B7574" }}>
            <Icon d={IC.package} size={36} />
          </div>
        )}
        {inCart && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#2B7574",
              color: "#fff",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            {qty}
          </div>
        )}
      </div>

      {/* Info zone */}
      <div
        style={{
          padding: "14px 14px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div>
          {produit.categorie && (
            <Badge color="#0E2931" bg="rgba(14,41,49,0.07)">
              {produit.categorie}
            </Badge>
          )}
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 700,
              fontSize: 13.5,
              color: "var(--text)",
              marginTop: 6,
              lineHeight: 1.3,
            }}
          >
            {produit.nom_produit_f}
          </div>
          {produit.description_f && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--muted)",
                marginTop: 3,
                lineHeight: 1.5,
              }}
            >
              {produit.description_f.length > 55
                ? produit.description_f.slice(0, 55) + "…"
                : produit.description_f}
            </div>
          )}
        </div>

        {/* Rates row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Number(produit.taux_tva) > 0 && (
            <Badge color="#a06b1a" bg="rgba(160,107,26,0.08)">
              TVA {produit.taux_tva}%
            </Badge>
          )}
          {Number(produit.taux_fodec) > 0 && (
            <Badge color="#861211" bg="rgba(134,18,17,0.07)">
              FODEC {produit.taux_fodec}%
            </Badge>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 6,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#2B7574",
                letterSpacing: "-0.02em",
              }}
            >
              {fmt(produit.prix_unitaire_ht)}{" "}
              <span
                style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)" }}
              >
                DT HT
              </span>
            </div>
          </div>

          {/* Cart controls */}
          {inCart ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => onRemove(produit)}
                style={S.ctrlBtn("#2B7574")}
              >
                <Icon d={IC.minus} size={12} />
              </button>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  minWidth: 20,
                  textAlign: "center",
                  color: "#2B7574",
                }}
              >
                {qty}
              </span>
              <button
                onClick={() => onAdd(produit)}
                style={S.ctrlBtn("#2B7574")}
              >
                <Icon d={IC.plus} size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(produit)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#2B7574",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              <Icon d={IC.plus} size={12} /> Ajouter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Cart Panel ───────────────────────────────────────────────────────────────
const CartPanel = ({
  cart,
  fournisseur,
  produits,
  onRemove,
  onQtyChange,
  onSubmit,
  submitting,
  onClose,
}) => {
  const lines = Object.entries(cart)
    .map(([id, qty]) => {
      const p = produits.find((x) => String(x.id) === String(id));
      if (!p || qty < 1) return null;
      const calc = calcLigne(p, qty);
      return { p, qty, ...calc };
    })
    .filter(Boolean);

  const totals = lines.reduce(
    (acc, l) => ({
      ht: acc.ht + l.ht,
      fodec: acc.fodec + l.fodec,
      tva: acc.tva + l.tva,
      ttc: acc.ttc + l.ttc,
    }),
    { ht: 0, fodec: 0, tva: 0, ttc: 0 },
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(14,41,49,0.45)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: 420,
          maxWidth: "95vw",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          animation: "slideCart .25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`@keyframes slideCart{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}`}</style>

        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text)",
              }}
            >
              Panier ({lines.length} article{lines.length !== 1 ? "s" : ""})
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                padding: 4,
              }}
            >
              <Icon d={IC.close} size={18} />
            </button>
          </div>
          {fournisseur && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <Icon d={IC.building} size={12} />
              Fournisseur :{" "}
              <strong style={{ color: "var(--text)" }}>
                {fournisseur.nom_societe ||
                  `${fournisseur.nom} ${fournisseur.prenom}`}
              </strong>
            </div>
          )}
        </div>

        {/* Lines */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {lines.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--muted)",
              }}
            >
              <Icon d={IC.cart} size={32} />
              <p style={{ marginTop: 12, fontSize: 13 }}>
                Votre panier est vide
              </p>
            </div>
          ) : (
            lines.map(({ p, qty, ht, ttc }) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#e8f0ee,#d4e4e0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {((produit) => {
                    const img =
                      p.images?.find((i) => i.is_primary) || p.images?.[0];
                    return img ? (
                      <img
                        src={`http://localhost:5000${img.image_url}`}
                        alt={p.nom_produit_f || "produit"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Icon d={IC.package} size={18} />
                    );
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text)",
                      lineHeight: 1.3,
                    }}
                  >
                    {p.nom_produit_f}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {fmt(p.prix_unitaire_ht)} DT × {qty}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#2B7574",
                      marginTop: 3,
                    }}
                  >
                    {fmt(ht)} DT HT
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => onRemove(p, true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: 2,
                    }}
                  >
                    <Icon d={IC.trash} size={13} />
                  </button>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <button
                      onClick={() => onQtyChange(p.id, Math.max(0, qty - 1))}
                      style={S.ctrlBtn("#2B7574")}
                    >
                      <Icon d={IC.minus} size={10} />
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => onQtyChange(p.id, qty + 1)}
                      style={S.ctrlBtn("#2B7574")}
                    >
                      <Icon d={IC.plus} size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {lines.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "14px 16px",
              flexShrink: 0,
            }}
          >
            {[
              { label: "Total HT", val: totals.ht },
              { label: "FODEC", val: totals.fodec },
              { label: "TVA", val: totals.tva },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                <span>{r.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {fmt(r.val)} DT
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "var(--text)",
                marginTop: 8,
                paddingTop: 8,
                borderTop: "2px solid var(--border)",
              }}
            >
              <span>Total TTC</span>
              <span style={{ color: "#2B7574" }}>{fmt(totals.ttc)} DT</span>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || !fournisseur}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "12px",
                background: submitting ? "var(--muted)" : "#2B7574",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background .2s",
              }}
            >
              {submitting ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin .7s linear infinite",
                    }}
                  />{" "}
                  Création...
                </>
              ) : (
                <>
                  <Icon d={IC.truck} size={15} /> Passer la commande
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Success Modal ────────────────────────────────────────────────────────────
const SuccessModal = ({ commande, onClose }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      background: "rgba(14,41,49,0.55)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}
  >
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 18,
        padding: "36px 32px",
        textAlign: "center",
        maxWidth: 380,
        width: "100%",
        border: "1px solid var(--border)",
        boxShadow: "0 24px 64px rgba(14,41,49,0.2)",
        animation: "erpSlideUp .25s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(43,117,116,0.1)",
          border: "2px solid #2B7574",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          color: "#2B7574",
        }}
      >
        <Icon d={IC.check} size={28} />
      </div>
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text)",
          letterSpacing: "-0.03em",
        }}
      >
        Commande créée !
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--muted)",
          marginTop: 8,
          lineHeight: 1.6,
        }}
      >
        La commande d'achat{" "}
        <strong style={{ color: "var(--text)" }}>#{commande?.id}</strong> a été
        créée avec succès et est en attente de validation.
      </div>
      <div
        style={{
          margin: "20px 0",
          padding: "12px 16px",
          borderRadius: 10,
          background: "rgba(43,117,116,0.06)",
          border: "1px solid rgba(43,117,116,0.2)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <span style={{ color: "var(--muted)" }}>Total TTC</span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 800,
            color: "#2B7574",
          }}
        >
          {fmt(commande?.total_ttc)} DT
        </span>
      </div>
      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: "11px",
          background: "#2B7574",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Fermer
      </button>
    </div>
  </div>
);

// ─── Styles shared ────────────────────────────────────────────────────────────
const S = {
  ctrlBtn: (c) => ({
    width: 24,
    height: 24,
    border: `1px solid ${c}33`,
    background: `${c}11`,
    color: c,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  }),
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CatalogueAchat = ({ showToast }) => {
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [fourFilter, setFourFilter] = useState(""); // id_fournisseur filter
  const [isGrid, setIsGrid] = useState(true);
  const [cart, setCart] = useState({}); // { produit_id: qty }
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  // Load data
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [pRes, fRes] = await Promise.all([
          API.get("/produits-fournisseur"),
          API.get("/users/fournisseurs"),
        ]);
        setProduits(pRes.data?.data || []);
        setFournisseurs(Array.isArray(fRes.data) ? fRes.data : []);
      } catch (err) {
        showToast?.("Erreur lors du chargement du catalogue.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter produits
  const categories = useMemo(
    () => [...new Set(produits.map((p) => p.categorie).filter(Boolean))].sort(),
    [produits],
  );

  const filtered = useMemo(
    () =>
      produits.filter((p) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          p.nom_produit_f?.toLowerCase().includes(q) ||
          p.categorie?.toLowerCase().includes(q) ||
          p.description_f?.toLowerCase().includes(q);
        const matchC = !catFilter || p.categorie === catFilter;
        const matchF =
          !fourFilter || String(p.id_fournisseur) === String(fourFilter);
        return matchQ && matchC && matchF;
      }),
    [produits, search, catFilter, fourFilter],
  );

  // Cart helpers
  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);

  const cartFournisseurId = useMemo(() => {
    const ids = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id]) => produits.find((p) => String(p.id) === id)?.id_fournisseur)
      .filter(Boolean);
    return ids.length ? ids[0] : null;
  }, [cart, produits]);

  const cartFournisseur = useMemo(
    () => fournisseurs.find((f) => String(f.id) === String(cartFournisseurId)),
    [fournisseurs, cartFournisseurId],
  );

  const handleAdd = useCallback(
    (prod) => {
      // Enforce single-fournisseur cart
      const newFour = String(prod.id_fournisseur);
      if (
        cartFournisseurId &&
        String(cartFournisseurId) !== newFour &&
        cartCount > 0
      ) {
        const ok = window.confirm(
          "Votre panier contient des produits d'un autre fournisseur. Vider le panier et ajouter ce produit ?",
        );
        if (!ok) return;
        setCart({ [prod.id]: 1 });
        return;
      }
      setCart((prev) => ({ ...prev, [prod.id]: (prev[prod.id] || 0) + 1 }));
    },
    [cartFournisseurId, cartCount],
  );

  const handleRemove = useCallback((prod, full = false) => {
    setCart((prev) => {
      const next = { ...prev };
      if (full || (next[prod.id] || 0) <= 1) delete next[prod.id];
      else next[prod.id] -= 1;
      return next;
    });
  }, []);

  const handleQtyChange = useCallback((id, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!cartFournisseurId) {
      showToast?.("Sélectionnez des produits avant de commander.", "error");
      return;
    }
    const lines = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        id_produit_fournisseur: Number(id),
        quantite: qty,
      }));

    setSubmitting(true);
    try {
      const res = await API.post("/commandes-achat", {
        id_fournisseur: cartFournisseurId,
        details: lines,
      });
      if (res.data?.success) {
        setSuccess(res.data.data);
        setCart({});
        setCartOpen(false);
      } else {
        showToast?.(
          res.data?.message || "Erreur lors de la commande.",
          "error",
        );
      }
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Erreur lors de la commande.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fournisseur label helper
  const getFourLabel = (id) => {
    const f = fournisseurs.find((f) => String(f.id) === String(id));
    if (!f) return `#${id}`;
    return f.nom_societe || `${f.nom} ${f.prenom}`;
  };

  return (
    <div className="erp-page" style={{ position: "relative" }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.03em",
            color: "var(--text)",
          }}
        >
          Catalogue Fournisseurs
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          {produits.length} produit{produits.length !== 1 ? "s" : ""}{" "}
          disponibles chez {fournisseurs.length} fournisseur
          {fournisseurs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
          {/* Search */}
          <div className="erp-search" style={{ minWidth: 200 }}>
            <Icon d={IC.search} size={14} />
            <input
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Fournisseur filter */}
          <select
            className="erp-select"
            value={fourFilter}
            onChange={(e) => setFourFilter(e.target.value)}
          >
            <option value="">Tous les fournisseurs</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom_societe || `${f.nom} ${f.prenom}`}
              </option>
            ))}
          </select>

          {/* Catégorie filter */}
          <select
            className="erp-select"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Grid / List toggle */}
          <button
            onClick={() => setIsGrid(true)}
            className="erp-icon-btn"
            style={{
              background: isGrid ? "var(--blue-dim)" : "",
              color: isGrid ? "var(--blue)" : "",
            }}
            title="Grille"
          >
            <Icon d={IC.grid} size={15} />
          </button>
          <button
            onClick={() => setIsGrid(false)}
            className="erp-icon-btn"
            style={{
              background: !isGrid ? "var(--blue-dim)" : "",
              color: !isGrid ? "var(--blue)" : "",
            }}
            title="Liste"
          >
            <Icon d={IC.list} size={15} />
          </button>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#2B7574",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "8px 16px",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              position: "relative",
              boxShadow: "0 2px 12px rgba(43,117,116,0.3)",
            }}
          >
            <Icon d={IC.cart} size={16} />
            Panier
            {cartCount > 0 && (
              <span
                style={{
                  background: "#fff",
                  color: "#2B7574",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  marginLeft: 2,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Active filters chips ── */}
      {(fourFilter || catFilter || search) && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {fourFilter && (
            <div style={S.chip}>
              <Icon d={IC.building} size={11} />
              {getFourLabel(fourFilter)}
              <button onClick={() => setFourFilter("")} style={S.chipX}>
                <Icon d={IC.close} size={10} />
              </button>
            </div>
          )}
          {catFilter && (
            <div style={S.chip}>
              <Icon d={IC.tag} size={11} />
              {catFilter}
              <button onClick={() => setCatFilter("")} style={S.chipX}>
                <Icon d={IC.close} size={10} />
              </button>
            </div>
          )}
          {search && (
            <div style={S.chip}>
              <Icon d={IC.search} size={11} />"{search}"
              <button onClick={() => setSearch("")} style={S.chipX}>
                <Icon d={IC.close} size={10} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cart info banner ── */}
      {cartCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(43,117,116,0.07)",
            border: "1px solid rgba(43,117,116,0.2)",
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#2B7574",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon d={IC.cart} size={14} />
            <strong>
              {cartCount} article{cartCount > 1 ? "s" : ""}
            </strong>{" "}
            dans le panier
            {cartFournisseur && (
              <span style={{ color: "var(--muted)" }}>
                — Fournisseur :{" "}
                <strong style={{ color: "var(--text)" }}>
                  {getFourLabel(cartFournisseurId)}
                </strong>
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setCart({})}
              style={{
                background: "none",
                border: "1px solid rgba(134,18,17,0.3)",
                color: "#861211",
                borderRadius: 7,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon d={IC.trash} size={11} /> Vider
            </button>
            <button
              onClick={() => setCartOpen(true)}
              style={{
                background: "#2B7574",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              Voir le panier →
            </button>
          </div>
        </div>
      )}

      {/* ── Product grid/list ── */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--muted)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon d={IC.package} size={24} />
          </div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
            }}
          >
            Aucun produit trouvé
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Essayez de modifier vos filtres.
          </div>
        </div>
      ) : (
        <>
          <div
            style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}
          >
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </div>
          {/* Group by fournisseur */}
          {!fourFilter && fournisseurs.length > 1 ? (
            fournisseurs.map((f) => {
              const fps = filtered.filter(
                (p) => String(p.id_fournisseur) === String(f.id),
              );
              if (fps.length === 0) return null;
              return (
                <div key={f.id} style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(43,117,116,0.1)",
                        color: "#2B7574",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon d={IC.building} size={14} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--text)",
                        }}
                      >
                        {f.nom_societe || `${f.nom} ${f.prenom}`}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {fps.length} produit{fps.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => setFourFilter(String(f.id))}
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "#2B7574",
                        background: "rgba(43,117,116,0.07)",
                        border: "1px solid rgba(43,117,116,0.2)",
                        borderRadius: 6,
                        padding: "3px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Filtrer
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isGrid
                        ? "repeat(auto-fill,minmax(220px,1fr))"
                        : "1fr",
                      gap: 12,
                    }}
                  >
                    {fps.map((p) => (
                      <ProduitCard
                        key={p.id}
                        produit={p}
                        qty={cart[p.id] || 0}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        isGrid={isGrid}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isGrid
                  ? "repeat(auto-fill,minmax(220px,1fr))"
                  : "1fr",
                gap: 12,
              }}
            >
              {filtered.map((p) => (
                <ProduitCard
                  key={p.id}
                  produit={p}
                  qty={cart[p.id] || 0}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  isGrid={isGrid}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Cart Panel ── */}
      {cartOpen && (
        <CartPanel
          cart={cart}
          produits={produits}
          fournisseur={cartFournisseur}
          onRemove={handleRemove}
          onQtyChange={handleQtyChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* ── Success modal ── */}
      {success && (
        <SuccessModal commande={success} onClose={() => setSuccess(null)} />
      )}
    </div>
  );
};

// Extend shared styles
S.chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 99,
  padding: "4px 10px",
  fontSize: 12,
  color: "var(--text-2)",
};
S.chipX = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--muted)",
  display: "flex",
  alignItems: "center",
  padding: 0,
};

export default CatalogueAchat;