import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);
const I = {
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  orders:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
  product:  "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  profile:  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  check:    "M20 6L9 17l-5-5",
  close:    "M18 6L6 18M6 6l12 12",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ban:      "M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636zM5.636 5.636l12.728 12.728",
  image:    "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  save:     "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  truck:    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  plus:     "M12 5v14M5 12h14",
  building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  invoice:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  inbox:    "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  coin:     "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  eyeOff:   "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  shield2:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice    = v => v != null ? `${parseFloat(v).toFixed(3)} DT` : "—";
const fmtDate     = v => v ? new Date(v).toLocaleDateString("fr-FR") : "—";
const fmtDateLong = v => v ? new Date(v).toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "—";
const unwrap      = d => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];

const STATUT_CFG = {
  "en attente": { label:"En attente", color:"orange" },
  envoyée:      { label:"Envoyée",    color:"blue"   },
  acceptée:     { label:"Acceptée",   color:"green"  },
  refusée:      { label:"Refusée",    color:"red"    },
  livrée:       { label:"Livrée",     color:"teal"   },
  archivée:     { label:"Archivée",   color:"gray"   },
};

const STATUT_FACTURE_CFG = {
  brouillon: { label:"Brouillon", color:"gray"   },
  reçue:     { label:"Reçue",     color:"blue"   },
  payée:     { label:"Payée",     color:"green"  },
  annulée:   { label:"Annulée",   color:"red"    },
};

// ─── Design System ─────────────────────────────────────────────────────────────

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#080C10;
  --surface:#0F1823;
  --surface2:#162030;
  --surface3:#1C2A3E;
  --surface4:#203040;
  --border:rgba(255,255,255,0.06);
  --border2:rgba(255,255,255,0.11);
  --border3:rgba(255,255,255,0.18);
  --accent:#00E5A8;
  --accent2:#00C48C;
  --accent3:#009970;
  --accent-d:rgba(0,229,168,0.08);
  --accent-m:rgba(0,229,168,0.15);
  --accent-b:rgba(0,229,168,0.25);
  --danger:#FF4D6A;
  --danger-l:rgba(255,77,106,0.10);
  --danger-b:rgba(255,77,106,0.22);
  --warning:#FFAB2E;
  --warning-l:rgba(255,171,46,0.10);
  --warning-b:rgba(255,171,46,0.22);
  --blue:#5BA4F5;
  --blue-l:rgba(91,164,245,0.10);
  --blue-b:rgba(91,164,245,0.22);
  --violet:      #9B87F5;
  --violet-l:rgba(155,135,245,0.10);
  --violet-b:rgba(155,135,245,0.22);
  --violet:#9B87F5;
  --violet-l:rgba(155,135,245,0.10);
  --text:#EEF2F8;
  --text2:#8BA3BF;
  --text3:#4A6480;
  --sidebar:268px;
  --r:10px;--r-lg:14px;--r-xl:20px;
  --sh:0 2px 16px rgba(0,0,0,0.5);
  --sh-lg:0 8px 40px rgba(0,0,0,0.6);
  --sh-xl:0 24px 64px rgba(0,0,0,0.7);
}

body{background:var(--bg);color:var(--text);font-family:'Nunito',sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
.f-dash{display:flex;height:100vh;overflow:hidden}

/* ── Sidebar ── */
.f-sidebar{
  width:var(--sidebar);min-width:var(--sidebar);
  background:var(--surface);
  display:flex;flex-direction:column;
  border-right:1px solid var(--border);
  position:relative;overflow:hidden;
}
.f-sidebar::after{
  content:'';position:absolute;bottom:-60px;left:-60px;
  width:220px;height:220px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,229,168,0.04) 0%,transparent 70%);
  pointer-events:none;
}

.f-brand{
  padding:22px 18px 20px;display:flex;align-items:center;gap:13px;
  border-bottom:1px solid var(--border);position:relative;z-index:1;
}
.f-brand-logo{
  width:40px;height:40px;border-radius:12px;
  background:linear-gradient(145deg,var(--accent),var(--accent3));
  display:grid;place-items:center;flex-shrink:0;
  font-family:'Sora',sans-serif;font-weight:800;font-size:17px;color:#080C10;
  box-shadow:0 0 0 3px var(--accent-m),0 6px 20px rgba(0,229,168,0.3);
}
.f-brand-name{font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:var(--text);letter-spacing:-0.02em;line-height:1.2}
.f-brand-role{font-size:10px;color:var(--accent);margin-top:3px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase}

.f-nav{padding:14px 10px;flex:1;overflow-y:auto;position:relative;z-index:1}
.f-nav-label{font-size:9.5px;font-weight:700;color:var(--text3);letter-spacing:0.16em;text-transform:uppercase;padding:0 12px 10px;display:block;font-family:'Sora',sans-serif}
.f-nav-item{
  display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:var(--r);
  cursor:pointer;color:var(--text2);font-size:13px;font-weight:600;
  transition:all 0.16s;border:none;background:none;width:100%;text-align:left;
  margin-bottom:2px;font-family:'Nunito',sans-serif;position:relative;
}
.f-nav-item:hover{background:rgba(255,255,255,0.04);color:var(--text)}
.f-nav-item.active{background:var(--accent-d);color:var(--accent);font-weight:700;border:1px solid rgba(0,229,168,0.12)}
.f-nav-item.active::before{content:'';position:absolute;left:0;top:22%;bottom:22%;width:2.5px;border-radius:0 3px 3px 0;background:var(--accent);box-shadow:0 0 10px var(--accent)}
.f-nav-badge{margin-left:auto;background:var(--accent);color:#080C10;font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;font-family:'Sora',sans-serif}

.f-sidebar-footer{padding:14px 10px;border-top:1px solid var(--border);position:relative;z-index:1}
.f-user-card{
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);
  background:var(--surface2);border:1px solid var(--border);margin-bottom:8px;
  transition:border-color 0.15s;
}
.f-user-card:hover{border-color:var(--border2)}
.f-avatar{
  width:34px;height:34px;border-radius:9px;
  background:linear-gradient(135deg,var(--accent),var(--accent3));
  display:grid;place-items:center;font-size:13px;font-weight:800;color:#080C10;
  flex-shrink:0;font-family:'Sora',sans-serif;
}
.f-user-name{font-size:13px;font-weight:700;color:var(--text)}
.f-user-role{font-size:11px;color:var(--text3);font-weight:500}

/* ── Main ── */
.f-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.f-topbar{
  height:60px;
  background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 26px;flex-shrink:0;
}
.f-topbar-title{font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:var(--text);letter-spacing:-0.02em}
.f-content{flex:1;overflow-y:auto;padding:26px;background:var(--bg)}

/* ── Stats ── */
.f-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}
.f-stat{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);
  padding:20px 22px;box-shadow:var(--sh);transition:all 0.2s;position:relative;overflow:hidden;
}
.f-stat:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:var(--sh-lg)}
.f-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.f-stat-icon{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;margin-bottom:14px}
.f-stat.teal   .f-stat-icon{background:var(--accent-d); color:var(--accent)}
.f-stat.teal::before  {background:linear-gradient(90deg,var(--accent),transparent)}
.f-stat.blue   .f-stat-icon{background:var(--blue-l);   color:var(--blue)}
.f-stat.blue::before  {background:linear-gradient(90deg,var(--blue),transparent)}
.f-stat.green  .f-stat-icon{background:var(--accent-d); color:var(--accent)}
.f-stat.green::before {background:linear-gradient(90deg,var(--accent2),transparent)}
.f-stat.orange .f-stat-icon{background:var(--warning-l);color:var(--warning)}
.f-stat.orange::before{background:linear-gradient(90deg,var(--warning),transparent)}
.f-stat.red    .f-stat-icon{background:var(--danger-l); color:var(--danger)}
.f-stat.red::before   {background:linear-gradient(90deg,var(--danger),transparent)}

.f-stat-label{font-size:10.5px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:7px;font-family:'Sora',sans-serif}
.f-stat-val{font-family:'Sora',sans-serif;font-size:26px;font-weight:800;margin-bottom:3px;letter-spacing:-0.02em}
.f-stat.teal   .f-stat-val,.f-stat.green .f-stat-val{color:var(--accent)}
.f-stat.blue   .f-stat-val{color:var(--blue)}
.f-stat.orange .f-stat-val{color:var(--warning)}
.f-stat.red    .f-stat-val{color:var(--danger)}
.f-stat-sub{font-size:11.5px;color:var(--text3);font-weight:500}

/* ── Table ── */
.f-tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:22px;box-shadow:var(--sh)}
.f-tbl{width:100%;border-collapse:collapse}
.f-tbl thead th{
  padding:11px 16px;text-align:left;font-size:10px;font-weight:700;color:var(--text3);
  letter-spacing:0.1em;text-transform:uppercase;
  background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);
  white-space:nowrap;font-family:'Sora',sans-serif;
}
.f-tbl tbody tr{border-bottom:1px solid var(--border);transition:background 0.1s}
.f-tbl tbody tr:last-child{border-bottom:none}
.f-tbl tbody tr:hover{background:rgba(255,255,255,0.025)}
.f-tbl tbody td{padding:12px 16px;font-size:13px;vertical-align:middle}

/* ── Badges ── */
.f-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:10.5px;font-weight:700;white-space:nowrap;font-family:'Sora',sans-serif}
.f-badge-orange{background:var(--warning-l);color:var(--warning);border:1px solid var(--warning-b)}
.f-badge-blue  {background:var(--blue-l);   color:var(--blue);   border:1px solid var(--blue-b)}
.f-badge-green {background:var(--accent-d); color:var(--accent); border:1px solid var(--accent-b)}
.f-badge-red   {background:var(--danger-l); color:var(--danger); border:1px solid var(--danger-b)}
.f-badge-teal  {background:var(--accent-d); color:var(--accent); border:1px solid rgba(0,229,168,0.3)}
.f-badge-gray  {background:rgba(255,255,255,0.05);color:var(--text2);border:1px solid var(--border2)}

/* ── Buttons ── */
.f-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--r);border:none;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap}
.f-btn-sm{padding:5px 11px;font-size:12px;border-radius:8px}
.f-btn-primary{background:var(--accent);color:#080C10;box-shadow:0 4px 18px rgba(0,229,168,0.28)}
.f-btn-primary:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 6px 26px rgba(0,229,168,0.4)}
.f-btn-primary:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none}
.f-btn-ghost{background:var(--surface2);color:var(--text);border:1px solid var(--border2)}
.f-btn-ghost:hover{background:var(--surface3);border-color:var(--border3)}
.f-btn-danger{background:var(--danger-l);color:var(--danger);border:1px solid var(--danger-b)}
.f-btn-danger:hover{background:rgba(255,77,106,0.18)}
.f-btn-success{background:var(--accent-d);color:var(--accent);border:1px solid var(--accent-b)}
.f-btn-success:hover{background:var(--accent-m)}
.f-btn-blue{background:var(--blue-l);color:var(--blue);border:1px solid var(--blue-b)}
.f-btn-blue:hover{background:rgba(91,164,245,0.18)}
.f-icon-btn{width:32px;height:32px;border-radius:9px;border:1px solid var(--border2);background:var(--surface2);display:grid;place-items:center;cursor:pointer;transition:all 0.15s;color:var(--text2)}
.f-icon-btn:hover{background:var(--surface3);border-color:var(--border3);color:var(--text)}
.f-icon-btn-teal{color:var(--accent)}
.f-icon-btn-teal:hover{background:var(--accent-d);border-color:var(--accent-b)}
.f-icon-btn-red{color:var(--danger)}
.f-icon-btn-red:hover{background:var(--danger-l);border-color:var(--danger-b)}

/* ── Search ── */
.f-search{display:flex;align-items:center;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r);padding:0 13px;height:36px;transition:all 0.2s;gap:8px}
.f-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-d)}
.f-search input{border:none;background:transparent;outline:none;width:100%;font-family:'Nunito',sans-serif;font-size:13px;color:var(--text)}
.f-search input::placeholder{color:var(--text3)}

/* ── Overlay + Modal ── */
.f-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.82);display:grid;place-items:center;z-index:1000;backdrop-filter:blur(16px);animation:fFadeIn 0.15s ease}
@keyframes fFadeIn{from{opacity:0}to{opacity:1}}
@keyframes fUp{from{transform:translateY(20px) scale(0.97);opacity:0}to{transform:none;opacity:1}}
.f-modal{
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--r-xl);
  padding:28px;width:520px;max-width:95vw;max-height:92vh;overflow-y:auto;
  animation:fUp 0.22s cubic-bezier(0.16,1,0.3,1);
  box-shadow:var(--sh-xl);
}
.f-modal-wide{width:820px}
.f-modal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.f-modal-title{font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:var(--text);letter-spacing:-0.01em}
.f-modal-close{width:32px;height:32px;border-radius:9px;border:1px solid var(--border2);background:var(--surface2);color:var(--text2);display:grid;place-items:center;cursor:pointer;transition:all 0.2s}
.f-modal-close:hover{background:var(--danger-l);color:var(--danger);border-color:var(--danger-b);transform:rotate(90deg)}
.f-modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)}

/* ── Form ── */
.f-form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.f-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.f-form-label{font-size:10.5px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.09em;font-family:'Sora',sans-serif}
.f-form-input,.f-form-select,.f-form-textarea{background:var(--surface2);border:1px solid var(--border2);color:var(--text);font-family:'Nunito',sans-serif;font-size:13px;padding:9px 13px;border-radius:var(--r);outline:none;transition:all 0.15s;width:100%}
.f-form-input:focus,.f-form-select:focus,.f-form-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-d);background:var(--surface3)}
.f-form-input::placeholder{color:var(--text3)}
.f-form-textarea{resize:vertical;min-height:80px;line-height:1.6}
.f-form-input.error{border-color:var(--danger);box-shadow:0 0 0 3px var(--danger-l)}
.f-form-select option{background:var(--surface2)}

/* ── Section header ── */
.f-sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.f-sec-title{font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:var(--text);letter-spacing:-0.02em}

/* ── Product cards ── */
.f-prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:14px}
.f-prod-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--sh);transition:all 0.2s}
.f-prod-card:hover{border-color:rgba(0,229,168,0.25);transform:translateY(-3px);box-shadow:var(--sh-lg),0 0 28px rgba(0,229,168,0.06)}
.f-prod-img{width:100%;height:140px;background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--text3);overflow:hidden;border-bottom:1px solid var(--border)}
.f-prod-img img{width:100%;height:100%;object-fit:cover}
.f-prod-body{padding:14px 16px}
.f-prod-name{font-weight:700;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Sora',sans-serif;color:var(--text)}
.f-prod-price{font-size:17px;font-weight:800;color:var(--accent);margin-bottom:8px;font-family:'Sora',sans-serif;letter-spacing:-0.02em}
.f-prod-actions{display:flex;gap:6px;margin-top:10px}

/* ── Date picker ── */
.f-date-hint{font-size:12px;margin-top:8px;font-weight:700}
.f-date-hint.ok {color:var(--accent)}
.f-date-hint.err{color:var(--danger)}

/* ── Profile ── */
.f-profile-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:28px;box-shadow:var(--sh);max-width:680px}
.f-profile-avatar{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:grid;place-items:center;font-family:'Sora',sans-serif;font-size:26px;font-weight:800;color:#080C10;margin-bottom:22px;box-shadow:0 0 0 4px var(--accent-m),0 8px 32px rgba(0,229,168,0.24)}
.f-profile-name{font-family:'Sora',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px;color:var(--text);letter-spacing:-0.02em}
.f-profile-role{font-size:13px;color:var(--text2);margin-bottom:26px;display:flex;align-items:center;gap:8px}

/* ── Confirm modal ── */
.f-confirm{text-align:center}
.f-confirm-icon{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;margin:0 auto 18px}
.f-confirm-icon.danger {background:var(--danger-l); color:var(--danger); border:1px solid var(--danger-b)}
.f-confirm-icon.warning{background:var(--warning-l);color:var(--warning);border:1px solid var(--warning-b)}
.f-confirm-icon.success{background:var(--accent-d);color:var(--accent); border:1px solid var(--accent-b)}
.f-confirm h3{font-family:'Sora',sans-serif;font-size:17px;font-weight:700;margin-bottom:10px;color:var(--text);letter-spacing:-0.01em}
.f-confirm p {font-size:13.5px;color:var(--text2);line-height:1.65;margin-bottom:24px}
.f-confirm-btns{display:flex;gap:10px;justify-content:center}

/* ── Toast ── */
.f-toast{position:fixed;bottom:28px;right:28px;background:var(--surface);border:1px solid var(--border2);border-radius:var(--r-lg);padding:13px 20px;display:flex;align-items:center;gap:12px;font-size:13px;font-weight:600;animation:fUp 0.25s ease;z-index:2000;box-shadow:var(--sh-xl);font-family:'Nunito',sans-serif;max-width:340px}
.f-toast.success{border-left:3px solid var(--accent)}
.f-toast.error  {border-left:3px solid var(--danger)}
.f-toast-icon{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;flex-shrink:0}
.f-toast.success .f-toast-icon{background:var(--accent-d);color:var(--accent)}
.f-toast.error   .f-toast-icon{background:var(--danger-l);color:var(--danger)}

.f-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(0,0,0,0.2);border-top-color:#080C10;border-radius:50%;animation:fSpin 0.6s linear infinite}
.f-spinner-dark{display:inline-block;width:13px;height:13px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:fSpin 0.6s linear infinite}
@keyframes fSpin{to{transform:rotate(360deg)}}

.f-empty{text-align:center;padding:60px 20px;color:var(--text3)}
.f-empty p{margin-top:12px;font-size:13px;color:var(--text2)}

.f-filter-sel{background:var(--surface2);border:1px solid var(--border2);color:var(--text);font-family:'Nunito',sans-serif;font-size:12px;font-weight:600;padding:0 28px 0 11px;height:36px;border-radius:var(--r);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234A6480' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;transition:border-color 0.15s}
.f-filter-sel:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-d)}
.f-filter-sel option{background:var(--surface2)}

/* ── Facture detail ── */
.f-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.f-detail-box{background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:13px 15px}
.f-detail-box-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:5px;font-family:'Sora',sans-serif}
.f-detail-box-val{font-size:13.5px;font-weight:600;color:var(--text)}

/* ── Totals strip ── */
.f-totals{
  background:var(--accent-d);border:1px solid var(--accent-b);border-radius:var(--r-lg);
  padding:18px 22px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;
}
.f-total-item-label{font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--text3);margin-bottom:4px;font-family:'Sora',sans-serif}
.f-total-item-val{font-family:'Sora',sans-serif;font-size:18px;font-weight:800;color:var(--accent);letter-spacing:-0.02em}

.f-lines-title{font-family:'Sora',sans-serif;font-weight:700;font-size:11px;margin-bottom:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.09em}

/* ── Timeline ── */
.f-timeline{display:flex;flex-direction:column;gap:0}
.f-tl-item{display:flex;gap:12px;padding-bottom:18px;position:relative}
.f-tl-item:last-child{padding-bottom:0}
.f-tl-item:not(:last-child)::before{content:'';position:absolute;left:15px;top:32px;bottom:0;width:1px;background:var(--border)}
.f-tl-dot{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;border:1px solid transparent}
.f-tl-dot.done   {background:var(--accent-d);border-color:var(--accent-b);color:var(--accent)}
.f-tl-dot.pending{background:var(--surface2);border-color:var(--border);color:var(--text3)}
.f-tl-content{flex:1;padding-top:5px}
.f-tl-label{font-size:13px;font-weight:600;color:var(--text)}
.f-tl-date {font-size:11px;color:var(--text3);margin-top:2px}

/* ── Info row (profile company) ── */
.f-info-section{background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:22px}
.f-info-section-title{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:14px;display:flex;align-items:center;gap:6px;font-family:'Sora',sans-serif}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.16)}
`;


// ─── Sub-components ───────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`f-toast ${type}`}>
      <div className="f-toast-icon"><Icon d={type === "success" ? I.check : I.close} size={12} /></div>
      {msg}
    </div>
  );
};

const SafeImg = ({ src, size = 30 }) => {
  const [err, setErr] = useState(false);
  if (!src || err) return <Icon d={I.image} size={size} />;
  return <img src={`http://localhost:5000${src}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setErr(true)} />;
};

const StatutBadge = ({ statut }) => {
  const cfg = STATUT_CFG[statut] || { label: statut, color: "gray" };
  return (
    <span className={`f-badge f-badge-${cfg.color}`}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", display:"inline-block" }} />
      {cfg.label}
    </span>
  );
};

const FactureBadge = ({ statut }) => {
  const cfg = STATUT_FACTURE_CFG[statut] || { label: statut, color: "gray" };
  return (
    <span className={`f-badge f-badge-${cfg.color}`}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", display:"inline-block" }} />
      {cfg.label}
    </span>
  );
};

// ─── Accept Modal ─────────────────────────────────────────────────────────────
const AcceptModal = ({ commande, onClose, onConfirm, saving }) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!date) { setError("La date de livraison est obligatoire."); return; }
    setError(""); onConfirm(date);
  };

  return (
    <div className="f-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="f-modal">
        <div className="f-modal-hdr">
          <span className="f-modal-title">Accepter la commande #{commande.id}</span>
          <button className="f-modal-close" onClick={onClose}><Icon d={I.close} size={16} /></button>
        </div>
        <p style={{ fontSize:13.5, color:"var(--text2)", lineHeight:1.65, marginBottom:20 }}>
          Indiquez la <strong style={{ color:"var(--text)" }}>date de livraison prévue</strong> pour confirmer l'acceptation —{" "}
          Total : <strong style={{ color:"var(--accent)" }}>{fmtPrice(commande.total_ht)}</strong>
        </p>
        <div className="f-form-group">
          <label className="f-form-label">Date de livraison *</label>
          <input type="date" min={minDate} value={date}
            onChange={e => { setDate(e.target.value); setError(""); }}
            className={`f-form-input ${error ? "error" : ""}`} />
          {error && <div style={{ fontSize:12, color:"var(--danger)", fontWeight:700, marginTop:4 }}>{error}</div>}
          {date && !error && <div className="f-date-hint ok">✓ Livraison prévue le {fmtDateLong(date)}</div>}
        </div>
        <div className="f-modal-footer">
          <button className="f-btn f-btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button className="f-btn f-btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? <><span className="f-spinner" /> Traitement…</> : <><Icon d={I.check} size={14} /> Confirmer</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({ commande, onClose, onAccept, onRefuse, saving }) => {
  const canAct = ["en attente","envoyée","brouillon"].includes(commande.statut);
  return (
    <div className="f-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="f-modal f-modal-wide">
        <div className="f-modal-hdr">
          <div>
            <div className="f-modal-title">Commande #{commande.id} — {commande.num_ordre}</div>
            <div style={{ fontSize:12, color:"var(--text3)", marginTop:3 }}>
              Créée le {fmtDate(commande.date_creation)}
              {commande.date_livraison && ` · Livraison : ${fmtDate(commande.date_livraison)}`}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <StatutBadge statut={commande.statut} />
            <button className="f-modal-close" onClick={onClose}><Icon d={I.close} size={16} /></button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
          {[["Type", commande.type_en||"—"], ["Admin", `${commande.admin_prenom||""} ${commande.admin_nom||""}`.trim()||"—"], ["Total HT", fmtPrice(commande.total_ht)]].map(([label, val]) => (
            <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:"var(--text3)", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{val}</div>
            </div>
          ))}
        </div>
        {commande.date_livraison && (
          <div style={{ background:"var(--success-l)", border:"1px solid rgba(0,223,162,0.2)", borderRadius:"var(--r)", padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, fontSize:13, color:"var(--accent)" }}>
            <Icon d={I.truck} size={16} />
            Livraison prévue le <strong style={{ marginLeft:4 }}>{fmtDateLong(commande.date_livraison)}</strong>
          </div>
        )}
        {canAct && (
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:16, borderTop:"1px solid var(--border)" }}>
            <button className="f-btn f-btn-danger" onClick={onRefuse} disabled={saving}><Icon d={I.ban} size={13} /> Refuser</button>
            <button className="f-btn f-btn-primary" onClick={onAccept} disabled={saving}><Icon d={I.check} size={13} /> Accepter</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────
const ProductFormModal = ({ product, fournisseurId, onClose, onSaved, showToast }) => {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    nom_produit_f:    product?.nom_produit_f    || "",
    description_f:    product?.description_f    || "",
    categorie:        product?.categorie        || "",
    prix_unitaire_ht: product?.prix_unitaire_ht || "",
    taux_tva:         product?.taux_tva         ?? 19,
    taux_fodec:       product?.taux_fodec       ?? 1,
    taux_dc:          product?.taux_dc          ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nom_produit_f.trim() || !form.prix_unitaire_ht) {
      showToast("Nom et prix sont obligatoires.", "error"); return;
    }
    setSaving(true);
    try {
      const payload = { id_fournisseur: fournisseurId, nom_produit_f: form.nom_produit_f.trim(), description_f: form.description_f.trim() || null, categorie: form.categorie.trim() || null, prix_unitaire_ht: parseFloat(form.prix_unitaire_ht), taux_tva: parseFloat(form.taux_tva)||0, taux_fodec: parseFloat(form.taux_fodec)||0, taux_dc: parseFloat(form.taux_dc)||0 };
      if (isEdit) { await API.put(`/produits-fournisseur/${product.id}`, payload); showToast("Produit mis à jour.", "success"); }
      else        { await API.post("/produits-fournisseur", payload);              showToast("Produit créé.", "success"); }
      onSaved(); onClose();
    } catch (err) { showToast(err.response?.data?.message || "Erreur.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="f-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="f-modal">
        <div className="f-modal-hdr">
          <span className="f-modal-title">{isEdit ? "Modifier le produit" : "Nouveau produit"}</span>
          <button className="f-modal-close" onClick={onClose}><Icon d={I.close} size={16} /></button>
        </div>
        <div className="f-form-group">
          <label className="f-form-label">Nom du produit *</label>
          <input className="f-form-input" value={form.nom_produit_f} onChange={set("nom_produit_f")} placeholder="Ex: Huile moteur 5W30" />
        </div>
        <div className="f-form-group">
          <label className="f-form-label">Description</label>
          <textarea className="f-form-textarea" value={form.description_f} onChange={set("description_f")} placeholder="Description…" />
        </div>
        <div className="f-form-row">
          <div className="f-form-group">
            <label className="f-form-label">Catégorie</label>
            <input className="f-form-input" value={form.categorie} onChange={set("categorie")} placeholder="Ex: Informatique" />
          </div>
          <div className="f-form-group">
            <label className="f-form-label">Prix unitaire HT *</label>
            <input className="f-form-input" type="number" min="0" step="0.001" value={form.prix_unitaire_ht} onChange={set("prix_unitaire_ht")} placeholder="0.000" />
          </div>
        </div>
        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:12, fontFamily:"'Sora',sans-serif" }}>Taux et taxes</div>
          <div className="f-form-row" style={{ marginBottom:0 }}>
            {[["taux_tva","TVA (%)"],["taux_fodec","FODEC (%)"],["taux_dc","DC (%)"]].map(([k,lbl]) => (
              <div key={k} className="f-form-group" style={{ marginBottom:0 }}>
                <label className="f-form-label">{lbl}</label>
                <input className="f-form-input" type="number" min="0" max="100" step="0.1" value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>
        </div>
        <div className="f-modal-footer">
          <button className="f-btn f-btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button className="f-btn f-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="f-spinner" /> Enregistrement…</> : <><Icon d={I.save} size={13} /> {isEdit ? "Sauvegarder" : "Créer"}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Facture Detail Modal ─────────────────────────────────────────────────────
const FactureDetailModal = ({ factureId, onClose, onAction, saving }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await API.get(`/factures-achat/${factureId}`);
        setData(r.data?.data || r.data);
      } catch { /* parent handles */ }
      finally { setLoading(false); }
    })();
  }, [factureId]);

  if (loading) return (
    <div className="f-overlay">
      <div className="f-modal" style={{ display:"grid", placeItems:"center", minHeight:220 }}>
        <span className="f-spinner-dark" style={{ width:30, height:30, borderWidth:3 }} />
      </div>
    </div>
  );

  if (!data?.facture) return (
    <div className="f-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="f-modal">
        <div className="f-confirm">
          <div className="f-confirm-icon danger"><Icon d={I.alert} size={22} /></div>
          <h3>Facture introuvable</h3>
          <p>Impossible de charger les données.</p>
          <div className="f-confirm-btns">
            <button className="f-btn f-btn-ghost" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );

  const { facture, details = [] } = data;
  const statut = facture.statut;
  const canRecevoir = statut === "brouillon";
  const canPayer    = statut === "reçue";
  const canAnnuler  = statut !== "payée" && statut !== "annulée";

  const timeline = [
    { label:"Créée",  date:facture.date_creation,  done:true },
    { label:"Reçue",  date:facture.date_reception,  done:!!facture.date_reception },
    { label:"Payée",  date:facture.date_paiement,   done:!!facture.date_paiement },
  ];

  const handleConfirmAction = async () => {
    await onAction(factureId, confirm);
    setConfirm(null); onClose();
  };

  if (confirm) {
    const cfgMap = {
      recevoir: { icon:I.inbox, cls:"success", title:"Marquer comme reçue ?",  msg:`La facture ${facture.num_facture} sera marquée reçue.`,    btn:"Confirmer réception",    btnCls:"f-btn-success" },
      payer:    { icon:I.coin,  cls:"success", title:"Marquer comme payée ?",  msg:`La facture ${facture.num_facture} sera marquée payée.`,     btn:"Confirmer paiement",     btnCls:"f-btn-primary" },
      annuler:  { icon:I.ban,   cls:"danger",  title:"Annuler la facture ?",   msg:`La facture ${facture.num_facture} sera annulée définitivement.`, btn:"Confirmer l'annulation", btnCls:"f-btn-danger"  },
    };
    const cfg = cfgMap[confirm];
    return (
      <div className="f-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
        <div className="f-modal">
          <div className="f-confirm">
            <div className={`f-confirm-icon ${cfg.cls}`}><Icon d={cfg.icon} size={22} /></div>
            <h3>{cfg.title}</h3>
            <p>{cfg.msg}</p>
            <div className="f-confirm-btns">
              <button className="f-btn f-btn-ghost" onClick={() => setConfirm(null)} disabled={saving}>Annuler</button>
              <button className={`f-btn ${cfg.btnCls}`} onClick={handleConfirmAction} disabled={saving}>
                {saving ? <><span className="f-spinner" /> …</> : cfg.btn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="f-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="f-modal f-modal-wide">
        <div className="f-modal-hdr">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"var(--accent-l)", border:"1px solid rgba(0,223,162,0.2)", display:"grid", placeItems:"center", color:"var(--accent)" }}>
              <Icon d={I.invoice} size={18} />
            </div>
            <div>
              <div className="f-modal-title">{facture.num_facture}</div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                Créée le {fmtDate(facture.date_creation)}
                {facture.date_echeance && ` · Échéance : ${fmtDate(facture.date_echeance)}`}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <FactureBadge statut={statut} />
            <button className="f-modal-close" onClick={onClose}><Icon d={I.close} size={16} /></button>
          </div>
        </div>

        <div className="f-totals">
          {[["Total HT", fmtPrice(facture.total_ht)],["FODEC", fmtPrice(facture.fodec)],["TVA", fmtPrice(facture.tva)],["Total TTC", fmtPrice(facture.total_ttc)]].map(([lbl, val]) => (
            <div key={lbl}>
              <div className="f-total-item-label">{lbl}</div>
              <div className="f-total-item-val">{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24 }}>
          <div>
            <div className="f-detail-grid">
              {[["N° Facture", facture.num_facture],["Trimestre", facture.trimestre||"—"],["Fournisseur", `${facture.fournisseur_prenom||""} ${facture.fournisseur_nom||""}`.trim()||"—"],["Email", facture.fournisseur_email||"—"],["Date échéance", fmtDate(facture.date_echeance)],["Date paiement", fmtDate(facture.date_paiement)]].map(([label, val]) => (
                <div className="f-detail-box" key={label}>
                  <div className="f-detail-box-label">{label}</div>
                  <div className="f-detail-box-val">{val}</div>
                </div>
              ))}
            </div>

            {details.length > 0 && (
              <>
                <div className="f-lines-title">Lignes ({details.length})</div>
                <div className="f-tbl-wrap" style={{ marginBottom:0 }}>
                  <table className="f-tbl">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th style={{ textAlign:"right" }}>Qté</th>
                        <th style={{ textAlign:"right" }}>Prix unit. HT</th>
                        <th style={{ textAlign:"right" }}>Total HT</th>
                        <th style={{ textAlign:"right" }}>TVA</th>
                        <th style={{ textAlign:"right" }}>FODEC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600 }}>{d.nom_produit || `Produit #${d.id_produit_fournisseur}`}</td>
                          <td style={{ textAlign:"right", fontFamily:"monospace" }}>{d.quantite}</td>
                          <td style={{ textAlign:"right", fontFamily:"monospace" }}>{fmtPrice(d.prix_unitaire_ht)}</td>
                          <td style={{ textAlign:"right", fontFamily:"monospace", fontWeight:700, color:"var(--accent)" }}>{fmtPrice(d.total_ht_ligne)}</td>
                          <td style={{ textAlign:"right" }}>{d.taux_tva != null ? <span className="f-badge f-badge-gray">{d.taux_tva}%</span> : "—"}</td>
                          <td style={{ textAlign:"right" }}>{d.taux_fodec != null ? <span className="f-badge f-badge-gray">{d.taux_fodec}%</span> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div>
            <div className="f-lines-title" style={{ marginBottom:14 }}>Historique</div>
            <div className="f-timeline" style={{ marginBottom:24 }}>
              {timeline.map((t, i) => (
                <div className="f-tl-item" key={i}>
                  <div className={`f-tl-dot ${t.done ? "done" : "pending"}`}><Icon d={t.done ? I.check : I.calendar} size={13} /></div>
                  <div className="f-tl-content">
                    <div className="f-tl-label" style={{ color:t.done?"var(--text)":"var(--text3)" }}>{t.label}</div>
                    <div className="f-tl-date">{t.date ? fmtDate(t.date) : "—"}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {canRecevoir && <button className="f-btn f-btn-blue"    style={{ width:"100%" }} onClick={() => setConfirm("recevoir")} disabled={saving}><Icon d={I.inbox} size={14} /> Marquer reçue</button>}
              {canPayer    && <button className="f-btn f-btn-success" style={{ width:"100%" }} onClick={() => setConfirm("payer")}    disabled={saving}><Icon d={I.coin}  size={14} /> Marquer payée</button>}
              {canAnnuler  && <button className="f-btn f-btn-danger"  style={{ width:"100%" }} onClick={() => setConfirm("annuler")}  disabled={saving}><Icon d={I.ban}   size={14} /> Annuler</button>}
            </div>
          </div>
        </div>

        <div className="f-modal-footer">
          <button className="f-btn f-btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
};

// ─── FACTURES ACHAT PAGE ──────────────────────────────────────────────────────
const FacturesAchatPage = ({ showToast }) => {
  const [factures,   setFactures]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [statutF,    setStatutF]    = useState("");
  const [trimestreF, setTrimestreF] = useState("");
  const [detailId,   setDetailId]   = useState(null);
  const [saving,     setSaving]     = useState(false);

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try { const r = await API.get("/factures-achat"); setFactures(unwrap(r.data)); }
    catch { showToast("Erreur chargement des factures.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchFactures(); }, [fetchFactures]);

  const total      = factures.length;
  const brouillons = factures.filter(f => f.statut === "brouillon").length;
  const recues     = factures.filter(f => f.statut === "reçue").length;
  const payees     = factures.filter(f => f.statut === "payée").length;
  const montantTTC = factures.filter(f => f.statut !== "annulée").reduce((s, f) => s + parseFloat(f.total_ttc||0), 0);
  const trimestres = [...new Set(factures.map(f => f.trimestre).filter(Boolean))].sort();

  const filtered = factures.filter(f => {
    const q = search.toLowerCase();
    return (
      (!q || f.num_facture?.toLowerCase().includes(q) || String(f.id).includes(q) || `${f.fournisseur_nom} ${f.fournisseur_prenom}`.toLowerCase().includes(q))
      && (!statutF    || f.statut    === statutF)
      && (!trimestreF || f.trimestre === trimestreF)
    );
  });

  const handleAction = async (id, action) => {
    setSaving(true);
    try {
      const routes = { recevoir:`/factures-achat/${id}/recevoir`, payer:`/factures-achat/${id}/payer`, annuler:`/factures-achat/${id}/annuler` };
      const msgs   = { recevoir:"Facture marquée reçue ✓", payer:"Facture payée ✓", annuler:"Facture annulée." };
      await API.patch(routes[action]);
      showToast(msgs[action], "success");
      fetchFactures();
    } catch (err) { showToast(err.response?.data?.message || "Erreur.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="f-stats" style={{ gridTemplateColumns:"repeat(5,1fr)" }}>
        {[
          { label:"Total",          val:total,                                 color:"teal",   sub:"factures",     icon:I.invoice },
          { label:"Brouillons",     val:brouillons,                            color:"orange", sub:"en attente",   icon:I.edit    },
          { label:"Reçues",         val:recues,                                color:"blue",   sub:"à régler",     icon:I.inbox   },
          { label:"Payées",         val:payees,                                color:"green",  sub:"soldées",      icon:I.check   },
          { label:"Montant TTC",    val:`${montantTTC.toFixed(0)} DT`,         color:"teal",   sub:"hors annulées",icon:I.coin   },
        ].map(s => (
          <div className={`f-stat ${s.color}`} key={s.label}>
            <div className="f-stat-icon"><Icon d={s.icon} size={16} /></div>
            <div className="f-stat-label">{s.label}</div>
            <div className="f-stat-val">{s.val}</div>
            <div className="f-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="f-sec-hdr">
        <span className="f-sec-title">
          Factures d'achat
          <span style={{ fontSize:12, fontWeight:500, color:"var(--text3)", marginLeft:8 }}>({filtered.length})</span>
        </span>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <select className="f-filter-sel" value={trimestreF} onChange={e => setTrimestreF(e.target.value)}>
            <option value="">Tous trimestres</option>
            {trimestres.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="f-filter-sel" value={statutF} onChange={e => setStatutF(e.target.value)}>
            <option value="">Tous statuts</option>
            {Object.entries(STATUT_FACTURE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="f-search" style={{ width:240 }}>
            <Icon d={I.search} size={14} />
            <input placeholder="N° facture, fournisseur…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="f-icon-btn f-icon-btn-teal" onClick={fetchFactures} title="Actualiser" disabled={loading}><Icon d={I.refresh} size={15} /></button>
        </div>
      </div>

      {loading ? (
        <div className="f-empty" style={{ paddingTop:80 }}>
          <span className="f-spinner-dark" style={{ width:28, height:28, borderWidth:3 }} />
        </div>
      ) : (
        <div className="f-tbl-wrap">
          <table className="f-tbl">
            <thead>
              <tr>
                <th>N° Facture</th><th>Fournisseur</th><th>Trimestre</th>
                <th style={{ textAlign:"right" }}>Total HT</th>
                <th style={{ textAlign:"right" }}>TVA</th>
                <th style={{ textAlign:"right" }}>Total TTC</th>
                <th>Statut</th><th>Création</th><th>Réception</th><th>Échéance</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}><div className="f-empty"><Icon d={I.invoice} size={38} /><p>Aucune facture trouvée</p></div></td></tr>
              ) : filtered.map(f => {
                const isOverdue = f.date_echeance && new Date(f.date_echeance) < new Date() && f.statut !== "payée" && f.statut !== "annulée";
                return (
                  <tr key={f.id} style={{ cursor:"pointer" }} onClick={() => setDetailId(f.id)}>
                    <td>
                      <div style={{ fontWeight:700, color:"var(--accent)", fontSize:13, fontFamily:"'Sora',sans-serif" }}>{f.num_facture}</div>
                      <div style={{ fontSize:11, color:"var(--text3)" }}>#{f.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:600 }}>{`${f.fournisseur_prenom||""} ${f.fournisseur_nom||""}`.trim()||"—"}</div>
                      {f.fournisseur_email && <div style={{ fontSize:11, color:"var(--text3)" }}>{f.fournisseur_email}</div>}
                    </td>
                    <td>
                      {f.trimestre
                        ? <span style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, fontFamily:"'Sora',sans-serif", color:"var(--text2)" }}>{f.trimestre}</span>
                        : <span style={{ color:"var(--text3)" }}>—</span>}
                    </td>
                    <td style={{ textAlign:"right", fontFamily:"monospace", fontWeight:600, color:"var(--text2)" }}>{fmtPrice(f.total_ht)}</td>
                    <td style={{ textAlign:"right", fontFamily:"monospace", color:"var(--text3)" }}>{fmtPrice(f.tva)}</td>
                    <td style={{ textAlign:"right", fontFamily:"monospace", fontWeight:700, color:"var(--accent)" }}>{fmtPrice(f.total_ttc)}</td>
                    <td onClick={e => e.stopPropagation()}><FactureBadge statut={f.statut} /></td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{fmtDate(f.date_creation)}</td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{fmtDate(f.date_reception)}</td>
                    <td style={{ fontSize:12, fontWeight:600, color:isOverdue?"var(--danger)":"var(--text3)" }}>
                      {fmtDate(f.date_echeance)}
                      {isOverdue && <div style={{ fontSize:10, color:"var(--danger)", fontWeight:700, fontFamily:"'Sora',sans-serif" }}>⚠ Échue</div>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button className="f-icon-btn f-icon-btn-teal" onClick={() => setDetailId(f.id)} title="Détail"><Icon d={I.eye} size={13} /></button>
                        {f.statut === "brouillon" && <button className="f-btn f-btn-blue    f-btn-sm" onClick={() => handleAction(f.id,"recevoir")} disabled={saving}><Icon d={I.inbox} size={12} /></button>}
                        {f.statut === "reçue"     && <button className="f-btn f-btn-success f-btn-sm" onClick={() => handleAction(f.id,"payer")}    disabled={saving}><Icon d={I.check} size={12} /></button>}
                        {f.statut !== "payée" && f.statut !== "annulée" && <button className="f-btn f-btn-danger f-btn-sm" onClick={() => handleAction(f.id,"annuler")} disabled={saving}><Icon d={I.ban} size={12} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detailId !== null && <FactureDetailModal factureId={detailId} onClose={() => setDetailId(null)} onAction={handleAction} saving={saving} />}
    </>
  );
};

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
const OrdersPage = ({ commandes, onRefresh, showToast }) => {
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState("");
  const [detailCmd, setDetailCmd] = useState(null);
  const [acceptCmd, setAcceptCmd] = useState(null);
  const [refuseCmd, setRefuseCmd] = useState(null);
  const [saving, setSaving]       = useState(false);

  const filtered = commandes.filter(c => {
    const q = search.toLowerCase();
    return (!q || String(c.id).includes(q) || String(c.num_ordre).includes(q)) && (!statusF || c.statut === statusF);
  });

  const doAccept = async date_livraison => {
    setSaving(true);
    try { await API.post(`/commandes-achat/${acceptCmd.id}/valider`, { date_livraison }); showToast("Commande acceptée ✓","success"); setAcceptCmd(null); setDetailCmd(null); onRefresh(); }
    catch (err) { showToast(err.response?.data?.message||"Erreur.","error"); }
    finally { setSaving(false); }
  };

  const doRefuse = async () => {
    setSaving(true);
    try { await API.post(`/commandes-achat/${refuseCmd.id}/cancel`); showToast("Commande refusée.","success"); setRefuseCmd(null); setDetailCmd(null); onRefresh(); }
    catch (err) { showToast(err.response?.data?.message||"Erreur.","error"); }
    finally { setSaving(false); }
  };

  const canAct = c => ["en attente","envoyée","brouillon"].includes(c.statut);

  return (
    <>
      <div className="f-sec-hdr">
        <span className="f-sec-title">Mes commandes <span style={{ fontSize:12, fontWeight:500, color:"var(--text3)" }}>({filtered.length})</span></span>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <select className="f-filter-sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">Tous statuts</option>
            {Object.entries(STATUT_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="f-search" style={{ width:240 }}>
            <Icon d={I.search} size={14} />
            <input placeholder="N° commande, ordre…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="f-icon-btn f-icon-btn-teal" onClick={onRefresh} title="Actualiser"><Icon d={I.refresh} size={15} /></button>
        </div>
      </div>

      <div className="f-tbl-wrap">
        <table className="f-tbl">
          <thead><tr><th>N°</th><th>N° Ordre</th><th>Type</th><th>Total HT</th><th>Statut</th><th>Création</th><th>Acceptation</th><th>Livraison</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="f-empty"><Icon d={I.orders} size={36} /><p>Aucune commande</p></div></td></tr>
              : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700, color:"var(--accent)", fontFamily:"'Sora',sans-serif" }}>#{c.id}</td>
                  <td style={{ color:"var(--text2)" }}>{c.num_ordre}</td>
                  <td><span style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, fontFamily:"'Sora',sans-serif", color:"var(--text2)" }}>{c.type_en}</span></td>
                  <td style={{ fontWeight:700, color:"var(--accent)", fontFamily:"monospace" }}>{fmtPrice(c.total_ht)}</td>
                  <td><StatutBadge statut={c.statut} /></td>
                  <td style={{ color:"var(--text3)", fontSize:12 }}>{fmtDate(c.date_creation)}</td>
                  <td style={{ color:"var(--text3)", fontSize:12 }}>{c.date_acceptation ? fmtDate(c.date_acceptation) : "—"}</td>
                  <td style={{ fontSize:12, fontWeight:600, color:c.date_livraison?"var(--accent)":"var(--text3)" }}>{c.date_livraison ? fmtDate(c.date_livraison) : "—"}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="f-icon-btn f-icon-btn-teal" onClick={() => setDetailCmd(c)} title="Détail"><Icon d={I.eye} size={13} /></button>
                      {canAct(c) && <>
                        <button className="f-btn f-btn-success f-btn-sm" onClick={() => setAcceptCmd(c)}><Icon d={I.check} size={12} /></button>
                        <button className="f-btn f-btn-danger  f-btn-sm" onClick={() => setRefuseCmd(c)}><Icon d={I.ban}   size={12} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {detailCmd && <OrderDetailModal commande={detailCmd} onClose={() => setDetailCmd(null)} onAccept={() => { setAcceptCmd(detailCmd); setDetailCmd(null); }} onRefuse={() => { setRefuseCmd(detailCmd); setDetailCmd(null); }} saving={saving} />}
      {acceptCmd && <AcceptModal commande={acceptCmd} onClose={() => setAcceptCmd(null)} onConfirm={doAccept} saving={saving} />}
      {refuseCmd && (
        <div className="f-overlay" onClick={e => e.target === e.currentTarget && setRefuseCmd(null)}>
          <div className="f-modal">
            <div className="f-confirm">
              <div className="f-confirm-icon danger"><Icon d={I.ban} size={22} /></div>
              <h3>Refuser la commande ?</h3>
              <p>La commande <strong>#{refuseCmd.id}</strong> sera refusée.<br /><span style={{ color:"var(--danger)" }}>Action irréversible.</span></p>
              <div className="f-confirm-btns">
                <button className="f-btn f-btn-ghost" onClick={() => setRefuseCmd(null)} disabled={saving}>Annuler</button>
                <button className="f-btn f-btn-danger" onClick={doRefuse} disabled={saving}>
                  {saving ? <><span className="f-spinner" /> …</> : <><Icon d={I.ban} size={13} /> Confirmer le refus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── PRODUCTS PAGE ────────────────────────────────────────────────────────────
const ProductsPage = ({ user, showToast }) => {
  const [produits, setProduits] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try { const r = await API.get(`/produits-fournisseur/fournisseur/${user.id}`); setProduits(unwrap(r.data)); }
    catch { showToast("Erreur chargement produits.", "error"); }
    finally { setLoading(false); }
  }, [user.id, showToast]);

  useEffect(() => { fetchProduits(); }, [fetchProduits]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await API.delete(`/produits-fournisseur/${toDelete.id}`); showToast("Produit supprimé.", "success"); setToDelete(null); fetchProduits(); }
    catch (err) { showToast(err.response?.data?.message || "Erreur.", "error"); }
    finally { setDeleting(false); }
  };

  const filtered = produits.filter(p => !search || p.nom_produit_f?.toLowerCase().includes(search.toLowerCase()) || p.categorie?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="f-sec-hdr">
        <span className="f-sec-title">Mes produits <span style={{ fontSize:12, fontWeight:500, color:"var(--text3)" }}>({filtered.length})</span></span>
        <div style={{ display:"flex", gap:8 }}>
          <div className="f-search" style={{ width:240 }}>
            <Icon d={I.search} size={14} /><input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="f-icon-btn f-icon-btn-teal" onClick={fetchProduits}><Icon d={I.refresh} size={15} /></button>
          <button className="f-btn f-btn-primary" onClick={() => setModal({})}><Icon d={I.plus} size={14} /> Nouveau produit</button>
        </div>
      </div>

      {loading
        ? <div className="f-empty"><span className="f-spinner-dark" style={{ width:28, height:28, borderWidth:3 }} /></div>
        : filtered.length === 0
          ? <div className="f-empty"><Icon d={I.product} size={38} /><p>Aucun produit</p></div>
          : (
            <div className="f-prod-grid">
              {filtered.map(p => (
                <div className="f-prod-card" key={p.id}>
                  <div className="f-prod-img">{p.images?.[0]?.image_url ? <SafeImg src={p.images[0].image_url} size={32} /> : <Icon d={I.image} size={32} />}</div>
                  <div className="f-prod-body">
                    <div className="f-prod-name" title={p.nom_produit_f}>{p.nom_produit_f}</div>
                    {p.categorie && <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}><Icon d={I.tag} size={11} /> {p.categorie}</div>}
                    <div className="f-prod-price">{fmtPrice(p.prix_unitaire_ht)} <span style={{ fontSize:11, color:"var(--text3)", fontFamily:"'Nunito',sans-serif", fontWeight:400 }}>HT</span></div>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                      {p.taux_tva   > 0 && <span className="f-badge f-badge-gray">TVA {p.taux_tva}%</span>}
                      {p.taux_fodec > 0 && <span className="f-badge f-badge-gray">FODEC {p.taux_fodec}%</span>}
                      {p.taux_dc    > 0 && <span className="f-badge f-badge-gray">DC {p.taux_dc}%</span>}
                    </div>
                    <div className="f-prod-actions">
                      <button className="f-btn f-btn-ghost f-btn-sm" style={{ flex:1 }} onClick={() => setModal(p)}><Icon d={I.edit} size={12} /> Modifier</button>
                      <button className="f-icon-btn f-icon-btn-red" onClick={() => setToDelete(p)}><Icon d={I.close} size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {modal !== null && <ProductFormModal product={Object.keys(modal).length ? modal : null} fournisseurId={user.id} onClose={() => setModal(null)} onSaved={fetchProduits} showToast={showToast} />}
      {toDelete && (
        <div className="f-overlay" onClick={e => e.target === e.currentTarget && setToDelete(null)}>
          <div className="f-modal">
            <div className="f-confirm">
              <div className="f-confirm-icon danger"><Icon d={I.close} size={22} /></div>
              <h3>Supprimer le produit ?</h3>
              <p><strong>{toDelete.nom_produit_f}</strong> sera supprimé définitivement.</p>
              <div className="f-confirm-btns">
                <button className="f-btn f-btn-ghost" onClick={() => setToDelete(null)} disabled={deleting}>Annuler</button>
                <button className="f-btn f-btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Suppression…" : "Supprimer"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
const ProfilePage = ({ user, showToast, onUserUpdate }) => {
  // ── Personal info ──
  const [form,   setForm]   = useState({ nom:user.nom||"", prenom:user.prenom||"", email:user.email||"", num_tlp:user.num_tlp||"" });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) { showToast("Nom, prénom et email requis.", "error"); return; }
    setSaving(true);
    try { await API.put(`/users/${user.id}`, form); showToast("Profil mis à jour.", "success"); onUserUpdate(form); }
    catch (err) { showToast(err.response?.data?.message || "Erreur.", "error"); }
    finally { setSaving(false); }
  };

  // ── Change password ──
  const [pwForm,      setPwForm]      = useState({ ancien:"", nouveau:"", confirm:"" });
  const [pwSaving,    setPwSaving]    = useState(false);
  const [showAncien,  setShowAncien]  = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwStrength,  setPwStrength]  = useState(0);
  const setPw = k => e => {
    const val = e.target.value;
    setPwForm(f => ({ ...f, [k]: val }));
    if (k === "nouveau") {
      let score = 0;
      if (val.length >= 8)                     score++;
      if (/[A-Z]/.test(val))                   score++;
      if (/[0-9]/.test(val))                   score++;
      if (/[@$!%*?&]/.test(val))               score++;
      setPwStrength(score);
    }
  };

  const handleChangePw = async () => {
    if (!pwForm.ancien)                            { showToast("Mot de passe actuel requis.", "error"); return; }
    if (pwForm.nouveau.length < 8)                 { showToast("Le nouveau mot de passe doit faire au moins 8 caractères.", "error"); return; }
    if (pwForm.nouveau !== pwForm.confirm)          { showToast("Les mots de passe ne correspondent pas.", "error"); return; }
    setPwSaving(true);
    try {
      await API.put("/auth/change-password", { currentPassword: pwForm.ancien, newPassword: pwForm.nouveau });
      showToast("Mot de passe modifié avec succès.", "success");
      setPwForm({ ancien:"", nouveau:"", confirm:"" });
      setPwStrength(0);
    }
    catch (err) { showToast(err.response?.data?.message || "Mot de passe actuel incorrect.", "error"); }
    finally { setPwSaving(false); }
  };

  const strengthLabels = ["", "Faible", "Moyen", "Bon", "Fort ✓"];
  const strengthColors = ["", "var(--danger)", "var(--warning)", "var(--blue)", "var(--accent)"];

  const PwInput = ({ field, value, show, onToggle, placeholder }) => (
    <div style={{ position:"relative" }}>
      <input
        className="f-form-input"
        type={show ? "text" : "password"}
        value={value}
        onChange={setPw(field)}
        placeholder={placeholder}
        style={{ paddingRight:42 }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text3)", display:"grid", placeItems:"center", padding:0, transition:"color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
      >
        <Icon d={show ? I.eyeOff : I.eye} size={15} />
      </button>
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start", maxWidth:900 }}>

      {/* ── Card 1: Personal info ── */}
      <div className="f-profile-card" style={{ margin:0 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>
          <div className="f-profile-avatar" style={{ marginBottom:0 }}>{user.prenom?.[0] || "F"}</div>
          <div>
            <div className="f-profile-name" style={{ marginBottom:4 }}>{user.prenom} {user.nom}</div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <span className="f-badge f-badge-teal">Fournisseur</span>
              {user.nom_societe && <span style={{ fontSize:12, color:"var(--text3)" }}>{user.nom_societe}</span>}
            </div>
          </div>
        </div>

        {/* Company info */}
        {(user.nom_societe || user.secteur_activite) && (
          <div className="f-info-section">
            <div className="f-info-section-title"><Icon d={I.building} size={12} /> Informations société</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[["Société", user.nom_societe],["Matricule fiscal", user.matricule_fiscal],["Secteur", user.secteur_activite],["Adresse", user.adresse_siege]].filter(([,v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:10, color:"var(--text3)", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:3, fontFamily:"'Sora',sans-serif" }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--text)" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal fields */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14, fontFamily:"'Sora',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
            <Icon d={I.profile} size={12} /> Informations personnelles
          </div>
          <div className="f-form-row">
            <div className="f-form-group"><label className="f-form-label">Prénom *</label><input className="f-form-input" value={form.prenom} onChange={set("prenom")} /></div>
            <div className="f-form-group"><label className="f-form-label">Nom *</label><input className="f-form-input" value={form.nom} onChange={set("nom")} /></div>
          </div>
          <div className="f-form-group"><label className="f-form-label">Email *</label><input className="f-form-input" type="email" value={form.email} onChange={set("email")} /></div>
          <div className="f-form-group"><label className="f-form-label">Téléphone</label><input className="f-form-input" value={form.num_tlp} onChange={set("num_tlp")} placeholder="+216 XX XXX XXX" /></div>
        </div>

        <button className="f-btn f-btn-primary" onClick={handleSave} disabled={saving} style={{ width:"100%" }}>
          {saving ? <><span className="f-spinner" /> Enregistrement…</> : <><Icon d={I.save} size={14} /> Sauvegarder le profil</>}
        </button>
      </div>

      {/* ── Card 2: Change password ── */}
      <div className="f-profile-card" style={{ margin:0 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:22, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:"var(--violet-l)", border:"1px solid rgba(155,135,245,0.25)",
            display:"grid", placeItems:"center", color:"var(--violet)",
          }}>
            <Icon d={I.lock} size={18} />
          </div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:"var(--text)", letterSpacing:"-0.01em" }}>
              Modifier le mot de passe
            </div>
            <div style={{ fontSize:12, color:"var(--text3)", marginTop:3 }}>
              Choisissez un mot de passe fort et unique
            </div>
          </div>
        </div>

        {/* Security tip */}
        <div style={{
          background:"var(--accent-d)", border:"1px solid var(--accent-b)",
          borderRadius:"var(--r)", padding:"10px 14px", marginBottom:20,
          display:"flex", alignItems:"flex-start", gap:9, fontSize:12, color:"var(--accent)",
        }}>
          <Icon d={I.shield2} size={14} />
          <span>Requis : 8 caractères min, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).</span>
        </div>

        {/* Fields */}
        <div className="f-form-group">
          <label className="f-form-label">Mot de passe actuel *</label>
          <PwInput field="ancien" value={pwForm.ancien} show={showAncien} onToggle={() => setShowAncien(v => !v)} placeholder="Votre mot de passe actuel" />
        </div>

        <div className="f-form-group">
          <label className="f-form-label">Nouveau mot de passe *</label>
          <PwInput field="nouveau" value={pwForm.nouveau} show={showNouveau} onToggle={() => setShowNouveau(v => !v)} placeholder="Minimum 8 caractères" />
          {/* Strength meter */}
          {pwForm.nouveau.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex:1, height:3, borderRadius:99,
                    background: i <= pwStrength ? strengthColors[pwStrength] : "var(--border2)",
                    transition:"background 0.25s",
                  }} />
                ))}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color: strengthColors[pwStrength], fontFamily:"'Sora',sans-serif" }}>
                {strengthLabels[pwStrength]}
              </div>
            </div>
          )}
        </div>

        <div className="f-form-group" style={{ marginBottom:24 }}>
          <label className="f-form-label">Confirmer le nouveau mot de passe *</label>
          <PwInput field="confirm" value={pwForm.confirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Répétez le mot de passe" />
          {pwForm.confirm.length > 0 && pwForm.nouveau !== pwForm.confirm && (
            <div style={{ fontSize:11.5, color:"var(--danger)", fontWeight:700, marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
              <Icon d={I.close} size={11} /> Les mots de passe ne correspondent pas
            </div>
          )}
          {pwForm.confirm.length > 0 && pwForm.nouveau === pwForm.confirm && pwStrength === 4 && (
            <div style={{ fontSize:11.5, color:"var(--accent)", fontWeight:700, marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
              <Icon d={I.check} size={11} /> Les mots de passe correspondent
            </div>
          )}
          {pwForm.confirm.length > 0 && pwForm.nouveau === pwForm.confirm && pwStrength < 4 && (
            <div style={{ fontSize:11.5, color:"var(--warning)", fontWeight:700, marginTop:5, display:"flex", alignItems:"center", gap:5 }}>
              <Icon d={I.alert} size={11} /> Mot de passe trop faible (majuscule, chiffre et @$!%*?& requis)
            </div>
          )}
        </div>

        <button
          className="f-btn f-btn-primary"
          onClick={handleChangePw}
          disabled={pwSaving || !pwForm.ancien || !pwForm.nouveau || pwForm.nouveau !== pwForm.confirm || pwStrength < 4}
          style={{ width:"100%" }}
        >
          {pwSaving
            ? <><span className="f-spinner" /> Modification…</>
            : <><Icon d={I.key} size={14} /> Modifier le mot de passe</>}
        </button>
      </div>

    </div>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ commandes, user }) => {
  const enAttente = commandes.filter(c => ["en attente","envoyée"].includes(c.statut)).length;
  const acceptees = commandes.filter(c => c.statut === "acceptée").length;
  const caTotal   = commandes.filter(c => c.statut === "acceptée").reduce((s, c) => s + parseFloat(c.total_ht||0), 0);
  const recent    = [...commandes].sort((a,b) => new Date(b.date_creation) - new Date(a.date_creation)).slice(0,6);

  return (
    <>
      <div className="f-stats">
        {[
          { label:"Total commandes", val:commandes.length, color:"teal",   sub:"reçues",       icon:I.orders  },
          { label:"En attente",      val:enAttente,         color:"orange", sub:"à traiter",    icon:I.alert   },
          { label:"Acceptées",       val:acceptees,         color:"green",  sub:"confirmées",   icon:I.check   },
          { label:"Valeur acceptée", val:`${caTotal.toFixed(0)} DT`, color:"blue", sub:"HT total", icon:I.coin },
        ].map(s => (
          <div className={`f-stat ${s.color}`} key={s.label}>
            <div className="f-stat-icon"><Icon d={s.icon} size={16} /></div>
            <div className="f-stat-label">{s.label}</div>
            <div className="f-stat-val">{s.val}</div>
            <div className="f-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Welcome banner */}
      <div style={{
        background:"linear-gradient(135deg,rgba(0,229,168,0.07) 0%,rgba(0,153,112,0.12) 100%)",
        border:"1px solid rgba(0,229,168,0.18)", borderRadius:"var(--r-xl)",
        padding:"22px 26px", marginBottom:22,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", right:-30, top:-30, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,168,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:19, marginBottom:5, color:"var(--text)", letterSpacing:"-0.02em" }}>
            Bonjour, <span style={{ color:"var(--accent)" }}>{user.prenom}</span> 👋
          </div>
          <div style={{ fontSize:13, color:"var(--text2)" }}>
            {enAttente > 0
              ? <span>Vous avez <strong style={{ color:"var(--warning)", fontWeight:800 }}>{enAttente}</strong> commande(s) en attente de traitement.</span>
              : <span style={{ color:"var(--accent)", fontWeight:600 }}>✓ Aucune commande en attente pour l'instant.</span>}
          </div>
        </div>
        <div style={{ width:52, height:52, borderRadius:14, background:"var(--accent-d)", border:"1px solid var(--accent-b)", display:"grid", placeItems:"center", color:"var(--accent)", flexShrink:0 }}>
          <Icon d={I.truck} size={24} />
        </div>
      </div>

      <div className="f-sec-hdr"><span className="f-sec-title">Commandes récentes</span></div>
      <div className="f-tbl-wrap">
        <table className="f-tbl">
          <thead><tr><th>N°</th><th>N° Ordre</th><th>Total HT</th><th>Statut</th><th>Création</th><th>Livraison</th></tr></thead>
          <tbody>
            {recent.length === 0
              ? <tr><td colSpan={6}><div className="f-empty"><p>Aucune commande</p></div></td></tr>
              : recent.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700, color:"var(--accent)", fontFamily:"'Sora',sans-serif" }}>#{c.id}</td>
                  <td style={{ color:"var(--text2)" }}>{c.num_ordre}</td>
                  <td style={{ fontWeight:700, color:"var(--accent)", fontFamily:"monospace" }}>{fmtPrice(c.total_ht)}</td>
                  <td><StatutBadge statut={c.statut} /></td>
                  <td style={{ color:"var(--text3)", fontSize:12 }}>{fmtDate(c.date_creation)}</td>
                  <td style={{ fontSize:12, fontWeight:600, color:c.date_livraison?"var(--accent)":"var(--text3)" }}>{c.date_livraison ? fmtDate(c.date_livraison) : "—"}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"home",     label:"Vue d'ensemble", icon:I.home    },
  { id:"orders",   label:"Mes commandes",  icon:I.orders  },
  { id:"invoices", label:"Mes factures",   icon:I.invoice },
  { id:"products", label:"Mes produits",   icon:I.product },
  { id:"profile",  label:"Mon profil",     icon:I.profile },
];

const PAGE_TITLES = {
  home:     "Vue d'ensemble",
  orders:   "Mes commandes",
  invoices: "Mes factures d'achat",
  products: "Mes produits",
  profile:  "Mon profil",
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const DashboardFournisseur = () => {
  const [page,      setPage]      = useState("home");
  const [commandes, setCommandes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [user,      setUser]      = useState(() =>
    JSON.parse(localStorage.getItem("user") || '{"prenom":"Fournisseur","role":"FOURNISSEUR"}')
  );

  const showToast = useCallback((msg, type="success") => setToast({ msg, type }), []);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try { const r = await API.get("/commandes-achat/mes-commandes"); setCommandes(unwrap(r.data)); }
    catch { showToast("Erreur chargement commandes.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchCommandes(); }, [fetchCommandes]);

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; };
  const enAttente = commandes.filter(c => ["en attente","envoyée"].includes(c.statut)).length;
  const initials  = `${user.prenom?.[0]||"F"}`.toUpperCase();

  return (
    <>
      <style>{DS}</style>
      <div className="f-dash">

        {/* ── Sidebar ── */}
        <aside className="f-sidebar">
          <div className="f-brand">
            <div className="f-brand-logo">F</div>
            <div>
              <div className="f-brand-name">Business ERP</div>
              <div className="f-brand-role">Espace Fournisseur</div>
            </div>
          </div>

          <nav className="f-nav">
            <span className="f-nav-label">Navigation</span>
            {NAV.map(n => (
              <button key={n.id} className={`f-nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <Icon d={n.icon} size={17} />
                {n.label}
                {n.id === "orders" && enAttente > 0 && <span className="f-nav-badge">{enAttente}</span>}
              </button>
            ))}
          </nav>

          <div className="f-sidebar-footer">
            <div className="f-user-card">
              <div className="f-avatar">{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="f-user-name">{user.prenom} {user.nom}</div>
                <div className="f-user-role">{user.nom_societe || "Fournisseur"}</div>
              </div>
            </div>
            <button className="f-nav-item" onClick={handleLogout} style={{ color:"var(--danger)" }}>
              <Icon d={I.logout} size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="f-main">
          <header className="f-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, color:"var(--text3)" }}>Business ERP</span>
              <span style={{ color:"var(--border2)" }}>›</span>
              <span className="f-topbar-title">{PAGE_TITLES[page]}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {loading && page !== "invoices" && <span className="f-spinner-dark" style={{ width:18, height:18, borderWidth:2.5 }} />}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r)" }}>
                <div className="f-avatar" style={{ width:26, height:26, fontSize:11, borderRadius:7 }}>{initials}</div>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--text2)" }}>{user.prenom}</span>
              </div>
            </div>
          </header>

          <main className="f-content">
            {page === "home"     && <HomePage commandes={commandes} user={user} />}
            {page === "orders"   && <OrdersPage commandes={commandes} onRefresh={fetchCommandes} showToast={showToast} />}
            {page === "invoices" && <FacturesAchatPage showToast={showToast} />}
            {page === "products" && <ProductsPage user={user} showToast={showToast} />}
            {page === "profile"  && <ProfilePage user={user} showToast={showToast} onUserUpdate={updated => { const next={...user,...updated}; setUser(next); localStorage.setItem("user", JSON.stringify(next)); }} />}
          </main>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
};

export default DashboardFournisseur;