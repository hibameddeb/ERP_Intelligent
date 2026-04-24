import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  home:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  catalogue: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z",
  clients:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 1 0 0 7.75",
  orders:    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
  invoice:   "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  close:     "M18 6L6 18M6 6l12 12",
  check:     "M20 6L9 17l-5-5",
  image:     "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19",
  cart:      "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  plus:      "M12 5v14M5 12h14",
  minus:     "M5 12h14",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  chevL:     "M15 18l-6-6 6-6",
  chevR:     "M9 18l6-6-6-6",
  tag:       "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  alert:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  ban:       "M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636zM5.636 5.636l12.728 12.728",
  download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  trending:  "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  user:      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = (v) => v ?? "—";
const fmtPrice = (v) => v != null ? `${parseFloat(v).toFixed(3)} DT` : "—";
const fmtDate  = (v) => v ? new Date(v).toLocaleDateString("fr-FR") : "—";
const calcTTC  = (ht, tva, fodec, dc) => {
  const p = parseFloat(ht) || 0;
  const f = p * ((parseFloat(fodec) || 0) / 100);
  const t = (p + f) * ((parseFloat(tva) || 0) / 100);
  const d = p * ((parseFloat(dc) || 0) / 100);
  return p + f + t - d;
};
const displayRef = (o) => o?.num_facture || o?.num_ordre || (o?.id ? `#${o.id}` : "—");
const unwrap = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
};

const ITEMS_PER_PAGE = 10;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f8fafc;--surface:#fff;--surface2:#f1f5f9;--border:#e2e8f0;--border2:#cbd5e1;
  --primary:#3b82f6;--primary-h:#2563eb;--primary-l:#eff6ff;
  --success:#10b981;--success-l:#ecfdf5;
  --warning:#f59e0b;--warning-l:#fffbeb;
  --danger:#ef4444;--danger-l:#fef2f2;
  --purple:#8b5cf6;--purple-l:#f5f3ff;
  --text:#1e293b;--text2:#64748b;--text3:#94a3b8;
  --shadow-sm:0 1px 2px rgba(0,0,0,.05);
  --shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);
  --shadow-lg:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);
  --shadow-xl:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);
  --r-sm:6px;--r:10px;--r-lg:14px;--r-xl:18px;
  --sidebar:260px;
}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;line-height:1.5}
.dash{display:flex;height:100vh;overflow:hidden}

/* sidebar */
.sidebar{width:var(--sidebar);min-width:var(--sidebar);background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;box-shadow:var(--shadow-sm)}
.brand{padding:22px 20px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
.brand-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:grid;place-items:center;font-weight:800;font-size:16px;color:#fff;flex-shrink:0;box-shadow:var(--shadow)}
.brand-name{font-weight:700;font-size:14px;color:var(--text);letter-spacing:-.02em}
.brand-role{font-size:11px;color:var(--text2);margin-top:1px;font-weight:500}
.nav{padding:16px 10px;flex:1}
.nav-label{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.15em;text-transform:uppercase;padding:0 12px 10px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r);cursor:pointer;color:var(--text2);font-size:13px;font-weight:500;transition:all .15s;border:none;background:none;width:100%;text-align:left;margin-bottom:2px;position:relative}
.nav-item:hover{background:var(--surface2);color:var(--text);transform:translateX(2px)}
.nav-item.active{background:var(--primary-l);color:var(--primary);font-weight:600}
.nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:18px;background:var(--primary);border-radius:0 3px 3px 0}
.nav-badge{margin-left:auto;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px}
.sidebar-footer{padding:12px 10px;border-top:1px solid var(--border);background:var(--surface2)}
.user-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);background:var(--surface);border:1px solid var(--border);margin-bottom:8px;box-shadow:var(--shadow-sm)}
.avatar{width:32px;height:32px;border-radius:50%;background:var(--primary-l);display:grid;place-items:center;font-size:12px;font-weight:700;color:var(--primary);flex-shrink:0}
.user-name{font-size:13px;font-weight:600}
.user-role{font-size:11px;color:var(--text2);font-weight:500}

/* main */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.topbar{height:62px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 26px;flex-shrink:0;box-shadow:var(--shadow-sm)}
.topbar-title{font-weight:700;font-size:16px;letter-spacing:-.02em}
.content{flex:1;overflow-y:auto;padding:26px}

/* stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;position:relative;overflow:hidden;box-shadow:var(--shadow-sm);transition:all .2s}
.stat:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}
.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.stat.blue::before{background:linear-gradient(90deg,#3b82f6,#2563eb)}
.stat.green::before{background:linear-gradient(90deg,#10b981,#059669)}
.stat.orange::before{background:linear-gradient(90deg,#f59e0b,#d97706)}
.stat.purple::before{background:linear-gradient(90deg,#8b5cf6,#7c3aed)}
.stat-label{font-size:11px;color:var(--text2);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.07em}
.stat-val{font-size:28px;font-weight:800;margin-bottom:3px}
.stat.blue .stat-val{color:var(--primary)}
.stat.green .stat-val{color:var(--success)}
.stat.orange .stat-val{color:var(--warning)}
.stat.purple .stat-val{color:var(--purple)}
.stat-sub{font-size:11px;color:var(--text3);font-weight:500}

/* section header */
.sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.sec-title{font-weight:700;font-size:15px}

/* table */
.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:22px;box-shadow:var(--shadow-sm)}
.tbl{width:100%;border-collapse:collapse}
.tbl thead th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.07em;text-transform:uppercase;background:var(--surface2);border-bottom:1px solid var(--border);white-space:nowrap}
.tbl tbody tr{border-bottom:1px solid var(--border);transition:background .1s;cursor:pointer}
.tbl tbody tr:last-child{border-bottom:none}
.tbl tbody tr:hover{background:var(--surface2)}
.tbl tbody td{padding:12px 16px;font-size:13px;vertical-align:middle}
.thumb{width:40px;height:40px;border-radius:var(--r-sm);background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text3);flex-shrink:0;overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover}

/* badges */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;white-space:nowrap}
.badge-blue{background:var(--primary-l);color:var(--primary);border:1px solid rgba(59,130,246,.2)}
.badge-green{background:var(--success-l);color:var(--success);border:1px solid rgba(16,185,129,.2)}
.badge-orange{background:var(--warning-l);color:var(--warning);border:1px solid rgba(245,158,11,.2)}
.badge-red{background:var(--danger-l);color:var(--danger);border:1px solid rgba(239,68,68,.2)}
.badge-purple{background:var(--purple-l);color:var(--purple);border:1px solid rgba(139,92,246,.2)}
.badge-gray{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;border-radius:var(--r);border:none;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-sm{padding:6px 11px;font-size:12px}
.btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:var(--shadow)}
.btn-primary:hover{background:#1d4ed8;transform:translateY(-1px);box-shadow:var(--shadow-lg)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow-sm)}
.btn-ghost:hover{background:var(--surface2);transform:translateY(-1px)}
.btn-danger{background:var(--danger-l);color:var(--danger);border:1px solid #fca5a5}
.btn-danger:hover{background:#fee2e2}
.btn-success{background:var(--success-l);color:var(--success);border:1px solid #86efac}
.btn-success:hover{background:#dcfce7}
.icon-btn{width:32px;height:32px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);display:grid;place-items:center;cursor:pointer;transition:all .15s;box-shadow:var(--shadow-sm)}
.icon-btn-blue{color:var(--primary)}
.icon-btn-blue:hover{background:var(--primary-l);border-color:var(--primary)}
.icon-btn-red{color:var(--danger)}
.icon-btn-red:hover{background:var(--danger-l);border-color:var(--danger)}

/* search */
.search-box{display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:0 13px;height:36px;transition:all .2s;box-shadow:var(--shadow-sm)}
.search-box:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.search-box input{border:none;background:transparent;outline:none;width:100%;margin-left:8px;font-family:'Inter',sans-serif;font-size:13px;color:var(--text)}
.search-box input::placeholder{color:var(--text3)}

/* filter select */
.flt-sel{background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;font-size:12px;padding:0 28px 0 11px;height:36px;border-radius:var(--r);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;box-shadow:var(--shadow-sm)}
.flt-sel:focus{border-color:var(--primary)}

/* overlay + modal */
.overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:grid;place-items:center;z-index:1000;backdrop-filter:blur(6px);animation:fadeIn .15s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(18px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:28px;width:580px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:slideUp .22s cubic-bezier(.4,0,.2,1);box-shadow:var(--shadow-xl)}
.modal-wide{width:760px}
.modal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.modal-title{font-weight:700;font-size:17px}
.modal-close{width:34px;height:34px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface2);color:var(--text2);display:grid;place-items:center;cursor:pointer;transition:all .2s}
.modal-close:hover{color:var(--text);transform:rotate(90deg)}
.modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid var(--border)}

/* confirm modal */
.confirm-modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:30px;width:420px;max-width:95vw;animation:slideUp .22s cubic-bezier(.4,0,.2,1);box-shadow:var(--shadow-xl);text-align:center}
.confirm-icon{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px}
.confirm-icon.danger{background:var(--danger-l);color:var(--danger)}
.confirm-icon.warning{background:var(--warning-l);color:var(--warning)}
.confirm-title{font-weight:700;font-size:17px;margin-bottom:10px}
.confirm-body{font-size:13.5px;color:var(--text2);line-height:1.7;margin-bottom:24px}
.confirm-btns{display:flex;gap:10px;justify-content:center}

/* form */
.form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-label{font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.06em}
.form-input,.form-select{background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;font-size:13px;padding:9px 13px;border-radius:var(--r);outline:none;transition:border-color .15s;width:100%;box-shadow:var(--shadow-sm)}
.form-input:focus,.form-select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,.1);background:#fff}

/* cart */
.cart-item{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);margin-bottom:8px}
.cart-item-name{font-weight:600;font-size:13px}
.cart-item-price{font-size:11px;color:var(--text2);margin-top:2px}
.cart-item-total{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--success);white-space:nowrap;font-size:13px}
.qty-ctrl{display:flex;align-items:center;gap:7px}
.qty-btn{width:26px;height:26px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);color:var(--text2);display:grid;place-items:center;cursor:pointer;font-size:13px;transition:all .15s}
.qty-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-l)}
.qty-val{font-family:'JetBrains Mono',monospace;font-weight:700;min-width:28px;text-align:center;font-size:13px}
.cart-total-row{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--success-l);border:1px solid #86efac;border-radius:var(--r);margin-bottom:14px}
.cart-total-label{font-size:11px;color:var(--success);font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.cart-total-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:800;color:var(--success)}

/* invoice view */
.inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.inv-logo{font-weight:800;font-size:20px;color:var(--primary);letter-spacing:-.02em}
.inv-meta{text-align:right;font-size:12px;color:var(--text2);line-height:1.8}
.inv-meta strong{color:var(--text)}
.inv-parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.inv-party{background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px}
.inv-party-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.inv-party-name{font-weight:700;font-size:14px;margin-bottom:5px}
.inv-party-detail{font-size:12px;color:var(--text2);line-height:1.7}
.inv-tbl{width:100%;border-collapse:collapse;margin-bottom:18px}
.inv-tbl th{padding:10px 14px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;text-align:left}
.inv-tbl td{padding:12px 14px;border-bottom:1px solid var(--border);font-size:13px}
.inv-tbl tr:last-child td{border-bottom:none}
.inv-totals{margin-left:auto;width:280px}
.inv-total-line{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:var(--text2)}
.inv-total-line.final{color:var(--text);font-weight:700;font-size:15px;padding-top:12px;margin-top:8px;border-top:1px solid var(--border)}
.inv-total-line span:last-child{font-family:'JetBrains Mono',monospace}

/* product grid */
.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.prod-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;cursor:pointer;transition:all .2s;position:relative;box-shadow:var(--shadow-sm)}
.prod-card:hover{border-color:var(--primary);box-shadow:var(--shadow-xl);transform:translateY(-3px)}
.prod-card-img{width:100%;height:140px;background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--text3);overflow:hidden}
.prod-card-img img{width:100%;height:100%;object-fit:cover}
.prod-card-body{padding:14px 16px}
.prod-card-name{font-weight:600;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prod-card-price{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--primary);margin-bottom:8px}
.prod-cart-badge{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:10px;font-weight:700;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;box-shadow:var(--shadow)}

/* pagination */
.pager{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border);background:var(--surface2)}
.pager-info{font-size:12px;color:var(--text2);font-weight:500}
.pager-pages{display:flex;gap:4px;align-items:center}
.page-btn{width:32px;height:32px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-size:12px;font-weight:600;display:grid;place-items:center;transition:all .15s}
.page-btn:hover:not(:disabled){border-color:var(--primary);color:var(--primary)}
.page-btn.active{background:linear-gradient(135deg,#3b82f6,#2563eb);border-color:var(--primary);color:#fff}
.page-btn:disabled{opacity:.4;cursor:not-allowed}

/* empty */
.empty{text-align:center;padding:50px 20px;color:var(--text3)}
.empty p{margin-top:10px;font-size:13px;color:var(--text2)}

/* toast */
.toast{position:fixed;bottom:26px;right:26px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:12px 18px;display:flex;align-items:center;gap:11px;font-size:13px;font-weight:500;animation:slideUp .25s ease;z-index:2000;box-shadow:var(--shadow-xl)}
.toast.success{border-left:4px solid var(--success)}
.toast.error{border-left:4px solid var(--danger)}
.toast-icon{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.toast.success .toast-icon{background:var(--success-l);color:var(--success)}
.toast.error .toast-icon{background:var(--danger-l);color:var(--danger)}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(59,130,246,.2);border-top-color:var(--primary);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner-white{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
`;

// ─── Reusable Components ───────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon"><Icon d={type === "success" ? Icons.check : Icons.close} size={12} /></div>
      {msg}
    </div>
  );
};

const SafeImg = ({ src, style }) => {
  const [err, setErr] = useState(false);
  if (!src || err) return <Icon d={Icons.image} size={28} />;
  return <img src={`http://localhost:5000${src}`} alt="" style={style} onError={() => setErr(true)} />;
};

const Pagination = ({ total, page, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end   = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="pager">
      <span className="pager-info">
        {Math.min((page-1)*perPage+1, total)}–{Math.min(page*perPage, total)} sur {total}
      </span>
      <div className="pager-pages">
        <button className="page-btn" onClick={() => onChange(page-1)} disabled={page===1}><Icon d={Icons.chevL} size={12} /></button>
        {start > 1 && <span style={{ fontSize:12, color:'var(--text3)', padding:'0 4px' }}>…</span>}
        {pages.map(p => <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => onChange(p)}>{p}</button>)}
        {end < totalPages && <span style={{ fontSize:12, color:'var(--text3)', padding:'0 4px' }}>…</span>}
        <button className="page-btn" onClick={() => onChange(page+1)} disabled={page===totalPages}><Icon d={Icons.chevR} size={12} /></button>
      </div>
    </div>
  );
};

// Status helpers
const statusColor = (s) => ({
  en_attente: 'orange', validée: 'green', annulée: 'red', livrée: 'blue',
  VALIDEE: 'green', PAYEE: 'green', EN_RETARD: 'red', ANNULEE: 'red', BROUILLON: 'gray',
})[s] || 'blue';

const StatusBadge = ({ s }) => (
  <span className={`badge badge-${statusColor(s)}`}>
    <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
    {s?.replace(/_/g, ' ') || '—'}
  </span>
);

// ─── Product Detail Modal ─────────────────────────────────────────────────────
const ProductModal = ({ product, onClose, onAddToCart }) => {
  const [qty, setQty] = useState(1);
  const ttc = calcTTC(product.prix_vente_ht, product.taux_tva, product.taux_fodec, product.taux_dc);
  const stockOk = (parseInt(product.quantite) || 0) > 0;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-hdr">
          <span className="modal-title">{product.nom_commercial}</span>
          <button className="modal-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
        </div>

        <div style={{ height:200, background:'var(--surface2)', borderRadius:'var(--r-lg)', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', border:'1px solid var(--border)' }}>
          {product.main_image
            ? <SafeImg src={product.main_image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <Icon d={Icons.image} size={48} />
          }
        </div>

        {product.description_interne && (
          <p style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.7, marginBottom:16 }}>{product.description_interne}</p>
        )}

        {/* Supplier info */}
        {product.fournisseur_societe && (
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--text2)' }}>
            Fournisseur : <strong style={{ color:'var(--text)' }}>{product.fournisseur_societe}</strong>
            {product.fournisseur_nom_produit && <> · {product.fournisseur_nom_produit}</>}
          </div>
        )}

        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:800, color:'var(--primary)', fontFamily:"'JetBrains Mono',monospace" }}>
                {fmtPrice(product.prix_vente_ht)} <span style={{ fontSize:12, color:'var(--text3)', fontFamily:"'Inter',sans-serif", fontWeight:500 }}>HT</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>
                TTC estimé : <strong>{ttc.toFixed(3)} DT</strong>
                {product.taux_tva > 0 && ` · TVA ${product.taux_tva}%`}
                {product.taux_fodec > 0 && ` · FODEC ${product.taux_fodec}%`}
              </div>
              <div style={{ marginTop:8 }}>
                <span className={`badge ${parseInt(product.quantite) > 5 ? 'badge-green' : parseInt(product.quantite) > 0 ? 'badge-orange' : 'badge-red'}`}>
                  {parseInt(product.quantite) > 0 ? `${product.quantite} en stock` : 'Rupture de stock'}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}><Icon d={Icons.minus} size={12} /></button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(parseInt(product.quantite)||99, q+1))}><Icon d={Icons.plus} size={12} /></button>
              </div>
              <button className="btn btn-primary" disabled={!stockOk} onClick={() => { onAddToCart(product, qty); onClose(); }}>
                <Icon d={Icons.cart} size={14} /> Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({ orderId, onClose }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    API.get(`/commandes/${orderId}`)
      .then(r => setData(r.data?.data || r.data))
      .catch(() => setError("Impossible de charger la commande."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const commande = data?.commande;
  const details  = data?.details || [];
  const totalHT  = details.reduce((s, d) => s + parseFloat(d.total_ht_ligne || 0), 0);
  const totalTTC = parseFloat(commande?.total_ttc || 0);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-hdr">
          <span className="modal-title">{commande ? `Commande — ${displayRef(commande)}` : `Commande #${orderId}`}</span>
          <div style={{ display:'flex', gap:8 }}>
            {commande && <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon d={Icons.download} size={13} /> Imprimer</button>}
            <button className="modal-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', padding:'40px', color:'var(--text2)' }}><span className="spinner" /> Chargement…</div>}
        {error   && <div style={{ textAlign:'center', padding:'40px', color:'var(--danger)' }}>{error}</div>}

        {!loading && !error && commande && (
          <div className="inv-header" style={{ display:'block' }}>
            <div className="inv-header">
              <div>
                <div className="inv-logo">Business ERP</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, fontWeight:500 }}>Espace Commercial</div>
              </div>
              <div className="inv-meta">
                <div><strong>Référence</strong> {displayRef(commande)}</div>
                <div><strong>Date</strong> {fmtDate(commande.date_creation)}</div>
                <div><strong>Statut</strong> <StatusBadge s={commande.statut} /></div>
              </div>
            </div>

            <div className="inv-parties">
              <div className="inv-party">
                <div className="inv-party-label">Commercial</div>
                <div className="inv-party-name">{commande.commercial_prenom} {commande.commercial_nom}</div>
              </div>
              <div className="inv-party">
                <div className="inv-party-label">Client</div>
                <div className="inv-party-name">{commande.client_prenom} {commande.client_nom}</div>
                <div className="inv-party-detail">{commande.client_identifiant && `ID : ${commande.client_identifiant}`}<br />{commande.client_ville || '—'}</div>
              </div>
            </div>

            <table className="inv-tbl">
              <thead><tr><th>Produit</th><th style={{ textAlign:'center' }}>Qté</th><th>Prix HT</th><th>Total HT</th></tr></thead>
              <tbody>
                {details.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text2)', padding:24 }}>Aucune ligne</td></tr>
                  : details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{d.nom_produit || `Produit #${d.id_produit_entreprise}`}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>{d.quantite || d.quantite_achetee}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtPrice(d.prix_unitaire_ht_ap)}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--success)' }}>{parseFloat(d.total_ht_ligne||0).toFixed(3)} DT</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div className="inv-totals">
                <div className="inv-total-line"><span>Total HT</span><span>{totalHT.toFixed(3)} DT</span></div>
                <div className="inv-total-line final"><span>Total TTC</span><span>{totalTTC.toFixed(3)} DT</span></div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Fermer</button></div>
      </div>
    </div>
  );
};

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
const InvoiceDetailModal = ({ factureId, onClose }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    API.get(`/factures/${factureId}`)
      .then(r => setData(r.data?.data || r.data))
      .catch(() => setError("Impossible de charger la facture."))
      .finally(() => setLoading(false));
  }, [factureId]);

  const facture = data?.facture || data;
  const details = data?.details || [];
  const totalHT = details.reduce((s, d) => s + parseFloat(d.total_ht_ligne || 0), 0);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-hdr">
          <span className="modal-title">{facture ? `Facture — ${facture.num_facture || `#${factureId}`}` : `Facture #${factureId}`}</span>
          <div style={{ display:'flex', gap:8 }}>
            {facture && <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon d={Icons.download} size={13} /> Imprimer</button>}
            <button className="modal-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', padding:'40px', color:'var(--text2)' }}><span className="spinner" /> Chargement…</div>}
        {error   && <div style={{ textAlign:'center', padding:'40px', color:'var(--danger)' }}>{error}</div>}

        {!loading && !error && facture && (
          <>
            <div className="inv-header">
              <div>
                <div className="inv-logo">Business ERP</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, fontWeight:500 }}>Facture de vente</div>
              </div>
              <div className="inv-meta">
                <div><strong>N° Facture</strong> {facture.num_facture || '—'}</div>
                <div><strong>Date</strong> {fmtDate(facture.date_creation)}</div>
                {facture.trimestre && <div><strong>Trimestre</strong> {facture.trimestre}</div>}
                <div><strong>Statut</strong> <StatusBadge s={facture.statut} /></div>
              </div>
            </div>

            <div className="inv-parties">
              <div className="inv-party">
                <div className="inv-party-label">Commercial</div>
                <div className="inv-party-name">{facture.commercial_prenom} {facture.commercial_nom}</div>
              </div>
              <div className="inv-party">
                <div className="inv-party-label">Client</div>
                <div className="inv-party-name">{facture.client_prenom} {facture.client_nom}</div>
                <div className="inv-party-detail">{facture.client_identifiant && `ID : ${facture.client_identifiant}`}<br />{facture.client_ville || '—'}</div>
              </div>
            </div>

            <table className="inv-tbl">
              <thead><tr><th>Produit</th><th style={{ textAlign:'center' }}>Qté</th><th>Prix HT</th><th>Total HT</th></tr></thead>
              <tbody>
                {details.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text2)', padding:24 }}>Aucune ligne</td></tr>
                  : details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{d.nom_produit || `Produit #${d.id_produit_entreprise}`}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>{d.quantite || d.quantite_achetee}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmtPrice(d.prix_unitaire_ht_ap)}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--success)' }}>{parseFloat(d.total_ht_ligne||0).toFixed(3)} DT</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div className="inv-totals">
                <div className="inv-total-line"><span>Total HT</span><span>{parseFloat(facture.total_ht||totalHT).toFixed(3)} DT</span></div>
                {facture.fodec > 0 && <div className="inv-total-line"><span>FODEC</span><span>{parseFloat(facture.fodec).toFixed(3)} DT</span></div>}
                {facture.tva > 0 && <div className="inv-total-line"><span>TVA</span><span>{parseFloat(facture.tva).toFixed(3)} DT</span></div>}
                <div className="inv-total-line final"><span>Total TTC</span><span>{parseFloat(facture.total_ttc||0).toFixed(3)} DT</span></div>
              </div>
            </div>
          </>
        )}
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Fermer</button></div>
      </div>
    </div>
  );
};

// ─── New Order Modal ──────────────────────────────────────────────────────────
const NewOrderModal = ({ cart, clients, user, onClose, onConfirm, loading, onQtyChange, onRemove }) => {
  const [clientId,  setClientId]  = useState('');
  const [trimestre, setTrimestre] = useState('');

  const total = cart.reduce((s, item) =>
    s + calcTTC(item.prix_vente_ht, item.taux_tva, item.taux_fodec, item.taux_dc) * item.qty, 0);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <span className="modal-title">Nouvelle commande</span>
          <button className="modal-close" onClick={onClose}><Icon d={Icons.close} size={16} /></button>
        </div>

        {/* Cart items */}
        <div style={{ marginBottom:14 }}>
          {cart.map((item, i) => (
            <div key={i} className="cart-item">
              <div style={{ flex:1 }}>
                <div className="cart-item-name">{item.nom_commercial}</div>
                <div className="cart-item-price">{fmtPrice(item.prix_vente_ht)} HT / unité</div>
              </div>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => onQtyChange(i, item.qty - 1)}><Icon d={Icons.minus} size={11} /></button>
                <span className="qty-val">{item.qty}</span>
                <button className="qty-btn" onClick={() => onQtyChange(i, item.qty + 1)}><Icon d={Icons.plus} size={11} /></button>
              </div>
              <div className="cart-item-total">
                {(calcTTC(item.prix_vente_ht, item.taux_tva, item.taux_fodec, item.taux_dc) * item.qty).toFixed(3)} DT
              </div>
              <button className="icon-btn icon-btn-red" onClick={() => onRemove(i)}><Icon d={Icons.trash} size={13} /></button>
            </div>
          ))}
        </div>

        <div className="cart-total-row">
          <span className="cart-total-label">Total TTC estimé</span>
          <span className="cart-total-val">{total.toFixed(3)} DT</span>
        </div>

        <div className="form-group">
          <label className="form-label">Client *</label>
          <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">— Sélectionner un client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom} — {c.ville || c.email || c.identifiant || c.id}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Trimestre</label>
            <select className="form-select" value={trimestre} onChange={e => setTrimestre(e.target.value)}>
              <option value="">— Aucun —</option>
              {['T1','T2','T3','T4'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ clientId, trimestre })}
            disabled={loading || !clientId || cart.length === 0}>
            {loading ? <><span className="spinner-white" /> Création…</> : <><Icon d={Icons.check} size={13} /> Confirmer</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CATALOGUE PAGE ───────────────────────────────────────────────────────────
const CataloguePage = ({ produits, cart, onAddToCart }) => {
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);
  const [sortBy,  setSortBy]  = useState('name_asc');

  const cartQty = id => cart.find(c => c.id === id)?.qty || 0;

  const filtered = produits
    .filter(p => !search || p.nom_commercial?.toLowerCase().includes(search.toLowerCase()) || p.description_interne?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const pa = parseFloat(a.prix_vente_ht) || 0;
      const pb = parseFloat(b.prix_vente_ht) || 0;
      if (sortBy === 'price_asc')  return pa - pb;
      if (sortBy === 'price_desc') return pb - pa;
      if (sortBy === 'name_desc')  return b.nom_commercial?.localeCompare(a.nom_commercial);
      return a.nom_commercial?.localeCompare(b.nom_commercial);
    });

  return (
    <>
      <div className="sec-hdr" style={{ marginBottom:18 }}>
        <span className="sec-title">Catalogue produits <span style={{ fontWeight:500, color:'var(--text2)', marginLeft:6 }}>({filtered.length})</span></span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div className="search-box" style={{ width:240 }}>
            <Icon d={Icons.search} size={14} />
            <input placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="flt-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name_asc">Nom A→Z</option>
            <option value="name_desc">Nom Z→A</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {filtered.length === 0
        ? <div className="empty"><Icon d={Icons.catalogue} size={38} /><p>Aucun produit disponible</p></div>
        : (
          <div className="prod-grid">
            {filtered.map(p => {
              const qty = cartQty(p.id);
              const stockOk = (parseInt(p.quantite) || 0) > 0;
              return (
                <div className="prod-card" key={p.id} onClick={() => setDetail(p)}>
                  {qty > 0 && <span className="prod-cart-badge">{qty}</span>}
                  <div className="prod-card-img">
                    {p.main_image
                      ? <SafeImg src={p.main_image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <Icon d={Icons.image} size={30} />
                    }
                  </div>
                  <div className="prod-card-body">
                    <div className="prod-card-name" title={p.nom_commercial}>{p.nom_commercial}</div>
                    {p.description_interne && (
                      <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.5 }}>
                        {p.description_interne}
                      </div>
                    )}
                    <div className="prod-card-price">{fmtPrice(p.prix_vente_ht)} <span style={{ fontSize:11, color:'var(--text3)', fontFamily:"'Inter',sans-serif", fontWeight:400 }}>HT</span></div>
                    <div style={{ marginBottom:10 }}>
                      <span className={`badge ${parseInt(p.quantite) > 5 ? 'badge-green' : parseInt(p.quantite) > 0 ? 'badge-orange' : 'badge-red'}`}>
                        {parseInt(p.quantite) > 0 ? `${p.quantite} en stock` : 'Rupture'}
                      </span>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ width:'100%' }}
                      disabled={!stockOk}
                      onClick={e => { e.stopPropagation(); onAddToCart(p, 1); }}>
                      <Icon d={Icons.plus} size={12} /> Ajouter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {detail && <ProductModal product={detail} onClose={() => setDetail(null)} onAddToCart={onAddToCart} />}
    </>
  );
};

// ─── CLIENTS PAGE ─────────────────────────────────────────────────────────────
const ClientsPage = ({ clients }) => {
  const [search, setSearch]   = useState('');
  const [page,   setPage]     = useState(1);

  useEffect(() => setPage(1), [search]);

  const filtered  = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.nom?.toLowerCase().includes(q) || c.prenom?.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q) || c.ville?.toLowerCase().includes(q);
  });
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Mes clients ({filtered.length})</span>
        <div className="search-box" style={{ width:260 }}>
          <Icon d={Icons.search} size={14} />
          <input placeholder="Nom, email, ville…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Client</th><th>Identifiant</th><th>Activité</th><th>Ville</th><th>Téléphone</th><th>Statut</th></tr></thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={6} className="empty"><Icon d={Icons.clients} size={32} /><p>Aucun client</p></td></tr>
              : paginated.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar" style={{ width:34, height:34, fontSize:12, fontWeight:800 }}>{c.prenom?.[0]}{c.nom?.[0]}</div>
                      <div>
                        <div style={{ fontWeight:700 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:11, color:'var(--text2)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'var(--text2)' }}>{fmt(c.identifiant)}</td>
                  <td style={{ color:'var(--text2)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fmt(c.activite)}</td>
                  <td style={{ color:'var(--text2)' }}>{fmt(c.ville)}</td>
                  <td style={{ color:'var(--text2)' }}>{fmt(c.num_tlp)}</td>
                  <td><span className={`badge badge-${c.est_actif ? 'green' : 'red'}`}>{c.est_actif ? 'Actif' : 'Inactif'}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} perPage={ITEMS_PER_PAGE} onChange={setPage} />
      </div>
    </>
  );
};

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
const OrdersPage = ({ orders, showToast, onRefresh }) => {
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [page,      setPage]      = useState(1);
  const [viewId,    setViewId]    = useState(null);
  const [cancelO,   setCancelO]   = useState(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => setPage(1), [search, statusF]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || String(o.id).includes(q) || o.num_ordre?.toLowerCase().includes(q)
      || o.client_nom?.toLowerCase().includes(q) || o.client_prenom?.toLowerCase().includes(q);
    return matchSearch && (!statusF || o.statut === statusF);
  });
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await API.post(`/commandes/${cancelO.id}/cancel`);
      showToast('Commande annulée.', 'success');
      setCancelO(null);
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur.', 'error');
    } finally { setCanceling(false); }
  };

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Commandes ({filtered.length})</span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select className="flt-sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">Tous les statuts</option>
            {['en_attente','validée','annulée','livrée'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <div className="search-box" style={{ width:240 }}>
            <Icon d={Icons.search} size={14} />
            <input placeholder="Référence, client…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Trimestre</th><th>Total TTC</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={7} className="empty"><Icon d={Icons.orders} size={32} /><p>Aucune commande</p></td></tr>
              : paginated.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--primary)', fontSize:12 }}>{displayRef(o)}</td>
                  <td>
                    <div style={{ fontWeight:700 }}>{o.client_prenom} {o.client_nom || '—'}</div>
                    {o.client_identifiant && <div style={{ fontSize:11, color:'var(--text2)', fontFamily:"'JetBrains Mono',monospace" }}>{o.client_identifiant}</div>}
                  </td>
                  <td style={{ color:'var(--text2)', fontSize:12 }}>{fmtDate(o.date_creation)}</td>
                  <td>{o.trimestre ? <span className="badge badge-purple">{o.trimestre}</span> : <span style={{ color:'var(--text3)' }}>—</span>}</td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--success)' }}>
                    {o.total_ttc ? `${parseFloat(o.total_ttc).toFixed(3)} DT` : '—'}
                  </td>
                  <td><StatusBadge s={o.statut} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="icon-btn icon-btn-blue" onClick={() => setViewId(o.id)} title="Voir détail"><Icon d={Icons.eye} size={13} /></button>
                      {o.statut === 'en_attente' && (
                        <button className="icon-btn icon-btn-red" onClick={() => setCancelO(o)} title="Annuler"><Icon d={Icons.ban} size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} perPage={ITEMS_PER_PAGE} onChange={setPage} />
      </div>

      {viewId && <OrderDetailModal orderId={viewId} onClose={() => setViewId(null)} />}
      {cancelO && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setCancelO(null)}>
          <div className="confirm-modal">
            <div className="confirm-icon warning"><Icon d={Icons.ban} size={22} /></div>
            <div className="confirm-title">Annuler la commande ?</div>
            <div className="confirm-body">
              La commande <strong>{displayRef(cancelO)}</strong> de <strong>{cancelO.client_prenom} {cancelO.client_nom}</strong> sera annulée définitivement.
            </div>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setCancelO(null)} disabled={canceling}>Retour</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={canceling}>
                {canceling ? <><span className="spinner-white" /> Annulation…</> : <><Icon d={Icons.ban} size={13} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── INVOICES PAGE ────────────────────────────────────────────────────────────
const InvoicesPage = ({ factures }) => {
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [page,    setPage]    = useState(1);
  const [viewId,  setViewId]  = useState(null);

  useEffect(() => setPage(1), [search, statusF]);

  const filtered = factures.filter(f => {
    const q = search.toLowerCase();
    return (!q || f.num_facture?.toLowerCase().includes(q) || f.client_nom?.toLowerCase().includes(q) || f.client_prenom?.toLowerCase().includes(q))
      && (!statusF || f.statut === statusF);
  });
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Factures ({filtered.length})</span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select className="flt-sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">Tous les statuts</option>
            {['VALIDEE','PAYEE','EN_RETARD','ANNULEE','BROUILLON'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="search-box" style={{ width:240 }}>
            <Icon d={Icons.search} size={14} />
            <input placeholder="N° facture, client…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>N° Facture</th><th>Client</th><th>Commercial</th><th>Date</th><th>Trimestre</th><th>Total TTC</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={8} className="empty"><Icon d={Icons.invoice} size={32} /><p>Aucune facture</p></td></tr>
              : paginated.map(f => (
                <tr key={f.id} onClick={() => setViewId(f.id)}>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--primary)', fontSize:12 }}>{f.num_facture}</td>
                  <td>
                    <div style={{ fontWeight:700 }}>{f.client_prenom} {f.client_nom || '—'}</div>
                    {f.client_identifiant && <div style={{ fontSize:11, color:'var(--text2)' }}>{f.client_identifiant}</div>}
                  </td>
                  <td style={{ color:'var(--text2)', fontSize:12 }}>{f.commercial_prenom} {f.commercial_nom}</td>
                  <td style={{ color:'var(--text2)', fontSize:12 }}>{fmtDate(f.date_creation)}</td>
                  <td>{f.trimestre ? <span className="badge badge-purple">{f.trimestre}</span> : <span style={{ color:'var(--text3)' }}>—</span>}</td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--success)' }}>
                    {f.total_ttc ? `${parseFloat(f.total_ttc).toFixed(3)} DT` : '—'}
                  </td>
                  <td><StatusBadge s={f.statut} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="icon-btn icon-btn-blue" onClick={() => setViewId(f.id)}><Icon d={Icons.eye} size={13} /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} perPage={ITEMS_PER_PAGE} onChange={setPage} />
      </div>

      {viewId && <InvoiceDetailModal factureId={viewId} onClose={() => setViewId(null)} />}
    </>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ stats, clients, orders }) => (
  <>
    <div className="stats">
      {[
        { label:'Mes clients',  val:stats.clients,              color:'blue',   sub:'comptes actifs' },
        { label:'Commandes',    val:stats.orders,               color:'green',  sub:'total passées' },
        { label:'Factures',     val:stats.factures,             color:'orange', sub:'générées' },
        { label:'CA total TTC', val:`${stats.ca.toFixed(0)} DT`, color:'purple', sub:'chiffre d\'affaires' },
      ].map(s => (
        <div className={`stat ${s.color}`} key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-val">{s.val}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <div className="sec-hdr"><span className="sec-title">Dernières commandes</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Référence</th><th>Client</th><th>Total TTC</th><th>Statut</th></tr></thead>
            <tbody>
              {orders.slice(0,5).length === 0
                ? <tr><td colSpan={4} className="empty"><p>Aucune commande</p></td></tr>
                : orders.slice(0,5).map(o => (
                  <tr key={o.id}>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", color:'var(--primary)', fontSize:12, fontWeight:700 }}>{displayRef(o)}</td>
                    <td style={{ fontWeight:700 }}>{o.client_prenom} {o.client_nom || '—'}</td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", color:'var(--success)', fontWeight:800 }}>{o.total_ttc ? `${parseFloat(o.total_ttc).toFixed(3)} DT` : '—'}</td>
                    <td><StatusBadge s={o.statut} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="sec-hdr"><span className="sec-title">Clients récents</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Client</th><th>Ville</th><th>Statut</th></tr></thead>
            <tbody>
              {clients.slice(0,5).length === 0
                ? <tr><td colSpan={3} className="empty"><p>Aucun client</p></td></tr>
                : clients.slice(0,5).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight:700 }}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize:11, color:'var(--text2)' }}>{c.email}</div>
                    </td>
                    <td style={{ color:'var(--text2)' }}>{fmt(c.ville)}</td>
                    <td><span className={`badge badge-${c.est_actif ? 'green' : 'red'}`}>{c.est_actif ? 'Actif' : 'Inactif'}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:'home',      label:"Vue d'ensemble",  icon:Icons.home },
  { id:'catalogue', label:'Catalogue',        icon:Icons.catalogue },
  { id:'clients',   label:'Mes clients',      icon:Icons.clients },
  { id:'orders',    label:'Commandes',        icon:Icons.orders },
  { id:'invoices',  label:'Factures',         icon:Icons.invoice },
];

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const CommercialDashboard = () => {
  const [page,         setPage]         = useState('home');
  const [produits,     setProduits]     = useState([]);
  const [clients,      setClients]      = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [factures,     setFactures]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [orderModal,   setOrderModal]   = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [toast,        setToast]        = useState(null);
  const [loading,      setLoading]      = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{"prenom":"Commercial","role":"COMMERCIAL"}');

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const safeGet = async (url) => {
      try { const r = await API.get(url); return unwrap(r.data); }
      catch (err) { console.warn(`[fetchAll] ${url}`, err.response?.status ?? err.message); return []; }
    };

    const [prods, cls, ords, facts] = await Promise.all([
      safeGet('/produits-entreprise'),          // GET /api/produits-entreprise → { success, data: [] }
      safeGet('/users'),                         // GET /api/users → array (commercial gets only their clients)
      safeGet('/commandes/mes-commandes'),       // GET /api/commandes/mes-commandes
      safeGet('/factures'),                      // GET /api/factures → { success, data: [] }
    ]);

    setProduits(prods);
    setClients(cls.filter(u => u.role === 'CLIENT' || u.client_id)); // only clients
    setOrders(ords);
    setFactures(facts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addToCart = useCallback((product, qty) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { ...product, qty }];
    });
    showToast(`${product.nom_commercial} ajouté au panier.`, 'success');
  }, [showToast]);

  const updateQty = (idx, qty) => {
    if (qty <= 0) setCart(prev => prev.filter((_, i) => i !== idx));
    else setCart(prev => prev.map((item, i) => i === idx ? { ...item, qty } : item));
  };
  const removeFromCart = idx => setCart(prev => prev.filter((_, i) => i !== idx));

  const cartTotal = cart.reduce((s, item) =>
    s + calcTTC(item.prix_vente_ht, item.taux_tva, item.taux_fodec, item.taux_dc) * item.qty, 0);

  const handleCreateOrder = async ({ clientId, trimestre }) => {
    setOrderLoading(true);
    try {
      const parsedClientId = parseInt(clientId);
      if (!clientId || isNaN(parsedClientId)) { showToast('Veuillez sélectionner un client.', 'error'); return; }

      await API.post('/commandes', {
        id_client:    parsedClientId,
        id_commercial: user.id,
        trimestre:    trimestre || null,
        details:      cart.map(item => ({
          id_produit:          item.id,          // backend uses id_produit or id_produit_entreprise
          quantite_achetee:    item.qty,
          prix_unitaire_ht_ap: item.prix_vente_ht,
        })),
      });

      showToast('Commande créée avec succès !', 'success');
      setCart([]);
      setOrderModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la création.', 'error');
    } finally { setOrderLoading(false); }
  };

  const stats = {
    clients:  clients.length,
    orders:   orders.length,
    factures: factures.length,
    ca:       factures.reduce((s, f) => s + (parseFloat(f.total_ttc) || 0), 0),
  };

  const titles = { home:"Vue d'ensemble", catalogue:'Catalogue', clients:'Mes Clients', orders:'Commandes', invoices:'Factures' };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; };

  return (
    <>
      <style>{styles}</style>
      <div className="dash">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">B</div>
            <div>
              <div className="brand-name">Business ERP</div>
              <div className="brand-role">Espace Commercial</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-label">Menu</div>
            {NAV.map(n => (
              <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <Icon d={n.icon} size={17} />
                {n.label}
                {n.id === 'catalogue' && cart.length > 0 && (
                  <span className="nav-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>
                )}
                {n.id === 'orders' && orders.filter(o => o.statut === 'en_attente').length > 0 && (
                  <span className="nav-badge">{orders.filter(o => o.statut === 'en_attente').length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="avatar">{user.prenom?.[0] || 'C'}</div>
              <div>
                <div className="user-name">{user.prenom || 'Commercial'} {user.nom || ''}</div>
                <div className="user-role">Commercial</div>
              </div>
            </div>
            <button className="nav-item" style={{ width:'100%' }} onClick={handleLogout}>
              <Icon d={Icons.logout} size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">
          <header className="topbar">
            <span className="topbar-title">{titles[page]}</span>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {loading && <span className="spinner" />}
              {!loading && (
                <button className="icon-btn" onClick={fetchAll} title="Actualiser"><Icon d={Icons.refresh} size={15} /></button>
              )}
              {cart.length > 0 && (
                <button className="btn btn-primary" onClick={() => setOrderModal(true)}>
                  <Icon d={Icons.cart} size={14} />
                  Panier ({cart.reduce((s, i) => s + i.qty, 0)}) — {cartTotal.toFixed(3)} DT
                </button>
              )}
            </div>
          </header>

          <main className="content">
            {page === 'home'      && <HomePage stats={stats} clients={clients} orders={orders} />}
            {page === 'catalogue' && <CataloguePage produits={produits} cart={cart} onAddToCart={addToCart} />}
            {page === 'clients'   && <ClientsPage clients={clients} />}
            {page === 'orders'    && <OrdersPage orders={orders} showToast={showToast} onRefresh={fetchAll} />}
            {page === 'invoices'  && <InvoicesPage factures={factures} />}
          </main>
        </div>
      </div>

      {orderModal && (
        <NewOrderModal
          cart={cart} clients={clients} user={user}
          onClose={() => setOrderModal(false)}
          onConfirm={handleCreateOrder}
          loading={orderLoading}
          onQtyChange={updateQty}
          onRemove={removeFromCart}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
};

export default CommercialDashboard;