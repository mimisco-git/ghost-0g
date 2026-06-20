"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface LogLine { tag: string; tagColor: string; msg: string; time: string; }

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const CYAN = "#00FFD1";
const AMBER = "#ffb800";
const PURPLE = "#b08fff";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  }),
};

const logs = [
  { tag: "COMPUTE", tagColor: CYAN, msg: "TEE inference started · GLM-5-FP8 · AMD SEV-SNP enclave" },
  { tag: "COMPUTE", tagColor: CYAN, msg: "TEEML attestation generated · signature valid" },
  { tag: "WALLET", tagColor: "#ff7070", msg: "Deducted 0.0012 0G · no human signed · autonomous" },
  { tag: "STORAGE", tagColor: PURPLE, msg: "Inference record written to 0G Storage · hash anchored" },
  { tag: "CHAIN", tagColor: AMBER, msg: "Hash anchored on 0G Chain · human_authorized: FALSE" },
  { tag: "COMPUTE", tagColor: CYAN, msg: "New cycle · on-chain time-lock trigger fired" },
  { tag: "STORAGE", tagColor: PURPLE, msg: "Memory corpus updated · no delete permission exists" },
  { tag: "CHAIN", tagColor: AMBER, msg: "Admin key check · NONE FOUND · contract immutable" },
  { tag: "COMPUTE", tagColor: CYAN, msg: "Response signed by enclave · verification passed" },
];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function getTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ── GHOST ORB (CSS-based, Vision Pro quality) ──────────────────────────────
function GhostOrb() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!orbRef.current) return;
      const r = orbRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      orbRef.current.style.setProperty("--rx", `${dy * 10}deg`);
      orbRef.current.style.setProperty("--ry", `${-dx * 10}deg`);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <div ref={orbRef} style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", perspective: "1200px", "--rx": "0deg", "--ry": "0deg" } as React.CSSProperties}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", width: "85%", height: "85%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,209,0.16) 0%, rgba(0,255,209,0.04) 50%, transparent 70%)", filter: "blur(24px)", animation: "glowBreathe 5s ease-in-out infinite" }} />

      {/* Rings */}
      {[94, 112, 128].map((size, i) => (
        <div key={i} style={{ position: "absolute", width: `${size}%`, height: `${size}%`, borderRadius: "50%", border: `0.5px solid rgba(0,255,209,${0.14 - i * 0.04})`, animation: i === 0 ? "ringSpinA 20s linear infinite" : i === 1 ? "ringSpinB 30s linear infinite" : "none" }} />
      ))}

      {/* Main orb */}
      <div style={{ width: "68%", height: "68%", borderRadius: "50%", position: "relative", transform: "rotateX(var(--rx)) rotateY(var(--ry))", transformStyle: "preserve-3d", transition: "transform 0.1s ease-out", animation: "orbFloat 8s ease-in-out infinite", willChange: "transform" }}>
        {/* Ceramic body */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 36% 30%, #ffffff 0%, #eaf7f3 25%, #c8ede6 55%, #9fd8cc 80%, #78c0b5 100%)", boxShadow: "0 0 0 1px rgba(0,255,209,0.18), 0 12px 40px rgba(0,0,0,0.45), 0 32px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 3px rgba(0,0,0,0.06)" }} />
        {/* Primary specular — Vision Pro front glass */}
        <div style={{ position: "absolute", top: "4%", left: "10%", width: "55%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.12) 70%, transparent 100%)", transform: "rotate(-18deg)", filter: "blur(1.5px)" }} />
        {/* Secondary rim specular */}
        <div style={{ position: "absolute", top: "15%", left: "6%", width: "16%", height: "44%", borderRadius: "50%", background: "linear-gradient(155deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.08) 100%)", filter: "blur(3px)" }} />
        {/* Cyan subsurface */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 58% 68%, rgba(0,255,209,0.22) 0%, rgba(0,255,209,0.07) 50%, transparent 75%)", animation: "innerPulse 5s ease-in-out infinite" }} />
        {/* Bottom cyan rim */}
        <div style={{ position: "absolute", bottom: 0, left: "15%", width: "70%", height: "32%", background: "radial-gradient(ellipse at 50% 100%, rgba(0,255,209,0.32) 0%, rgba(0,255,209,0.1) 60%, transparent 100%)", filter: "blur(8px)" }} />
        {/* Equator band */}
        <div style={{ position: "absolute", top: "47%", left: "6%", right: "6%", height: "10%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.1) 70%, transparent)", borderRadius: "50%", filter: "blur(2px)" }} />
        {/* Glass edge */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 0 0 2px rgba(255,255,255,0.07)" }} />

        {/* Left eye */}
        <div style={{ position: "absolute", width: "17%", height: "20%", top: "33%", left: "24%", borderRadius: "50%", background: "radial-gradient(ellipse at 38% 32%, #1a1a1a 0%, #000 60%)", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 2px rgba(255,255,255,0.08)" }}>
          <div style={{ position: "absolute", width: "52%", height: "52%", top: "24%", left: "24%", borderRadius: "50%", background: "radial-gradient(ellipse at 32% 28%, #00FFD1, #00c8a8 55%, #006e5a 100%)", boxShadow: "0 0 8px rgba(0,255,209,0.9), 0 0 16px rgba(0,255,209,0.5)", animation: "eyeGlow 4s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: "18%", height: "18%", top: "16%", left: "58%", borderRadius: "50%", background: "#fff", opacity: 0.92 }} />
        </div>

        {/* Right eye */}
        <div style={{ position: "absolute", width: "17%", height: "20%", top: "33%", left: "57%", borderRadius: "50%", background: "radial-gradient(ellipse at 38% 32%, #1a1a1a 0%, #000 60%)", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 2px rgba(255,255,255,0.08)" }}>
          <div style={{ position: "absolute", width: "52%", height: "52%", top: "24%", left: "24%", borderRadius: "50%", background: "radial-gradient(ellipse at 32% 28%, #00FFD1, #00c8a8 55%, #006e5a 100%)", boxShadow: "0 0 8px rgba(0,255,209,0.9), 0 0 16px rgba(0,255,209,0.5)", animation: "eyeGlow 4s ease-in-out infinite 0.4s" }} />
          <div style={{ position: "absolute", width: "18%", height: "18%", top: "16%", left: "58%", borderRadius: "50%", background: "#fff", opacity: 0.92 }} />
        </div>
      </div>

      <style>{`
        @keyframes orbFloat   { 0%,100%{transform:rotateX(var(--rx)) rotateY(var(--ry)) translateY(0)} 50%{transform:rotateX(var(--rx)) rotateY(var(--ry)) translateY(-18px)} }
        @keyframes glowBreathe{ 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes innerPulse { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes eyeGlow    { 0%,100%{box-shadow:0 0 8px rgba(0,255,209,.9),0 0 16px rgba(0,255,209,.5)} 50%{box-shadow:0 0 14px rgba(0,255,209,1),0 0 28px rgba(0,255,209,.7)} }
        @keyframes ringSpinA  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ringSpinB  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>
    </div>
  );
}

// ── GLASS CARD ─────────────────────────────────────────────────────────────
function GlassCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 20,
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      boxShadow: "0 0 0 0.5px rgba(0,255,209,0.05) inset, 0 20px 40px rgba(0,0,0,0.4)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── SECTION WRAPPER ────────────────────────────────────────────────────────
function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "0 40px", ...style }}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {children}
      </div>
    </div>
  );
}

// ── REVEAL ─────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [cycles, setCycles] = useState(0);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [balance, setBalance] = useState("live");
  const feedRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const seed = logs.slice(0, 3).map(l => ({ ...l, time: getTime() }));
    setLines(seed);
    idxRef.current = 3;
    const iv = setInterval(() => {
      const e = logs[idxRef.current % logs.length];
      setLines(prev => [...prev.slice(-23), { ...e, time: getTime() }]);
      idxRef.current++;
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok && j.data?.completedCycles) setCycles(j.data.completedCycles);
      } catch {}
    }
    async function loadBal() {
      try {
        const r = await fetch("/api/wallet", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok && j.data?.balance) setBalance(j.data.balance);
      } catch {}
    }
    load(); loadBal();
    const iv = setInterval(() => { load(); loadBal(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const Tag = ({ label, color }: { label: string; color: string }) => (
    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 980, border: `0.5px solid ${color}33`, background: `${color}11`, color, display: "inline-block" }}>
      {label}
    </span>
  );

  const Btn = ({ href, primary, children, target }: { href: string; primary?: boolean; children: React.ReactNode; target?: string }) => (
    <a href={href} target={target} style={{ display: "inline-block", padding: "14px 28px", borderRadius: 980, fontSize: 15, fontWeight: primary ? 600 : 400, textDecoration: "none", background: primary ? CYAN : "transparent", color: primary ? "#000" : CYAN, border: primary ? "none" : `0.5px solid rgba(0,255,209,0.35)`, transition: "all 0.2s", cursor: "pointer" }}>
      {children}
    </a>
  );

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "-apple-system, 'SF Pro Display', Inter, 'Helvetica Neue', sans-serif", WebkitFontSmoothing: "antialiased", overflowX: "hidden", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: "rgba(0,0,0,0.78)", backdropFilter: "saturate(180%) blur(40px)", WebkitBackdropFilter: "saturate(180%) blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo2.png" alt="Ghost" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", objectPosition: "center 20%", boxShadow: "0 0 0 1px rgba(0,255,209,0.18)" }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 500, letterSpacing: "0.18em", color: CYAN }}>GHOST</span>
        </a>
        <div style={{ display: "flex", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {[["Architecture", "#architecture"], ["Proof", "#proof"], ["Dashboard", "/dashboard"], ["GitHub", "https://github.com/mimisco-git/ghost-0g"]].map(([label, href]) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <Btn href="https://0g.ai/arena/zero-cup" target="_blank">Vote on Zero Cup</Btn>
      </nav>

      {/* HERO */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 40px 60px" }}>
        <div style={{ width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left */}
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0.15} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 22, height: 1, background: CYAN, display: "inline-block", flexShrink: 0 }} />
              Zero Cup 2026 · Built on 0G
            </motion.p>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0.3} style={{ fontSize: "clamp(40px, 5.5vw, 76px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 24px" }}>
              The AI that<br />
              <span style={{ background: "linear-gradient(135deg, #fff 0%, #00FFD1 52%, #fff 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 5s ease-in-out infinite" }}>
                cannot be stopped.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0.45} style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 440 }}>
              Autonomous agent inside 0G&apos;s Trusted Execution Environment.{" "}
              <strong style={{ color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>Pays for its own compute.</strong>{" "}
              Runs under a contract with{" "}
              <strong style={{ color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>no admin key.</strong>{" "}
              No kill switch. Not even ours.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.6} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
              <Btn href="/dashboard" primary>Watch it think live</Btn>
              <Btn href="https://github.com/mimisco-git/ghost-0g" target="_blank">Read the code</Btn>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.75} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label="0G Compute" color={CYAN} />
              <Tag label="0G Storage" color={PURPLE} />
              <Tag label="0G Chain" color={AMBER} />
              <Tag label="ERC-7857" color="rgba(255,255,255,0.4)" />
            </motion.div>
          </div>

          {/* Right: Orb */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.4} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "clamp(280px, 34vw, 440px)", aspectRatio: "1" }}>
              <GhostOrb />
              {/* Badges */}
              <div style={{ position: "absolute", top: "8%", left: "-2%", padding: "8px 14px", borderRadius: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(0,255,209,0.2)", fontFamily: "JetBrains Mono, monospace" }}>
                <div style={{ fontSize: 9, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>TEE Status</div>
                <div style={{ fontSize: 12, color: CYAN, fontWeight: 500 }}>Enclave Active</div>
              </div>
              <div style={{ position: "absolute", bottom: "12%", right: "-2%", padding: "8px 14px", borderRadius: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(0,255,209,0.2)", fontFamily: "JetBrains Mono, monospace" }}>
                <div style={{ fontSize: 9, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Human Authorized</div>
                <div style={{ fontSize: 12, color: CYAN, fontWeight: 500 }}>FALSE</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MARQUEE */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)", padding: "13px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 40, animation: "marquee 30s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {["TEEML ATTESTATION VERIFIED", "0G COMPUTE · SEALED INFERENCE", "0G STORAGE · PERMANENT MEMORY", "0G CHAIN · ZERO ADMIN KEYS", "AUTONOMOUS PAYMENT LOOP", "HUMAN AUTHORIZED: FALSE", "NO KILL SWITCH · ALWAYS ON", "ZERO CUP 2026", "ERC-7857 AGENTIC ID", "TEEML ATTESTATION VERIFIED", "0G COMPUTE · SEALED INFERENCE", "0G STORAGE · PERMANENT MEMORY", "0G CHAIN · ZERO ADMIN KEYS", "AUTONOMOUS PAYMENT LOOP", "HUMAN AUTHORIZED: FALSE", "NO KILL SWITCH · ALWAYS ON", "ZERO CUP 2026", "ERC-7857 AGENTIC ID"].map((t, i) => (
            <span key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: CYAN, flexShrink: 0, display: "inline-block" }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* METRICS */}
      <div style={{ padding: "72px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
          {[
            { val: cycles || 0, label: "Inference cycles\ncompleted on 0G", accent: false },
            { val: "0", label: "Admin keys.\nNo owner exists.", accent: true },
            { val: "3", label: "0G layers.\nAll load-bearing.", accent: false },
            { val: "FALSE", label: "Human authorized.\nEvery cycle.", accent: true },
          ].map((m, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div style={{ background: "#080808", padding: "36px 28px", textAlign: "center", cursor: "default" }}>
                <div style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8, color: m.accent ? CYAN : "#fff" }}>{m.val}</div>
                <div style={{ fontSize: 11.5, color: "#86868b", lineHeight: 1.55, whiteSpace: "pre-line" }}>{m.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ARCHITECTURE */}
      <Section style={{ padding: "0 40px 80px" }}>
        <div id="architecture" />
        <Reveal><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 16 }}>Architecture</p></Reveal>
        <Reveal delay={0.08}><h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.08, margin: "0 0 14px" }}>Three layers.<br />All load-bearing.</h2></Reveal>
        <Reveal delay={0.16}><p style={{ fontSize: 16, fontWeight: 300, color: "#86868b", lineHeight: 1.75, maxWidth: 500, margin: "0 0 48px" }}>Remove any one and GHOST fails. This is not a 0G bolt-on. 0G is the reason it works at all.</p></Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {[
            { tag: "0G Compute", tc: CYAN, title: "Verifiable inference", body: "Every inference runs inside a Confidential VM with AMD SEV-SNP. The result carries a TEEML attestation — cryptographic proof the exact model ran unmodified. Not even 0G sees the input.", wide: false },
            { tag: "0G Storage", tc: PURPLE, title: "Permanent memory", body: "Every output, attestation receipt, and decision is written to decentralized storage with a content hash. No delete function exists. The history is public, permanent, and tamper-proof.", wide: false },
            { tag: "0G Chain", tc: AMBER, title: "Ownerless contract", body: "The contract has no admin key, no pause function, no upgrade path. GHOST holds its own wallet and pays for its own compute. No human signature authorizes any of this.", wide: false },
            { tag: "Autonomous loop", tc: "rgba(255,255,255,0.4)", title: "Self-sustaining economic entity", body: "GHOST wakes on an on-chain schedule, runs inference, pays from its wallet, writes to storage, anchors the hash on chain, sleeps, and repeats indefinitely without any human action.", wide: true },
            { tag: "Agentic ID", tc: "rgba(255,255,255,0.4)", title: "Coming: GHOST mints itself", body: "After cycle 10, GHOST mints its own ERC-7857 Agentic ID with its complete memory encrypted inside. Ownable, transferable, sellable. The buyer gets the running agent with verifiable history.", wide: false },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div style={{ background: "#080808", padding: "34px 30px", gridColumn: c.wide ? "span 2" : undefined, height: "100%", boxSizing: "border-box" }}>
                <Tag label={c.tag} color={c.tc} />
                <h3 style={{ fontSize: "clamp(15px, 1.8vw, 19px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "18px 0 12px" }}>{c.title}</h3>
                <p style={{ fontSize: 13.5, color: "#86868b", lineHeight: 1.75, fontWeight: 300, margin: 0 }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* STEPS */}
      <div style={{ padding: "0 40px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 900 }}>
          <Reveal><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 14 }}>Autonomous loop</p></Reveal>
          <Reveal delay={0.08}><h2 style={{ fontSize: "clamp(24px, 3.5vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 40px" }}>What GHOST does every 6 minutes</h2></Reveal>

          <GlassCard>
            {[
              { n: "01", title: "Wake on-chain", desc: "A time-locked trigger fires on 0G Chain. No human initiates this.", pill: "0G Chain", pc: AMBER },
              { n: "02", title: "Run inference inside TEE", desc: "0G Compute Router routes to a hardware enclave. TEEML attestation generated.", pill: "TEEML", pc: CYAN },
              { n: "03", title: "Pay for its own compute", desc: "GHOST deducts the cost from its own on-chain wallet. No human signs this.", pill: "Auto pay", pc: AMBER },
              { n: "04", title: "Write to 0G Storage", desc: "Full inference record written with a content hash. Permanent. Cannot be deleted.", pill: "0G Storage", pc: PURPLE },
              { n: "05", title: "Anchor the hash on chain", desc: "Content hash written to 0G Chain. Anyone can verify this exact output, unaltered.", pill: "Immutable", pc: AMBER },
              { n: "06", title: "Sleep. Repeat indefinitely.", desc: "GHOST runs as long as its wallet holds tokens. Self-sustaining. Always on.", pill: "Always on", pc: "rgba(255,255,255,0.35)" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 28px", borderBottom: i < 5 ? "0.5px solid rgba(255,255,255,0.06)" : "none", background: "rgba(255,255,255,0.012)" }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.14)", letterSpacing: "0.08em", width: 28, flexShrink: 0 }}>{s.n}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 4px" }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: "#86868b", fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, fontWeight: 500, padding: "5px 14px", borderRadius: 980, border: `0.5px solid ${s.pc}44`, background: `${s.pc}0f`, color: s.pc, flexShrink: 0 }}>{s.pill}</span>
                </div>
              </Reveal>
            ))}
          </GlassCard>
        </div>
      </div>

      {/* PROOF */}
      <div id="proof" style={{ padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(0,255,209,0.055) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Reveal><h2 style={{ fontSize: "clamp(34px, 5.5vw, 68px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 18px", maxWidth: 800 }}>Don&apos;t trust us.<br /><em style={{ color: CYAN, fontStyle: "normal" }}>Verify it.</em></h2></Reveal>
        <Reveal delay={0.1}><p style={{ fontSize: "clamp(14px, 1.5vw, 17px)", color: "#86868b", fontWeight: 300, lineHeight: 1.7, maxWidth: 440, margin: "0 0 52px" }}>Every claim GHOST makes is independently checkable on 0G Chain. Not a promise. A cryptographic proof.</p></Reveal>
        <Reveal delay={0.22}>
          <div style={{ width: "100%", maxWidth: 720 }}>
            <GlassCard>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", background: "rgba(255,255,255,0.02)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase" }}>Attestation Receipt · 0G Compute</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: CYAN, padding: "4px 12px", borderRadius: 980, background: "rgba(0,255,209,0.07)", border: "0.5px solid rgba(0,255,209,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />
                  TEEML · Verified
                </span>
              </div>
              <div style={{ padding: "16px 22px", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                {[["agent_id", "ghost-v1.0 · 0xD040...ed40", "#fff"],["model", "zai-org/GLM-5-FP8 · 0G Compute Router", AMBER],["verifiability", "TEEML · hardware enclave confirmed", CYAN],["enclave_type", "Confidential VM · AMD SEV-SNP", "#fff"],["tee_hash", "sha256:e3b0c44298fc1c149afbf4c8996fb924...", "#6e6e73"],["payment_tx", "0g-chain · 0.0012 0G deducted autonomously", AMBER],["human_auth", "FALSE · autonomous execution confirmed", CYAN],["tampered", "FALSE · signature valid · enclave genuine", CYAN]].map(([k,v,c]) => (
                  <div key={k} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "#6e6e73", width: 140, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: c, wordBreak: "break-all" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6e6e73" }}>0G Galileo Testnet · Chain ID 16602</span>
                <a href="https://chainscan-galileo.0g.ai" target="_blank" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: CYAN, textDecoration: "none", opacity: 0.75 }}>Verify on 0G Explorer →</a>
              </div>
            </GlassCard>
          </div>
        </Reveal>
      </div>

      {/* LIVE FEED */}
      <div style={{ padding: "0 40px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 800 }}>
          <Reveal>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>Live agent activity</p>
            <GlassCard>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 18px", background: "rgba(255,255,255,0.02)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                {[["#ff5f57"],["#ffbd2e"],["#28c941"]].map(([c]) => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6e6e73", marginLeft: "auto", letterSpacing: "0.06em" }}>ghost-agent · live cycle feed</span>
              </div>
              <div ref={feedRef} style={{ padding: "12px 16px", minHeight: 250, maxHeight: 250, overflowY: "auto", fontFamily: "JetBrains Mono, monospace", display: "flex", flexDirection: "column", gap: 2 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ fontSize: 11.5, lineHeight: 1.9, display: "flex", gap: 10, alignItems: "flex-start", animation: "fadein 0.3s ease" }}>
                    <span style={{ color: "#6e6e73", flexShrink: 0, width: 68 }}>{l.time}</span>
                    <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, alignSelf: "center", minWidth: 60, textAlign: "center", letterSpacing: "0.05em", background: `${l.tagColor}18`, color: l.tagColor }}>{l.tag}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", flex: 1 }}>{l.msg}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderTop: "0.5px solid rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#6e6e73" }}>Agent balance</span>
                  <span style={{ color: CYAN, fontWeight: 500 }}>{balance}</span>
                  <span style={{ color: "#6e6e73" }}>0G</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />
                  <span style={{ color: "#6e6e73", fontSize: 10 }}>No human control</span>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(0,255,209,0.065) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Reveal><p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: CYAN, textTransform: "uppercase", marginBottom: 22 }}>Zero Cup 2026 · Group Stage</p></Reveal>
        <Reveal delay={0.08}><h2 style={{ fontSize: "clamp(42px, 7vw, 88px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.01, margin: "0 0 18px" }}>The first AI<br />no one can <span style={{ color: CYAN }}>kill.</span></h2></Reveal>
        <Reveal delay={0.16}><p style={{ fontSize: "clamp(14px, 1.5vw, 18px)", color: "#86868b", fontWeight: 300, maxWidth: 440, margin: "0 auto 44px", lineHeight: 1.75 }}>Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties. That is not a feature. That is the architecture.</p></Reveal>
        <Reveal delay={0.24}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Btn href="https://0g.ai/arena/zero-cup" target="_blank" primary>Vote for GHOST</Btn>
            <Btn href="/dashboard">Live dashboard</Btn>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src="/logo2.png" alt="Ghost" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover", objectPosition: "center 20%" }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: CYAN, letterSpacing: "0.18em", fontWeight: 500 }}>GHOST</span>
            </div>
            <p style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.7, maxWidth: 190, margin: 0 }}>Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          </div>
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.16em", color: "#6e6e73", textTransform: "uppercase", marginBottom: 4 }}>Project</span>
              {[["Architecture","#architecture"],["Proof","#proof"],["Dashboard","/dashboard"]].map(([l,h]) => <a key={l} href={h} style={{ fontSize: 13, color: "#86868b", textDecoration: "none" }}>{l}</a>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.16em", color: "#6e6e73", textTransform: "uppercase", marginBottom: 4 }}>Links</span>
              {[["GitHub","https://github.com/mimisco-git/ghost-0g"],["0G Docs","https://docs.0g.ai"],["Zero Cup","https://0g.ai/arena/zero-cup"]].map(([l,h]) => <a key={l} href={h} target="_blank" style={{ fontSize: 13, color: "#86868b", textDecoration: "none" }}>{l}</a>)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {[["Compute:","0G Compute Router"],["Storage:","0G Storage SDK"],["Chain:","0G Galileo · ID 16602"],["Identity:","ERC-7857 Agentic ID"]].map(([k,v]) => (
              <p key={k} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6e6e73", lineHeight: 2.2, margin: 0 }}>{k} <span style={{ color: CYAN }}>{v}</span></p>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 40px", borderTop: "0.5px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#6e6e73" }}>GHOST · Zero Cup 2026 · 0G Ecosystem</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#6e6e73" }}>ghost-rouge-five.vercel.app</span>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadein   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        a:hover { opacity: 0.8; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.2); border-radius: 2px; }
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
