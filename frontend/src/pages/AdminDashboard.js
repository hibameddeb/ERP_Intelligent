import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import API from "../services/api";
import DemandesAdhesion from "./DemandesAdhesion";
import GestionProduits from "./GestionProduits";
import Parametres from "./Parametres";
import GestionFournisseurs from "./GestionFournisseurs";
import CommandesPage from "./Commandes";
import LogActivite from "./LogActivite";
import NotificationBell from "./NotificationBell";
import CatalogueAchat from "./Catalogueachat";
import SupportPage from "./Reclamations";

// ─── Icon ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  users:        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  products:     "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z",
  orders:       "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
  stats:        "M18 20V10M12 20V4M6 20v-6",
  settings:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:       "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  plus:         "M12 5v14M5 12h14",
  edit:         "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:        "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  toggle:       "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  search:       "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  close:        "M18 6L6 18M6 6l12 12",
  check:        "M20 6L9 17l-5-5",
  demand:       "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  activity:     "M22 12h-4l-3 9L9 3l-3 9H2",
  bell:         "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  shield:       "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  transfer:     "M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01",
  warning:      "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  eye:          "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  phone:        "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2.46h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.99-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail:         "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  map:          "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  briefcase:    "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z",
  arrowLeft:    "M19 12H5M12 19l-7-7 7-7",
  reclamations: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z",
  creditCard:   "M1 4h22v16H1zM1 10h22",
};

// ─── Design System CSS ────────────────────────────────────────────────────────
const DS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #E8E6E3;
  --surface:     #F6F4F1;
  --surface-2:   #FFFFFF;
  --surface-3:   #EDEAE7;
  --border:      #D6D2CE;
  --border-2:    #C4BFB9;
  --blue:        #2B7574;
  --blue-dim:    rgba(43,117,116,0.10);
  --blue-glow:   rgba(43,117,116,0.22);
  --blue-hover:  #12484C;
  --teal:        #12484C;
  --teal-dim:    rgba(18,72,76,0.10);
  --amber:       #a06b1a;
  --amber-dim:   rgba(160,107,26,0.10);
  --rose:        #861211;
  --rose-dim:    rgba(134,18,17,0.10);
  --violet:      #0E2931;
  --violet-dim:  rgba(14,41,49,0.10);
  --text:        #0E2931;
  --text-2:      #3d6372;
  --muted:       #7a98a4;
  --sidebar-w:   252px;
  --topbar-h:    60px;
  --r:           10px;
  --r-lg:        14px;
  --r-xl:        18px;
}

body {
  background: var(--bg); color: var(--text);
  font-family: 'DM Sans', sans-serif; font-size: 14px;
  line-height: 1.5; -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-2); }

.erp-shell { display: flex; height: 100vh; overflow: hidden; }

/* ── Sidebar ── */
.erp-sidebar {
  width: var(--sidebar-w); min-width: var(--sidebar-w);
  background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.erp-brand {
  display: flex; align-items: center; gap: 12px;
  padding: 22px 18px 20px; border-bottom: 1px solid var(--border);
}
.erp-brand-mark {
  width: 36px; height: 36px; border-radius: 9px; background: var(--blue);
  display: grid; place-items: center; flex-shrink: 0;
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;
  font-size: 17px; color: #fff; letter-spacing: -0.05em;
  box-shadow: 0 0 0 3px var(--blue-dim), 0 4px 14px var(--blue-glow);
}
.erp-brand-name {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
  font-size: 14.5px; color: var(--text); letter-spacing: -0.02em; line-height: 1.2;
}
.erp-brand-sub {
  font-size: 11px; color: var(--muted); margin-top: 2px;
  letter-spacing: 0.05em; text-transform: uppercase; font-weight: 500;
}
.erp-nav { padding: 12px 10px; flex: 1; overflow-y: auto; }
.erp-nav-label {
  font-size: 10px; font-weight: 600; color: var(--muted);
  letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 10px 6px; display: block;
}
.erp-nav-btn {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 12px; border: none; background: none;
  border-radius: var(--r); color: var(--text-2);
  font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
  cursor: pointer; transition: background 0.15s, color 0.15s; text-align: left;
  position: relative;
}
.erp-nav-btn:hover { background: var(--surface-2); color: var(--text); }
.erp-nav-btn.active { background: var(--blue-dim); color: var(--blue); font-weight: 600; }
.erp-nav-btn.active::before {
  content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
  width: 3px; border-radius: 0 3px 3px 0; background: var(--blue);
}
.erp-nav-btn svg { opacity: 0.75; flex-shrink: 0; }
.erp-nav-btn.active svg { opacity: 1; }
.erp-nav-btn.danger { color: var(--rose); }
.erp-nav-btn.danger:hover { background: var(--rose-dim); }
.erp-sidebar-footer { border-top: 1px solid var(--border); padding: 12px 10px; }
.erp-user-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: var(--r);
  background: var(--surface-2); border: 1px solid var(--border); margin-bottom: 6px;
}
.erp-user-chip-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.erp-user-chip-role { font-size: 11px; color: var(--muted); }

/* ── Avatar ── */
.erp-avatar {
  display: grid; place-items: center; border-radius: 8px;
  background: linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%);
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
  color: #fff; flex-shrink: 0; letter-spacing: -0.02em;
}
.erp-avatar.sm  { width: 28px; height: 28px; font-size: 11px; border-radius: 7px; }
.erp-avatar.md  { width: 34px; height: 34px; font-size: 13px; border-radius: 9px; }
.erp-avatar.lg  { width: 44px; height: 44px; font-size: 17px; border-radius: 11px; }
.erp-avatar.xl  { width: 72px; height: 72px; font-size: 26px; border-radius: 18px; }
.erp-avatar.circle { border-radius: 50%; }

/* ── Main area ── */
.erp-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.erp-topbar {
  height: var(--topbar-h); background: var(--surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; flex-shrink: 0; gap: 16px;
}
.erp-topbar-left { display: flex; align-items: center; gap: 8px; }
.erp-breadcrumb-base { font-size: 13px; color: var(--muted); }
.erp-breadcrumb-sep { color: var(--border-2); margin: 0 2px; }
.erp-page-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
  font-size: 15px; color: var(--text); letter-spacing: -0.02em;
}
.erp-topbar-right { display: flex; align-items: center; gap: 8px; }
.erp-topbar-divider { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }
.erp-icon-btn {
  width: 34px; height: 34px; border-radius: var(--r);
  border: 1px solid var(--border); background: var(--surface-2);
  color: var(--text-2); display: grid; place-items: center;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.erp-icon-btn:hover { border-color: var(--border-2); color: var(--text); background: var(--surface-3); }
.erp-topbar-user {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 12px 5px 5px; border-radius: 99px;
  border: 1px solid var(--border); background: var(--surface-2); cursor: default;
}
.erp-topbar-username { font-size: 13px; font-weight: 500; color: var(--text-2); }
.erp-content { flex: 1; overflow-y: auto; padding: 28px; }

/* ── Stats grid ── */
.erp-stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 14px; margin-bottom: 24px;
}
.erp-stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 20px 20px 18px;
  transition: border-color 0.2s;
}
.erp-stat-card:hover { border-color: var(--border-2); }
.erp-stat-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: grid; place-items: center; margin-bottom: 14px;
}
.erp-stat-label {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.erp-stat-value {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px;
  font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px;
}
.erp-stat-sub { font-size: 12px; color: var(--muted); }

/* ── Toolbar ── */
.erp-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
}
.erp-toolbar-left { display: flex; align-items: center; gap: 8px; }
.erp-toolbar-right { display: flex; align-items: center; gap: 8px; }
.erp-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
  font-size: 15px; color: var(--text); letter-spacing: -0.02em;
}
.erp-section-count { font-size: 12px; color: var(--muted); margin-left: 5px; font-weight: 400; }

/* ── Search / Select ── */
.erp-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r); padding: 0 12px; height: 36px;
  transition: border-color 0.15s; color: var(--muted);
}
.erp-search:focus-within { border-color: var(--blue); color: var(--blue); }
.erp-search input {
  background: none; border: none; outline: none; color: var(--text);
  font-family: 'DM Sans', sans-serif; font-size: 13px; width: 190px;
}
.erp-search input::placeholder { color: var(--muted); }
.erp-select {
  background: var(--surface); border: 1px solid var(--border); color: var(--text);
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  padding: 0 28px 0 12px; height: 36px; border-radius: var(--r);
  outline: none; cursor: pointer; transition: border-color 0.15s; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a98a4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
}
.erp-select:focus { border-color: var(--blue); }
.erp-select option { background: var(--surface-2); }

/* ── Buttons ── */
.erp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 16px; border-radius: var(--r);
  border: 1px solid transparent; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; white-space: nowrap; letter-spacing: -0.01em;
}
.erp-btn svg { flex-shrink: 0; }
.erp-btn-sm { height: 30px; padding: 0 11px; font-size: 12px; }
.erp-btn-primary { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 1px 3px var(--blue-glow); }
.erp-btn-primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); }
.erp-btn-primary:active { transform: scale(0.98); }
.erp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.erp-btn-ghost { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
.erp-btn-ghost:hover { border-color: var(--border-2); color: var(--text); background: var(--surface-3); }
.erp-btn-danger { background: var(--rose-dim); color: var(--rose); border-color: rgba(134,18,17,0.25); }
.erp-btn-danger:hover { background: rgba(134,18,17,0.18); }
.erp-btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }
.erp-btn-success { background: var(--teal-dim); color: var(--teal); border-color: rgba(18,72,76,0.25); }
.erp-btn-success:hover { background: rgba(18,72,76,0.18); }
.erp-btn-pay {
  background: var(--blue); color: #fff; border-color: var(--blue);
  height: 30px; padding: 0 12px; font-size: 12px; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'DM Sans', sans-serif; font-weight: 500;
  cursor: pointer; border: 1px solid var(--blue); transition: all 0.15s;
}
.erp-btn-pay:hover { background: var(--blue-hover); }
.erp-btn-pay:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Table ── */
.erp-table-container {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-lg); overflow: hidden;
}
.erp-table { width: 100%; border-collapse: collapse; }
.erp-table thead th {
  padding: 11px 16px; text-align: left;
  font-size: 11px; font-weight: 600; color: var(--muted);
  letter-spacing: 0.07em; text-transform: uppercase;
  background: var(--surface-2); border-bottom: 1px solid var(--border);
  white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
}
.erp-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
.erp-table tbody tr:last-child { border-bottom: none; }
.erp-table tbody tr:hover { background: var(--surface-2); }
.erp-table tbody td { padding: 13px 16px; font-size: 13.5px; vertical-align: middle; }
.erp-table tbody tr.clickable-row { cursor: pointer; }

/* ── User cell ── */
.erp-user-cell { display: flex; align-items: center; gap: 11px; }
.erp-user-name { font-weight: 500; color: var(--text); font-size: 13.5px; }
.erp-user-id { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--muted); margin-top: 1px; }

/* ── Badges ── */
.erp-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.03em; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap;
}
.erp-badge-blue   { background: var(--blue-dim);   color: var(--blue);   border: 1px solid rgba(43,117,116,0.2); }
.erp-badge-amber  { background: var(--amber-dim);  color: var(--amber);  border: 1px solid rgba(160,107,26,0.2); }
.erp-badge-violet { background: var(--violet-dim); color: var(--violet); border: 1px solid rgba(14,41,49,0.2); }
.erp-badge-teal   { background: var(--teal-dim);   color: var(--teal);   border: 1px solid rgba(18,72,76,0.2); }
.erp-badge-rose   { background: var(--rose-dim);   color: var(--rose);   border: 1px solid rgba(134,18,17,0.2); }
.erp-badge-muted  { background: rgba(77,90,122,0.12); color: var(--text-2); border: 1px solid var(--border); }

/* ── Status ── */
.erp-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.erp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.erp-status-active   { background: var(--teal-dim);  color: var(--teal); }
.erp-status-inactive { background: var(--rose-dim);  color: var(--rose); }
.erp-status-pending  { background: var(--amber-dim); color: var(--amber); }

/* ── Action buttons ── */
.erp-actions { display: flex; align-items: center; gap: 4px; }
.erp-act-btn {
  width: 30px; height: 30px; border-radius: 7px; border: none;
  display: grid; place-items: center; cursor: pointer; transition: all 0.15s;
}
.erp-act-edit  { background: var(--blue-dim);   color: var(--blue); }
.erp-act-edit:hover  { background: rgba(43,117,116,0.2); }
.erp-act-del   { background: var(--rose-dim);   color: var(--rose); }
.erp-act-del:hover   { background: rgba(134,18,17,0.2); }
.erp-act-ok    { background: var(--teal-dim);   color: var(--teal); }
.erp-act-ok:hover    { background: rgba(18,72,76,0.2); }
.erp-act-off   { background: var(--rose-dim);   color: var(--rose); }
.erp-act-off:hover   { background: rgba(134,18,17,0.2); }
.erp-act-view  { background: var(--violet-dim); color: var(--violet); }
.erp-act-view:hover  { background: rgba(14,41,49,0.2); }
.erp-act-pay   { background: var(--blue-dim);   color: var(--blue); }
.erp-act-pay:hover   { background: rgba(43,117,116,0.2); }

/* ── Empty state ── */
.erp-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 24px; gap: 12px; color: var(--muted);
}
.erp-empty-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--surface-2); border: 1px solid var(--border);
  display: grid; place-items: center;
}
.erp-empty p { font-size: 13.5px; color: var(--text-2); }

/* ── Modal / Overlay ── */
.erp-overlay {
  position: fixed; inset: 0; background: rgba(14,41,49,0.55);
  display: grid; place-items: center; z-index: 1000;
  backdrop-filter: blur(8px); animation: erpFadeIn 0.14s ease;
}
@keyframes erpFadeIn { from { opacity:0 } to { opacity:1 } }
.erp-modal {
  background: var(--surface); border: 1px solid var(--border-2);
  border-radius: var(--r-xl); padding: 28px;
  width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
  animation: erpSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
}
.erp-modal-wide { width: 660px; }
@keyframes erpSlideUp {
  from { transform: translateY(14px) scale(0.97); opacity: 0 }
  to   { transform: none; opacity: 1 }
}
.erp-modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 22px; gap: 12px;
}
.erp-modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px;
  font-weight: 700; color: var(--text); letter-spacing: -0.02em;
}
.erp-modal-sub { font-size: 13px; color: var(--text-2); margin-top: 3px; }
.erp-modal-close {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface-2);
  color: var(--muted); display: grid; place-items: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.15s;
}
.erp-modal-close:hover { color: var(--text); border-color: var(--border-2); }
.erp-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border);
}

/* ── Form ── */
.erp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.erp-form-full { grid-column: 1 / -1; }
.erp-form-group { display: flex; flex-direction: column; gap: 6px; }
.erp-form-label { font-size: 12px; font-weight: 500; color: var(--text-2); }
.erp-form-label span { color: var(--rose); margin-left: 2px; }
.erp-input, .erp-form-select {
  background: var(--surface-2); border: 1px solid var(--border); color: var(--text);
  font-family: 'DM Sans', sans-serif; font-size: 13.5px;
  padding: 9px 13px; border-radius: var(--r); outline: none;
  transition: border-color 0.15s, box-shadow 0.15s; width: 100%;
}
.erp-input:focus, .erp-form-select:focus {
  border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-dim);
}
.erp-input::placeholder { color: var(--muted); }
.erp-input:disabled { opacity: 0.5; cursor: not-allowed; }
.erp-form-select option { background: var(--surface-2); }

/* ── Confirm modal ── */
.erp-confirm { width: 440px; text-align: center; padding: 32px 28px 28px; }
.erp-confirm-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: grid; place-items: center; margin: 0 auto 18px;
}
.erp-confirm-icon.danger  { background: var(--rose-dim);  color: var(--rose);  border: 1px solid rgba(134,18,17,0.2); }
.erp-confirm-icon.warning { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(160,107,26,0.2); }
.erp-confirm h3 {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700;
  margin-bottom: 8px; letter-spacing: -0.02em;
}
.erp-confirm p { color: var(--text-2); font-size: 13.5px; line-height: 1.6; margin-bottom: 20px; }
.erp-confirm-btns { display: flex; gap: 8px; justify-content: center; }

/* ── Transfer box ── */
.erp-transfer-box {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r); padding: 14px 16px; margin-bottom: 20px; text-align: left;
}
.erp-transfer-box-label {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.erp-transfer-alert {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--amber-dim); border: 1px solid rgba(160,107,26,0.25);
  border-radius: var(--r); padding: 10px 12px; margin-bottom: 14px;
  font-size: 12.5px; color: var(--amber); text-align: left;
}

/* ── Drawer ── */
.erp-drawer-overlay {
  position: fixed; inset: 0; background: rgba(14,41,49,0.35);
  z-index: 900; animation: erpFadeIn 0.15s ease;
}
.erp-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 420px; max-width: 95vw;
  background: var(--surface); border-left: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
  animation: drawerSlide 0.25s cubic-bezier(0.16,1,0.3,1); z-index: 950;
}
@keyframes drawerSlide {
  from { transform: translateX(100%); opacity: 0 }
  to   { transform: none; opacity: 1 }
}
.erp-drawer-header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 20px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.erp-drawer-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px;
  font-weight: 700; color: var(--text); letter-spacing: -0.02em; flex: 1;
}
.erp-drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
.erp-drawer-section { margin-bottom: 22px; }
.erp-drawer-section-label {
  font-size: 10px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.erp-info-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13px;
}
.erp-info-row:last-child { border-bottom: none; }
.erp-info-row-icon  { color: var(--muted); flex-shrink: 0; }
.erp-info-row-label { color: var(--muted); width: 90px; flex-shrink: 0; font-size: 12px; }
.erp-info-row-value { color: var(--text); font-weight: 500; }

/* ── Client card ── */
.erp-client-card {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 12px; border-radius: var(--r);
  background: var(--surface-2); border: 1px solid var(--border);
  margin-bottom: 8px; transition: border-color 0.15s;
}
.erp-client-card:hover { border-color: var(--border-2); }
.erp-client-card-name { font-size: 13px; font-weight: 500; color: var(--text); }
.erp-client-card-meta { font-size: 11.5px; color: var(--muted); margin-top: 1px; }

/* ── Toast ── */
.erp-toast {
  position: fixed; bottom: 22px; right: 22px;
  background: var(--surface-2); border: 1px solid var(--border-2);
  border-radius: var(--r-lg); padding: 12px 18px;
  display: flex; align-items: center; gap: 11px;
  font-size: 13.5px; font-weight: 500;
  animation: toastIn 0.28s cubic-bezier(0.16,1,0.3,1); z-index: 9999;
  box-shadow: 0 8px 32px rgba(14,41,49,0.15); max-width: 360px;
}
@keyframes toastIn { from { transform: translateY(10px) scale(0.95); opacity:0 } to { transform:none; opacity:1 } }
.erp-toast.success { border-left: 3px solid var(--teal); }
.erp-toast.error   { border-left: 3px solid var(--rose); }
.erp-toast-icon { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
.erp-toast.success .erp-toast-icon { background: var(--teal-dim); color: var(--teal); }
.erp-toast.error   .erp-toast-icon { background: var(--rose-dim); color: var(--rose); }

/* ── Coming soon ── */
.erp-coming {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 60vh; gap: 16px;
}
.erp-coming-icon {
  width: 68px; height: 68px; border-radius: 18px;
  background: var(--surface); border: 1px solid var(--border);
  display: grid; place-items: center; color: var(--muted); margin-bottom: 4px;
}
.erp-coming h2 {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700;
  color: var(--text); letter-spacing: -0.03em;
}
.erp-coming p { font-size: 13px; color: var(--text-2); max-width: 280px; text-align: center; line-height: 1.7; }
.erp-coming-tag {
  background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(43,117,116,0.2);
  padding: 4px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600;
}

/* ── Spinner ── */
.erp-spin {
  width: 16px; height: 16px; border: 2px solid var(--border);
  border-top-color: var(--blue); border-radius: 50%;
  animation: spin 0.65s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Payment Modal ── */
.pay-overlay {
  position: fixed; inset: 0; background: rgba(14,41,49,0.60);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; animation: erpFadeIn 0.15s ease;
}
.pay-modal {
  background: var(--surface); border-radius: var(--r-xl);
  width: 560px; max-width: 96vw; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid var(--border-2);
  animation: erpSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
}
.pay-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  background: var(--surface-2); flex-shrink: 0;
}
.pay-header-title { font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 700; font-size: 15px; color: var(--text); }
.pay-header-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }
.pay-close {
  background: none; border: none; cursor: pointer; color: var(--muted);
  font-size: 20px; line-height: 1; padding: 2px 6px; border-radius: 6px;
  transition: color 0.15s;
}
.pay-close:hover { color: var(--text); }
.pay-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.pay-iframe { flex: 1; border: none; width: 100%; height: 480px; }
.pay-center {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 14px; padding: 40px 24px; text-align: center;
}
.pay-spinner {
  width: 44px; height: 44px; border: 3px solid var(--border);
  border-top-color: var(--blue); border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.pay-success-icon {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--teal-dim); color: var(--teal);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700;
  border: 2px solid rgba(18,72,76,0.2);
}
.pay-error-icon {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--rose-dim); color: var(--rose);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700;
  border: 2px solid rgba(134,18,17,0.2);
}
.pay-hint { font-size: 13px; color: var(--muted); }
.pay-polling-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px; background: var(--surface-2);
  border-top: 1px solid var(--border); font-size: 12px; color: var(--muted);
  flex-shrink: 0;
}
.pay-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--blue);
  animation: payPulse 1.4s ease-in-out infinite; flex-shrink: 0;
}
@keyframes payPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes payBar   { from{width:0} to{width:100%} }
.pay-footer {
  padding: 9px 20px; font-size: 11px; color: var(--muted);
  text-align: center; border-top: 1px solid var(--border);
  background: var(--surface-2); flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 1100px) { .erp-stats-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 768px)  { .erp-sidebar { display: none; } .erp-content { padding: 16px; } }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const roleBadge = (role) => {
  const map = { ADMIN: "blue", COMMERCIAL: "amber", COMPTABLE: "violet", CLIENT: "teal" };
  return <span className={`erp-badge erp-badge-${map[role] || "muted"}`}>{role}</span>;
};

const initials = (u) =>
  `${u.prenom?.[0] || ""}${u.nom?.[0] || ""}`.toUpperCase();

const statutBadge = (statut) => {
  const map = {
    non_payée: "amber",
    payée:     "teal",
    annulée:   "rose",
  };
  const label = statut === "non_payée" ? "non payée" : statut;
  return <span className={`erp-badge erp-badge-${map[statut] || "muted"}`}>{label}</span>;
};

const Toast = ({ msg, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`erp-toast ${type}`}>
      <div className="erp-toast-icon">
        <Icon d={type === "success" ? Icons.check : Icons.close} size={13} />
      </div>
      {msg}
    </div>
  );
};

const PaymentModal = ({ facture, onPaid, onClose }) => {
  const [step, setStep]               = useState("choose");
  const [activeMethod, setActiveMethod] = useState(null);
  const [sentEmail, setSentEmail]     = useState("");
  const [errMsg, setErrMsg]           = useState("");
  const [showBar, setShowBar]         = useState(false);
  const pollingRef                    = useRef(null);

  useEffect(() => () => clearInterval(pollingRef.current), []);

  const handleKonnect = async () => {
    setActiveMethod("konnect");
    setStep("sending");
    try {
      const res = await API.post(`/payment/facture/${facture.id}/initier`);
      setSentEmail(res.data.email || facture?.fournisseur_email || "");
      setStep("email_sent");
      pollingRef.current = setInterval(async () => {
        try {
          const r = await API.get(`/payment/facture/${facture.id}/verifier`);
          if (r.data.statut === "payée") {
            clearInterval(pollingRef.current);
            setStep("paid");
            setTimeout(() => { onPaid?.(); onClose?.(); }, 2500);
          }
        } catch (_) {}
      }, 5000);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Erreur lors de l'envoi du lien.");
      setStep("error");
    }
  };

  const lancerSimulation = async () => {
    setStep("processing");
    setShowBar(true);
    try {
      await API.post(`/payment/facture/${facture.id}/simuler`);
      setTimeout(() => {
        setStep("paid");
        setTimeout(() => { onPaid?.(); onClose?.(); }, 2500);
      }, 2200);
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

  const numFacture = facture?.num_facture;
  const montant    = facture?.total_ttc;

  return (
    <div className="pay-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="pay-modal">
        <div className="pay-header">
          <div>
            <div className="pay-header-title">💳 Paiement sécurisé</div>
            <div className="pay-header-sub">
              Facture {numFacture} — {parseFloat(montant || 0).toFixed(3)} DT
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
              borderRadius:99, background:"var(--blue-dim)", color:"var(--blue)",
              fontSize:11, fontWeight:600, border:"1px solid rgba(43,117,116,0.2)"
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--blue)", display:"inline-block" }} />
              Sandbox
            </span>
            <button className="pay-close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="pay-body">
          {step === "choose" && (
            <div style={{ padding:28, display:"flex", flexDirection:"column", gap:16, flex:1 }}>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15, color:"var(--text)", marginBottom:4 }}>
                Choisir une méthode de paiement
              </div>
              <button onClick={handleKonnect} style={{
                display:"flex", alignItems:"flex-start", gap:14, padding:18,
                borderRadius:14, border:"2px solid var(--border)", background:"var(--surface-2)",
                cursor:"pointer", textAlign:"left", transition:"all 0.18s", width:"100%"
              }}
              onMouseOver={e=>e.currentTarget.style.borderColor="var(--blue)"}
              onMouseOut={e=>e.currentTarget.style.borderColor="var(--border)"}
              >
                <div style={{
                  width:46, height:46, borderRadius:12, background:"var(--blue-dim)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0
                }}>💳</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"var(--text)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Konnect Gateway
                  </div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:3, lineHeight:1.5 }}>
                    Génère un lien de paiement sécurisé<br/>envoyé par email au fournisseur
                  </div>
                  <span style={{
                    display:"inline-block", marginTop:8, padding:"2px 8px", borderRadius:99,
                    fontSize:10, fontWeight:700, background:"var(--blue-dim)", color:"var(--blue)",
                    border:"1px solid rgba(43,117,116,0.2)"
                  }}>Sandbox</span>
                </div>
              </button>
              <button onClick={() => { setActiveMethod("demo"); setStep("demo"); }} style={{
                display:"flex", alignItems:"flex-start", gap:14, padding:18,
                borderRadius:14, border:"2px solid var(--border)", background:"var(--surface-2)",
                cursor:"pointer", textAlign:"left", transition:"all 0.18s", width:"100%"
              }}
              onMouseOver={e=>e.currentTarget.style.borderColor="var(--amber)"}
              onMouseOut={e=>e.currentTarget.style.borderColor="var(--border)"}
              >
                <div style={{
                  width:46, height:46, borderRadius:12, background:"var(--amber-dim)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0
                }}>🧪</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"var(--text)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Simulation démo
                  </div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:3, lineHeight:1.5 }}>
                    Marque la facture payée directement<br/>pour la démonstration PFE
                  </div>
                  <span style={{
                    display:"inline-block", marginTop:8, padding:"2px 8px", borderRadius:99,
                    fontSize:10, fontWeight:700, background:"var(--amber-dim)", color:"var(--amber)",
                    border:"1px solid rgba(160,107,26,0.2)"
                  }}>Démo PFE</span>
                </div>
              </button>
            </div>
          )}

          {step === "sending" && (
            <div className="pay-center">
              <div className="pay-spinner" />
              <p style={{ fontWeight:600, fontSize:15, color:"var(--text)" }}>Génération du lien…</p>
              <p className="pay-hint">Préparation du lien de paiement et envoi par email au fournisseur.</p>
            </div>
          )}

          {step === "email_sent" && (
            <div className="pay-center">
              <div style={{
                width:72, height:72, borderRadius:"50%",
                background:"var(--blue-dim)", border:"2px solid rgba(43,117,116,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:32
              }}>✉️</div>
              <p style={{ fontWeight:700, fontSize:17, color:"var(--text)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Lien de paiement envoyé !
              </p>
              <p className="pay-hint">Un email a été envoyé au fournisseur :</p>
              <div style={{
                background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:8,
                padding:"8px 16px", fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                color:"var(--blue)", fontWeight:600
              }}>
                📧 {sentEmail}
              </div>
              <p className="pay-hint" style={{ maxWidth:320, textAlign:"center", lineHeight:1.7 }}>
                Le fournisseur recevra un email avec un lien sécurisé pour saisir
                ses coordonnées bancaires et encaisser le paiement.<br/>
                <strong>Ce lien est valable 60 minutes.</strong>
              </p>
              <div className="pay-polling-bar" style={{ borderRadius:10, border:"1px solid var(--border)", marginTop:4 }}>
                <div className="pay-dot" />
                En attente du paiement par le fournisseur…
                <button onClick={handleRetry} style={{
                  marginLeft:"auto", background:"none", border:"none",
                  color:"var(--muted)", fontSize:12, cursor:"pointer"
                }}>Annuler</button>
              </div>
            </div>
          )}

          {step === "demo" && (
            <div className="pay-center">
              <div style={{
                width:"100%", maxWidth:400, background:"var(--surface-2)",
                border:"1px solid var(--border)", borderRadius:16, overflow:"hidden"
              }}>
                <div style={{
                  padding:"20px 24px", background:"linear-gradient(135deg,#2B7574,#0E2931)",
                  textAlign:"center"
                }}>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>
                    Simulation de paiement
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>Mode démonstration PFE</div>
                </div>
                <div style={{ padding:24 }}>
                  <div style={{
                    background:"var(--surface-3)", border:"1px solid var(--border)",
                    borderRadius:10, padding:18, textAlign:"center", marginBottom:20
                  }}>
                    <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      Montant à simuler
                    </div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:34, fontWeight:800, color:"var(--text)" }}>
                      {parseFloat(montant || 0).toFixed(3)} <span style={{ fontSize:16, color:"var(--muted)" }}>DT</span>
                    </div>
                  </div>
                  <div style={{
                    display:"flex", gap:10, background:"var(--amber-dim)", border:"1px solid rgba(160,107,26,0.2)",
                    borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:12, color:"var(--amber)", lineHeight:1.5
                  }}>
                    <span style={{ flexShrink:0, fontSize:16 }}>⚠️</span>
                    <span>Mode démonstration — aucun vrai paiement. La facture <strong>{numFacture}</strong> sera marquée <strong>payée</strong> en base de données.</span>
                  </div>
                  <button onClick={lancerSimulation} style={{
                    width:"100%", padding:15, borderRadius:12,
                    background:"linear-gradient(135deg,#2B7574,#12484C)",
                    color:"#fff", border:"none", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontWeight:700, fontSize:15, cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", gap:8
                  }}>
                    <Icon d={Icons.check} size={16} /> Confirmer le paiement simulé
                  </button>
                </div>
              </div>
              <button onClick={handleRetry} style={{
                background:"none", border:"none", color:"var(--muted)",
                fontSize:12, cursor:"pointer", marginTop:4
              }}>← Changer de méthode</button>
            </div>
          )}

          {step === "processing" && (
            <div className="pay-center">
              <div className="pay-spinner" />
              <p style={{ fontWeight:600, fontSize:15, color:"var(--text)" }}>Traitement en cours…</p>
              <p className="pay-hint">Simulation du paiement de <strong>{parseFloat(montant || 0).toFixed(3)} DT</strong></p>
              {showBar && (
                <div style={{ width:240, height:4, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", background:"linear-gradient(90deg,var(--blue),#4ade80)",
                    borderRadius:99, animation:"payBar 2.2s cubic-bezier(0.4,0,0.2,1) forwards"
                  }} />
                </div>
              )}
            </div>
          )}

          {step === "paid" && (
            <div className="pay-center">
              <div className="pay-success-icon">✓</div>
              <p style={{ fontWeight:700, fontSize:17, color:"var(--teal)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Paiement confirmé !
              </p>
              <p className="pay-hint">La facture <strong>{numFacture}</strong> est maintenant réglée.</p>
              <div style={{
                padding:"10px 20px", borderRadius:10, fontSize:13, fontWeight:700,
                background:"var(--teal-dim)", color:"var(--teal)", border:"1px solid rgba(18,72,76,0.2)"
              }}>
                ✓ {parseFloat(montant || 0).toFixed(3)} DT réglés avec succès
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="pay-center">
              <div className="pay-error-icon">✕</div>
              <p style={{ fontWeight:700, fontSize:15, color:"var(--rose)" }}>Erreur</p>
              <p className="pay-hint">{errMsg}</p>
              <button className="erp-btn erp-btn-primary" onClick={handleRetry} style={{ marginTop:8 }}>
                Réessayer
              </button>
            </div>
          )}
        </div>

        <div className="pay-footer">
          🔒 SSL sécurisé · 🏦 Powered by <strong>Konnect</strong> · 🇹🇳 Agréé BCT · ⚠️ Mode Sandbox
        </div>
      </div>
    </div>
  );
};

// ─── FacturesAchatPage ────────────────────────────────────────────────────────
const FacturesAchatPage = ({ showToast }) => {
  const [factures, setFactures]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [payModal, setPayModal]   = useState(null);

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/factures-achat");
      setFactures(res.data?.data || []);
    } catch {
      showToast("Erreur chargement factures.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchFactures(); }, [fetchFactures]);

  const filtered = factures.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.num_facture?.toLowerCase().includes(q) ||
      f.fournisseur_nom?.toLowerCase().includes(q) ||
      f.fournisseur_prenom?.toLowerCase().includes(q);
    const matchStatut = !statutFilter || f.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const stats = [
    { label: "Total",     value: factures.length,                                          color: "var(--blue)",   dim: "var(--blue-dim)",   icon: Icons.demand,     sub: "factures achat" },
    { label: "Non payées",value: factures.filter((f) => f.statut === "non_payée").length,  color: "var(--amber)",  dim: "var(--amber-dim)",  icon: Icons.warning,    sub: "impayées" },
    { label: "Payées",    value: factures.filter((f) => f.statut === "payée").length,      color: "var(--teal)",   dim: "var(--teal-dim)",   icon: Icons.check,      sub: "réglées" },
    { label: "Annulées",  value: factures.filter((f) => f.statut === "annulée").length,    color: "var(--rose)",   dim: "var(--rose-dim)",   icon: Icons.close,      sub: "annulées" },
  ];

  return (
    <>
      <div className="erp-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="erp-stat-card">
            <div className="erp-stat-icon" style={{ background: s.dim, color: s.color }}>
              <Icon d={s.icon} size={16} />
            </div>
            <div className="erp-stat-label">{s.label}</div>
            <div className="erp-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="erp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="erp-toolbar">
        <div className="erp-toolbar-left">
          <span className="erp-section-title">
            Factures Achat <span className="erp-section-count">({filtered.length})</span>
          </span>
        </div>
        <div className="erp-toolbar-right">
          <div className="erp-search">
            <Icon d={Icons.search} size={14} />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="erp-select"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="non_payée">Non payée</option>
            <option value="payée">Payée</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>
      </div>

      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Fournisseur</th>
              <th>Total HT</th>
              <th>Total TTC</th>
              <th>Statut</th>
              <th>Date création</th>
              <th>Date échéance</th>
              <th style={{ width: 130 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="erp-empty">
                    <span className="erp-spin" style={{ width: 24, height: 24 }} />
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="erp-empty">
                    <div className="erp-empty-icon">
                      <Icon d={Icons.demand} size={22} />
                    </div>
                    <p>Aucune facture trouvée</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((f) => (
              <tr key={f.id}>
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: "var(--blue)" }}>
                    {f.num_facture}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: "var(--text)" }}>
                    {f.fournisseur_prenom} {f.fournisseur_nom}
                  </div>
                  {f.fournisseur_societe && (
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{f.fournisseur_societe}</div>
                  )}
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  {parseFloat(f.total_ht || 0).toFixed(3)} DT
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>
                  {parseFloat(f.total_ttc || 0).toFixed(3)} DT
                </td>
                <td>{statutBadge(f.statut)}</td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {f.date_creation ? new Date(f.date_creation).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td>
                  <div className="erp-actions">
                    {f.statut === "non_payée" && (
                      <button
                        className="erp-act-btn erp-act-pay"
                        title="Payer cette facture"
                        onClick={() => setPayModal(f)}
                      >
                        <Icon d={Icons.creditCard} size={13} />
                      </button>
                    )}
                    {f.statut === "payée" && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: "var(--teal)",
                        background: "var(--teal-dim)", padding: "3px 8px",
                        borderRadius: 6, border: "1px solid rgba(18,72,76,0.2)",
                      }}>
                        ✓ Payée
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payModal && (
        <PaymentModal
          facture={payModal}
          onPaid={() => {
            showToast(`Facture ${payModal.num_facture} payée avec succès !`, "success");
            fetchFactures();
          }}
          onClose={() => setPayModal(null)}
        />
      )}
    </>
  );
};

// ─── FacturesVentePage ────────────────────────────────────────────────────────
const FacturesVentePage = ({ showToast }) => {
  const [factures, setFactures]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [statutFilter, setStatutFilter]       = useState("");
  const [commercialFilter, setCommercialFilter] = useState("");
  const [busyId, setBusyId]                   = useState(null);

  // ── Deduplicated, sorted list of commerciaux from loaded factures ──
  const commerciaux = useMemo(() => {
    const seen = new Set();
    return factures
      .filter((f) => {
        const name = `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((f) => ({
        key:   `${f.commercial_prenom || ""}_${f.commercial_nom || ""}`,
        label: `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [factures]);

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/factures");
      setFactures(res.data?.data || []);
    } catch {
      showToast("Erreur chargement factures vente.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchFactures(); }, [fetchFactures]);

  const filtered = factures.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.num_facture?.toLowerCase().includes(q) ||
      f.client_nom?.toLowerCase().includes(q) ||
      f.client_prenom?.toLowerCase().includes(q) ||
      f.commercial_nom?.toLowerCase().includes(q) ||
      f.commercial_prenom?.toLowerCase().includes(q);
    const matchStatut     = !statutFilter     || f.statut === statutFilter;
    const matchCommercial = !commercialFilter ||
      `${f.commercial_prenom || ""} ${f.commercial_nom || ""}`.trim() === commercialFilter;
    return matchSearch && matchStatut && matchCommercial;
  });

  const stats = [
    { label: "Total",      value: factures.length,                                          color: "var(--blue)",   dim: "var(--blue-dim)",   icon: Icons.demand,     sub: "factures vente" },
    { label: "Non payées", value: factures.filter((f) => f.statut === "non_payée").length, color: "var(--amber)",  dim: "var(--amber-dim)",  icon: Icons.warning,    sub: "impayées" },
    { label: "Payées",     value: factures.filter((f) => f.statut === "payée").length,     color: "var(--teal)",   dim: "var(--teal-dim)",   icon: Icons.check,      sub: "réglées" },
    { label: "Annulées",   value: factures.filter((f) => f.statut === "annulée").length,   color: "var(--rose)",   dim: "var(--rose-dim)",   icon: Icons.close,      sub: "annulées" },
  ];

  const runAction = async (id, path, msg) => {
    setBusyId(id);
    try {
      await API.patch(`/factures/${id}/${path}`);
      showToast(msg, "success");
      fetchFactures();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="erp-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="erp-stat-card">
            <div className="erp-stat-icon" style={{ background: s.dim, color: s.color }}>
              <Icon d={s.icon} size={16} />
            </div>
            <div className="erp-stat-label">{s.label}</div>
            <div className="erp-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="erp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div className="erp-toolbar-left">
          <span className="erp-section-title">
            Factures Vente <span className="erp-section-count">({filtered.length})</span>
          </span>
        </div>
        <div className="erp-toolbar-right">
          <div className="erp-search">
            <Icon d={Icons.search} size={14} />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="erp-select"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="non_payée">Non payée</option>
            <option value="payée">Payée</option>
            <option value="annulée">Annulée</option>
          </select>
          {/* ── Filtre commercial ── */}
          <select
            className="erp-select"
            value={commercialFilter}
            onChange={(e) => setCommercialFilter(e.target.value)}
          >
            <option value="">Tous les commerciaux</option>
            {commerciaux.map((c) => (
              <option key={c.key} value={c.label}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Client</th>
              <th>Commercial</th>
              <th>Total HT</th>
              <th>Total TTC</th>
              <th>Statut</th>
              <th>Date création</th>
              <th>Date échéance</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                  Aucune facture vente
                </td>
              </tr>
            ) : filtered.map((f) => (
              <tr key={f.id}>
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: "var(--blue)" }}>
                    {f.num_facture}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: "var(--text)" }}>
                    {f.client_prenom} {f.client_nom}
                  </div>
                  {f.client_identifiant && (
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{f.client_identifiant}</div>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {f.commercial_prenom} {f.commercial_nom}
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  {parseFloat(f.total_ht || 0).toFixed(3)} DT
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>
                  {parseFloat(f.total_ttc || 0).toFixed(3)} DT
                </td>
                <td>{statutBadge(f.statut)}</td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {f.date_creation ? new Date(f.date_creation).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td>
                  <div className="erp-actions">
                    {f.statut === "non_payée" && (
                      <button
                        className="erp-act-btn erp-act-ok"
                        title="Marquer payée"
                        disabled={busyId === f.id}
                        onClick={() => runAction(f.id, "payer", `Facture ${f.num_facture} payée.`)}
                      >
                        <Icon d={Icons.check} size={13} />
                      </button>
                    )}
                    {f.statut !== "annulée" &&
                      f.status_electronique !== "submitted" &&
                      f.status_electronique !== "accepted" && (
                      <button
                        className="erp-act-btn erp-act-edit"
                        title="Envoyer à TTN"
                        disabled={busyId === f.id}
                        onClick={() => runAction(f.id, "emettre", `Facture ${f.num_facture} envoyée à TTN.`)}
                      >
                        <Icon d={Icons.bell} size={13} />
                      </button>
                    )}
                    {f.statut !== "payée" && f.statut !== "annulée" && (
                      <button
                        className="erp-act-btn erp-act-del"
                        title="Annuler"
                        disabled={busyId === f.id}
                        onClick={() => runAction(f.id, "annuler", `Facture ${f.num_facture} annulée.`)}
                      >
                        <Icon d={Icons.close} size={13} />
                      </button>
                    )}
                    {f.statut === "payée" && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: "var(--teal)",
                        background: "var(--teal-dim)", padding: "3px 8px",
                        borderRadius: 6, border: "1px solid rgba(18,72,76,0.2)",
                      }}>
                        ✓ Payée
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Tunisian regions ─────────────────────────────────────────────────────────
const REGIONS_TN = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Le Kef","Mahdia","La Manouba",
  "Médenine","Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana",
  "Sousse","Tataouine","Tozeur","Tunis","Zaghouan",
];

// ─── UserModal ────────────────────────────────────────────────────────────────
const UserModal = ({ user, onClose, onSaved, toast }) => {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", role: "COMMERCIAL", num_tlp: "", region: "",
    ...(user || {}),
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isCommercial = form.role === "COMMERCIAL";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      isEdit
        ? await API.put(`/users/${form.id}`, form)
        : await API.post("/users", form);
      toast(isEdit ? "Utilisateur mis à jour." : "Utilisateur créé.", "success");
      onSaved();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || "Erreur.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="erp-modal">
        <div className="erp-modal-header">
          <div>
            <div className="erp-modal-title">
              {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </div>
            <div className="erp-modal-sub">
              {isEdit ? `Édition du compte #${form.id}` : "Ajouter un membre au système"}
            </div>
          </div>
          <button className="erp-modal-close" onClick={onClose}>
            <Icon d={Icons.close} size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="erp-form-grid">
            <div className="erp-form-group">
              <label className="erp-form-label">Nom <span>*</span></label>
              <input className="erp-input" value={form.nom} onChange={set("nom")} required placeholder="Dupont" />
            </div>
            <div className="erp-form-group">
              <label className="erp-form-label">Prénom <span>*</span></label>
              <input className="erp-input" value={form.prenom} onChange={set("prenom")} required placeholder="Jean" />
            </div>
            <div className="erp-form-group erp-form-full">
              <label className="erp-form-label">Adresse email <span>*</span></label>
              <input className="erp-input" type="email" value={form.email} onChange={set("email")} required placeholder="jean@entreprise.com" />
            </div>
            <div className="erp-form-group">
              <label className="erp-form-label">Rôle <span>*</span></label>
              <select className="erp-input erp-form-select" value={form.role} onChange={set("role")} disabled={isEdit}>
                <option value="COMMERCIAL">Commercial</option>
                <option value="COMPTABLE">Comptable</option>
              </select>
            </div>
            <div className="erp-form-group">
              <label className="erp-form-label">Téléphone {isCommercial && <span>*</span>}</label>
              <input className="erp-input" value={form.num_tlp || ""} onChange={set("num_tlp")} placeholder="+216 98 000 000" required={isCommercial} />
            </div>
            {isCommercial && (
              <div className="erp-form-group erp-form-full">
                <label className="erp-form-label">Région <span>*</span></label>
                <select className="erp-input erp-form-select" value={form.region || ""} onChange={set("region")} required>
                  <option value="">— Sélectionner une région —</option>
                  {REGIONS_TN.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="erp-modal-footer">
            <button type="button" className="erp-btn erp-btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="erp-btn erp-btn-primary" disabled={loading}>
              {loading ? <span className="erp-spin" /> : <Icon d={isEdit ? Icons.check : Icons.plus} size={14} />}
              {isEdit ? "Enregistrer" : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
const DeleteConfirmModal = ({ user, allUsers, onClose, onConfirm, loading }) => {
  const isCommercial = user?.role === "COMMERCIAL";
  const [nouveauCommercialId, setNouveauCommercialId] = useState("");
  const commercialClients = isCommercial
    ? allUsers.filter((u) => u.role === "CLIENT" && u.id_commercial === user.id)
    : [];
  const clientCount = commercialClients.length;
  const otherCommercials = allUsers.filter((u) => u.role === "COMMERCIAL" && u.id !== user?.id);
  const needsTransfer = isCommercial && clientCount > 0;
  const canConfirm = !needsTransfer || nouveauCommercialId !== "";

  return (
    <div className="erp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="erp-modal erp-confirm">
        <div className={`erp-confirm-icon ${needsTransfer ? "warning" : "danger"}`}>
          <Icon d={needsTransfer ? Icons.transfer : Icons.trash} size={22} />
        </div>
        <h3>{needsTransfer ? "Transférer puis supprimer ?" : "Supprimer l'utilisateur ?"}</h3>
        <p>
          Vous êtes sur le point de supprimer{" "}
          <strong>{user?.prenom} {user?.nom}</strong>.
          {needsTransfer && <> Ce commercial a <strong>{clientCount} client(s)</strong> qui doivent être transférés.</>}
          {!needsTransfer && isCommercial && " Ce commercial n'a aucun client."}
          {!isCommercial && " Cette action est irréversible."}
        </p>
        {needsTransfer && (
          <div className="erp-transfer-box">
            <div className="erp-transfer-alert">
              <Icon d={Icons.warning} size={14} />
              <span>Les {clientCount} client(s) seront notifiés par email du changement de commercial.</span>
            </div>
            <div className="erp-transfer-box-label">Assigner les clients à</div>
            {otherCommercials.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--rose)", padding: "6px 0" }}>
                Aucun autre commercial disponible. Créez-en un d'abord.
              </p>
            ) : (
              <select className="erp-input erp-form-select" value={nouveauCommercialId} onChange={(e) => setNouveauCommercialId(e.target.value)}>
                <option value="">— Choisir un commercial —</option>
                {otherCommercials.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="erp-confirm-btns">
          <button className="erp-btn erp-btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="erp-btn erp-btn-danger"
            onClick={() => onConfirm(needsTransfer ? parseInt(nouveauCommercialId) : null)}
            disabled={loading || !canConfirm || (needsTransfer && otherCommercials.length === 0)}
          >
            {loading ? <span className="erp-spin" /> : <Icon d={Icons.trash} size={14} />}
            {needsTransfer ? "Transférer & Supprimer" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── UserDrawer ───────────────────────────────────────────────────────────────
const UserDrawer = ({ user: initialUser, allUsers, onClose, onEdit }) => {
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [allCommercials, setAllCommercials] = useState([]);
  const [navStack, setNavStack]         = useState([initialUser]);

  const user      = navStack[navStack.length - 1];
  const canGoBack = navStack.length > 1;
  const pushUser  = (u) => setNavStack((prev) => [...prev, u]);
  const popUser   = () => setNavStack((prev) => prev.slice(0, -1));

  useEffect(() => {
    API.get("/users?roleFilter=COMMERCIAL")
      .then((res) => setAllCommercials(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setClients([]);
    if (user?.role !== "COMMERCIAL") return;
    setLoading(true);
    API.get("/users?roleFilter=CLIENT")
      .then((res) => setClients((res.data || []).filter((c) => c.id_commercial === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  if (!user) return null;

  const assignedCommercial =
    user.role === "CLIENT"
      ? allUsers.find((u) => u.id === user.id_commercial) ||
        allCommercials.find((u) => u.id === user.id_commercial)
      : null;

  return (
    <>
      <div className="erp-drawer-overlay" onClick={onClose} />
      <aside className="erp-drawer">
        <div className="erp-drawer-header">
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}
            onClick={canGoBack ? popUser : onClose}
            title={canGoBack ? "Retour" : "Fermer"}
          >
            <Icon d={Icons.arrowLeft} size={16} />
          </button>
          <span className="erp-drawer-title">
            {canGoBack ? (
              <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                  ← {navStack[navStack.length - 2]?.prenom} {navStack[navStack.length - 2]?.nom}
                </span>
                <span>Fiche client</span>
              </span>
            ) : "Fiche utilisateur"}
          </span>
          <button className="erp-btn erp-btn-ghost erp-btn-sm" onClick={() => onEdit(user)}>
            <Icon d={Icons.edit} size={13} /> Modifier
          </button>
        </div>

        <div className="erp-drawer-body">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div className="erp-avatar xl">{initials(user)}</div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "var(--text)" }}>
                {user.prenom} {user.nom}
              </div>
              <div style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}>
                {roleBadge(user.role)}
                <span className={`erp-status ${user.est_actif ? "erp-status-active" : "erp-status-inactive"}`}>
                  <span className="erp-status-dot" />
                  {user.est_actif ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>

          <div className="erp-drawer-section">
            <div className="erp-drawer-section-label">Informations</div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "4px 14px" }}>
              <div className="erp-info-row">
                <span className="erp-info-row-icon"><Icon d={Icons.mail} size={14} /></span>
                <span className="erp-info-row-label">Email</span>
                <span className="erp-info-row-value">{user.email}</span>
              </div>
              <div className="erp-info-row">
                <span className="erp-info-row-icon"><Icon d={Icons.phone} size={14} /></span>
                <span className="erp-info-row-label">Téléphone</span>
                <span className="erp-info-row-value" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  {user.num_tlp || "—"}
                </span>
              </div>
              <div className="erp-info-row">
                <span className="erp-info-row-icon"><Icon d={Icons.shield} size={14} /></span>
                <span className="erp-info-row-label">ID</span>
                <span className="erp-info-row-value" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  #{String(user.id).padStart(5, "0")}
                </span>
              </div>
              {user.role === "CLIENT" && user.ville && (
                <div className="erp-info-row">
                  <span className="erp-info-row-icon"><Icon d={Icons.map} size={14} /></span>
                  <span className="erp-info-row-label">Ville</span>
                  <span className="erp-info-row-value">{user.ville}</span>
                </div>
              )}
              {user.role === "CLIENT" && user.activite && (
                <div className="erp-info-row">
                  <span className="erp-info-row-icon"><Icon d={Icons.briefcase} size={14} /></span>
                  <span className="erp-info-row-label">Activité</span>
                  <span className="erp-info-row-value">{user.activite}</span>
                </div>
              )}
            </div>
          </div>

          {user.role === "CLIENT" && (
            <div className="erp-drawer-section">
              <div className="erp-drawer-section-label">Commercial assigné</div>
              {assignedCommercial ? (
                <div className="erp-client-card">
                  <div className="erp-avatar md">{initials(assignedCommercial)}</div>
                  <div>
                    <div className="erp-client-card-name">{assignedCommercial.prenom} {assignedCommercial.nom}</div>
                    <div className="erp-client-card-meta">{assignedCommercial.email}</div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Aucun commercial assigné.</p>
              )}
            </div>
          )}

          {user.role === "COMMERCIAL" && (
            <div className="erp-drawer-section">
              <div className="erp-drawer-section-label">
                Clients ({loading ? "…" : clients.length})
              </div>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                  <span className="erp-spin" style={{ width: 22, height: 22 }} />
                </div>
              ) : clients.length === 0 ? (
                <div className="erp-empty" style={{ padding: "24px 0" }}>
                  <div className="erp-empty-icon"><Icon d={Icons.users} size={20} /></div>
                  <p>Aucun client assigné</p>
                </div>
              ) : (
                <>
                  {user.region && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--blue)", fontWeight: 600, background: "var(--blue-dim)", border: "1px solid rgba(43,117,116,0.2)", borderRadius: "var(--r)", padding: "6px 12px", marginBottom: 10 }}>
                      <Icon d={Icons.map} size={13} />
                      Région : {user.region}
                    </div>
                  )}
                  {clients.map((c) => (
                    <div key={c.id} className="erp-client-card" style={{ cursor: "pointer" }}
                      onClick={() => pushUser(c)} title={`Voir la fiche de ${c.prenom} ${c.nom}`}>
                      <div className="erp-avatar md">{initials(c)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="erp-client-card-name">{c.prenom} {c.nom}</div>
                        <div className="erp-client-card-meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {c.email}
                          {c.region && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--blue)", background: "var(--blue-dim)", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>
                              {c.region}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`erp-status ${c.est_actif ? "erp-status-active" : "erp-status-inactive"}`} style={{ fontSize: 11 }}>
                        <span className="erp-status-dot" />
                        {c.est_actif ? "Actif" : "Inactif"}
                      </span>
                      <span style={{ color: "var(--muted)", marginLeft: 4, flexShrink: 0 }}>
                        <Icon d={Icons.eye} size={13} />
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// ─── UsersPage ────────────────────────────────────────────────────────────────
const UsersPage = ({ showToast }) => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalUser, setModalUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?roleFilter=${roleFilter}` : "";
      const res = await API.get(`/users${params}`);
      setUsers(res.data || []);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (u, e) => {
    e.stopPropagation();
    try {
      await API.patch(`/users/${u.id}/status`, { est_actif: !u.est_actif });
      showToast(`Compte ${!u.est_actif ? "activé" : "désactivé"}.`, "success");
      fetchUsers();
    } catch {
      showToast("Erreur.", "error");
    }
  };

  const handleDelete = async (nouveau_commercial_id = null) => {
    setDelLoading(true);
    try {
      await API.delete(`/users/${deleteUser.id}`, {
        data: nouveau_commercial_id ? { nouveau_commercial_id } : {},
      });
      showToast("Utilisateur supprimé.", "success");
      setDeleteUser(null);
      if (drawerUser?.id === deleteUser.id) setDrawerUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la suppression.", "error");
    } finally {
      setDelLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (u.role === "CLIENT")
      return q && `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(q);
    return !q || `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(q);
  });

  const stats = [
    { label: "Total",   value: users.length,                                   color: "var(--blue)",   dim: "var(--blue-dim)",   icon: Icons.users,    sub: "comptes enregistrés" },
    { label: "Actifs",  value: users.filter((u) => u.est_actif).length,        color: "var(--teal)",   dim: "var(--teal-dim)",   icon: Icons.check,    sub: "connectés récemment" },
    { label: "Clients", value: users.filter((u) => u.role==="CLIENT").length,  color: "var(--amber)",  dim: "var(--amber-dim)",  icon: Icons.shield,   sub: "comptes client" },
    { label: "Équipe",  value: users.filter((u) => u.role!=="CLIENT").length,  color: "var(--violet)", dim: "var(--violet-dim)", icon: Icons.settings, sub: "admin / staff" },
  ];

  return (
    <>
      <div className="erp-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="erp-stat-card">
            <div className="erp-stat-icon" style={{ background: s.dim, color: s.color }}>
              <Icon d={s.icon} size={16} />
            </div>
            <div className="erp-stat-label">{s.label}</div>
            <div className="erp-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="erp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="erp-toolbar">
        <div className="erp-toolbar-left">
          <span className="erp-section-title">
            Utilisateurs <span className="erp-section-count">({filtered.length})</span>
          </span>
        </div>
        <div className="erp-toolbar-right">
          <div className="erp-search">
            <Icon d={Icons.search} size={14} />
            <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="erp-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="COMPTABLE">Comptable</option>
          </select>
          <button className="erp-btn erp-btn-primary" onClick={() => setModalUser({})}>
            <Icon d={Icons.plus} size={14} /> Ajouter
          </button>
        </div>
      </div>

      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="erp-empty"><span className="erp-spin" style={{ width: 24, height: 24 }} /></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="erp-empty">
                  <div className="erp-empty-icon"><Icon d={Icons.users} size={22} /></div>
                  <p>Aucun utilisateur trouvé</p>
                </div>
              </td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="clickable-row" onClick={() => setDrawerUser(u)}>
                <td>
                  <div className="erp-user-cell">
                    <div className="erp-avatar md">{initials(u)}</div>
                    <div>
                      <div className="erp-user-name">{u.prenom} {u.nom}</div>
                      <div className="erp-user-id">#{String(u.id).padStart(5, "0")}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--text-2)" }}>{u.email}</td>
                <td>{roleBadge(u.role)}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "var(--text-2)" }}>
                  {u.num_tlp || "—"}
                </td>
                <td>
                  <span className={`erp-status ${u.est_actif ? "erp-status-active" : "erp-status-inactive"}`}>
                    <span className="erp-status-dot" />
                    {u.est_actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="erp-actions">
                    <button className="erp-act-btn erp-act-edit" title="Modifier" onClick={() => setModalUser(u)}>
                      <Icon d={Icons.edit} size={13} />
                    </button>
                    <button
                      className={`erp-act-btn ${u.est_actif ? "erp-act-off" : "erp-act-ok"}`}
                      title={u.est_actif ? "Désactiver" : "Activer"}
                      onClick={(e) => handleToggle(u, e)}
                    >
                      <Icon d={Icons.toggle} size={13} />
                    </button>
                    <button className="erp-act-btn erp-act-del" title="Supprimer" onClick={() => setDeleteUser(u)}>
                      <Icon d={Icons.trash} size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser !== null && (
        <UserModal
          user={Object.keys(modalUser).length ? modalUser : null}
          onClose={() => setModalUser(null)}
          onSaved={fetchUsers}
          toast={showToast}
        />
      )}
      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          allUsers={users}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
          loading={delLoading}
        />
      )}
      {drawerUser && (
        <UserDrawer
          user={drawerUser}
          allUsers={users}
          onClose={() => setDrawerUser(null)}
          onEdit={(u) => { setDrawerUser(null); setModalUser(u); }}
        />
      )}
    </>
  );
};

// ─── ComingSoon ───────────────────────────────────────────────────────────────
const ComingSoon = ({ title, icon }) => (
  <div className="erp-coming">
    <div className="erp-coming-icon"><Icon d={icon} size={30} /></div>
    <h2>{title}</h2>
    <span className="erp-coming-tag">Bientôt disponible</span>
    <p>Cette section est en cours de développement.</p>
  </div>
);

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "users",         label: "Utilisateurs",      icon: Icons.users        },
  { id: "demands",       label: "Demandes Adhésion",  icon: Icons.demand       },
  { id: "fournisseurs",  label: "Fournisseurs",        icon: Icons.briefcase    },
  { id: "catalogue",     label: "Catalogue Achat",     icon: Icons.products     },
  { id: "products",      label: "Produits",            icon: Icons.products     },
  { id: "orders",        label: "Commandes",           icon: Icons.orders       },
  { id: "reclamations",  label: "Réclamations",        icon: Icons.reclamations },
  { id: "stats",         label: "Statistiques",        icon: Icons.stats        },
  { id: "logs",          label: "Journal d'activité",  icon: Icons.activity     },
  { id: "factures",       label: "Factures Achat",      icon: Icons.demand       },
  { id: "facturesVente",  label: "Factures Vente",      icon: Icons.demand       },
  { id: "settings",      label: "Paramètres",          icon: Icons.settings     },
];

const PAGE_TITLES = {
  users:        "Gestion des Utilisateurs",
  demands:      "Demandes d'Adhésion",
  fournisseurs: "Gestion des Fournisseurs",
  catalogue:    "Catalogue Achat",
  products:     "Gestion des Produits",
  orders:       "Commandes",
  reclamations: "Réclamations & Support",
  stats:        "Statistiques",
  logs:         "Journal d'activité",
  factures:      "Factures Achat",
  facturesVente: "Factures Vente",
  settings:     "Paramètres",
};

// ─── AdminDashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [page, setPage] = useState("users");
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || '{"prenom":"Admin","nom":"","role":"ADMIN"}');
    } catch {
      return { prenom: "Admin", nom: "", role: "ADMIN" };
    }
  });

  const userInitials = `${currentUser.prenom?.[0] || "A"}${currentUser.nom?.[0] || ""}`.toUpperCase();

  const showToast = useCallback(
    (msg, type = "success") => setToast({ msg, type }),
    []
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <>
      <style>{DS}</style>
      <div className="erp-shell">
        {/* ── Sidebar ── */}
        <aside className="erp-sidebar">
          <div className="erp-brand">
            <div className="erp-brand-mark">B</div>
            <div>
              <div className="erp-brand-name">Business ERP</div>
              <div className="erp-brand-sub">Administration</div>
            </div>
          </div>
          <nav className="erp-nav">
            <span className="erp-nav-label">Navigation</span>
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`erp-nav-btn ${page === n.id ? "active" : ""}`}
                onClick={() => setPage(n.id)}
              >
                <Icon d={n.icon} size={16} />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="erp-sidebar-footer">
            <div className="erp-user-chip">
              <div className="erp-avatar sm circle">{userInitials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="erp-user-chip-name">{currentUser.prenom} {currentUser.nom}</div>
                <div className="erp-user-chip-role">{currentUser.role}</div>
              </div>
            </div>
            <button className="erp-nav-btn danger" onClick={handleLogout}>
              <Icon d={Icons.logout} size={16} />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="erp-main">
          <header className="erp-topbar">
            <div className="erp-topbar-left">
              <span className="erp-breadcrumb-base">Business ERP</span>
              <span className="erp-breadcrumb-sep">›</span>
              <span className="erp-page-title">{PAGE_TITLES[page]}</span>
            </div>
            <div className="erp-topbar-right">
              <NotificationBell />
              <div className="erp-topbar-divider" />
              <div className="erp-topbar-user">
                <div className="erp-avatar sm circle">{userInitials}</div>
                <span className="erp-topbar-username">{currentUser.prenom}</span>
              </div>
            </div>
          </header>

          <main className="erp-content">
            {page === "users"        && <UsersPage showToast={showToast} />}
            {page === "demands"      && <DemandesAdhesion showToast={showToast} />}
            {page === "fournisseurs" && <GestionFournisseurs toast={showToast} />}
            {page === "catalogue"    && <CatalogueAchat showToast={showToast} />}
            {page === "products"     && <GestionProduits showToast={showToast} />}
            {page === "orders"       && <CommandesPage showToast={showToast} />}
            {page === "reclamations" && <SupportPage showToast={showToast} />}
            {page === "stats"        && <ComingSoon title="Statistiques" icon={Icons.stats} />}
            {page === "logs"         && <LogActivite showToast={showToast} />}
            {page === "factures"     && <FacturesAchatPage showToast={showToast} />}
            {page === "facturesVente"&& <FacturesVentePage showToast={showToast} />}
            {page === "settings"     && (
              <Parametres
                currentUser={currentUser}
                onLogout={handleLogout}
                onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
              />
            )}
          </main>
        </div>
      </div>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  );
};

export default AdminDashboard;