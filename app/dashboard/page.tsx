"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const BG     = "#030712";
const CARD   = "rgba(11,15,25,0.8)";
const BORDER = "rgba(31,41,61,0.6)";
const CYAN   = "#00FFD1";
const AMBER  = "#ffb800";
const PURPLE = "#7c6af7";
const WHITE  = "#f3f4f6";
const MUTED  = "#6b7280";
const DIMMED = "#374151";
const RED    = "#f87171";

interface Cycle {
  cycle: number;
  timestamp: string;
  status: string;
  compute?: { output?: string; model?: string; latencyMs?: number; inputTok?: number; outputTok?: number; error?: string };
  wallet?: { address: string; balance: string };
  chain?: { txHash?: string; blockNumber?: number; error?: string };
  storageHash?: string;
  contentHash?: string;
  human_authorized: boolean;
}

interface Stats {
  completedCycles: number;
  failedCycles: number;
  anchoredOnChain: number;
  totalTokens: number;
  avgLatencyMs: number;
  wallet?: { address: string; balance: string; txCount: number; blockNumber: number; explorerUrl: string };
  lastCycle?: Cycle;
}

function pad(n: number) { return n < 10 ? "0"+n : ""+n; }
function fmtDate(ts: string) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

const statusColor = (s: string) => s === "complete" ? CYAN : s === "compute_failed" ? RED : AMBER;
const statusLabel = (s: string) => s === "complete" ? "VERIFIED" : s === "compute_failed" ? "FAILED" : "PENDING";

function Row({ label, value, color = WHITE }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${BORDER}` }}>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: MUTED }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Panel({ title, children, glow }: { title: string; children: React.ReactNode; glow?: string }) {
  return (
    <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", backdropFilter: "blur(40px)", boxShadow: glow ? `0 0 0 0.5px ${glow}15 inset, 0 16px 32px rgba(0,0,0,0.5)` : "0 16px 32px rgba(0,0,0,0.4)" }}>
      <div style={{ padding: "12px 20px", background: "rgba(11,15,25,0.6)", borderBottom: `0.5px solid ${BORDER}` }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [cycles, setCycles]     = useState<Cycle[]>([]);
  const [selected, setSelected] = useState<Cycle | null>(null);
  const [alive, setAlive]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [nextRun, setNextRun]   = useState("");

  const storageHash = stats?.lastCycle?.storageHash
    || "0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a";

  async function refresh() {
    try {
      const [sRes, cRes, hRes] = await Promise.all([
        fetch("/api/stats",  { signal: AbortSignal.timeout(5000) }),
        fetch("/api/cycles", { signal: AbortSignal.timeout(5000) }),
        fetch("/api/health", { signal: AbortSignal.timeout(5000) }),
      ]);
      if (sRes.ok) { const j = await sRes.json(); if (j.ok) setStats(j.data); }
      if (cRes.ok) { const j = await cRes.json(); if (j.ok) setCycles(j.cycles || []); }
      if (hRes.ok) { const j = await hRes.json(); if (j.ok) setAlive(j.agentAlive); }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { refresh(); const iv = setInterval(refresh, 15000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const d = new Date();
      const m = 5 - (d.getMinutes() % 6);
      const s = 59 - d.getSeconds();
      setNextRun(`${m}m ${pad(s)}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const topMetrics = [
    { label: "Total Cycles",   sub: "TEE verified",    val: loading ? "—" : stats?.completedCycles ?? 0,                color: CYAN   },
    { label: "Agent Balance",  sub: "0G tokens",       val: loading ? "—" : stats?.wallet?.balance ?? "0",              color: WHITE  },
    { label: "Chain Anchors",  sub: "On 0G Chain",     val: loading ? "—" : stats?.anchoredOnChain ?? 0,                color: AMBER  },
    { label: "Tokens Used",    sub: "Total inference", val: loading ? "—" : (stats?.totalTokens ?? 0).toLocaleString(), color: PURPLE },
    { label: "Admin Keys",     sub: "No owner exists", val: "0",                                                        color: CYAN   },
    { label: "Next Cycle",     sub: "Auto trigger",    val: nextRun || "—",                                             color: WHITE  },
  ];

  return (
    <div style={{ background: BG, color: WHITE, fontFamily: "-apple-system,'SF Pro Display',Inter,'Helvetica Neue',sans-serif", WebkitFontSmoothing: "antialiased", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* TOP BAR */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: `${BG}ee`, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderBottom: `0.5px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${BORDER}` }}>
              <img src="/logo2.png" alt="Ghost" style={{ width: 34, height: 34, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
            </div>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: WHITE }}>GHOST</span>
          </a>
          <div style={{ width: 1, height: 16, background: BORDER }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Live Agent Monitor</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Network badge */}
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.1em" }}>NETWORK: 0G_TESTNET</span>
          <div style={{ width: 1, height: 14, background: BORDER }} />
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.1em", padding: "7px 14px", borderRadius: 8, background: alive ? `${CYAN}0c` : `${RED}0c`, border: `0.5px solid ${alive ? CYAN : RED}30`, color: alive ? CYAN : RED }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: alive ? CYAN : RED, display: "inline-block", animation: alive ? "pulse 2s infinite" : "none", boxShadow: alive ? `0 0 8px ${CYAN}` : "none" }} />
            ENCLAVE: {alive ? "ACTIVE" : "OFFLINE"}
          </div>
          <a href="/" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, textDecoration: "none", padding: "7px 14px", border: `0.5px solid ${BORDER}`, borderRadius: 8, letterSpacing: "0.08em" }}>← Site</a>
        </div>
      </header>

      <div style={{ paddingTop: 60, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOP METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", background: BORDER, borderBottom: `0.5px solid ${BORDER}` }} className="metrics-strip">
          {topMetrics.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ background: "rgba(11,15,25,0.95)", padding: "22px 20px", textAlign: "center", borderRight: i < 5 ? `0.5px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(18px,2.2vw,28px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: m.color, marginBottom: 5 }}>{m.val}</div>
              <div style={{ fontSize: 9.5, color: DIMMED }}>{m.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>

          {/* LEFT: CYCLE LIST */}
          <div style={{ background: `${BG}`, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${BORDER}` }}>
            <div style={{ padding: "12px 24px", background: "rgba(11,15,25,0.6)", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Inference Cycles · 0G Compute Router</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: CYAN, padding: "3px 10px", borderRadius: 5, background: `${CYAN}0c`, border: `0.5px solid ${CYAN}30` }}>{cycles.length} total</span>
                <a href={`https://storagescan.0g.ai/tx?hash=${storageHash}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: PURPLE, padding: "3px 10px", borderRadius: 5, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, textDecoration: "none" }}>StorageScan →</a>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && (
                <div style={{ padding: "72px 24px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED }}>
                  Connecting to agent...
                </div>
              )}
              {!loading && cycles.length === 0 && (
                <div style={{ padding: "72px 24px", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 14, background: "rgba(11,15,25,0.8)", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${BORDER}` }}>
                    <img src="/logo2.png" alt="Ghost" style={{ width: 60, height: 60, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
                  </div>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: MUTED, lineHeight: 2, margin: "0 0 8px" }}>No cycles yet.</p>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: DIMMED, margin: "0 0 28px" }}>node agent/index.js</p>
                  <div style={{ padding: "18px 20px", borderRadius: 12, background: `${PURPLE}08`, border: `0.5px solid ${PURPLE}25`, textAlign: "left" }}>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 10 }}>0G Storage · Verified</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, lineHeight: 1.8 }}>
                      Root hash:<br />
                      <span style={{ color: PURPLE, wordBreak: "break-all" as const, fontSize: 9 }}>{storageHash}</span>
                    </div>
                    <a href={`https://storagescan.0g.ai/tx?hash=${storageHash}`} target="_blank" style={{ display: "inline-block", marginTop: 12, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>View on StorageScan →</a>
                  </div>
                </div>
              )}

              {cycles.map((c, i) => (
                <motion.div key={c.cycle} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  onClick={() => setSelected(selected?.cycle === c.cycle ? null : c)}
                  style={{ padding: "16px 24px", borderBottom: `0.5px solid ${BORDER}`, cursor: "pointer", background: selected?.cycle === c.cycle ? `${CYAN}04` : "transparent", borderLeft: selected?.cycle === c.cycle ? `2px solid ${CYAN}` : "2px solid transparent", display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 14, alignItems: "start", transition: "background 0.12s" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: DIMMED, paddingTop: 1 }}>#{c.cycle}</span>
                  <div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: WHITE, marginBottom: 5 }}>{c.compute?.model || "0G Compute Router"} · {fmtDate(c.timestamp)}</div>
                    {c.compute?.output && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.compute.output}</div>}
                    {c.compute?.error && <div style={{ fontSize: 12, color: RED, lineHeight: 1.6 }}>{c.compute.error}</div>}
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: DIMMED, marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {c.compute?.latencyMs && <span style={{ color: CYAN }}>{c.compute.latencyMs}ms</span>}
                      {c.storageHash    && <span style={{ color: PURPLE }}>storage: {c.storageHash.slice(0,10)}...</span>}
                      {c.chain?.txHash  && <span style={{ color: AMBER }}>tx: {c.chain.txHash.slice(0,10)}...</span>}
                      <span>{timeAgo(c.timestamp)}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: `${statusColor(c.status)}12`, color: statusColor(c.status), border: `0.5px solid ${statusColor(c.status)}28`, flexShrink: 0, letterSpacing: "0.06em" }}>{statusLabel(c.status)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ background: "rgba(7,8,10,0.98)", borderLeft: `0.5px solid ${BORDER}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* WALLET */}
            <div style={{ padding: "20px", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED, display: "block", marginBottom: 14 }}>Agent Wallet · 0G Chain</span>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 36, fontWeight: 700, color: CYAN, lineHeight: 1, marginBottom: 3, letterSpacing: "-0.03em" }}>{stats?.wallet?.balance ?? "—"}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: CYAN, opacity: 0.55, marginBottom: 14, letterSpacing: "0.12em" }}>0G TOKENS</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: DIMMED, wordBreak: "break-all", lineHeight: 1.7, marginBottom: 12 }}>{stats?.wallet?.address ?? "Loading..."}</div>
              {stats?.wallet?.explorerUrl && <a href={stats.wallet.explorerUrl} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, textDecoration: "none", fontWeight: 600, opacity: 0.8 }}>View on 0G Explorer →</a>}
              <div style={{ marginTop: 16 }}>
                {[
                  ["TX Count",    stats?.wallet?.txCount ?? "—",                       CYAN],
                  ["Block",       stats?.wallet?.blockNumber?.toLocaleString() ?? "—", WHITE],
                  ["Network",     "0G Testnet",                                        WHITE],
                  ["Avg Latency", stats?.avgLatencyMs ? `${stats.avgLatencyMs}ms` : "—", AMBER],
                  ["Anchored",    stats ? `${stats.anchoredOnChain}/${stats.completedCycles}` : "—", CYAN],
                  ["Failed",      stats?.failedCycles ?? 0,                            stats?.failedCycles ? RED : MUTED],
                ].map(([k,v,c]) => <Row key={String(k)} label={String(k)} value={String(v)} color={String(c)} />)}
              </div>
            </div>

            {/* 0G STORAGE */}
            <div style={{ padding: "20px", borderBottom: `0.5px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED }}>0G Storage</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 600, color: PURPLE, padding: "3px 9px", borderRadius: 5, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}28` }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: PURPLE, display: "inline-block", animation: "pulse 2.5s infinite" }} />LIVE
                </span>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED, lineHeight: 1.75, marginBottom: 12 }}>
                Latest root hash:<br />
                <span style={{ color: PURPLE, wordBreak: "break-all", fontSize: 8.5 }}>{storageHash}</span>
              </div>
              <a href={`https://storagescan.0g.ai/tx?hash=${storageHash}`} target="_blank" style={{ display: "block", padding: "10px 14px", borderRadius: 9, background: `${PURPLE}08`, border: `0.5px solid ${PURPLE}28`, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 600, color: PURPLE, textDecoration: "none", textAlign: "center" }}>View on StorageScan →</a>
              <div style={{ marginTop: 14 }}>
                {[["Replicated","TRUE",CYAN],["Deletable","FALSE",CYAN],["Permanent","TRUE",CYAN],["Network","0G Galileo",WHITE]].map(([k,v,c]) => <Row key={k} label={k} value={v} color={c} />)}
              </div>
            </div>

            {/* CONTRACT */}
            <div style={{ padding: "20px", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED, display: "block", marginBottom: 14 }}>Contract Status</span>
              {[["Owner","NONE",CYAN],["Kill switch","NONE",CYAN],["Upgradeable","FALSE",CYAN],["Compute","0G Router",WHITE],["Human auth","FALSE",CYAN],["Admin keys","0",CYAN]].map(([k,v,c]) => <Row key={k} label={k} value={v} color={c} />)}
            </div>

            {/* CYCLE DETAIL */}
            {selected ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "20px" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: CYAN, display: "block", marginBottom: 14 }}>Cycle #{selected.cycle}</span>
                {[
                  ["Status",  statusLabel(selected.status),                                        statusColor(selected.status)],
                  ["Time",    fmtDate(selected.timestamp),                                         WHITE],
                  ["Model",   selected.compute?.model || "GLM-5-FP8",                              AMBER],
                  ["Latency", selected.compute?.latencyMs ? `${selected.compute.latencyMs}ms`:"—", WHITE],
                  ["Tokens",  `${selected.compute?.inputTok||0}in / ${selected.compute?.outputTok||0}out`, PURPLE],
                  ["Chain tx",selected.chain?.txHash ? selected.chain.txHash.slice(0,16)+"...":"—", AMBER],
                  ["Human",   "FALSE",                                                              CYAN],
                ].map(([k,v,c]) => <Row key={k} label={k} value={v} color={c} />)}

                {selected.storageHash && (
                  <div style={{ marginTop: 16 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const, display: "block", marginBottom: 8 }}>Storage Hash</span>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: PURPLE, wordBreak: "break-all", lineHeight: 1.75 }}>{selected.storageHash}</div>
                    <a href={`https://storagescan.0g.ai/tx?hash=${selected.storageHash}`} target="_blank" style={{ display: "inline-block", marginTop: 10, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>View on StorageScan →</a>
                  </div>
                )}

                {selected.compute?.output && (
                  <div style={{ marginTop: 16 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const, display: "block", marginBottom: 8 }}>Inference Output</span>
                    <div style={{ background: "#000", border: `0.5px solid ${BORDER}`, borderRadius: 9, padding: "12px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: MUTED, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflowY: "auto" }}>{selected.compute.output}</div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: DIMMED, lineHeight: 2 }}>
                Click any cycle<br />to see full detail
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${CYAN}22; color: ${CYAN}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.12); border-radius: 2px; }
        a:hover { opacity: 0.75; }
        @media (max-width: 960px) {
          .metrics-strip { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
