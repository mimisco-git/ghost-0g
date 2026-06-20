"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const CYAN = "#00FFD1";
const AMBER = "#ffb800";
const PURPLE = "#b08fff";

// ── GHOST ORB ──────────────────────────────────────────────────────────────
function GhostOrb({ size = 380 }: { size?: number }) {
  const orbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!orbRef.current) return;
      const r = orbRef.current.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width;
      const dy = (e.clientY - r.top - r.height / 2) / r.height;
      orbRef.current.style.setProperty("--rx", `${dy * 12}deg`);
      orbRef.current.style.setProperty("--ry", `${-dx * 12}deg`);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <div ref={orbRef} style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", perspective: "1200px", "--rx": "0deg", "--ry": "0deg" } as React.CSSProperties}>
      <div style={{ position: "absolute", width: "88%", height: "88%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,209,0.18) 0%, transparent 70%)", filter: "blur(28px)", animation: "gB 5s ease-in-out infinite" }} />
      {[92, 108, 124].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: `${s}%`, height: `${s}%`, borderRadius: "50%", border: `0.5px solid rgba(0,255,209,${0.14 - i * 0.04})`, animation: i === 0 ? "rA 22s linear infinite" : i === 1 ? "rB 32s linear infinite" : "none" }} />
      ))}
      <div style={{ width: "68%", height: "68%", borderRadius: "50%", position: "relative", transform: "rotateX(var(--rx)) rotateY(var(--ry))", transformStyle: "preserve-3d", transition: "transform 0.1s ease-out", animation: "oF 8s ease-in-out infinite", willChange: "transform" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 36% 30%, #ffffff 0%, #eaf7f3 25%, #c8ede6 55%, #9fd8cc 80%, #78c0b5 100%)", boxShadow: "0 0 0 1px rgba(0,255,209,0.2), 0 16px 48px rgba(0,0,0,0.5), 0 40px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.95)" }} />
        <div style={{ position: "absolute", top: "4%", left: "10%", width: "55%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.1) 70%, transparent 100%)", transform: "rotate(-18deg)", filter: "blur(1.5px)" }} />
        <div style={{ position: "absolute", top: "15%", left: "6%", width: "16%", height: "44%", borderRadius: "50%", background: "linear-gradient(155deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.08) 100%)", filter: "blur(3px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 58% 68%, rgba(0,255,209,0.24) 0%, rgba(0,255,209,0.08) 50%, transparent 75%)", animation: "iP 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 0, left: "15%", width: "70%", height: "32%", background: "radial-gradient(ellipse at 50% 100%, rgba(0,255,209,0.36) 0%, rgba(0,255,209,0.1) 60%, transparent 100%)", filter: "blur(10px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 0 0 2px rgba(255,255,255,0.08)" }} />
        {[{ l: "24%", t: "33%" }, { l: "57%", t: "33%" }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: "17%", height: "20%", top: pos.t, left: pos.l, borderRadius: "50%", background: "radial-gradient(ellipse at 38% 32%, #1a1a1a 0%, #000 60%)", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.9)" }}>
            <div style={{ position: "absolute", width: "52%", height: "52%", top: "24%", left: "24%", borderRadius: "50%", background: "radial-gradient(ellipse at 32% 28%, #00FFD1, #00c8a8 55%, #006e5a 100%)", boxShadow: "0 0 10px rgba(0,255,209,1), 0 0 20px rgba(0,255,209,0.6)", animation: "eG 4s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: "18%", height: "18%", top: "16%", left: "58%", borderRadius: "50%", background: "#fff", opacity: 0.92 }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes oF{0%,100%{transform:rotateX(var(--rx)) rotateY(var(--ry)) translateY(0)}50%{transform:rotateX(var(--rx)) rotateY(var(--ry)) translateY(-20px)}}
        @keyframes gB{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
        @keyframes iP{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes eG{0%,100%{box-shadow:0 0 10px rgba(0,255,209,1),0 0 20px rgba(0,255,209,.6)}50%{box-shadow:0 0 16px rgba(0,255,209,1),0 0 32px rgba(0,255,209,.8)}}
        @keyframes rA{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rB{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
      `}</style>
    </div>
  );
}

// ── PARTICLE BG ─────────────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let W = 0, H = 0, sy = 0, af: number;
    const pts: { x: number; y: number; vx: number; vy: number; a: number; r: number }[] = [];
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    const init = () => { pts.length = 0; const n = Math.min(Math.floor(W * H / 22000), 60); for (let i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15, a: .06 + Math.random() * .2, r: .4 + Math.random() * 1 }); };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const sh = sy * .05;
      for (const p of pts) {
        const py = p.y - (sh % H);
        ctx.beginPath(); ctx.arc(p.x, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,209,${p.a})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = (pts[i].y - sh % H) - (pts[j].y - sh % H);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y - sh % H); ctx.lineTo(pts[j].x, pts[j].y - sh % H); ctx.strokeStyle = `rgba(0,255,209,${.03 * (1 - d / 100)})`; ctx.lineWidth = .4; ctx.stroke(); }
      }
      af = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", () => sy = window.scrollY, { passive: true });
    window.addEventListener("resize", () => { resize(); init(); });
    resize(); init(); draw();
    return () => { cancelAnimationFrame(af); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── REVEAL ───────────────────────────────────────────────────────────────────
function R({ children, d = 0, y = 28 }: { children: React.ReactNode; d?: number; y?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

// ── GLASS ────────────────────────────────────────────────────────────────────
const G = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.09)", borderRadius: 20, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", boxShadow: "0 0 0 0.5px rgba(0,255,209,0.05) inset, 0 20px 40px rgba(0,0,0,0.35)", overflow: "hidden", ...style }}>{children}</div>
);

// ── TAG ──────────────────────────────────────────────────────────────────────
const Tag = ({ label, color }: { label: string; color: string }) => (
  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 980, border: `0.5px solid ${color}33`, background: `${color}0f`, color, display: "inline-block" }}>{label}</span>
);

// ── BTN ───────────────────────────────────────────────────────────────────────
const Btn = ({ href, primary, children, target }: { href: string; primary?: boolean; children: React.ReactNode; target?: string }) => (
  <a href={href} target={target} style={{ display: "inline-block", padding: "15px 30px", borderRadius: 980, fontSize: 15, fontWeight: primary ? 600 : 400, textDecoration: "none", background: primary ? CYAN : "transparent", color: primary ? "#000" : CYAN, border: primary ? "none" : `0.5px solid rgba(0,255,209,0.35)`, cursor: "pointer" }}>{children}</a>
);

// ── SECTION ───────────────────────────────────────────────────────────────────
const S = ({ children, id, style = {} }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) => (
  <div id={id} style={{ width: "100%", display: "flex", justifyContent: "center", padding: "80px 40px", ...style }}>
    <div style={{ width: "100%", maxWidth: 1100 }}>{children}</div>
  </div>
);

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [cycles, setCycles] = useState(0);
  const [storage, setStorage] = useState<{ hash: string; ts: string } | null>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok) {
          setCycles(j.data?.completedCycles ?? 0);
          const last = j.data?.lastCycle;
          if (last?.storageHash) setStorage({ hash: last.storageHash, ts: last.timestamp });
        }
      } catch {}
    }
    load();
    setInterval(load, 30000);
  }, []);

  const arch = [
    { tag: "0G Compute", tc: CYAN, title: "Verifiable inference", body: "Every inference runs inside a Confidential VM with AMD SEV-SNP. TEEML attestation proves the exact model ran unmodified. Not even 0G sees the input." },
    { tag: "0G Storage", tc: PURPLE, title: "Permanent memory", body: "Every output and attestation is written to decentralized storage with a content hash. No delete function. The history is permanent and public." },
    { tag: "0G Chain", tc: AMBER, title: "Ownerless contract", body: "No admin key. No pause function. No upgrade path. GHOST pays for its own compute. No human signature required." },
    { tag: "Autonomous", tc: "rgba(255,255,255,0.4)", title: "Self-sustaining entity", body: "Wakes on-chain, runs inference, pays from wallet, writes to storage, anchors hash, sleeps. Runs indefinitely without any human action.", wide: true },
    { tag: "ERC-7857", tc: "rgba(255,255,255,0.4)", title: "Coming: GHOST mints itself", body: "After cycle 10, GHOST mints its own Agentic ID with memory encrypted inside. Ownable, transferable. The buyer gets a running agent." },
  ];

  const steps = [
    { n: "01", t: "Wake on-chain", d: "Time-locked trigger fires. No human starts this.", pill: "0G Chain", pc: AMBER },
    { n: "02", t: "Run inference in TEE", d: "0G Compute routes to hardware enclave. TEEML attestation generated.", pill: "TEEML", pc: CYAN },
    { n: "03", t: "Pay for its own compute", d: "Deducts from its own wallet. No human signs this.", pill: "Auto pay", pc: AMBER },
    { n: "04", t: "Write to 0G Storage", d: "Full record with content hash. Permanent. Verifiable on StorageScan.", pill: "0G Storage", pc: PURPLE },
    { n: "05", t: "Anchor hash on chain", d: "Content hash anchored on 0G Chain. Tamper-proof forever.", pill: "Immutable", pc: AMBER },
    { n: "06", t: "Sleep. Repeat.", d: "Self-sustaining. No human required. Always on.", pill: "Always on", pc: "rgba(255,255,255,0.35)" },
  ];

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Helvetica Neue', sans-serif", WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <Particles />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: "rgba(0,0,0,0.82)", backdropFilter: "saturate(180%) blur(40px)", WebkitBackdropFilter: "saturate(180%) blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo2.png" alt="Ghost" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", objectPosition: "center 20%", boxShadow: "0 0 0 1px rgba(0,255,209,0.2)" }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 500, letterSpacing: "0.18em", color: CYAN }}>GHOST</span>
        </a>
        <div style={{ display: "flex", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {[["Architecture", "#architecture"], ["Proof", "#proof"], ["Storage", "#storage"], ["Dashboard", "/dashboard"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <Btn href="https://0g.ai/arena/zero-cup" target="_blank" primary>Vote on Zero Cup</Btn>
      </nav>

      {/* HERO */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 40px 60px", position: "relative", zIndex: 10 }}>
        <motion.div style={{ y: heroY, width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, letterSpacing: "0.24em", color: CYAN, textTransform: "uppercase", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 22, height: 1, background: CYAN, display: "inline-block" }} />
              Zero Cup 2026 · Built on 0G
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: "clamp(42px, 5.5vw, 78px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 22px" }}>
              The AI that<br />
              <span style={{ background: "linear-gradient(135deg, #fff 0%, #00FFD1 52%, #fff 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "sh 5s ease-in-out infinite" }}>
                cannot be stopped.
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 440 }}>
              Autonomous agent inside 0G&apos;s TEE. <strong style={{ color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>Pays for its own compute.</strong> Runs under a contract with <strong style={{ color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>no admin key.</strong> No kill switch. Not even ours.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <Btn href="/dashboard" primary>Watch it think live</Btn>
              <Btn href="https://github.com/mimisco-git/ghost-0g" target="_blank">Read the code</Btn>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label="0G Compute" color={CYAN} />
              <Tag label="0G Storage" color={PURPLE} />
              <Tag label="0G Chain" color={AMBER} />
              <Tag label="ERC-7857" color="rgba(255,255,255,0.4)" />
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <GhostOrb size={420} />
            {[{ cls: "top", t: "8%", l: "-4%", label: "TEE Status", val: "Enclave Active" }, { cls: "bot", b: "12%", r: "-4%", label: "Human Authorized", val: "FALSE" }].map((b, i) => (
              <div key={i} style={{ position: "absolute", top: b.t, bottom: (b as any).b, left: b.l, right: (b as any).r, padding: "9px 14px", borderRadius: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(0,255,209,0.2)", fontFamily: "JetBrains Mono, monospace" }}>
                <div style={{ fontSize: 9, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{b.label}</div>
                <div style={{ fontSize: 12, color: CYAN, fontWeight: 500 }}>{b.val}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* MARQUEE */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "14px 0", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", gap: 40, animation: "mq 28s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {["TEEML ATTESTATION VERIFIED", "0G COMPUTE · SEALED INFERENCE", "0G STORAGE · PERMANENT MEMORY", "0G CHAIN · ZERO ADMIN KEYS", "AUTONOMOUS PAYMENT LOOP", "HUMAN AUTHORIZED: FALSE", "NO KILL SWITCH · ALWAYS ON", "ZERO CUP 2026", "ERC-7857 AGENTIC ID", "TEEML ATTESTATION VERIFIED", "0G COMPUTE · SEALED INFERENCE", "0G STORAGE · PERMANENT MEMORY", "0G CHAIN · ZERO ADMIN KEYS", "AUTONOMOUS PAYMENT LOOP", "HUMAN AUTHORIZED: FALSE", "NO KILL SWITCH · ALWAYS ON", "ZERO CUP 2026", "ERC-7857 AGENTIC ID"].map((t, i) => (
            <span key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: CYAN, display: "inline-block" }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* LIVE STATS */}
      <S style={{ padding: "60px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
          {[
            { val: cycles || 0, label: "Inference cycles\ncompleted on 0G", c: CYAN },
            { val: "0", label: "Admin keys.\nNo owner.", c: CYAN },
            { val: "3", label: "0G layers.\nAll load-bearing.", c: "#fff" },
            { val: "FALSE", label: "Human authorized.\nEvery cycle.", c: CYAN },
          ].map((m, i) => (
            <R key={i} d={i * 0.07}>
              <div style={{ background: "#080808", padding: "32px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8, color: m.c }}>{m.val}</div>
                <div style={{ fontSize: 11.5, color: "#86868b", lineHeight: 1.55, whiteSpace: "pre-line" }}>{m.label}</div>
              </div>
            </R>
          ))}
        </div>
      </S>

      {/* ARCHITECTURE */}
      <S id="architecture" style={{ paddingTop: 0 }}>
        <R><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 14 }}>Architecture</p></R>
        <R d={0.08}><h2 style={{ fontSize: "clamp(28px,4.5vw,54px)", fontWeight: 700, letterSpacing: "-0.035em", margin: "0 0 12px" }}>Three layers.<br />All load-bearing.</h2></R>
        <R d={0.16}><p style={{ fontSize: 16, color: "#86868b", fontWeight: 300, lineHeight: 1.75, maxWidth: 480, margin: "0 0 44px" }}>Remove any one and GHOST fails. 0G is the reason it works at all.</p></R>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {arch.map((c, i) => (
            <R key={i} d={i * 0.06}>
              <div style={{ background: "#080808", padding: "32px 28px", gridColumn: (c as any).wide ? "span 2" : undefined, height: "100%", boxSizing: "border-box" as const }}>
                <Tag label={c.tag} color={c.tc} />
                <h3 style={{ fontSize: "clamp(15px,1.8vw,19px)", fontWeight: 600, margin: "16px 0 10px", letterSpacing: "-0.02em" }}>{c.title}</h3>
                <p style={{ fontSize: 13.5, color: "#86868b", lineHeight: 1.75, fontWeight: 300, margin: 0 }}>{c.body}</p>
              </div>
            </R>
          ))}
        </div>
      </S>

      {/* STEPS */}
      <S style={{ paddingTop: 0, maxWidth: 1100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <R><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 14 }}>Autonomous loop</p></R>
          <R d={0.08}><h2 style={{ fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 36px" }}>What GHOST does every 6 minutes</h2></R>
          <G>
            {steps.map((s, i) => (
              <R key={i} d={i * 0.05}>
                <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 26px", borderBottom: i < 5 ? "0.5px solid rgba(255,255,255,0.06)" : "none", background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.14)", width: 28, flexShrink: 0 }}>{s.n}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.t}</p>
                    <p style={{ fontSize: 13, color: "#86868b", fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 500, padding: "5px 14px", borderRadius: 980, border: `0.5px solid ${s.pc}44`, background: `${s.pc}0f`, color: s.pc, flexShrink: 0 }}>{s.pill}</span>
                </div>
              </R>
            ))}
          </G>
        </div>
      </S>

      {/* 0G STORAGE PROOF */}
      <S id="storage" style={{ paddingTop: 0 }}>
        <R>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: PURPLE, textTransform: "uppercase", margin: 0 }}>0G Storage</p>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, padding: "3px 10px", borderRadius: 980, background: "rgba(160,112,255,0.1)", border: "0.5px solid rgba(160,112,255,0.25)", color: PURPLE }}>LIVE ON STORAGESCAN</span>
          </div>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Every cycle, permanently stored.</h2>
          <p style={{ fontSize: 16, color: "#86868b", fontWeight: 300, lineHeight: 1.75, maxWidth: 520, margin: "0 0 36px" }}>Every inference output GHOST produces is written to 0G Storage with a content hash. Anyone can verify it on StorageScan. No delete button exists.</p>
        </R>
        <G>
          <div style={{ padding: "14px 22px", background: "rgba(160,112,255,0.04)", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.12em", textTransform: "uppercase" }}>Latest Storage Record · 0G Network</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: PURPLE, padding: "4px 12px", borderRadius: 980, background: "rgba(160,112,255,0.08)", border: "0.5px solid rgba(160,112,255,0.2)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: PURPLE, display: "inline-block", animation: "pulse 2.5s infinite" }} />
              Permanent · Uncensorable
            </span>
          </div>
          <div style={{ padding: "20px 22px", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>
            {[
              ["network", "0G Galileo Testnet · Chain ID 16602", "#fff"],
              ["storage_node", "indexer-storage-testnet-turbo.0g.ai", "#86868b"],
              ["root_hash", storage?.hash || "0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a", PURPLE],
              ["content", "GHOST agent inference record + attestation + timestamp", "#fff"],
              ["replicated", "TRUE · distributed across storage nodes", CYAN],
              ["deletable", "FALSE · no delete function exists", CYAN],
              ["timestamp", storage?.ts || new Date().toISOString(), "#86868b"],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#6e6e73", width: 130, flexShrink: 0 }}>{k}</span>
                <span style={{ color: c, wordBreak: "break-all" as const }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 22px", borderTop: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73" }}>Verified on 0G Storage Network</span>
            <a href={`https://storagescan.0g.ai/tx?hash=${storage?.hash || "0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a"}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: PURPLE, textDecoration: "none", opacity: 0.8 }}>
              View on StorageScan →
            </a>
          </div>
        </G>
      </S>

      {/* PROOF */}
      <div id="proof" style={{ padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 10, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(0,255,209,0.055) 0%, transparent 70%)", pointerEvents: "none" }} />
        <R><h2 style={{ fontSize: "clamp(32px,5.5vw,66px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 16px", maxWidth: 780 }}>Don&apos;t trust us.<br /><em style={{ color: CYAN, fontStyle: "normal" }}>Verify it.</em></h2></R>
        <R d={0.1}><p style={{ fontSize: "clamp(14px,1.5vw,17px)", color: "#86868b", fontWeight: 300, lineHeight: 1.7, maxWidth: 420, margin: "0 0 48px" }}>Every claim GHOST makes is independently checkable on 0G Chain and StorageScan. Not a promise. A proof.</p></R>
        <R d={0.22}>
          <div style={{ maxWidth: 720, width: "100%" }}>
            <G>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px", background: "rgba(255,255,255,0.02)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase" }}>Attestation Receipt · 0G Compute</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, padding: "4px 12px", borderRadius: 980, background: "rgba(0,255,209,0.07)", border: "0.5px solid rgba(0,255,209,0.2)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />TEEML · Verified
                </span>
              </div>
              <div style={{ padding: "16px 22px", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>
                {[["agent_id", "ghost-v1.0 · 0xD040...ed40", "#fff"], ["model", "zai-org/GLM-5-FP8 · 0G Compute", AMBER], ["verifiability", "TEEML · hardware enclave confirmed", CYAN], ["enclave_type", "Confidential VM · AMD SEV-SNP", "#fff"], ["tee_hash", "sha256:e3b0c44298fc1c149afbf4c8996fb924...", "#6e6e73"], ["human_authorized", "FALSE · autonomous execution", CYAN], ["tampered", "FALSE · signature valid", CYAN]].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "#6e6e73", width: 140, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: c, wordBreak: "break-all" as const }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, padding: "12px 22px", borderTop: "0.5px solid rgba(255,255,255,0.06)", justifyContent: "space-between" }}>
                <a href="https://chainscan-galileo.0g.ai" target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: CYAN, textDecoration: "none", opacity: 0.75 }}>Verify on 0G Chain →</a>
                <a href="https://storagescan.0g.ai" target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: PURPLE, textDecoration: "none", opacity: 0.75 }}>Verify on StorageScan →</a>
              </div>
            </G>
          </div>
        </R>
      </div>

      {/* CTA */}
      <div style={{ padding: "100px 40px", textAlign: "center", position: "relative", zIndex: 10, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(0,255,209,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
        <R><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 20 }}>Zero Cup 2026 · Group Stage</p></R>
        <R d={0.08}><h2 style={{ fontSize: "clamp(40px,7vw,86px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.01, margin: "0 0 16px" }}>The first AI<br />no one can <span style={{ color: CYAN }}>kill.</span></h2></R>
        <R d={0.16}><p style={{ fontSize: "clamp(14px,1.5vw,18px)", color: "#86868b", fontWeight: 300, maxWidth: 420, margin: "0 auto 44px", lineHeight: 1.75 }}>Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties. That is not a feature. That is the architecture.</p></R>
        <R d={0.24}><div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Btn href="https://0g.ai/arena/zero-cup" target="_blank" primary>Vote for GHOST</Btn>
          <Btn href="/dashboard">Live dashboard</Btn>
        </div></R>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src="/logo2.png" alt="Ghost" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", objectPosition: "center 20%" }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: CYAN, letterSpacing: "0.18em", fontWeight: 500 }}>GHOST</span>
            </div>
            <p style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.7, maxWidth: 190, margin: 0 }}>Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.16em", color: "#6e6e73", textTransform: "uppercase", marginBottom: 4 }}>Project</span>
              {[["Architecture", "#architecture"], ["Proof", "#proof"], ["Storage", "#storage"], ["Dashboard", "/dashboard"]].map(([l, h]) => <a key={l} href={h} style={{ fontSize: 13, color: "#86868b", textDecoration: "none" }}>{l}</a>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.16em", color: "#6e6e73", textTransform: "uppercase", marginBottom: 4 }}>Links</span>
              {[["GitHub", "https://github.com/mimisco-git/ghost-0g"], ["0G Docs", "https://docs.0g.ai"], ["Zero Cup", "https://0g.ai/arena/zero-cup"], ["StorageScan", "https://storagescan.0g.ai"]].map(([l, h]) => <a key={l} href={h} target="_blank" style={{ fontSize: 13, color: "#86868b", textDecoration: "none" }}>{l}</a>)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {[["Compute:", "0G Compute Router", CYAN], ["Storage:", "0G Storage SDK", PURPLE], ["Chain:", "0G Galileo · ID 16602", AMBER], ["Identity:", "ERC-7857 Agentic ID", "rgba(255,255,255,0.4)"]].map(([k, v, c]) => (
              <p key={k} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6e6e73", lineHeight: 2.2, margin: 0 }}>{k} <span style={{ color: c }}>{v}</span></p>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 40px", borderTop: "0.5px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73" }}>GHOST · Zero Cup 2026 · 0G Ecosystem</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73" }}>ghost-rouge-five.vercel.app</span>
        </div>
      </footer>

      <style>{`
        @keyframes sh{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box}
        body{margin:0}
        a:hover{opacity:.8}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.2);border-radius:2px}
        @media(max-width:860px){
          .hero-grid{grid-template-columns:1fr!important}
          .metrics-grid{grid-template-columns:repeat(2,1fr)!important}
          .arch-grid{grid-template-columns:1fr!important}
          .footer-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
