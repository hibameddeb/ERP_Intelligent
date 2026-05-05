import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const Icons = {
    orders:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
    search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
    close:    "M18 6L6 18M6 6l12 12",
    check:    "M20 6L9 17l-5-5",
    eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    validate: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
    ban:      "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636",
    box:      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
    map:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    truck:    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    shop:     "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
    purchase: "M6 2h12l3 7H3L6 2zM3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 9v8M15 9v8",
    xCircle:  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.cmd-page { font-family: 'Outfit', sans-serif; }

.cmd-tabs { display:flex; gap:2px; margin-bottom:22px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:4px; width:fit-content; }
.cmd-tab { display:flex; align-items:center; gap:8px; padding:9px 20px; border-radius:9px; border:none; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; color:var(--muted); background:transparent; white-space:nowrap; }
.cmd-tab:hover { color:var(--text); background:var(--surface-2,#fff); }
.cmd-tab.active { background:var(--blue,#2B7574); color:#fff; box-shadow:0 2px 8px rgba(43,117,116,.28); }
.cmd-tab.active-achat { background:var(--teal,#12484C); color:#fff; box-shadow:0 2px 8px rgba(18,72,76,.28); }
.cmd-tab-badge { background:rgba(255,255,255,.25); color:inherit; font-size:10px; font-weight:700; padding:2px 6px; border-radius:99px; line-height:1; }
.cmd-tab:not(.active):not(.active-achat) .cmd-tab-badge { background:var(--border); color:var(--muted); }

.cmd-stats { display:flex; gap:14px; margin-bottom:24px; flex-wrap:wrap; }
.cmd-stat { flex:1; min-width:140px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; position:relative; overflow:hidden; transition:border-color .2s; }
.cmd-stat:hover { border-color:var(--border-2,#C4BFB9); }
.cmd-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.cmd-stat.blue::before   { background:var(--blue,#2B7574); }
.cmd-stat.green::before  { background:var(--teal,#12484C); }
.cmd-stat.orange::before { background:var(--amber,#a06b1a); }
.cmd-stat.red::before    { background:var(--rose,#861211); }
.cmd-stat.purple::before { background:#7c3aed; }
.cmd-stat-label { font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.07em; margin-bottom:6px; }
.cmd-stat-val   { font-size:24px; font-weight:800; line-height:1; margin-bottom:3px; }
.cmd-stat-val.blue   { color:var(--blue,#2B7574); }
.cmd-stat-val.green  { color:var(--teal,#12484C); }
.cmd-stat-val.orange { color:var(--amber,#a06b1a); }
.cmd-stat-val.red    { color:var(--rose,#861211); }
.cmd-stat-val.purple { color:#7c3aed; }
.cmd-stat-sub { font-size:11px; color:var(--muted); }

.cmd-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
.cmd-toolbar-left  { display:flex; align-items:center; gap:10px; flex:1; flex-wrap:wrap; }
.cmd-toolbar-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.cmd-search { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px 13px; min-width:240px; transition:border-color .15s; }
.cmd-search:focus-within { border-color:var(--blue,#2B7574); }
.cmd-search input { background:none; border:none; outline:none; color:var(--text); font-size:13px; width:100%; font-family:'Outfit',sans-serif; }
.cmd-search input::placeholder { color:var(--muted); }
.cmd-select { background:var(--surface); border:1px solid var(--border); color:var(--text); font-family:'Outfit',sans-serif; font-size:13px; padding:8px 12px; border-radius:10px; outline:none; cursor:pointer; transition:border-color .15s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a98a4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:30px; }
.cmd-select:focus { border-color:var(--blue,#2B7574); }

.cmd-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
.cmd-table { width:100%; border-collapse:collapse; }
.cmd-table thead th { padding:12px 16px; text-align:left; font-size:10px; font-weight:700; color:var(--muted); letter-spacing:.08em; text-transform:uppercase; background:var(--surface-2,#fff); border-bottom:1px solid var(--border); white-space:nowrap; }
.cmd-table tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
.cmd-table tbody tr:last-child { border-bottom:none; }
.cmd-table tbody tr:hover { background:var(--surface-2,#fff); }
.cmd-table tbody td { padding:13px 16px; font-size:13px; vertical-align:middle; }

.cmd-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; white-space:nowrap; }
.cmd-badge-dot { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }
.cmd-badge-wait    { background:rgba(160,107,26,.12);  color:var(--amber,#a06b1a); border:1px solid rgba(160,107,26,.2); }
.cmd-badge-valid   { background:rgba(18,72,76,.12);    color:var(--teal,#12484C);  border:1px solid rgba(18,72,76,.2); }
.cmd-badge-cancel  { background:rgba(134,18,17,.12);   color:var(--rose,#861211);  border:1px solid rgba(134,18,17,.2); }
.cmd-badge-sent    { background:rgba(43,117,116,.12);  color:var(--blue,#2B7574);  border:1px solid rgba(43,117,116,.2); }
.cmd-badge-livree  { background:rgba(18,72,76,.18);    color:var(--teal,#12484C);  border:1px solid rgba(18,72,76,.3); }
.cmd-badge-nonlivree { background:rgba(134,18,17,.12); color:var(--rose,#861211);  border:1px solid rgba(134,18,17,.2); }
.cmd-badge-acceptee { background:rgba(124,58,237,.1);  color:#7c3aed;              border:1px solid rgba(124,58,237,.2); }

.cmd-type-pill { display:inline-flex; align-items:center; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; background:rgba(43,117,116,.1); color:var(--blue,#2B7574); border:1px solid rgba(43,117,116,.18); letter-spacing:.04em; font-family:'JetBrains Mono',monospace; }

.cmd-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; border:none; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
.cmd-btn:disabled { opacity:.5; cursor:not-allowed; }
.cmd-btn svg { flex-shrink:0; }
.cmd-btn-ghost   { background:var(--surface-2,#fff); color:var(--text-2,#3d6372); border:1px solid var(--border); }
.cmd-btn-ghost:hover   { border-color:var(--blue,#2B7574); color:var(--blue,#2B7574); }
.cmd-btn-primary { background:var(--blue,#2B7574); color:#fff; box-shadow:0 1px 4px rgba(43,117,116,.25); }
.cmd-btn-primary:hover { background:var(--blue-hover,#12484C); }
.cmd-btn-danger  { background:rgba(134,18,17,.1); color:var(--rose,#861211); border:1px solid rgba(134,18,17,.2); }
.cmd-btn-danger:hover  { background:rgba(134,18,17,.2); }
.cmd-btn-success { background:rgba(18,72,76,.1); color:var(--teal,#12484C); border:1px solid rgba(18,72,76,.2); }
.cmd-btn-success:hover { background:rgba(18,72,76,.2); }
.cmd-btn-sm { padding:5px 10px; font-size:12px; }

.cmd-icon-btn { width:32px; height:32px; border-radius:8px; border:none; display:grid; place-items:center; cursor:pointer; transition:all .15s; flex-shrink:0; }
.cmd-ib-view    { background:rgba(14,41,49,.08);  color:var(--text-2,#3d6372); }
.cmd-ib-view:hover    { background:rgba(14,41,49,.15); }
.cmd-ib-success { background:rgba(18,72,76,.1);   color:var(--teal,#12484C); }
.cmd-ib-success:hover { background:rgba(18,72,76,.22); }
.cmd-ib-danger  { background:rgba(134,18,17,.1);  color:var(--rose,#861211); }
.cmd-ib-danger:hover  { background:rgba(134,18,17,.22); }
.cmd-ib-truck   { background:rgba(124,58,237,.1); color:#7c3aed; }
.cmd-ib-truck:hover   { background:rgba(124,58,237,.22); }
.cmd-actions { display:flex; align-items:center; gap:5px; }

.cmd-empty { text-align:center; padding:64px 20px; color:var(--muted); }
.cmd-empty-icon { margin-bottom:12px; opacity:.35; }
.cmd-empty p { font-size:14px; margin-bottom:4px; color:var(--text-2,#3d6372); }
.cmd-empty small { font-size:12px; }
.cmd-spinner-wrap { display:flex; align-items:center; justify-content:center; gap:10px; padding:64px; color:var(--muted); font-size:13px; }
.cmd-spinner { display:inline-block; width:18px; height:18px; border:2px solid var(--border); border-top-color:var(--blue,#2B7574); border-radius:50%; animation:cmdSpin .7s linear infinite; }
@keyframes cmdSpin { to { transform:rotate(360deg); } }
.cmd-btn-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:currentColor; border-radius:50%; animation:cmdSpin .6s linear infinite; }

.cmd-overlay { position:fixed; inset:0; background:rgba(14,41,49,.55); display:grid; place-items:center; z-index:1000; backdrop-filter:blur(5px); animation:cmdFadeIn .14s ease; }
@keyframes cmdFadeIn { from { opacity:0 } to { opacity:1 } }
.cmd-modal { background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:28px; width:560px; max-width:95vw; max-height:90vh; overflow-y:auto; animation:cmdSlideUp .2s cubic-bezier(.16,1,.3,1); }
.cmd-modal-wide { width:740px; }
@keyframes cmdSlideUp { from { transform:translateY(14px); opacity:0 } to { transform:none; opacity:1 } }
.cmd-modal-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; gap:10px; }
.cmd-modal-title { font-weight:700; font-size:17px; color:var(--text); }
.cmd-modal-sub   { font-size:12px; color:var(--muted); margin-top:3px; }
.cmd-modal-close { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2,#fff); color:var(--muted); display:grid; place-items:center; cursor:pointer; flex-shrink:0; }
.cmd-modal-close:hover { color:var(--text); }
.cmd-modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; padding-top:18px; border-top:1px solid var(--border); }

.cmd-confirm { width:420px !important; text-align:center; padding:32px 28px !important; }
.cmd-confirm-icon { width:52px; height:52px; border-radius:50%; display:grid; place-items:center; margin:0 auto 16px; }
.cmd-confirm-icon.danger  { background:rgba(134,18,17,.1); color:var(--rose,#861211); }
.cmd-confirm-icon.success { background:rgba(18,72,76,.1);  color:var(--teal,#12484C); }
.cmd-confirm-icon.purple  { background:rgba(124,58,237,.1); color:#7c3aed; }
.cmd-confirm h3  { font-weight:700; font-size:17px; margin-bottom:10px; }
.cmd-confirm p   { font-size:13px; color:var(--muted); line-height:1.7; margin-bottom:24px; }
.cmd-confirm-btns { display:flex; justify-content:center; gap:10px; }

/* ── Livraison choice buttons ── */
.cmd-livraison-choices { display:flex; gap:12px; justify-content:center; margin-top:4px; }
.cmd-livraison-btn { flex:1; max-width:160px; display:flex; flex-direction:column; align-items:center; gap:8px; padding:18px 12px; border-radius:12px; border:2px solid; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; font-weight:600; font-size:13px; }
.cmd-livraison-btn.oui { border-color:rgba(18,72,76,.25); background:rgba(18,72,76,.06); color:var(--teal,#12484C); }
.cmd-livraison-btn.oui:hover { background:rgba(18,72,76,.14); border-color:var(--teal,#12484C); }
.cmd-livraison-btn.non { border-color:rgba(134,18,17,.22); background:rgba(134,18,17,.06); color:var(--rose,#861211); }
.cmd-livraison-btn.non:hover { background:rgba(134,18,17,.14); border-color:var(--rose,#861211); }
.cmd-livraison-btn:disabled { opacity:.45; cursor:not-allowed; }
.cmd-livraison-btn-icon { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:currentColor; color:#fff; flex-shrink:0; }
.cmd-livraison-btn.oui .cmd-livraison-btn-icon { background:var(--teal,#12484C); }
.cmd-livraison-btn.non .cmd-livraison-btn-icon { background:var(--rose,#861211); }

.cmd-detail-sec { background:var(--surface-2,#fff); border:1px solid var(--border); border-radius:12px; padding:16px 18px; margin-bottom:14px; }
.cmd-detail-sec-title { font-size:10px; font-weight:700; color:var(--muted); letter-spacing:.1em; text-transform:uppercase; margin-bottom:14px; display:flex; align-items:center; gap:6px; padding-bottom:10px; border-bottom:1px solid var(--border); }
.cmd-detail-grid  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.cmd-detail-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
.cmd-detail-field { display:flex; flex-direction:column; gap:4px; }
.cmd-detail-field label { font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
.cmd-detail-field span { font-size:13px; color:var(--text); font-weight:500; }
.cmd-detail-field span.mono { font-family:'JetBrains Mono',monospace; font-size:12px; }
.cmd-detail-field span.empty { color:var(--muted); font-style:italic; font-weight:400; }

.cmd-info-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; }
.cmd-info-row:last-child { border-bottom:none; }
.cmd-info-row-icon  { color:var(--muted); flex-shrink:0; }
.cmd-info-row-label { color:var(--muted); width:110px; flex-shrink:0; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.cmd-info-row-value { color:var(--text); font-weight:500; flex:1; }
.cmd-info-row-value.mono { font-family:'JetBrains Mono',monospace; font-size:12px; }

.cmd-prod-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.cmd-prod-table th { padding:9px 12px; background:var(--surface); border-bottom:1px solid var(--border); font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; text-align:left; }
.cmd-prod-table td { padding:11px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
.cmd-prod-table tbody tr:last-child td { border-bottom:none; }
.cmd-prod-table tbody tr:hover { background:var(--surface,#F6F4F1); }
.cmd-prod-total-row  { display:flex; justify-content:flex-end; margin-top:12px; }
.cmd-prod-total-box  { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:12px 18px; min-width:240px; }
.cmd-prod-total-line { display:flex; justify-content:space-between; gap:40px; font-size:12px; color:var(--muted); padding:4px 0; }
.cmd-prod-total-line.final { color:var(--text); font-weight:700; font-size:15px; padding-top:10px; margin-top:6px; border-top:1px solid var(--border); }
.cmd-prod-total-line span:last-child { font-family:'JetBrains Mono',monospace; }

.cmd-alert-strip { display:flex; align-items:center; gap:10px; background:rgba(134,18,17,.08); border:1px solid rgba(134,18,17,.2); border-radius:10px; padding:12px 14px; margin-bottom:16px; font-size:12.5px; color:var(--rose,#861211); font-weight:500; }
.cmd-error-box { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; gap:10px; text-align:center; }
.cmd-error-box p { font-size:14px; color:var(--text-2,#3d6372); }
.cmd-error-box small { font-size:12px; color:var(--muted); }

.cmd-info-banner {
    display:flex; align-items:center; gap:10px;
    background:rgba(43,117,116,.08); border:1px solid rgba(43,117,116,.18);
    border-radius:10px; padding:10px 14px; margin-bottom:16px;
    font-size:12.5px; color:var(--blue,#2B7574); font-weight:500;
}
.cmd-info-banner-icon {
    width:22px; height:22px; border-radius:50%;
    background:rgba(43,117,116,.15); color:var(--blue,#2B7574);
    display:grid; place-items:center; flex-shrink:0;
}

.cmd-toast { position:fixed; bottom:28px; right:28px; background:var(--surface-2,#fff); border:1px solid var(--border); border-radius:12px; padding:12px 18px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500; animation:cmdSlideUp .3s ease; z-index:2000; box-shadow:0 8px 32px rgba(14,41,49,.12); max-width:360px; }
.cmd-toast.success { border-left:3px solid var(--teal,#12484C); }
.cmd-toast.error   { border-left:3px solid var(--rose,#861211); }
.cmd-toast-icon { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; }
.cmd-toast.success .cmd-toast-icon { background:rgba(18,72,76,.12);  color:var(--teal,#12484C); }
.cmd-toast.error   .cmd-toast-icon { background:rgba(134,18,17,.12); color:var(--rose,#861211); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate  = (v) => v ? new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
const fmtPrice = (v) => v != null ? `${parseFloat(v).toFixed(3)} DT` : '—';
const displayRef = (o) => o.num_ordre ? `N°${o.num_ordre}` : `#${o.id}`;
const val = (v, fallback = '—') => (v !== null && v !== undefined && v !== '') ? v : fallback;

const calcTTC = (ht, tva, fodec, dc, qty = 1) => {
    const montant = parseFloat(ht || 0) * qty;
    const f = montant * (parseFloat(fodec) || 0) / 100;
    const t = (montant + f) * (parseFloat(tva) || 0) / 100;
    const d = montant * (parseFloat(dc) || 0) / 100;
    return montant + f + t - d;
};

const normalizeStatus = (statut) => String(statut || '').trim().toLowerCase();

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ statut }) => {
    const key = normalizeStatus(statut);
    const map = {
        'en attente':  { cls: 'cmd-badge-wait',     label: 'En attente'  },
        'en_attente':  { cls: 'cmd-badge-wait',     label: 'En attente'  },
        'validée':     { cls: 'cmd-badge-valid',    label: 'Validée'     },
        'validee':     { cls: 'cmd-badge-valid',    label: 'Validée'     },
        'acceptée':    { cls: 'cmd-badge-acceptee', label: 'Acceptée'    },
        'acceptee':    { cls: 'cmd-badge-acceptee', label: 'Acceptée'    },
        'livrée':      { cls: 'cmd-badge-livree',   label: 'Livrée'      },
        'livree':      { cls: 'cmd-badge-livree',   label: 'Livrée'      },
        'non livrée':  { cls: 'cmd-badge-nonlivree',label: 'Non livrée'  },
        'non_livree':  { cls: 'cmd-badge-nonlivree',label: 'Non livrée'  },
        'refusée':     { cls: 'cmd-badge-cancel',   label: 'Refusée'     },
        'refusee':     { cls: 'cmd-badge-cancel',   label: 'Refusée'     },
        'facturée':    { cls: 'cmd-badge-valid',    label: 'Facturée'    },
        'facturee':    { cls: 'cmd-badge-valid',    label: 'Facturée'    },
        'archivée':    { cls: 'cmd-badge-wait',     label: 'Archivée'    },
        'archivee':    { cls: 'cmd-badge-wait',     label: 'Archivée'    },
        'annulée':     { cls: 'cmd-badge-cancel',   label: 'Annulée'     },
        'annulee':     { cls: 'cmd-badge-cancel',   label: 'Annulée'     },
        'envoyée':     { cls: 'cmd-badge-sent',     label: 'Envoyée'     },
        'envoyee':     { cls: 'cmd-badge-sent',     label: 'Envoyée'     },
    };
    const { cls, label } = map[key] || { cls: 'cmd-badge-wait', label: statut || '—' };
    return (
        <span className={`cmd-badge ${cls}`}>
            <span className="cmd-badge-dot" />{label}
        </span>
    );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
    useEffect(() => {
        const t = setTimeout(onDone, 3500);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <div className={`cmd-toast ${type}`}>
            <div className="cmd-toast-icon">
                <Icon d={type === 'success' ? Icons.check : Icons.alert} size={13} />
            </div>
            {msg}
        </div>
    );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, mono = false }) => (
    <div className="cmd-info-row">
        <span className="cmd-info-row-icon"><Icon d={icon} size={14} /></span>
        <span className="cmd-info-row-label">{label}</span>
        <span className={`cmd-info-row-value${mono ? ' mono' : ''}`}>{val(value)}</span>
    </div>
);

// ─── Confirm Modal (vente) ────────────────────────────────────────────────────
const ConfirmModal = ({ type, order, onClose, onConfirm, loading }) => {
    const isValidate = type === 'validate';
    return (
        <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmd-modal cmd-confirm">
                <div className={`cmd-confirm-icon ${isValidate ? 'success' : 'danger'}`}>
                    <Icon d={isValidate ? Icons.validate : Icons.ban} size={22} />
                </div>
                <h3>{isValidate ? 'Valider la commande ?' : 'Annuler la commande ?'}</h3>
                <p>
                    {isValidate
                        ? <span>La commande <strong>{displayRef(order)}</strong> sera validée et confirmée.</span>
                        : <span>La commande <strong>{displayRef(order)}</strong> sera annulée. Cette action est irréversible.</span>
                    }
                </p>
                <div className="cmd-confirm-btns">
                    <button className="cmd-btn cmd-btn-ghost" onClick={onClose} disabled={loading}>Retour</button>
                    <button
                        className={`cmd-btn ${isValidate ? 'cmd-btn-success' : 'cmd-btn-danger'}`}
                        onClick={onConfirm} disabled={loading}
                    >
                        {loading
                            ? <><span className="cmd-btn-spinner" /> {isValidate ? 'Validation...' : 'Annulation...'}</>
                            : <><Icon d={isValidate ? Icons.check : Icons.ban} size={13} /> {isValidate ? 'Confirmer' : "Confirmer l'annulation"}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Livraison Modal ──────────────────────────────────────────────────────────
const LivraisonModal = ({ order, onClose, onConfirm, loading }) => (
    <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="cmd-modal cmd-confirm">
            <div className="cmd-confirm-icon purple">
                <Icon d={Icons.truck} size={22} />
            </div>
            <h3>Statut de livraison</h3>
            <p>
                La commande <strong>{displayRef(order)}</strong> a-t-elle été reçue ?
                <br />
                <span style={{ fontSize:11 }}>
                    Si livrée, une facture d'achat sera automatiquement générée.
                </span>
            </p>
            <div className="cmd-livraison-choices">
                <button className="cmd-livraison-btn oui" onClick={() => onConfirm(true)} disabled={loading}>
                    <div className="cmd-livraison-btn-icon"><Icon d={Icons.check} size={18} /></div>
                    {loading ? <span className="cmd-btn-spinner" /> : 'Livrée'}
                </button>
                <button className="cmd-livraison-btn non" onClick={() => onConfirm(false)} disabled={loading}>
                    <div className="cmd-livraison-btn-icon"><Icon d={Icons.xCircle} size={18} /></div>
                    {loading ? <span className="cmd-btn-spinner" /> : 'Non livrée'}
                </button>
            </div>
            <div style={{ marginTop:20 }}>
                <button className="cmd-btn cmd-btn-ghost" onClick={onClose} disabled={loading}
                    style={{ width:'100%', justifyContent:'center' }}>
                    Annuler
                </button>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// SECTION VENTE
// ═══════════════════════════════════════════════════════════════

const DetailVenteModal = ({ id, onClose, onValidate, onCancel }) => {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        setLoading(true); setError(null);
        API.get(`/commandes/${id}`)
            .then(res => { if (res.data?.success) setData(res.data.data); else setError('Données invalides.'); })
            .catch(err => setError(err.response?.data?.message || 'Impossible de charger la commande.'))
            .finally(() => setLoading(false));
    }, [id]);

    const cmd  = data?.commande;
    const dets = data?.details || [];

    const totalHT  = dets.reduce((s, d) => { const q = Number((d.quantite ?? d.quantite_achetee) || 0); return s + (parseFloat(d.prix_unitaire_ht_ap || 0) * q); }, 0);
    const totalTTC = dets.reduce((s, d) => { const q = Number((d.quantite ?? d.quantite_achetee) || 0); return s + calcTTC(d.prix_unitaire_ht_ap, d.taux_tva, d.taux_fodec, d.taux_dc, q); }, 0);

    return (
        <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmd-modal cmd-modal-wide">
                <div className="cmd-modal-hdr">
                    <div>
                        <div className="cmd-modal-title">{cmd ? `Commande vente ${displayRef(cmd)}` : `Commande #${id}`}</div>
                        <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                            {cmd && <StatusBadge statut={cmd.statut} />}
                            {cmd && <span style={{ color:'var(--muted)', fontSize:11 }}>{fmtDate(cmd.date_creation)}</span>}
                        </div>
                    </div>
                    <button className="cmd-modal-close" onClick={onClose}><Icon d={Icons.close} size={14} /></button>
                </div>

                {loading ? (
                    <div className="cmd-spinner-wrap"><span className="cmd-spinner" /> Chargement...</div>
                ) : error ? (
                    <div className="cmd-error-box"><Icon d={Icons.alert} size={32} /><p>{error}</p></div>
                ) : !cmd ? (
                    <div className="cmd-error-box"><p>Commande introuvable.</p></div>
                ) : (
                    <>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.orders} size={12} /> Informations commande</div>
                            <div className="cmd-detail-grid3">
                                <div className="cmd-detail-field"><label>Référence</label><span className="mono">{displayRef(cmd)}</span></div>
                                <div className="cmd-detail-field"><label>Date création</label><span>{fmtDate(cmd.date_creation)}</span></div>
                                <div className="cmd-detail-field"><label>Statut</label><StatusBadge statut={cmd.statut} /></div>
                                <div className="cmd-detail-field"><label>Trimestre</label><span>{val(cmd.trimestre)}</span></div>
                                <div className="cmd-detail-field"><label>Type</label><span>{val(cmd.type_en)}</span></div>
                                <div className="cmd-detail-field"><label>Date validation</label><span>{fmtDate(cmd.date_validation)}</span></div>
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.user} size={12} /> Client</div>
                            <div style={{ background:'var(--surface)', borderRadius:8, padding:'4px 12px' }}>
                                <InfoRow icon={Icons.user} label="Nom complet" value={(cmd.client_prenom || cmd.client_nom) ? `${cmd.client_prenom||''} ${cmd.client_nom||''}`.trim() : null} />
                                <InfoRow icon={Icons.tag}  label="Identifiant" value={cmd.client_identifiant} mono />
                                <InfoRow icon={Icons.map}  label="Adresse"     value={cmd.client_adresse} />
                                <InfoRow icon={Icons.map}  label="Ville"       value={cmd.client_ville} />
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.building} size={12} /> Commercial assigné</div>
                            <div style={{ background:'var(--surface)', borderRadius:8, padding:'4px 12px' }}>
                                <InfoRow icon={Icons.user} label="Nom complet" value={(cmd.commercial_prenom || cmd.commercial_nom) ? `${cmd.commercial_prenom||''} ${cmd.commercial_nom||''}`.trim() : null} />
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title">
                                <Icon d={Icons.box} size={12} /> Produits
                                <span style={{ marginLeft:'auto', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'1px 8px', fontSize:10, fontWeight:700, color:'var(--text-2)' }}>
                                    {dets.length} article{dets.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {dets.length === 0 ? <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'16px 0' }}>Aucun produit.</p> : (
                                <>
                                    <div style={{ overflowX:'auto' }}>
                                        <table className="cmd-prod-table">
                                            <thead><tr><th>Produit</th><th style={{ textAlign:'right' }}>Qté</th><th style={{ textAlign:'right' }}>Prix HT</th><th style={{ textAlign:'right' }}>TVA</th><th style={{ textAlign:'right' }}>FODEC</th><th style={{ textAlign:'right' }}>Total TTC</th></tr></thead>
                                            <tbody>
                                                {dets.map((d, idx) => {
                                                    const qty = Number((d.quantite ?? d.quantite_achetee) || 0);
                                                    const ttc = calcTTC(d.prix_unitaire_ht_ap, d.taux_tva, d.taux_fodec, d.taux_dc, qty);
                                                    return (
                                                        <tr key={d.id || idx}>
                                                            <td><div style={{ fontWeight:600 }}>{d.nom_produit || '—'}</div></td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>{qty}</td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{fmtPrice(d.prix_unitaire_ht_ap)}</td>
                                                            <td style={{ textAlign:'right', color:'var(--muted)', fontSize:11 }}>{d.taux_tva ?? 0}%</td>
                                                            <td style={{ textAlign:'right', color:'var(--muted)', fontSize:11 }}>{d.taux_fodec ?? 0}%</td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'var(--blue,#2B7574)' }}>{ttc.toFixed(3)} DT</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="cmd-prod-total-row">
                                        <div className="cmd-prod-total-box">
                                            <div className="cmd-prod-total-line"><span>Total HT</span><span>{totalHT.toFixed(3)} DT</span></div>
                                            <div className="cmd-prod-total-line final"><span>Total TTC</span><span>{totalTTC.toFixed(3)} DT</span></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="cmd-modal-footer">
                            <button className="cmd-btn cmd-btn-ghost" onClick={onClose}>Fermer</button>
                            {normalizeStatus(cmd.statut) === 'en_attente' && (
                                <>
                                    <button className="cmd-btn cmd-btn-danger cmd-btn-sm" onClick={() => { onClose(); onCancel(cmd); }}>
                                        <Icon d={Icons.ban} size={13} /> Annuler
                                    </button>
                                    <button className="cmd-btn cmd-btn-success cmd-btn-sm" onClick={() => { onClose(); onValidate(cmd); }}>
                                        <Icon d={Icons.validate} size={13} /> Valider
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Vente Panel ──────────────────────────────────────────────────────────────
const CommandesVentePanel = ({ notify }) => {
    const [orders,           setOrders]           = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [search,           setSearch]           = useState('');
    const [statusFilter,     setStatusFilter]     = useState('');
    const [commercialFilter, setCommercialFilter] = useState('');
    const [viewId,           setViewId]           = useState(null);
    const [confirm,          setConfirm]          = useState(null);
    const [actionLoad,       setActionLoad]       = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try { const res = await API.get('/commandes'); setOrders(res.data.data || []); }
        catch { notify('Erreur lors du chargement des commandes de vente.', 'error'); }
        finally { setLoading(false); }
    }, [notify]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── Liste dédupliquée des commerciaux ─────────────────────
    const commerciaux = useMemo(() => {
        const seen = new Set();
        return orders
            .filter(o => {
                const name = `${o.commercial_prenom || ''} ${o.commercial_nom || ''}`.trim();
                if (!name || seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .map(o => ({
                key: `${o.commercial_prenom || ''}_${o.commercial_nom || ''}`,
                label: `${o.commercial_prenom || ''} ${o.commercial_nom || ''}`.trim(),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [orders]);

    const handleValidate = async () => {
        setActionLoad(true);
        try { await API.post(`/commandes/${confirm.order.id}/valider`); notify('Commande validée avec succès.', 'success'); setConfirm(null); fetchOrders(); }
        catch (e) { notify(e.response?.data?.message || 'Erreur lors de la validation.', 'error'); }
        finally { setActionLoad(false); }
    };

    const handleCancel = async () => {
        setActionLoad(true);
        try { await API.post(`/commandes/${confirm.order.id}/cancel`); notify('Commande annulée.', 'success'); setConfirm(null); fetchOrders(); }
        catch (e) { notify(e.response?.data?.message || "Erreur lors de l'annulation.", 'error'); }
        finally { setActionLoad(false); }
    };

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        const status = normalizeStatus(o.statut);
        const matchSearch = !q
            || `${o.client_nom} ${o.client_prenom} ${o.commercial_nom} ${o.commercial_prenom}`.toLowerCase().includes(q)
            || String(o.id).includes(q)
            || String(o.num_ordre || '').includes(q);
        const matchStatus     = !statusFilter     || status === statusFilter;
        const matchCommercial = !commercialFilter  ||
            `${o.commercial_prenom || ''} ${o.commercial_nom || ''}`.trim() === commercialFilter;
        return matchSearch && matchStatus && matchCommercial;
    });

    const stats = [
        { label:'Total',      value:orders.length,                                                                                                              cls:'blue',   sub:'commandes' },
        { label:'En attente', value:orders.filter(o => ['en attente','en_attente'].includes(normalizeStatus(o.statut))).length,                                 cls:'orange', sub:'à traiter' },
        { label:'Validées',   value:orders.filter(o => ['validée','validee','facturée','facturee'].includes(normalizeStatus(o.statut))).length,                 cls:'green',  sub:'traitées'  },
        { label:'Refusées',   value:orders.filter(o => ['refusée','refusee'].includes(normalizeStatus(o.statut))).length,                                       cls:'red',    sub:'refusées'  },
    ];

    return (
        <>
            <div className="cmd-stats">
                {stats.map(s => (
                    <div key={s.label} className={`cmd-stat ${s.cls}`}>
                        <div className="cmd-stat-label">{s.label}</div>
                        <div className={`cmd-stat-val ${s.cls}`}>{s.value}</div>
                        <div className="cmd-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>
            <div className="cmd-toolbar">
                <div className="cmd-toolbar-left">
                    <div className="cmd-search">
                        <Icon d={Icons.search} size={14} />
                        <input
                            placeholder="Rechercher client, commercial, N° commande..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="cmd-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        <option value="en attente">En attente</option>
                        <option value="validée">Validée</option>
                        <option value="refusée">Refusée</option>
                        <option value="facturée">Facturée</option>
                        <option value="archivée">Archivée</option>
                    </select>
                    <select className="cmd-select" value={commercialFilter} onChange={e => setCommercialFilter(e.target.value)}>
                        <option value="">Tous les commerciaux</option>
                        {commerciaux.map(c => (
                            <option key={c.key} value={c.label}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div className="cmd-toolbar-right">
                    <button className="cmd-btn cmd-btn-ghost cmd-btn-sm" onClick={fetchOrders}>
                        <Icon d={Icons.refresh} size={14} /> Rafraîchir
                    </button>
                </div>
            </div>
            <div className="cmd-table-wrap">
                <table className="cmd-table">
                    <thead>
                        <tr>
                            <th>Référence</th><th>Client</th><th>Commercial</th>
                            <th>Date</th><th>Total TTC</th><th>Statut</th>
                            <th style={{ width:120 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className="cmd-spinner-wrap"><span className="cmd-spinner" /> Chargement...</div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="cmd-empty">
                                    <div className="cmd-empty-icon"><Icon d={Icons.shop} size={40} /></div>
                                    <p>Aucune commande de vente trouvée</p>
                                    <small>{search || statusFilter || commercialFilter ? 'Essayez de modifier vos filtres' : 'Les commandes apparaîtront ici'}</small>
                                </div>
                            </td></tr>
                        ) : filtered.map(o => (
                            <tr key={o.id} style={{ cursor:'pointer' }} onClick={() => setViewId(o.id)}>
                                <td><span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color:'var(--blue,#2B7574)' }}>{displayRef(o)}</span></td>
                                <td>
                                    <div style={{ fontWeight:600 }}>{o.client_prenom} {o.client_nom}</div>
                                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{o.client_ville || o.ville || '—'}</div>
                                </td>
                                <td style={{ color:'var(--text-2,#3d6372)' }}>{o.commercial_prenom} {o.commercial_nom}</td>
                                <td style={{ color:'var(--muted)', fontSize:12 }}>{fmtDate(o.date_creation)}</td>
                                <td style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{fmtPrice(o.total_ttc)}</td>
                                <td><StatusBadge statut={o.statut} /></td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="cmd-actions">
                                        <button className="cmd-icon-btn cmd-ib-view" title="Voir" onClick={() => setViewId(o.id)}><Icon d={Icons.eye} size={13} /></button>
                                        {['en attente','en_attente'].includes(normalizeStatus(o.statut)) && (
                                            <>
                                                <button className="cmd-icon-btn cmd-ib-success" title="Valider" onClick={() => setConfirm({ type:'validate', order:o })}><Icon d={Icons.validate} size={13} /></button>
                                                <button className="cmd-icon-btn cmd-ib-danger"  title="Annuler" onClick={() => setConfirm({ type:'cancel',   order:o })}><Icon d={Icons.ban}      size={13} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {viewId && (
                <DetailVenteModal
                    id={viewId}
                    onClose={() => setViewId(null)}
                    onValidate={o => { setViewId(null); setConfirm({ type:'validate', order:o }); }}
                    onCancel={o =>   { setViewId(null); setConfirm({ type:'cancel',   order:o }); }}
                />
            )}
            {confirm && (
                <ConfirmModal
                    type={confirm.type}
                    order={confirm.order}
                    onClose={() => setConfirm(null)}
                    onConfirm={confirm.type === 'validate' ? handleValidate : handleCancel}
                    loading={actionLoad}
                />
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════
// SECTION ACHAT
// ═══════════════════════════════════════════════════════════════

const DetailAchatModal = ({ id, onClose, onLivraison }) => {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        setLoading(true); setError(null);
        API.get(`/commandes-achat/${id}`)
            .then(res => { if (res.data?.success) setData(res.data.data); else setError('Données invalides reçues du serveur.'); })
            .catch(err => setError(err.response?.data?.message || 'Impossible de charger la commande.'))
            .finally(() => setLoading(false));
    }, [id]);

    const cmd  = data?.commande;
    const dets = data?.details || [];

    const totalHT  = dets.reduce((s, d) => { const q = Number(d.quantite || 0); return s + (parseFloat(d.prix_unitaire_ht || 0) * q); }, 0);
    const totalTTC = dets.reduce((s, d) => { const q = Number(d.quantite || 0); return s + calcTTC(d.prix_unitaire_ht, d.taux_tva, d.taux_fodec, d.taux_dc, q); }, 0);

    const status    = cmd ? normalizeStatus(cmd.statut) : '';
    const isPending = ['en attente','en_attente'].includes(status);
    const canLivrer = ['acceptée','acceptee'].includes(status);

    return (
        <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmd-modal cmd-modal-wide">
                <div className="cmd-modal-hdr">
                    <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div className="cmd-modal-title">{cmd ? `Commande achat ${displayRef(cmd)}` : `Commande achat #${id}`}</div>
                            {cmd?.type_en && <span className="cmd-type-pill">{cmd.type_en}</span>}
                        </div>
                        <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                            {cmd && <StatusBadge statut={cmd.statut} />}
                            {cmd && <span style={{ color:'var(--muted)', fontSize:11 }}>{fmtDate(cmd.date_creation)}</span>}
                        </div>
                    </div>
                    <button className="cmd-modal-close" onClick={onClose}><Icon d={Icons.close} size={14} /></button>
                </div>

                {loading ? (
                    <div className="cmd-spinner-wrap"><span className="cmd-spinner" /> Chargement...</div>
                ) : error ? (
                    <div className="cmd-error-box"><Icon d={Icons.alert} size={32} /><p>{error}</p></div>
                ) : !cmd ? (
                    <div className="cmd-error-box"><p>Commande introuvable.</p></div>
                ) : (
                    <>
                        {isPending && (
                            <div className="cmd-info-banner">
                                <span className="cmd-info-banner-icon"><Icon d={Icons.alert} size={12} /></span>
                                En attente de la décision du fournisseur (acceptation / refus).
                            </div>
                        )}
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.orders} size={12} /> Informations commande</div>
                            <div className="cmd-detail-grid3">
                                <div className="cmd-detail-field"><label>Référence</label><span className="mono">{displayRef(cmd)}</span></div>
                                <div className="cmd-detail-field"><label>Date création</label><span>{fmtDate(cmd.date_creation)}</span></div>
                                <div className="cmd-detail-field"><label>Statut</label><StatusBadge statut={cmd.statut} /></div>
                                <div className="cmd-detail-field"><label>Type</label><span>{val(cmd.type_en)}</span></div>
                                <div className="cmd-detail-field"><label>Date envoi</label><span>{fmtDate(cmd.date_envoi)}</span></div>
                                <div className="cmd-detail-field"><label>Date acceptation</label><span>{fmtDate(cmd.date_acceptation)}</span></div>
                                <div className="cmd-detail-field"><label>Date livraison prévue</label><span>{fmtDate(cmd.date_livraison)}</span></div>
                                <div className="cmd-detail-field"><label>Date archivage</label><span>{fmtDate(cmd.date_archivage)}</span></div>
                                <div className="cmd-detail-field"><label>Total HT</label>
                                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'var(--blue,#2B7574)' }}>{fmtPrice(cmd.total_ht)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.truck} size={12} /> Fournisseur</div>
                            <div style={{ background:'var(--surface)', borderRadius:8, padding:'4px 12px' }}>
                                <InfoRow icon={Icons.building} label="Société" value={cmd.fournisseur_societe} />
                                <InfoRow icon={Icons.user}     label="Contact" value={(cmd.fournisseur_prenom || cmd.fournisseur_nom) ? `${cmd.fournisseur_prenom||''} ${cmd.fournisseur_nom||''}`.trim() : null} />
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title"><Icon d={Icons.building} size={12} /> Administrateur responsable</div>
                            <div style={{ background:'var(--surface)', borderRadius:8, padding:'4px 12px' }}>
                                <InfoRow icon={Icons.user} label="Nom complet" value={(cmd.admin_prenom || cmd.admin_nom) ? `${cmd.admin_prenom||''} ${cmd.admin_nom||''}`.trim() : null} />
                            </div>
                        </div>
                        <div className="cmd-detail-sec">
                            <div className="cmd-detail-sec-title">
                                <Icon d={Icons.box} size={12} /> Produits commandés
                                <span style={{ marginLeft:'auto', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'1px 8px', fontSize:10, fontWeight:700, color:'var(--text-2)' }}>
                                    {dets.length} article{dets.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {dets.length === 0 ? <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'16px 0' }}>Aucun produit.</p> : (
                                <>
                                    <div style={{ overflowX:'auto' }}>
                                        <table className="cmd-prod-table">
                                            <thead><tr><th>Produit fournisseur</th><th style={{ textAlign:'right' }}>Qté</th><th style={{ textAlign:'right' }}>Prix HT</th><th style={{ textAlign:'right' }}>TVA</th><th style={{ textAlign:'right' }}>FODEC</th><th style={{ textAlign:'right' }}>Total HT</th><th style={{ textAlign:'right' }}>Total TTC</th></tr></thead>
                                            <tbody>
                                                {dets.map((d, idx) => {
                                                    const qty     = Number(d.quantite || 0);
                                                    const ligneHT = parseFloat(d.prix_unitaire_ht || 0) * qty;
                                                    const ttc     = calcTTC(d.prix_unitaire_ht, d.taux_tva, d.taux_fodec, d.taux_dc, qty);
                                                    return (
                                                        <tr key={d.id || idx}>
                                                            <td><div style={{ fontWeight:600 }}>{d.produit_fournisseur_nom || '—'}</div></td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>{qty}</td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{fmtPrice(d.prix_unitaire_ht)}</td>
                                                            <td style={{ textAlign:'right', color:'var(--muted)', fontSize:11 }}>{d.taux_tva ?? 0}%</td>
                                                            <td style={{ textAlign:'right', color:'var(--muted)', fontSize:11 }}>{d.taux_fodec ?? 0}%</td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{ligneHT.toFixed(3)} DT</td>
                                                            <td style={{ textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'var(--blue,#2B7574)' }}>{ttc.toFixed(3)} DT</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="cmd-prod-total-row">
                                        <div className="cmd-prod-total-box">
                                            <div className="cmd-prod-total-line"><span>Total HT</span><span>{totalHT.toFixed(3)} DT</span></div>
                                            <div className="cmd-prod-total-line final"><span>Total TTC estimé</span><span>{totalTTC.toFixed(3)} DT</span></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="cmd-modal-footer">
                            <button className="cmd-btn cmd-btn-ghost" onClick={onClose}>Fermer</button>
                            {canLivrer && (
                                <button
                                    className="cmd-btn cmd-btn-sm"
                                    style={{ background:'rgba(124,58,237,.1)', color:'#7c3aed', border:'1px solid rgba(124,58,237,.2)' }}
                                    onClick={() => { onClose(); onLivraison(cmd); }}
                                >
                                    <Icon d={Icons.truck} size={13} /> Statut livraison
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Achat Panel ──────────────────────────────────────────────────────────────
const CommandesAchatPanel = ({ notify }) => {
    const [orders,       setOrders]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewId,       setViewId]       = useState(null);
    const [livraison,    setLivraison]    = useState(null);
    const [actionLoad,   setActionLoad]   = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try { const res = await API.get('/commandes-achat'); setOrders(res.data.data || []); }
        catch { notify("Erreur lors du chargement des commandes d'achat.", 'error'); }
        finally { setLoading(false); }
    }, [notify]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleLivraison = async (livree) => {
        setActionLoad(true);
        try {
            const res = await API.patch(`/commandes-achat/${livraison.id}/livraison`, { livree });
            notify(
                livree
                    ? `Commande livrée — Facture ${res.data.data?.facture?.num_facture || ''} générée.`
                    : 'Commande marquée non livrée.',
                'success'
            );
            setLivraison(null); fetchOrders();
        } catch (e) {
            notify(e.response?.data?.message || 'Erreur lors de la mise à jour.', 'error');
        } finally { setActionLoad(false); }
    };

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        const status = normalizeStatus(o.statut);
        const matchSearch = !q
            || `${o.fournisseur_nom||''} ${o.fournisseur_prenom||''} ${o.fournisseur_societe||''} ${o.admin_nom||''} ${o.admin_prenom||''}`.toLowerCase().includes(q)
            || String(o.id).includes(q)
            || String(o.num_ordre || '').includes(q);
        const matchStatus = !statusFilter || status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = [
        { label:'Total',      value:orders.length,                                                                                                  cls:'blue',   sub:"commandes d'achat" },
        { label:'En attente', value:orders.filter(o => ['en attente','en_attente'].includes(normalizeStatus(o.statut))).length,                     cls:'orange', sub:'fournisseur'       },
        { label:'Acceptées',  value:orders.filter(o => ['acceptée','acceptee'].includes(normalizeStatus(o.statut))).length,                         cls:'purple', sub:'à livrer'          },
        { label:'Livrées',    value:orders.filter(o => ['livrée','livree'].includes(normalizeStatus(o.statut))).length,                            cls:'green',  sub:'reçues'            },
        { label:'Refusées',   value:orders.filter(o => ['refusée','refusee'].includes(normalizeStatus(o.statut))).length,                          cls:'red',    sub:'annulées'          },
    ];

    return (
        <>
            <div className="cmd-info-banner">
                <span className="cmd-info-banner-icon"><Icon d={Icons.alert} size={12} /></span>
                Les décisions d'acceptation et de refus sont gérées par le fournisseur. Vous pouvez consulter chaque commande et marquer la livraison une fois acceptée.
            </div>
            <div className="cmd-stats">
                {stats.map(s => (
                    <div key={s.label} className={`cmd-stat ${s.cls}`}>
                        <div className="cmd-stat-label">{s.label}</div>
                        <div className={`cmd-stat-val ${s.cls}`}>{s.value}</div>
                        <div className="cmd-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>
            <div className="cmd-toolbar">
                <div className="cmd-toolbar-left">
                    <div className="cmd-search">
                        <Icon d={Icons.search} size={14} />
                        <input placeholder="Rechercher fournisseur, société, N° ordre..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="cmd-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        <option value="en attente">En attente</option>
                        <option value="acceptée">Acceptée</option>
                        <option value="livrée">Livrée</option>
                        <option value="non livrée">Non livrée</option>
                        <option value="refusée">Refusée</option>
                        <option value="archivée">Archivée</option>
                    </select>
                </div>
                <div className="cmd-toolbar-right">
                    <button className="cmd-btn cmd-btn-ghost cmd-btn-sm" onClick={fetchOrders}><Icon d={Icons.refresh} size={14} /> Rafraîchir</button>
                </div>
            </div>
            <div className="cmd-table-wrap">
                <table className="cmd-table">
                    <thead>
                        <tr>
                            <th>Référence</th><th>Fournisseur</th><th>Admin</th><th>Type</th>
                            <th>Date</th><th>Livraison prévue</th><th>Total HT</th><th>Statut</th>
                            <th style={{ width:90 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9}><div className="cmd-spinner-wrap"><span className="cmd-spinner" /> Chargement...</div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={9}>
                                <div className="cmd-empty">
                                    <div className="cmd-empty-icon"><Icon d={Icons.purchase} size={40} /></div>
                                    <p>Aucune commande d'achat trouvée</p>
                                    <small>{search || statusFilter ? 'Essayez de modifier vos filtres' : "Les commandes d'achat apparaîtront ici"}</small>
                                </div>
                            </td></tr>
                        ) : filtered.map(o => {
                            const status    = normalizeStatus(o.statut);
                            const canLivrer = ['acceptée','acceptee'].includes(status);
                            return (
                                <tr key={o.id} style={{ cursor:'pointer' }} onClick={() => setViewId(o.id)}>
                                    <td><span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color:'var(--teal,#12484C)' }}>{displayRef(o)}</span></td>
                                    <td>
                                        <div style={{ fontWeight:600 }}>{o.fournisseur_societe || '—'}</div>
                                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{[o.fournisseur_prenom, o.fournisseur_nom].filter(Boolean).join(' ') || '—'}</div>
                                    </td>
                                    <td style={{ color:'var(--text-2,#3d6372)', fontSize:12 }}>{[o.admin_prenom, o.admin_nom].filter(Boolean).join(' ') || '—'}</td>
                                    <td>{o.type_en && <span className="cmd-type-pill">{o.type_en}</span>}</td>
                                    <td style={{ color:'var(--muted)', fontSize:12 }}>{fmtDate(o.date_creation)}</td>
                                    <td style={{ fontSize:12 }}>
                                        {o.date_livraison
                                            ? <span style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--teal,#12484C)' }}>{fmtDate(o.date_livraison)}</span>
                                            : <span style={{ color:'var(--muted)' }}>—</span>
                                        }
                                    </td>
                                    <td style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{fmtPrice(o.total_ht)}</td>
                                    <td><StatusBadge statut={o.statut} /></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="cmd-actions">
                                            <button className="cmd-icon-btn cmd-ib-view" title="Voir" onClick={() => setViewId(o.id)}><Icon d={Icons.eye} size={13} /></button>
                                            {canLivrer && (
                                                <button className="cmd-icon-btn cmd-ib-truck" title="Statut livraison" onClick={() => setLivraison(o)}>
                                                    <Icon d={Icons.truck} size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {viewId && (
                <DetailAchatModal
                    id={viewId}
                    onClose={() => setViewId(null)}
                    onLivraison={o => { setViewId(null); setLivraison(o); }}
                />
            )}
            {livraison && (
                <LivraisonModal
                    order={livraison}
                    onClose={() => setLivraison(null)}
                    onConfirm={handleLivraison}
                    loading={actionLoad}
                />
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const CommandesPage = () => {
    const [activeTab, setActiveTab] = useState('vente');
    const [toast,     setToast]     = useState(null);
    const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

    return (
        <>
            <style>{styles}</style>
            <div className="cmd-page">
                <div className="cmd-tabs">
                    <button className={`cmd-tab ${activeTab === 'vente' ? 'active' : ''}`} onClick={() => setActiveTab('vente')}>
                        <Icon d={Icons.shop} size={14} /> Commandes de vente
                    </button>
                    <button className={`cmd-tab ${activeTab === 'achat' ? 'active-achat' : ''}`} onClick={() => setActiveTab('achat')}>
                        <Icon d={Icons.purchase} size={14} /> Commandes d'achat
                    </button>
                </div>
                {activeTab === 'vente'
                    ? <CommandesVentePanel notify={notify} />
                    : <CommandesAchatPanel notify={notify} />
                }
            </div>
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </>
    );
};

export default CommandesPage;