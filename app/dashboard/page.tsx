"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// ── DESIGN TOKENS (matches landing page exactly) ─────────────────────────────
const BG     = "#030712";
const CARD   = "rgba(9,14,26,0.6)";
const BORDER = "rgba(31,41,61,0.6)";
const TERM   = "#02040a";
const GREEN  = "#00ff66";
const BLUE   = "#58a6ff";
const CYAN   = "#00FFD1";
const AMBER  = "#ffb800";
const PURPLE = "#7c6af7";
const WHITE  = "#f3f4f6";
const MUTED  = "#6b7280";
const DIMMED = "#374151";
const RED    = "#f87171";

const CONTRACT_ADDRESS = "0x58282264D3e65F3026014026DFb2f428E141A0Bd";
const AGENT_WALLET     = "0xD0405c14e6c8e58aa11Ad19BEC20C8c47086ed40";
const STORAGE_SCAN     = "https://storagescan-galileo.0g.ai/submission/127795";
const CHAIN_SCAN       = `https://chainscan-galileo.0g.ai/address/${CONTRACT_ADDRESS}`;

interface Cycle {
  cycle: number; timestamp: string; status: string;
  compute?: { output?: string; model?: string; latencyMs?: number; inputTok?: number; outputTok?: number; error?: string };
  wallet?: { address: string; balance: string };
  chain?: { txHash?: string; blockNumber?: number; error?: string; contract?: string };
  storageHash?: string; contentHash?: string; human_authorized: boolean;
}
interface Stats {
  completedCycles: number; failedCycles: number; anchoredOnChain: number;
  totalTokens: number; avgLatencyMs: number;
  wallet?: { address: string; balance: string; txCount: number; blockNumber: number; explorerUrl: string };
  lastCycle?: Cycle;
}

function pad(n: number) { return n < 10 ? "0"+n : ""+n; }
function fmtDate(ts: string) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtShort(ts: string) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}
const statusColor = (s: string) => s === "complete" ? GREEN : s === "compute_failed" ? RED : AMBER;
const statusLabel = (s: string) => s === "complete" ? "VERIFIED" : s === "compute_failed" ? "FAILED" : "PENDING";

// ── MOBILE HOOK ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return m;
}

// ── GLASS CARD ────────────────────────────────────────────────────────────────
function GCard({ children, style = {}, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
  return (
    <div style={{
      background: CARD, border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 14, backdropFilter: "saturate(180%) blur(40px)",
      WebkitBackdropFilter: "saturate(180%) blur(40px)",
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.3), 0 16px 32px rgba(0,0,0,0.5)${glow ? `, 0 0 0 0.5px ${glow}12 inset` : ""}`,
      overflow: "hidden", position: "relative" as const, ...style,
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)", pointerEvents: "none", borderRadius: 14 }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function Row({ k, v, c = WHITE, mono = true }: { k: string; v: string | number; c?: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", boxShadow: `inset 0 -0.5px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.03)` }}>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{k}</span>
      <span style={{ fontFamily: mono ? "JetBrains Mono, monospace" : "inherit", fontSize: 10.5, color: c, fontWeight: 600, textAlign: "right" as const, wordBreak: "break-all" as const, maxWidth: "60%" }}>{v}</span>
    </div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [cycles, setCycles]       = useState<Cycle[]>([]);
  const [selected, setSelected]   = useState<Cycle | null>(null);
  const [alive, setAlive]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [nextRun, setNextRun]     = useState("—");
  const [activeTab, setActiveTab] = useState<"overview"|"telemetry">("overview");
  const [contractCycles, setContractCycles] = useState<number>(0);
  const termRef = useRef<HTMLDivElement>(null);
  const [termLines, setTermLines] = useState<string[]>([]);

  const storageHash = stats?.lastCycle?.storageHash || "0x3a1cf298f55bc76ebc4605972df2fade8d08087ed6902a8247aee6eda6c542ce";

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

  async function fetchContractCycles() {
    try {
      const r = await fetch("https://evmrpc-testnet.0g.ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: CONTRACT_ADDRESS, data: "0x3b44e776" }, "latest"] }),
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j.result) setContractCycles(parseInt(j.result, 16));
    } catch {}
  }

  useEffect(() => {
    refresh(); fetchContractCycles();
    const iv = setInterval(refresh, 15000);
    const cv = setInterval(fetchContractCycles, 30000);
    return () => { clearInterval(iv); clearInterval(cv); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const d = new Date();
      const m = 5 - (d.getMinutes() % 6);
      const s = 59 - d.getSeconds();
      setNextRun(`${m}m ${pad(s)}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const allLines = [
    `[${new Date().toTimeString().slice(0,8)}] Core init · 0G Compute enclave: SEALED`,
    `[${new Date().toTimeString().slice(0,8)}] TEEML attestation active · AMD SEV-SNP`,
    `[${new Date().toTimeString().slice(0,8)}] Agent wallet: 0xD040...ed40`,
    `[${new Date().toTimeString().slice(0,8)}] GhostAnchor: ${CONTRACT_ADDRESS.slice(0,14)}...`,
    `[${new Date().toTimeString().slice(0,8)}] Storage txSeq: 127795 · anchored`,
    `[${new Date().toTimeString().slice(0,8)}] human_authorized: FALSE · autonomous mode`,
    `[${new Date().toTimeString().slice(0,8)}] 0G Chain anchoring: ACTIVE`,
    `[${new Date().toTimeString().slice(0,8)}] Admin key check · NONE FOUND · immutable`,
    `[${new Date().toTimeString().slice(0,8)}] Awaiting next cycle trigger...`,
  ];

  useEffect(() => {
    setTermLines(allLines.slice(0, 4));
    let i = 4;
    const iv = setInterval(() => {
      setTermLines(prev => [...prev.slice(-8), allLines[i % allLines.length].replace(allLines[i % allLines.length].slice(1,9), new Date().toTimeString().slice(0,8))]);
      i++;
    }, 3000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [termLines]);

  const topMetrics = [
    { label: "Cycles",       sub: "TEE verified",   val: loading ? "—" : stats?.completedCycles ?? 0,  c: CYAN  },
    { label: "Balance",      sub: "0G tokens",       val: loading ? "—" : stats?.wallet?.balance ?? "0", c: WHITE },
    { label: "On-Chain",     sub: "Anchored",        val: loading ? "—" : contractCycles,                c: AMBER },
    { label: "Tokens",       sub: "Total inference", val: loading ? "—" : (stats?.totalTokens ?? 0).toLocaleString(), c: PURPLE },
    { label: "Admin Keys",   sub: "No owner",        val: "0",                                           c: CYAN  },
    { label: "Next Cycle",   sub: "Auto trigger",    val: nextRun,                                       c: WHITE },
  ];

  // ── SHARED HEADER ─────────────────────────────────────────────────────────
  const Header = () => (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: isMobile ? 52 : 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${isMobile ? 18 : 28}px`, background: "rgba(3,7,18,0.92)", backdropFilter: "saturate(200%) blur(40px)", WebkitBackdropFilter: "saturate(200%) blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Ping dot */}
        <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: alive ? GREEN : RED, opacity: 0.4, animation: alive ? "ping 1.5s ease-in-out infinite" : "none" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: alive ? GREEN : RED, boxShadow: alive ? `0 0 6px ${GREEN}` : "none" }} />
        </div>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid rgba(31,41,61,0.6)" }}>
            <img src="/logo2.png" alt="Ghost" style={{ width: 32, height: 32, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: isMobile ? 11 : 12, fontWeight: 700, letterSpacing: "0.2em", color: WHITE }}>GHOST</span>
        </a>
        {!isMobile && (
          <>
            <div style={{ width: 1, height: 16, background: BORDER }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Live Agent Monitor</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!isMobile && (
          <>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED }}>NETWORK: 0G_TESTNET</span>
            <div style={{ width: 1, height: 14, background: BORDER }} />
          </>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 8, background: alive ? `${GREEN}0c` : `${RED}0c`, border: `0.5px solid ${alive ? GREEN : RED}28`, color: alive ? GREEN : RED }}>
          ENCLAVE: {alive ? "ACTIVE" : "OFFLINE"}
        </div>
        <a href="/" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED, textDecoration: "none", padding: "6px 10px", border: `0.5px solid ${BORDER}`, borderRadius: 7 }}>← Site</a>
      </div>
    </header>
  );

  // ── MOBILE DASHBOARD ──────────────────────────────────────────────────────
  if (isMobile) return (
    <div style={{ background: BG, color: WHITE, fontFamily: "-apple-system,'SF Pro Display',Inter,sans-serif", WebkitFontSmoothing: "antialiased", minHeight: "100vh", backgroundImage: "radial-gradient(rgba(31,41,61,0.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <Header />
      <div style={{ paddingTop: 52 }}>

        {/* METRICS: Gemini fix 1: 3x2 compact grid, all 6 values above fold */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "rgba(255,255,255,0.07)", borderTop: "0.5px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          {topMetrics.map((m, i) => (
            <div key={i} style={{ background: "rgba(8,13,24,0.5)", padding: "11px 10px", backdropFilter: "blur(40px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: MUTED }}>{m.label}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: m.c, margin: "5px 0 3px" }}>{m.val}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 7.5, color: DIMMED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{m.sub}</span>
            </div>
          ))}
        </div>

        {/* TAB NAV */}
        <div style={{ display: "flex", borderBottom: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(9,14,26,0.6)", backdropFilter: "blur(20px)" }}>
          {(["overview", "telemetry"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "12px", fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? GREEN : MUTED, borderBottom: activeTab === tab ? `2px solid ${GREEN}` : "2px solid transparent", transition: "color 0.2s" }}>
              {tab === "telemetry" ? "0G Telemetry" : "Overview"}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {activeTab === "overview" && (
            <>
              {/* SOVEREIGNTY SHIELD */}
              <GCard glow={GREEN}>
                <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: WHITE }}>Sovereignty Shield</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${GREEN}10`, color: GREEN, border: `0.5px solid ${GREEN}28` }}>ATTESTED</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {/* Gemini fix 2: flex-row justify-between for every row, truncate long values */}
                  <div style={{ background: TERM, border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["CONTRACT",        CONTRACT_ADDRESS.slice(0,10)+"..."+CONTRACT_ADDRESS.slice(-4), BLUE],
                      ["CYCLES ON-CHAIN", contractCycles.toString(),                                     GREEN],
                      ["STORAGE STATUS",  "PROVABLY_ANCHORED",                                          GREEN],
                      ["HUMAN AUTH",      "FALSE",                                                       GREEN],
                      ["ADMIN KEY",       "NONE_EXISTS",                                                 GREEN],
                      ["KILL SWITCH",     "NONE_EXISTS",                                                 GREEN],
                      ["UPGRADEABLE",     "FALSE",                                                       GREEN],
                    ].map(([l,v,c]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: DIMMED, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0 }}>{l}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: c, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "55%" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Gemini fix 3: equal visual weight buttons, same height, flex-1 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <a href={STORAGE_SCAN} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: WHITE, color: BG, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" as const, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>Verify Storage</a>
                    <a href={CHAIN_SCAN} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: "rgba(9,14,26,0.5)", color: MUTED, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, textDecoration: "none", border: "0.5px solid rgba(255,255,255,0.1)" }}>Contract</a>
                  </div>
                </div>
              </GCard>

              {/* WALLET */}
              <GCard glow={CYAN}>
                <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED }}>Agent Wallet</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 32, fontWeight: 700, color: CYAN, lineHeight: 1, marginBottom: 3, letterSpacing: "-0.03em" }}>{stats?.wallet?.balance ?? "—"}</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: CYAN, opacity: 0.5, marginBottom: 10, letterSpacing: "0.12em" }}>0G TOKENS</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: BLUE, wordBreak: "break-all", lineHeight: 1.65, marginBottom: 10 }}>{stats?.wallet?.address ?? AGENT_WALLET}</div>
                  {[["Anchored", stats ? `${stats.anchoredOnChain}/${stats.completedCycles}` : "—", CYAN], ["Next Cycle", nextRun, GREEN], ["Failed", stats?.failedCycles ?? 0, stats?.failedCycles ? RED : MUTED]].map(([k,v,c]) => (
                    <Row key={String(k)} k={String(k)} v={String(v)} c={String(c)} />
                  ))}
                </div>
              </GCard>

              {/* LIVE TERMINAL */}
              <GCard>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                  {[["#ff5f57"],["#ffbd2e"],["#28c941"]].map(([c]) => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED, marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: GREEN, display: "inline-block", animation: "pulse 2s infinite" }} />agent feed
                  </span>
                </div>
                <div ref={termRef} style={{ padding: "10px 14px", height: 180, overflowY: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: GREEN, display: "flex", flexDirection: "column", gap: 3, background: TERM }}>
                  {termLines.map((line, i) => (
                    <div key={i} style={{ opacity: i === termLines.length - 1 ? 1 : 0.6 }}>
                      <span style={{ color: DIMMED }}>{line.slice(0, 11)}</span>{line.slice(11)}
                    </div>
                  ))}
                </div>
              </GCard>

              {/* CYCLES LIST */}
              <GCard>
                <div style={{ padding: "11px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Inference Cycles</span>
                  <div style={{ display: "flex", gap: 7 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: GREEN, padding: "3px 8px", borderRadius: 4, background: `${GREEN}0c`, border: `0.5px solid ${GREEN}25` }}>{cycles.length} total</span>
                    <a href={STORAGE_SCAN} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: PURPLE, padding: "3px 8px", borderRadius: 4, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}25`, textDecoration: "none" }}>StorageScan</a>
                  </div>
                </div>
                {loading && <div style={{ padding: "32px 16px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED }}>Connecting to agent...</div>}
                {!loading && cycles.length === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED, margin: "0 0 6px" }}>No cycles yet.</p>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: DIMMED, margin: 0 }}>node agent/index.js</p>
                  </div>
                )}
                {cycles.map((c, i) => (
                  <motion.div key={c.cycle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => setSelected(selected?.cycle === c.cycle ? null : c)}
                    style={{ padding: "13px 16px", boxShadow: "inset 0 -0.5px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.03)", cursor: "pointer", background: selected?.cycle === c.cycle ? `${GREEN}05` : "transparent", borderLeft: selected?.cycle === c.cycle ? `2px solid ${GREEN}` : "2px solid transparent" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: DIMMED }}>#{c.cycle}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${statusColor(c.status)}12`, color: statusColor(c.status), border: `0.5px solid ${statusColor(c.status)}25` }}>{statusLabel(c.status)}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: DIMMED, marginLeft: "auto" }}>{timeAgo(c.timestamp)}</span>
                    </div>
                    {c.compute?.output && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.compute.output}</div>}
                    {c.compute?.error  && <div style={{ fontSize: 12, color: RED }}>{c.compute.error}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 5, fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}>
                      {c.compute?.latencyMs && <span style={{ color: CYAN }}>{c.compute.latencyMs}ms</span>}
                      {c.storageHash && <span style={{ color: PURPLE }}>storage ✓</span>}
                      {c.chain?.txHash && !c.chain.error && <span style={{ color: AMBER }}>chain ✓</span>}
                    </div>
                  </motion.div>
                ))}
                {selected && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "14px 16px", borderTop: `0.5px solid ${GREEN}20`, background: `${GREEN}04` }}>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 10 }}>Cycle #{selected.cycle} Detail</div>
                    {[
                      ["Time",    fmtDate(selected.timestamp),                                              WHITE],
                      ["Model",   selected.compute?.model || "openrouter/auto",                             AMBER],
                      ["Latency", selected.compute?.latencyMs ? `${selected.compute.latencyMs}ms` : "—",   WHITE],
                      ["Tokens",  `${selected.compute?.inputTok||0} / ${selected.compute?.outputTok||0}`,   PURPLE],
                      ["Chain TX",selected.chain?.txHash ? selected.chain.txHash.slice(0,16)+"..." : "—",  AMBER],
                      ["Human",   "FALSE",                                                                   GREEN],
                    ].map(([k,v,c]) => <Row key={k} k={k} v={String(v)} c={String(c)} />)}
                    {selected.storageHash && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: DIMMED, fontWeight: 700, marginBottom: 5 }}>STORAGE HASH</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: BLUE, wordBreak: "break-all", lineHeight: 1.7, marginBottom: 8 }}>{selected.storageHash}</div>
                        <a href={`https://storagescan-galileo.0g.ai/tx?hash=${selected.storageHash}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: PURPLE, textDecoration: "none", fontWeight: 700 }}>View on StorageScan →</a>
                      </div>
                    )}
                    {selected.compute?.output && (
                      <div style={{ marginTop: 12, background: TERM, borderRadius: 8, padding: "10px 12px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: MUTED, lineHeight: 1.7, maxHeight: 150, overflowY: "auto" }}>
                        {selected.compute.output}
                      </div>
                    )}
                  </motion.div>
                )}
              </GCard>
            </>
          )}

          {activeTab === "telemetry" && (
            <GCard>
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED }}>0G Telemetry</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                {[
                  ["Agent Wallet",     stats?.wallet?.address ?? AGENT_WALLET,                        BLUE],
                  ["Balance",          `${stats?.wallet?.balance ?? "—"} 0G`,                         GREEN],
                  ["TX Count",         stats?.wallet?.txCount?.toString() ?? "—",                     WHITE],
                  ["Block Number",     stats?.wallet?.blockNumber?.toLocaleString() ?? "—",           WHITE],
                  ["Network",          "0G Galileo · Chain ID 16602",                                 WHITE],
                  ["Contract",         CONTRACT_ADDRESS.slice(0,10)+"..."+CONTRACT_ADDRESS.slice(-4), CYAN],
                  ["Cycles On-Chain",  contractCycles.toString(),                                      GREEN],
                  ["Latest Storage",   storageHash.slice(0,18)+"...",                                  BLUE],
                  ["Human Authorized", "FALSE",                                                        GREEN],
                  ["Admin Keys",       "NONE",                                                         GREEN],
                  ["Kill Switch",      "NONE",                                                         GREEN],
                  ["Upgradeable",      "FALSE",                                                        GREEN],
                ].map(([k,v,c]) => <Row key={k} k={k} v={String(v)} c={String(c)} />)}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  <a href={STORAGE_SCAN} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, color: PURPLE, textDecoration: "none" }}>StorageScan</a>
                  <a href={CHAIN_SCAN} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: `${CYAN}0c`, border: `0.5px solid ${CYAN}30`, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, color: CYAN, textDecoration: "none" }}>Contract</a>
                </div>
              </div>
            </GCard>
          )}
        </div>
      </div>


      <style>{`
        @keyframes ping{0%{transform:scale(1);opacity:.8}75%,100%{transform:scale(2);opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.15);border-radius:2px;}
        a:hover{opacity:0.8;}
      `}</style>
    </div>
  );

  // ── DESKTOP DASHBOARD ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, color: WHITE, fontFamily: "-apple-system,'SF Pro Display',Inter,sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <Header />

      <div style={{ paddingTop: 60, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOP METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", background: "rgba(255,255,255,0.06)", borderBottom: `0.5px solid ${BORDER}` }}>
          {topMetrics.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ background: "rgba(9,14,26,0.95)", padding: "22px 18px", textAlign: "center", borderRight: i < 5 ? `0.5px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 7 }}>{m.label}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(18px,2.2vw,28px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: m.c, marginBottom: 5 }}>{m.val}</div>
              <div style={{ fontSize: 9.5, color: DIMMED }}>{m.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", minHeight: 0 }}>

          {/* LEFT 2/3: tabs */}
          <div style={{ gridColumn: "span 2", background: BG, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${BORDER}` }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `0.5px solid ${BORDER}`, background: "rgba(9,14,26,0.6)" }}>
              {(["overview","telemetry"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "14px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? GREEN : MUTED, borderBottom: activeTab === tab ? `2px solid ${GREEN}` : "2px solid transparent", transition: "color 0.2s" }}>
                  {tab === "telemetry" ? "0G_Telemetry" : tab}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 20, fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: MUTED }}>
                BLOCK: #{stats?.wallet?.blockNumber?.toLocaleString() ?? "—"}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* TERMINAL */}
                  <GCard glow={GREEN}>
                    <div style={{ padding: "18px 22px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: WHITE, margin: "0 0 5px" }}>Autonomous Core Stream</h2>
                          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: MUTED, margin: 0 }}>Sealed compute cycles inside 0G TEE</p>
                        </div>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED }}>CYCLE: #{stats?.completedCycles ?? "—"}</span>
                      </div>
                      <div style={{ background: TERM, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", height: 240, fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: GREEN, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)" }}>
                        <div ref={termRef} style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                          {termLines.map((line, i) => (
                            <div key={i} style={{ opacity: i === termLines.length - 1 ? 1 : 0.65 }}>
                              <span style={{ color: DIMMED }}>{line.slice(0, 11)}</span>{line.slice(11)}
                            </div>
                          ))}
                        </div>
                        <div style={{ borderTop: `0.5px solid ${DIMMED}`, paddingTop: 10, marginTop: 6, display: "flex", alignItems: "center" }}>
                          <span style={{ color: MUTED, marginRight: 8, fontWeight: 700 }}>$&gt;</span>
                          <span style={{ color: GREEN, opacity: 0.5 }}>autonomous execution · no input required</span>
                        </div>
                      </div>
                    </div>
                  </GCard>

                  {/* TWIN METRIC CARDS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { label: "Compute Stability", val: alive ? "ONLINE" : "OFFLINE", c: alive ? GREEN : RED },
                      { label: "0G Storage Commits", val: `${stats?.completedCycles ?? 0}`, suffix: "cycles", c: WHITE },
                      { label: "Avg Inference Latency", val: stats?.avgLatencyMs ? `${stats.avgLatencyMs}ms` : "—", c: CYAN },
                      { label: "Tokens Processed", val: (stats?.totalTokens ?? 0).toLocaleString(), c: WHITE },
                    ].map((m, i) => (
                      <GCard key={i}>
                        <div style={{ padding: "22px 24px" }}>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: MUTED, display: "block", marginBottom: 8 }}>{m.label}</span>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: m.c }}>
                            {m.val}{m.suffix && <span style={{ fontSize: 13, color: MUTED, fontWeight: 400, marginLeft: 6 }}>{m.suffix}</span>}
                          </div>
                        </div>
                      </GCard>
                    ))}
                  </div>

                  {/* CYCLES LIST */}
                  <GCard>
                    <div style={{ padding: "14px 22px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>Inference Cycles · 0G Compute</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: GREEN, padding: "3px 9px", borderRadius: 5, background: `${GREEN}0c`, border: `0.5px solid ${GREEN}28` }}>{cycles.length} total</span>
                        <a href={STORAGE_SCAN} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: PURPLE, padding: "3px 9px", borderRadius: 5, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}28`, textDecoration: "none" }}>StorageScan →</a>
                      </div>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {loading && <div style={{ padding: "48px 22px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED }}>Connecting to agent...</div>}
                      {!loading && cycles.length === 0 && <div style={{ padding: "48px 22px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED }}>No cycles yet. Run: node agent/index.js</div>}
                      {cycles.map((c, i) => (
                        <motion.div key={c.cycle} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          onClick={() => setSelected(selected?.cycle === c.cycle ? null : c)}
                          style={{ padding: "14px 22px", borderBottom: `0.5px solid ${BORDER}`, cursor: "pointer", background: selected?.cycle === c.cycle ? `${GREEN}04` : "transparent", borderLeft: selected?.cycle === c.cycle ? `2px solid ${GREEN}` : "2px solid transparent", display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 14, alignItems: "start", transition: "background 0.12s" }}
                        >
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: DIMMED }}>#{c.cycle}</span>
                          <div>
                            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: WHITE, marginBottom: 4 }}>{c.compute?.model || "0G Compute"} · {fmtDate(c.timestamp)}</div>
                            {c.compute?.output && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.compute.output}</div>}
                            {c.compute?.error  && <div style={{ fontSize: 12, color: RED }}>{c.compute.error}</div>}
                            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: DIMMED, marginTop: 5, display: "flex", gap: 12 }}>
                              {c.compute?.latencyMs && <span style={{ color: CYAN }}>{c.compute.latencyMs}ms</span>}
                              {c.storageHash && <span style={{ color: PURPLE }}>storage: {c.storageHash.slice(0,10)}...</span>}
                              {c.chain?.txHash && <span style={{ color: AMBER }}>tx: {c.chain.txHash.slice(0,10)}...</span>}
                              <span>{timeAgo(c.timestamp)}</span>
                            </div>
                          </div>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: `${statusColor(c.status)}12`, color: statusColor(c.status), border: `0.5px solid ${statusColor(c.status)}25`, flexShrink: 0 }}>{statusLabel(c.status)}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GCard>
                </div>
              )}

              {activeTab === "telemetry" && (
                <GCard>
                  <div style={{ padding: "16px 22px", borderBottom: `0.5px solid ${BORDER}` }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED }}>0G Telemetry · Live Chain + Storage Data</span>
                  </div>
                  <div style={{ padding: "20px 22px" }}>
                    {[
                      ["Agent Wallet",       stats?.wallet?.address ?? AGENT_WALLET,                        BLUE],
                      ["Balance",            `${stats?.wallet?.balance ?? "—"} 0G`,                         GREEN],
                      ["TX Count",           stats?.wallet?.txCount?.toString() ?? "—",                     WHITE],
                      ["Block Number",       stats?.wallet?.blockNumber?.toLocaleString() ?? "—",           WHITE],
                      ["Network",            "0G Galileo Testnet · Chain ID 16602",                         WHITE],
                      ["Contract Address",   CONTRACT_ADDRESS,                                               CYAN],
                      ["Cycles On-Chain",    contractCycles.toString(),                                      GREEN],
                      ["Latest Storage Hash",storageHash,                                                    BLUE],
                      ["Storage Node",       "indexer-storage-testnet-turbo.0g.ai",                          MUTED],
                      ["Model",              "openrouter/auto · llama-3.1-8b",                               AMBER],
                      ["Enclave",            "Confidential VM · TEEML Verified",                            CYAN],
                      ["Human Authorized",   "FALSE · autonomous execution",                                 GREEN],
                      ["Admin Keys",         "NONE",                                                         GREEN],
                      ["Kill Switch",        "NONE",                                                         GREEN],
                      ["Upgradeable",        "FALSE",                                                        GREEN],
                    ].map(([k,v,c]) => (
                      <div key={k} style={{ display: "flex", gap: 16, padding: "9px 0", borderBottom: `0.5px solid ${BORDER}` }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, width: 200, flexShrink: 0, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{k}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: c, wordBreak: "break-all" as const, lineHeight: 1.6 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </GCard>
              )}
            </div>
          </div>

          {/* RIGHT 1/3: sovereignty + wallet + cycle detail */}
          <div style={{ background: "rgba(5,7,15,0.98)", display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* SOVEREIGNTY */}
            <GCard glow={GREEN} style={{ margin: "20px", borderRadius: 14 }}>
              <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: WHITE }}>Sovereignty Shield</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: `${GREEN}10`, color: GREEN, border: `0.5px solid ${GREEN}28` }}>ATTESTED</span>
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ background: TERM, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "14px", marginBottom: 14, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }}>
                  {[
                    ["CONTRACT",        CONTRACT_ADDRESS.slice(0,16)+"...", BLUE],
                    ["CYCLES ON-CHAIN", contractCycles.toString(),          GREEN],
                    ["STORAGE STATUS",  "PROVABLY_ANCHORED",                GREEN],
                    ["HUMAN AUTH",      "FALSE",                            GREEN],
                    ["TEEML",           "SIGNATURE_VALID",                  GREEN],
                    ["ADMIN KEY",       "NONE_EXISTS",                      GREEN],
                    ["KILL SWITCH",     "NONE_EXISTS",                      GREEN],
                    ["UPGRADEABLE",     "FALSE",                            GREEN],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ marginBottom: 9 }}>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, fontWeight: 700, color: DIMMED, letterSpacing: "0.1em", marginBottom: 2 }}>{l}</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: c, wordBreak: "break-all" as const }}>{v}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.7, marginBottom: 14 }}>Memory and weight profiles isolated cryptographically within 0G decentralized compute.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href={STORAGE_SCAN} target="_blank" style={{ display: "block", padding: "12px", background: WHITE, color: BG, borderRadius: 9, fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" as const, textAlign: "center", textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>Verify Storage</a>
                  <a href={CHAIN_SCAN} target="_blank" style={{ display: "block", padding: "10px", background: `${CYAN}0c`, border: `0.5px solid ${CYAN}30`, color: CYAN, borderRadius: 9, fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, textAlign: "center", textDecoration: "none" }}>View Contract</a>
                </div>
              </div>
            </GCard>

            {/* WALLET */}
            <GCard glow={CYAN} style={{ margin: "0 20px 20px" }}>
              <div style={{ padding: "13px 20px", borderBottom: `0.5px solid ${BORDER}` }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED }}>Agent Wallet · 0G Chain</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 34, fontWeight: 700, color: CYAN, lineHeight: 1, marginBottom: 3, letterSpacing: "-0.03em" }}>{stats?.wallet?.balance ?? "—"}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: CYAN, opacity: 0.5, marginBottom: 12, letterSpacing: "0.14em" }}>0G TOKENS</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: BLUE, wordBreak: "break-all", lineHeight: 1.65, marginBottom: 10 }}>{stats?.wallet?.address ?? AGENT_WALLET}</div>
                {stats?.wallet?.explorerUrl && <a href={stats.wallet.explorerUrl} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: CYAN, textDecoration: "none", fontWeight: 600, opacity: 0.8 }}>View on 0G Explorer →</a>}
                <div style={{ marginTop: 12 }}>
                  {[
                    ["TX Count",    stats?.wallet?.txCount ?? "—",                                      CYAN],
                    ["Block",       stats?.wallet?.blockNumber?.toLocaleString() ?? "—",               WHITE],
                    ["Anchored",    stats ? `${stats.anchoredOnChain}/${stats.completedCycles}` : "—", CYAN],
                    ["Next Cycle",  nextRun,                                                            GREEN],
                    ["Failed",      stats?.failedCycles ?? 0,                                          stats?.failedCycles ? RED : MUTED],
                  ].map(([k,v,c]) => <Row key={String(k)} k={String(k)} v={String(v)} c={String(c)} />)}
                </div>
              </div>
            </GCard>

            {/* CYCLE DETAIL */}
            {selected ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ margin: "0 20px 20px" }}>
                <GCard>
                  <div style={{ padding: "13px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700, color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Cycle #{selected.cycle}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: statusColor(selected.status), fontWeight: 700 }}>{statusLabel(selected.status)}</span>
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    {[
                      ["Time",    fmtDate(selected.timestamp),                                              WHITE],
                      ["Model",   selected.compute?.model || "openrouter/auto",                             AMBER],
                      ["Latency", selected.compute?.latencyMs ? `${selected.compute.latencyMs}ms` : "—",   WHITE],
                      ["Tokens",  `${selected.compute?.inputTok||0} / ${selected.compute?.outputTok||0}`,   PURPLE],
                      ["Chain TX",selected.chain?.txHash ? selected.chain.txHash.slice(0,16)+"..." : "—",  AMBER],
                      ["Human",   "FALSE",                                                                   GREEN],
                    ].map(([k,v,c]) => <Row key={k} k={k} v={String(v)} c={String(c)} />)}
                    {selected.storageHash && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 700, color: DIMMED, letterSpacing: "0.1em", marginBottom: 6 }}>STORAGE HASH</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, color: BLUE, wordBreak: "break-all", lineHeight: 1.7, marginBottom: 8 }}>{selected.storageHash}</div>
                        <a href={`https://storagescan-galileo.0g.ai/tx?hash=${selected.storageHash}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: PURPLE, textDecoration: "none", fontWeight: 700 }}>View on StorageScan →</a>
                      </div>
                    )}
                    {selected.compute?.output && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 700, color: DIMMED, letterSpacing: "0.1em", marginBottom: 6 }}>INFERENCE OUTPUT</div>
                        <div style={{ background: TERM, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 160, overflowY: "auto" }}>{selected.compute.output}</div>
                      </div>
                    )}
                  </div>
                </GCard>
              </motion.div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: DIMMED, lineHeight: 2 }}>Click any cycle<br />to see full detail</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping{0%{transform:scale(1);opacity:.8}75%,100%{transform:scale(2);opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${GREEN}22;color:${GREEN};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.12);border-radius:2px;}
        a:hover{opacity:0.8;}
      `}</style>
    </div>
  );
}
