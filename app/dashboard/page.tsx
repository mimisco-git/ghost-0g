"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const CYAN = "#00FFD1";
const AMBER = "#ffb800";
const PURPLE = "#b08fff";
const RED = "#ff5555";

interface Cycle {
  cycle: number;
  timestamp: string;
  status: string;
  compute?: { output?: string; model?: string; latencyMs?: number; inputTok?: number; outputTok?: number; error?: string };
  wallet?: { address: string; balance: string };
  chain?: { txHash?: string; blockNumber?: number; error?: string };
  contentHash?: string;
  human_authorized: boolean;
}

interface Stats {
  totalCycles: number;
  completedCycles: number;
  failedCycles: number;
  anchoredOnChain: number;
  totalTokens: number;
  avgLatencyMs: number;
  wallet?: { address: string; balance: string; txCount: number; blockNumber: number; explorerUrl: string };
  lastCycle?: Cycle;
}

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function fmtTime(ts: string) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtDate(ts: string) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${fmtTime(ts)}`;
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

function GlassCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "0.5px solid rgba(255,255,255,0.09)",
      borderRadius: 18,
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      boxShadow: "0 0 0 0.5px rgba(0,255,209,0.05) inset, 0 16px 32px rgba(0,0,0,0.35)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Metric({ val, label, color = "#fff", sub = "" }: { val: string | number; label: string; color?: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "#080808", padding: "24px 20px", textAlign: "center" }}
    >
      <div style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color, marginBottom: 6 }}>{val}</div>
      <div style={{ fontSize: 11, color: "#86868b", letterSpacing: "0.04em", lineHeight: 1.5 }}>{label}</div>
      {sub && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#6e6e73", marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selected, setSelected] = useState<Cycle | null>(null);
  const [alive, setAlive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextRun, setNextRun] = useState("");

  async function refresh() {
    try {
      const [sRes, cRes, hRes] = await Promise.all([
        fetch("/api/stats", { signal: AbortSignal.timeout(5000) }),
        fetch("/api/cycles", { signal: AbortSignal.timeout(5000) }),
        fetch("/api/health", { signal: AbortSignal.timeout(5000) }),
      ]);
      if (sRes.ok) { const j = await sRes.json(); if (j.ok) setStats(j.data); }
      if (cRes.ok) { const j = await cRes.json(); if (j.ok) setCycles(j.cycles || []); }
      if (hRes.ok) { const j = await hRes.json(); if (j.ok) setAlive(j.agentAlive); }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
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

  const statusColor = (s: string) => s === "complete" ? CYAN : s === "compute_failed" ? RED : AMBER;
  const statusLabel = (s: string) => s === "complete" ? "VERIFIED" : s === "compute_failed" ? "FAILED" : "RUNNING";

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Helvetica Neue', sans-serif", WebkitFontSmoothing: "antialiased", minHeight: "100vh" }}>

      {/* TOPBAR */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(0,0,0,0.82)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo2.png" alt="Ghost" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover", objectPosition: "center 20%" }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 500, letterSpacing: "0.18em", color: CYAN }}>GHOST</span>
          </a>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#6e6e73", letterSpacing: "0.1em" }}>LIVE AGENT MONITOR</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, padding: "5px 14px", borderRadius: 980, background: alive ? "rgba(0,255,209,0.08)" : "rgba(255,85,85,0.08)", border: `0.5px solid ${alive ? "rgba(0,255,209,0.22)" : "rgba(255,85,85,0.22)"}`, color: alive ? CYAN : RED }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: alive ? CYAN : RED, display: "inline-block", animation: alive ? "pulse 2s infinite" : "none" }} />
            {alive ? "AGENT RUNNING" : "AGENT OFFLINE"}
          </div>
          <a href="/" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#86868b", textDecoration: "none", padding: "6px 14px", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8 }}>← Back to site</a>
        </div>
      </div>

      <div style={{ paddingTop: 54 }}>

        {/* METRICS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
          <Metric val={loading ? "..." : stats?.completedCycles ?? 0} label="Total Cycles" color={CYAN} sub="TEE verified" />
          <Metric val={loading ? "..." : stats?.wallet?.balance ?? "0"} label="Agent Balance" sub="0G tokens" />
          <Metric val={loading ? "..." : stats?.wallet?.txCount ?? 0} label="Chain Anchors" color={AMBER} sub="On 0G Chain" />
          <Metric val={loading ? "..." : stats?.totalTokens?.toLocaleString() ?? 0} label="Tokens Used" color={PURPLE} sub="Total inference" />
          <Metric val="0" label="Admin Keys" color={CYAN} sub="No owner exists" />
          <Metric val={nextRun || "..."} label="Next Cycle" sub="Auto trigger" />
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 1, background: "rgba(255,255,255,0.06)", minHeight: "calc(100vh - 54px - 96px)" }}>

          {/* LEFT: CYCLE LIST */}
          <div style={{ background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 24px", background: "#080808", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.14em", textTransform: "uppercase" }}>Inference Cycles · 0G Compute Router</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, padding: "3px 10px", borderRadius: 980, background: "rgba(0,255,209,0.08)", border: "0.5px solid rgba(0,255,209,0.2)" }}>{cycles.length} total</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && (
                <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6e6e73" }}>
                  Loading cycles...
                </div>
              )}
              {!loading && cycles.length === 0 && (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#6e6e73", lineHeight: 2 }}>
                    No cycles yet.<br />
                    <span style={{ fontSize: 11, color: "#4a4a52" }}>Start the agent: node agent/index.js</span>
                  </div>
                </div>
              )}
              {cycles.map((c, i) => (
                <motion.div
                  key={c.cycle}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  onClick={() => setSelected(selected?.cycle === c.cycle ? null : c)}
                  style={{ padding: "16px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.05)", cursor: "pointer", background: selected?.cycle === c.cycle ? "rgba(0,255,209,0.03)" : "transparent", borderLeft: selected?.cycle === c.cycle ? `2px solid ${CYAN}` : "2px solid transparent", display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 14, alignItems: "start", transition: "background 0.15s" }}
                >
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.18)", paddingTop: 2 }}>#{c.cycle}</span>
                  <div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#fff", marginBottom: 4 }}>
                      {c.compute?.model || "zai-org/GLM-5-FP8"} · {fmtDate(c.timestamp)}
                    </div>
                    {c.compute?.output && (
                      <div style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                        {c.compute.output}
                      </div>
                    )}
                    {c.compute?.error && (
                      <div style={{ fontSize: 12, color: RED, lineHeight: 1.55 }}>{c.compute.error}</div>
                    )}
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {c.compute?.latencyMs && <span style={{ color: CYAN }}>{c.compute.latencyMs}ms</span>}
                      {c.compute?.inputTok && <span style={{ color: PURPLE }}>{c.compute.inputTok}in/{c.compute.outputTok}out tok</span>}
                      {c.chain?.txHash && <span style={{ color: AMBER }}>tx: {c.chain.txHash.slice(0, 14)}...</span>}
                      <span>{timeAgo(c.timestamp)}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 500, padding: "3px 9px", borderRadius: 4, background: `${statusColor(c.status)}18`, color: statusColor(c.status), border: `0.5px solid ${statusColor(c.status)}33`, flexShrink: 0 }}>
                    {statusLabel(c.status)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div style={{ background: "#050505", borderLeft: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>

            {/* WALLET */}
            <div style={{ padding: "20px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#6e6e73", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14, margin: "0 0 14px" }}>Agent Wallet · 0G Chain</p>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 30, fontWeight: 600, color: CYAN, lineHeight: 1, marginBottom: 4 }}>{stats?.wallet?.balance ?? "..."}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, opacity: 0.7, marginBottom: 10 }}>0G TOKENS</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#6e6e73", wordBreak: "break-all", lineHeight: 1.6, marginBottom: 14 }}>
                {stats?.wallet?.address ?? "Loading..."}
              </div>
              {stats?.wallet?.explorerUrl && (
                <a href={stats.wallet.explorerUrl} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, textDecoration: "none", opacity: 0.75 }}>View on 0G Explorer →</a>
              )}
              {[
                ["TX Count", stats?.wallet?.txCount ?? "...", CYAN],
                ["Block Number", stats?.wallet?.blockNumber?.toLocaleString() ?? "...", "#fff"],
                ["Network", "0G Testnet", "#fff"],
                ["Avg Latency", stats?.avgLatencyMs ? `${stats.avgLatencyMs}ms` : "...", AMBER],
                ["Anchored", stats ? `${stats.anchoredOnChain}/${stats.completedCycles}` : "...", CYAN],
                ["Failed", stats?.failedCycles ?? 0, stats?.failedCycles ? RED : "#86868b"],
              ].map(([k, v, c]) => (
                <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "0.5px solid rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  <span style={{ color: "#6e6e73" }}>{k}</span>
                  <span style={{ color: String(c) }}>{String(v)}</span>
                </div>
              ))}
            </div>

            {/* STATUS */}
            <div style={{ padding: "20px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#6e6e73", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 14px" }}>Contract Status</p>
              {[
                ["Owner", "NONE", CYAN],
                ["Kill switch", "NONE", CYAN],
                ["Upgradeable", "FALSE", CYAN],
                ["Compute", "0G Router", "#fff"],
                ["Human authorized", "FALSE", CYAN],
                ["Admin keys", "0", CYAN],
              ].map(([k, v, c]) => (
                <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  <span style={{ color: "#86868b" }}>{k}</span>
                  <span style={{ color: String(c), fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>

            {/* SELECTED CYCLE DETAIL */}
            {selected && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "20px" }}>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: CYAN, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 14px" }}>Cycle #{selected.cycle} Detail</p>
                {[
                  ["Status", statusLabel(selected.status), statusColor(selected.status)],
                  ["Time", fmtDate(selected.timestamp), "#fff"],
                  ["Model", selected.compute?.model || "GLM-5-FP8", AMBER],
                  ["Latency", selected.compute?.latencyMs ? `${selected.compute.latencyMs}ms` : "N/A", "#fff"],
                  ["Input tok", selected.compute?.inputTok ?? "N/A", PURPLE],
                  ["Output tok", selected.compute?.outputTok ?? "N/A", PURPLE],
                  ["Chain tx", selected.chain?.txHash ? selected.chain.txHash.slice(0, 16) + "..." : "N/A", AMBER],
                  ["Block", selected.chain?.blockNumber ?? "N/A", "#fff"],
                  ["Human auth", "FALSE", CYAN],
                ].map(([k, v, c]) => (
                  <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                    <span style={{ color: "#6e6e73" }}>{k}</span>
                    <span style={{ color: String(c) }}>{String(v)}</span>
                  </div>
                ))}
                {selected.compute?.output && (
                  <>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#6e6e73", letterSpacing: "0.12em", textTransform: "uppercase", margin: "14px 0 8px" }}>Inference Output</p>
                    <div style={{ background: "#000", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#86868b", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflowY: "auto" }}>
                      {selected.compute.output}
                    </div>
                  </>
                )}
                {selected.contentHash && (
                  <>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#6e6e73", letterSpacing: "0.12em", textTransform: "uppercase", margin: "14px 0 6px" }}>Content Hash</p>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#6e6e73", wordBreak: "break-all", lineHeight: 1.6 }}>{selected.contentHash}</div>
                  </>
                )}
                {selected.chain?.txHash && (
                  <a href={`https://chainscan-galileo.0g.ai/tx/${selected.chain.txHash}`} target="_blank" style={{ display: "inline-block", marginTop: 14, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: CYAN, textDecoration: "none", opacity: 0.8 }}>
                    View tx on 0G Explorer →
                  </a>
                )}
              </motion.div>
            )}

            {!selected && (
              <div style={{ padding: "24px 20px", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#4a4a52", textAlign: "center", lineHeight: 1.8 }}>
                Click any cycle<br />to see full detail
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.15); border-radius: 2px; }
        a:hover { opacity: 0.8; }
        @media (max-width: 860px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .metrics-row { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
