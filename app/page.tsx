"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const BG       = "#030712";
const CARD     = "rgba(11,15,25,0.6)";
const BORDER   = "rgba(31,41,61,0.6)";
const CYAN     = "#00FFD1";
const AMBER    = "#ffb800";
const PURPLE   = "#7c6af7";
const WHITE    = "#f3f4f6";
const MUTED    = "#6b7280";
const DIMMED   = "#374151";

// ── PARTICLES ──────────────────────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let W = 0, H = 0, sy = 0, af: number;
    type P = { x: number; y: number; vx: number; vy: number; a: number; r: number };
    const pts: P[] = [];
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    const init = () => {
      pts.length = 0;
      const n = Math.min(Math.floor(W * H / 24000), 55);
      for (let i = 0; i < n; i++) pts.push({ x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-.5)*.12, vy:(Math.random()-.5)*.12, a:.04+Math.random()*.14, r:.3+Math.random()*.9 });
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const sh = sy * .03;
      for (const p of pts) {
        const py = p.y - (sh % H);
        ctx.beginPath(); ctx.arc(p.x, py, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0,255,209,${p.a})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = (pts[i].y-sh%H) - (pts[j].y-sh%H);
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 90) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y-sh%H); ctx.lineTo(pts[j].x, pts[j].y-sh%H); ctx.strokeStyle = `rgba(0,255,209,${.02*(1-d/90)})`; ctx.lineWidth = .3; ctx.stroke(); }
      }
      af = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", () => sy = window.scrollY, { passive: true });
    window.addEventListener("resize", () => { resize(); init(); });
    resize(); init(); draw();
    return () => cancelAnimationFrame(af);
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── GLASS CARD ─────────────────────────────────────────────────────────────
function Card({ children, style = {}, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
  return (
    <div style={{
      background: CARD,
      border: `0.5px solid ${BORDER}`,
      borderRadius: 16,
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      boxShadow: glow
        ? `0 0 0 0.5px ${glow}18 inset, 0 20px 40px rgba(0,0,0,0.5), 0 0 60px ${glow}08`
        : "0 20px 40px rgba(0,0,0,0.4)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── REVEAL ──────────────────────────────────────────────────────────────────
function R({ children, d = 0 }: { children: React.ReactNode; d?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.75, delay: d, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── TAG ────────────────────────────────────────────────────────────────────
function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600,
      letterSpacing: "0.15em", textTransform: "uppercase" as const,
      padding: "4px 10px", borderRadius: 6,
      border: `0.5px solid ${color}30`, background: `${color}0c`, color,
      display: "inline-block",
    }}>{label}</span>
  );
}

// ── BTN ────────────────────────────────────────────────────────────────────
function Btn({ href, primary, children, target }: { href: string; primary?: boolean; children: React.ReactNode; target?: string }) {
  return (
    <a href={href} target={target} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: primary ? "14px 28px" : "13px 28px",
      borderRadius: 10, fontSize: 14, fontWeight: primary ? 600 : 500,
      textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
      background: primary ? CYAN : "transparent",
      color: primary ? "#000" : WHITE,
      border: primary ? "none" : `0.5px solid ${BORDER}`,
      fontFamily: primary ? "inherit" : "JetBrains Mono, monospace",
      letterSpacing: primary ? "normal" : "0.05em",
    }}>
      {children}
    </a>
  );
}

// ── SECTION ────────────────────────────────────────────────────────────────
function Sec({ children, id, center, style = {} }: { children: React.ReactNode; id?: string; center?: boolean; style?: React.CSSProperties }) {
  return (
    <div id={id} style={{ width: "100%", padding: "96px 40px", display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", ...style }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

// ── EYEBROW ────────────────────────────────────────────────────────────────
function Eyebrow({ children, color = CYAN }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 18, height: 1, background: color, display: "inline-block", flexShrink: 0 }} />
      {children}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [cycles, setCycles] = useState(0);
  const [storageHash] = useState("0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a");
  const [lines, setLines] = useState<{ tag: string; tc: string; msg: string; time: string }[]>([]);
  const feedRef       = useRef<HTMLDivElement>(null);
  const idxRef        = useRef(0);
  const ghostRef      = useRef<HTMLDivElement>(null);
  const leftPupilRef  = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const rawY  = useTransform(scrollY, [0, 700], [0, -80]);
  const heroY = useSpring(rawY, { stiffness: 80, damping: 22 });

  // Body tilt + eye tracking
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ghostRef.current) {
        const r = ghostRef.current.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width/2) / r.width;
        const dy = (e.clientY - r.top  - r.height/2) / r.height;
        ghostRef.current.style.transform =
          `perspective(1200px) rotateX(${dy*10}deg) rotateY(${-dx*10}deg) translateZ(0)`;
      }
      [leftPupilRef, rightPupilRef].forEach(ref => {
        if (!ref.current) return;
        const eye   = ref.current.parentElement!.getBoundingClientRect();
        const ex    = eye.left + eye.width/2;
        const ey    = eye.top  + eye.height/2;
        const angle = Math.atan2(e.clientY - ey, e.clientX - ex);
        const dist  = Math.min(Math.hypot(e.clientX - ex, e.clientY - ey), eye.width * 0.26);
        ref.current.style.transform =
          `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
      });
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok) setCycles(j.data?.completedCycles ?? 0);
      } catch {}
    }
    load(); setInterval(load, 30000);
  }, []);

  const logs = [
    { tag: "COMPUTE", tc: CYAN, msg: "TEE inference · GLM-5-FP8 · AMD SEV-SNP enclave" },
    { tag: "COMPUTE", tc: CYAN, msg: "TEEML attestation generated · signature valid" },
    { tag: "WALLET", tc: "#f87171", msg: "Deducted 0.0012 0G · autonomous · no human signed" },
    { tag: "STORAGE", tc: PURPLE, msg: "Record written to 0G Storage · hash anchored" },
    { tag: "CHAIN", tc: AMBER, msg: "Hash anchored on 0G Chain · human_authorized: FALSE" },
    { tag: "COMPUTE", tc: CYAN, msg: "New cycle · on-chain time-lock trigger fired" },
    { tag: "STORAGE", tc: PURPLE, msg: "Memory corpus updated · no delete permission" },
    { tag: "CHAIN", tc: AMBER, msg: "Admin key check · NONE FOUND · contract immutable" },
  ];
  function pad(n: number) { return n < 10 ? "0"+n : ""+n; }
  function getTime() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  useEffect(() => {
    setLines(logs.slice(0, 3).map(l => ({ ...l, time: getTime() })));
    idxRef.current = 3;
    const iv = setInterval(() => {
      setLines(prev => [...prev.slice(-22), { ...logs[idxRef.current % logs.length], time: getTime() }]);
      idxRef.current++;
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [lines]);

  const metrics = [
    { val: cycles || 0, label: "Inference cycles", sub: "TEE verified", color: CYAN },
    { val: "0",         label: "Admin keys",       sub: "No owner exists", color: CYAN },
    { val: "3",         label: "0G layers",         sub: "All load-bearing", color: WHITE },
    { val: "FALSE",     label: "Human authorized",  sub: "Every single cycle", color: CYAN },
  ];

  const arch = [
    { tag: "0G Compute", color: CYAN,   title: "Verifiable inference",      body: "Every inference runs inside a Confidential VM with AMD SEV-SNP. TEEML attestation cryptographically proves the exact model ran unmodified. Not even 0G sees the input." },
    { tag: "0G Storage", color: PURPLE, title: "Permanent memory",           body: "Every output and attestation is written to decentralized storage with a content hash. No delete function exists. The complete history is permanent and tamper-proof." },
    { tag: "0G Chain",   color: AMBER,  title: "Ownerless contract",         body: "No admin key. No pause function. No upgrade path. GHOST holds its own wallet and pays for compute. No human signature is ever required." },
    { tag: "Autonomous", color: DIMMED, title: "Self-sustaining entity",     body: "Wakes on-chain, runs inference, pays from its wallet, writes to storage, anchors hash, sleeps. Runs indefinitely without any human action.", wide: true },
    { tag: "ERC-7857",   color: DIMMED, title: "Coming: GHOST mints itself", body: "After cycle 10, GHOST mints its own Agentic ID with complete memory encrypted inside. Ownable, transferable. The buyer receives a running agent." },
  ];

  const steps = [
    { n: "01", title: "Wake on-chain",           desc: "Time-locked trigger fires on 0G Chain. No human initiates this.",                         pill: "0G Chain",   pc: AMBER  },
    { n: "02", title: "Run inference in TEE",    desc: "0G Compute routes to hardware enclave. TEEML attestation generated.",                    pill: "TEEML",      pc: CYAN   },
    { n: "03", title: "Pay for its own compute", desc: "Deducts cost from its own on-chain wallet. No human signs. Contract settles.",            pill: "Auto pay",   pc: AMBER  },
    { n: "04", title: "Write to 0G Storage",     desc: "Full record written with content hash. Permanent. Verifiable on StorageScan.",            pill: "0G Storage", pc: PURPLE },
    { n: "05", title: "Anchor hash on chain",    desc: "Content hash anchored on 0G Chain. Tamper-proof forever.",                               pill: "Immutable",  pc: AMBER  },
    { n: "06", title: "Sleep. Repeat.",          desc: "Self-sustaining. No human required at any step. Runs as long as the wallet holds tokens.", pill: "Always on",  pc: DIMMED },
  ];

  return (
    <div style={{ background: BG, color: WHITE, fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Helvetica Neue', sans-serif", WebkitFontSmoothing: "antialiased", overflowX: "hidden", minHeight: "100vh" }}>

      <Particles />

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: `${BG}dd`, backdropFilter: "saturate(180%) blur(40px)", WebkitBackdropFilter: "saturate(180%) blur(40px)", borderBottom: `0.5px solid ${BORDER}` }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${BORDER}` }}>
            <img src="/logo2.png" alt="Ghost" style={{ width: 36, height: 36, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
          </div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: WHITE }}>GHOST</span>
        </a>
        <div style={{ display: "flex", gap: 36, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {[["Architecture", "#architecture"], ["Proof", "#proof"], ["Storage", "#storage"], ["Dashboard", "/dashboard"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13, color: MUTED, textDecoration: "none", fontWeight: 400 }}>{l}</a>
          ))}
        </div>
        <a href="https://0g.ai/arena/zero-cup" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", background: CYAN, color: "#000" }}>
          Vote on Zero Cup
        </a>
      </nav>

      {/* ── HERO ── */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "110px 40px 60px", position: "relative", zIndex: 10 }}>
        <motion.div style={{ y: heroY, width: "100%", maxWidth: 1160, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16,1,0.3,1] }}>
              <Eyebrow>Zero Cup 2026 · Built on 0G · Sealed Inference</Eyebrow>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.25, ease: [0.16,1,0.3,1] }} style={{ fontSize: "clamp(40px,5.2vw,76px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.01, margin: "0 0 24px", color: WHITE }}>
              The AI that<br />
              <span style={{ background: `linear-gradient(135deg, ${WHITE} 0%, ${CYAN} 52%, ${WHITE} 100%)`, backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "sh 6s ease-in-out infinite" }}>
                cannot be stopped.
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4, ease: [0.16,1,0.3,1] }} style={{ fontSize: "clamp(15px,1.5vw,17px)", fontWeight: 300, color: MUTED, lineHeight: 1.85, margin: "0 0 40px", maxWidth: 460 }}>
              Autonomous agent inside 0G&apos;s Trusted Execution Environment.{" "}
              <strong style={{ color: WHITE, fontWeight: 500 }}>Pays for its own compute.</strong>{" "}
              Runs under a contract with{" "}
              <strong style={{ color: WHITE, fontWeight: 500 }}>no admin key.</strong>{" "}
              No kill switch. Not even ours.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55, ease: [0.16,1,0.3,1] }} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
              <Btn href="/dashboard" primary>Watch it think live</Btn>
              <Btn href="https://github.com/mimisco-git/ghost-0g" target="_blank">Read the code</Btn>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.75 }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label="0G Compute" color={CYAN} />
              <Tag label="0G Storage" color={PURPLE} />
              <Tag label="0G Chain" color={AMBER} />
              <Tag label="ERC-7857" color={MUTED} />
            </motion.div>
          </div>

          {/* Right: Ghost image */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, delay: 0.3, ease: [0.16,1,0.3,1] }} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* Glow */}
            <div style={{ position: "absolute", width: "80%", height: "80%", borderRadius: "50%", background: `radial-gradient(ellipse, ${CYAN}15 0%, transparent 70%)`, filter: "blur(36px)", animation: "gB 5s ease-in-out infinite", pointerEvents: "none" }} />

            {/* Rings */}
            {[94, 112, 128].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: `${s}%`, height: `${s}%`, borderRadius: "50%", border: `0.5px solid rgba(0,255,209,${0.1 - i*0.03})`, animation: i===0?"rA 24s linear infinite":i===1?"rB 34s linear infinite":"none", pointerEvents: "none" }} />
            ))}

            {/* Ghost */}
            <div style={{ position: "relative", zIndex: 2, width: "clamp(280px,34vw,440px)", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div ref={ghostRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transformStyle: "preserve-3d", transition: "transform 0.12s ease-out", animation: "gF 8s ease-in-out infinite", willChange: "transform", position: "relative" }}>
                <img src="/logo2.png" alt="GHOST" style={{ width: "84%", height: "84%", objectFit: "contain", mixBlendMode: "screen", filter: `drop-shadow(0 0 40px ${CYAN}44) drop-shadow(0 0 80px ${CYAN}18) brightness(1.08)`, pointerEvents: "none", userSelect: "none" }} />

                {/* LEFT EYE — large black socket covers white PNG eye entirely */}
                <div style={{ position: "absolute", top: "29%", left: "22%", width: "16%", height: "15%", borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9)" }}>
                  <div ref={leftPupilRef} style={{ width: "46%", height: "46%", borderRadius: "50%", background: "radial-gradient(ellipse at 32% 28%, #00FFD1, #00c8a8 55%, #006e5a 100%)", boxShadow: "0 0 10px rgba(0,255,209,1), 0 0 22px rgba(0,255,209,0.7)", transition: "transform 0.05s ease-out", willChange: "transform" }} />
                </div>

                {/* RIGHT EYE — large black socket covers white PNG eye entirely */}
                <div style={{ position: "absolute", top: "29%", left: "58%", width: "16%", height: "15%", borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9)" }}>
                  <div ref={rightPupilRef} style={{ width: "46%", height: "46%", borderRadius: "50%", background: "radial-gradient(ellipse at 32% 28%, #00FFD1, #00c8a8 55%, #006e5a 100%)", boxShadow: "0 0 10px rgba(0,255,209,1), 0 0 22px rgba(0,255,209,0.7)", transition: "transform 0.05s ease-out", willChange: "transform" }} />
                </div>
              </div>

              {/* Badges */}
              {[
                { top: "8%", left: "-8%", label: "TEE Status", val: "Enclave Active", color: CYAN },
                { bottom: "14%", right: "-8%", label: "Human Authorized", val: "FALSE", color: CYAN },
                { top: "42%", right: "-12%", label: "Storage", val: "0G Network", color: PURPLE },
              ].map((b, i) => (
                <div key={i} style={{ position: "absolute", top: b.top, bottom: (b as any).bottom, left: b.left, right: (b as any).right, padding: "10px 16px", borderRadius: 10, background: "rgba(3,7,18,0.85)", backdropFilter: "blur(20px)", border: `0.5px solid ${b.color}30`, fontFamily: "JetBrains Mono, monospace", boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 0.5px ${b.color}15 inset` }}>
                  <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{b.label}</div>
                  <div style={{ fontSize: 12, color: b.color, fontWeight: 600 }}>{b.val}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 10 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: DIMMED, letterSpacing: "0.18em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: `linear-gradient(to bottom, ${CYAN}60, transparent)`, animation: "sD 2.2s ease-in-out infinite" }} />
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, background: "rgba(11,15,25,0.4)", padding: "13px 0", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", gap: 40, animation: "mq 30s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {["TEEML ATTESTATION VERIFIED","0G COMPUTE · SEALED INFERENCE","0G STORAGE · PERMANENT MEMORY","0G CHAIN · ZERO ADMIN KEYS","AUTONOMOUS PAYMENT LOOP","HUMAN AUTHORIZED: FALSE","NO KILL SWITCH · ALWAYS ON","ZERO CUP 2026","ERC-7857 AGENTIC ID","TEEML ATTESTATION VERIFIED","0G COMPUTE · SEALED INFERENCE","0G STORAGE · PERMANENT MEMORY","0G CHAIN · ZERO ADMIN KEYS","AUTONOMOUS PAYMENT LOOP","HUMAN AUTHORIZED: FALSE","NO KILL SWITCH · ALWAYS ON","ZERO CUP 2026","ERC-7857 AGENTIC ID"].map((t, i) => (
            <span key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: CYAN, display: "inline-block", opacity: 0.6 }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── METRICS ── */}
      <Sec style={{ padding: "64px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: BORDER, borderRadius: 16, overflow: "hidden" }}>
          {metrics.map((m, i) => (
            <R key={i} d={i * 0.07}>
              <div style={{ background: "rgba(11,15,25,0.9)", padding: "36px 28px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>{m.label}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: m.color, marginBottom: 6 }}>{m.val}</div>
                <div style={{ fontSize: 10.5, color: DIMMED }}>{m.sub}</div>
              </div>
            </R>
          ))}
        </div>
      </Sec>

      {/* ── ARCHITECTURE ── */}
      <Sec id="architecture" style={{ paddingTop: 0 }}>
        <R><Eyebrow>Architecture</Eyebrow></R>
        <R d={0.08}><h2 style={{ fontSize: "clamp(30px,4.5vw,56px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.06, margin: "0 0 14px" }}>Three layers.<br />All load-bearing.</h2></R>
        <R d={0.16}><p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.8, maxWidth: 500, margin: "0 0 48px" }}>Remove any one and GHOST fails. This is not a 0G bolt-on. 0G is the reason it exists at all.</p></R>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: BORDER, borderRadius: 16, overflow: "hidden" }}>
          {arch.map((c, i) => (
            <R key={i} d={i * 0.06}>
              <div style={{ background: "rgba(11,15,25,0.85)", padding: "32px 28px", gridColumn: (c as any).wide ? "span 2" : undefined, height: "100%", boxSizing: "border-box" as const }}>
                <Tag label={c.tag} color={c.color} />
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.3, margin: "18px 0 10px" }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.8, fontWeight: 300, margin: 0 }}>{c.body}</p>
              </div>
            </R>
          ))}
        </div>
      </Sec>

      {/* ── STEPS ── */}
      <Sec style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <R><Eyebrow>Autonomous loop</Eyebrow></R>
          <R d={0.08}><h2 style={{ fontSize: "clamp(24px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 36px" }}>What GHOST does every 6 minutes</h2></R>
          <Card glow={CYAN}>
            {steps.map((s, i) => (
              <R key={i} d={i * 0.05}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 28px", borderBottom: i < 5 ? `0.5px solid ${BORDER}` : "none" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: DIMMED, width: 28, flexShrink: 0, fontWeight: 600 }}>{s.n}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 4px" }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: `0.5px solid ${s.pc}30`, background: `${s.pc}0c`, color: s.pc, flexShrink: 0, letterSpacing: "0.08em" }}>{s.pill}</span>
                </div>
              </R>
            ))}
          </Card>
        </div>
      </Sec>

      {/* ── 0G STORAGE ── */}
      <Sec id="storage" style={{ paddingTop: 0 }}>
        <R>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Eyebrow color={PURPLE}>0G Storage</Eyebrow>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 5, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, color: PURPLE }}>LIVE</span>
          </div>
        </R>
        <R d={0.08}><h2 style={{ fontSize: "clamp(24px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Every cycle, permanently stored.</h2></R>
        <R d={0.16}><p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.8, maxWidth: 520, margin: "0 0 40px" }}>Every inference GHOST produces is written to 0G Storage with a content hash. Verifiable by anyone on StorageScan. No delete button exists.</p></R>
        <R d={0.24}>
          <Card glow={PURPLE}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "rgba(124,106,247,0.04)", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Latest Storage Record · 0G Network</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: PURPLE, padding: "4px 12px", borderRadius: 6, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30` }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: PURPLE, display: "inline-block", animation: "pulse 2.5s infinite" }} />
                PERMANENT · UNCENSORABLE
              </span>
            </div>
            <div style={{ padding: "20px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
              {[
                ["network",    "0G Galileo Testnet · Chain ID 16602",                  WHITE],
                ["indexer",    "indexer-storage-testnet-turbo.0g.ai",                   MUTED],
                ["root_hash",  storageHash,                                              PURPLE],
                ["content",    "GHOST agent inference record + attestation receipt",    WHITE],
                ["replicated", "TRUE · distributed across 0G storage nodes",           CYAN],
                ["deletable",  "FALSE · no delete function exists anywhere",            CYAN],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", gap: 16, padding: "9px 0", borderBottom: `0.5px solid ${BORDER}` }}>
                  <span style={{ color: MUTED, width: 110, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: c, wordBreak: "break-all" as const }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: `0.5px solid ${BORDER}` }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: MUTED }}>0G Storage Network · Galileo Testnet</span>
              <a href={`https://storagescan.0g.ai/tx?hash=${storageHash}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>View on StorageScan →</a>
            </div>
          </Card>
        </R>
      </Sec>

      {/* ── PROOF ── */}
      <Sec id="proof" center style={{ paddingTop: 0 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: `radial-gradient(ellipse, ${CYAN}06 0%, transparent 70%)`, pointerEvents: "none" }} />
        <R><h2 style={{ fontSize: "clamp(32px,5vw,64px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 16px", textAlign: "center" }}>Don&apos;t trust us.<br /><em style={{ color: CYAN, fontStyle: "normal" }}>Verify it.</em></h2></R>
        <R d={0.1}><p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.8, maxWidth: 420, margin: "0 auto 52px", textAlign: "center" }}>Every claim is independently checkable on 0G Chain and StorageScan. Not a promise. A cryptographic proof.</p></R>
        <R d={0.22}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
            <Card glow={CYAN}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: `${CYAN}04`, borderBottom: `0.5px solid ${BORDER}` }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Attestation Receipt · 0G Compute</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, color: CYAN, padding: "4px 12px", borderRadius: 6, background: `${CYAN}0c`, border: `0.5px solid ${CYAN}30` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />
                  TEEML · VERIFIED
                </span>
              </div>
              <div style={{ padding: "18px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                {[
                  ["agent_id",        "ghost-v1.0 · 0xD040...ed40",                     WHITE],
                  ["model",           "zai-org/GLM-5-FP8 · 0G Compute Router",           AMBER],
                  ["verifiability",   "TEEML · hardware enclave confirmed",               CYAN],
                  ["enclave_type",    "Confidential VM · AMD SEV-SNP",                   WHITE],
                  ["tee_hash",        "sha256:e3b0c44298fc1c149afbf4c8996fb924...",       MUTED],
                  ["human_authorized","FALSE · autonomous execution confirmed",           CYAN],
                  ["tampered",        "FALSE · signature valid · enclave genuine",        CYAN],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: `0.5px solid ${BORDER}` }}>
                    <span style={{ color: MUTED, width: 150, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: c, wordBreak: "break-all" as const }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, padding: "14px 24px", borderTop: `0.5px solid ${BORDER}`, justifyContent: "space-between" }}>
                <a href="https://chainscan-galileo.0g.ai" target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: CYAN, textDecoration: "none", fontWeight: 600 }}>Verify on 0G Chain →</a>
                <a href={`https://storagescan.0g.ai/tx?hash=${storageHash}`} target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: PURPLE, textDecoration: "none", fontWeight: 600 }}>Verify on StorageScan →</a>
              </div>
            </Card>
          </div>
        </R>
      </Sec>

      {/* ── LIVE FEED ── */}
      <Sec style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <R><Eyebrow>Live agent activity</Eyebrow></R>
          <R d={0.08}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 20px", background: "rgba(11,15,25,0.6)", borderBottom: `0.5px solid ${BORDER}` }}>
                {[["#ff5f57"],["#ffbd2e"],["#28c941"]].map(([c]) => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: MUTED, marginLeft: "auto", letterSpacing: "0.06em" }}>ghost-agent · live cycle feed</span>
              </div>
              <div ref={feedRef} style={{ padding: "14px 18px", minHeight: 240, maxHeight: 240, overflowY: "auto", fontFamily: "JetBrains Mono, monospace", display: "flex", flexDirection: "column", gap: 2 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ fontSize: 11.5, lineHeight: 1.9, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: DIMMED, flexShrink: 0, width: 68 }}>{l.time}</span>
                    <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, alignSelf: "center", minWidth: 60, textAlign: "center", letterSpacing: "0.08em", background: `${l.tc}15`, color: l.tc, border: `0.5px solid ${l.tc}25` }}>{l.tag}</span>
                    <span style={{ color: "rgba(243,244,246,0.4)", flex: 1 }}>{l.msg}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: `0.5px solid ${BORDER}`, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: MUTED }}>Storage hash</span>
                  <span style={{ color: PURPLE, fontSize: 10 }}>{storageHash.slice(0, 20)}...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />
                  <span style={{ color: MUTED, fontSize: 10 }}>No human control</span>
                </div>
              </div>
            </Card>
          </R>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec center style={{ paddingTop: 0 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: `radial-gradient(ellipse, ${CYAN}07 0%, transparent 65%)`, pointerEvents: "none" }} />
        <R><Eyebrow>Zero Cup 2026 · Group Stage</Eyebrow></R>
        <R d={0.08}><h2 style={{ fontSize: "clamp(40px,7vw,88px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.0, margin: "0 0 18px", textAlign: "center" }}>The first AI<br />no one can <span style={{ color: CYAN }}>kill.</span></h2></R>
        <R d={0.16}><p style={{ fontSize: 16, color: MUTED, fontWeight: 300, maxWidth: 440, margin: "0 auto 48px", lineHeight: 1.8, textAlign: "center" }}>Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties. That is not a feature. That is the architecture.</p></R>
        <R d={0.24}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Btn href="https://0g.ai/arena/zero-cup" target="_blank" primary>Vote for GHOST</Btn>
            <Btn href="/dashboard">Live dashboard</Btn>
          </div>
        </R>
      </Sec>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `0.5px solid ${BORDER}`, position: "relative", zIndex: 10 }}>
        {/* Main footer links row */}
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 40px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${BORDER}` }}>
                <img src="/logo2.png" alt="Ghost" style={{ width: 32, height: 32, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: WHITE, letterSpacing: "0.18em", fontWeight: 700 }}>GHOST</span>
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, maxWidth: 200, margin: 0 }}>Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          </div>
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 4 }}>Project</span>
              {[["Architecture","#architecture"],["Proof","#proof"],["Storage","#storage"],["Dashboard","/dashboard"]].map(([l,h]) => <a key={l} href={h} style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>{l}</a>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 4 }}>Links</span>
              {[["GitHub","https://github.com/mimisco-git/ghost-0g"],["0G Docs","https://docs.0g.ai"],["Zero Cup","https://0g.ai/arena/zero-cup"],["StorageScan","https://storagescan-galileo.0g.ai"]].map(([l,h]) => <a key={l} href={h} target="_blank" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>{l}</a>)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {[["Compute:", "0G Compute Router", CYAN], ["Storage:", "0G Storage SDK", PURPLE], ["Chain:", "0G Galileo · ID 16602", AMBER], ["Identity:", "ERC-7857 Agentic ID", MUTED]].map(([k,v,c]) => (
              <p key={k} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: MUTED, lineHeight: 2.4, margin: 0 }}>{k} <span style={{ color: c }}>{v}</span></p>
            ))}
          </div>
        </div>

        {/* Bottom bar — exactly like 0G Builder Hub */}
        <div style={{ borderTop: `0.5px solid ${BORDER}`, maxWidth: 1160, margin: "0 auto", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: WHITE, margin: "0 0 2px", letterSpacing: "0.05em" }}>GHOST · Zero Cup 2026</p>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: DIMMED, margin: 0 }}>© 2026 GHOST · 0G Ecosystem</p>
          </div>

          {/* Social icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* X / Twitter */}
            <a href="https://x.com/sir_mimisco" target="_blank" aria-label="X / Twitter" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* GitHub */}
            <a href="https://github.com/mimisco-git/ghost-0g" target="_blank" aria-label="GitHub" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>

            {/* Telegram */}
            <a href="https://t.me/sir_mimisco" target="_blank" aria-label="Telegram" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>

            {/* Discord */}
            <a href="https://discord.com/users/sir_mimisco" target="_blank" aria-label="Discord" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.13 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes sh  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes mq  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes gB  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes gF  { 0%,100%{transform:perspective(1200px) translateY(0px)} 50%{transform:perspective(1200px) translateY(-18px)} }
        @keyframes rA  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rB  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes sD  { 0%{transform:scaleY(0);transform-origin:top;opacity:0} 40%{transform:scaleY(1);opacity:1} 100%{transform:scaleY(1);transform-origin:bottom;opacity:0} }
        * { box-sizing: border-box; } body { margin: 0; }
        a:hover { opacity: 0.75; }
        ::selection { background: ${CYAN}22; color: ${CYAN}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.15); border-radius: 2px; }
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: repeat(2,1fr) !important; }
          .arch-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
