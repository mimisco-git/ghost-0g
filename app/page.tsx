"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import ParticleCanvas from "@/components/ParticleCanvas";
import LiveFeed from "@/components/LiveFeed";
import { useReveal } from "@/components/useReveal";

const GhostOrb = lazy(() => import("@/components/GhostOrb"));

// ─── ANIMATION VARIANTS ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.75, delay: d, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useReveal();
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

function Item({ children, d = 0, className = "" }: { children: React.ReactNode; d?: number; className?: string }) {
  return <motion.div variants={fadeUp} custom={d} className={className}>{children}</motion.div>;
}

// ─── DATA ──────────────────────────────────────────────────────────────────
const marqueeItems = [
  "TEEML ATTESTATION VERIFIED", "0G COMPUTE · SEALED INFERENCE",
  "0G STORAGE · PERMANENT MEMORY", "0G CHAIN · ZERO ADMIN KEYS",
  "AUTONOMOUS PAYMENT LOOP", "HUMAN AUTHORIZED: FALSE",
  "NO KILL SWITCH · ALWAYS ON", "ZERO CUP 2026", "ERC-7857 AGENTIC ID",
];

const arch = [
  {
    tag: "0G Compute", cls: "text-cyan border-cyan/25 bg-cyan/[0.07]",
    title: "Verifiable inference",
    body: "Every inference runs inside a Confidential VM with AMD SEV-SNP. The result carries a TEEML attestation — cryptographic proof the exact model ran unmodified. Not even 0G can see the input.",
    wide: false,
  },
  {
    tag: "0G Storage", cls: "text-purple border-purple/25 bg-purple/[0.07]",
    title: "Permanent memory",
    body: "Every output, attestation receipt, and decision is written to decentralized storage with a content hash. No delete function exists. The complete history is public, permanent, and tamper-proof.",
    wide: false,
  },
  {
    tag: "0G Chain", cls: "text-amber border-amber/25 bg-amber/[0.07]",
    title: "Ownerless contract",
    body: "The contract has no admin key, no pause function, no upgrade path. GHOST holds its own wallet and pays for its own compute. No human signature authorizes any of this.",
    wide: false,
  },
  {
    tag: "Autonomous loop", cls: "text-gray5 border-white/10 bg-white/[0.03]",
    title: "Self-sustaining economic entity",
    body: "GHOST wakes on an on-chain schedule, runs inference, pays from its wallet, writes to storage, anchors the hash on chain, sleeps, and repeats. As long as its balance holds tokens, it runs indefinitely without any human action. It can receive tips on-chain and fund itself.",
    wide: true,
  },
  {
    tag: "Agentic ID", cls: "text-gray5 border-white/10 bg-white/[0.03]",
    title: "Coming: GHOST mints itself",
    body: "After cycle 10, GHOST mints its own ERC-7857 Agentic ID with its complete memory encrypted inside. Ownable, transferable, and sellable. The buyer receives a running agent with full verifiable history.",
    wide: false,
  },
];

const steps = [
  { n: "01", title: "Wake on-chain", desc: "A time-locked trigger fires on 0G Chain. No human initiates this.", pill: "0G Chain", pc: "text-amber border-amber/20 bg-amber/[0.06]" },
  { n: "02", title: "Run inference inside TEE", desc: "0G Compute Router routes to a hardware enclave. TEEML attestation generated — cryptographic proof the exact model ran unmodified.", pill: "TEEML", pc: "text-cyan border-cyan/20 bg-cyan/[0.07]" },
  { n: "03", title: "Pay for its own compute", desc: "GHOST deducts the cost from its own on-chain wallet. No human signs this. The contract settles autonomously.", pill: "Auto pay", pc: "text-amber border-amber/20 bg-amber/[0.06]" },
  { n: "04", title: "Write to 0G Storage", desc: "Full inference record — input, output, attestation, cost, timestamp — written with a content hash. Permanent. Cannot be deleted.", pill: "0G Storage", pc: "text-purple border-purple/20 bg-purple/[0.07]" },
  { n: "05", title: "Anchor the hash on chain", desc: "Content hash written to 0G Chain. Anyone can verify this exact output existed at this exact block, unaltered.", pill: "Immutable", pc: "text-amber border-amber/20 bg-amber/[0.06]" },
  { n: "06", title: "Sleep. Repeat indefinitely.", desc: "GHOST runs as long as its wallet holds tokens. Earns tips on-chain. No human required at any step.", pill: "Always on", pc: "text-gray5 border-white/10 bg-white/[0.04]" },
];

const attestRows: [string, string, string][] = [
  ["agent_id",       "ghost-v1.0 · 0xD040...ed40",                                                    "text-white"],
  ["model",          "zai-org/GLM-5-FP8 · 0G Compute Router",                                         "text-amber"],
  ["verifiability",  "TEEML · hardware enclave confirmed",                                             "text-cyan"],
  ["enclave_type",   "Confidential VM · AMD SEV-SNP",                                                  "text-white"],
  ["tee_hash",       "sha256:e3b0c44298fc1c149afbf4c8996fb924...",                                     "text-gray3 text-[10px]"],
  ["payment_tx",     "0g-chain · 0.0012 0G deducted autonomously",                                    "text-amber"],
  ["human_auth",     "FALSE · autonomous execution confirmed",                                         "text-cyan"],
  ["tampered",       "FALSE · signature valid · enclave genuine",                                      "text-cyan"],
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function Home() {
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok && j.data?.completedCycles) setCycles(j.data.completedCycles);
      } catch {}
    }
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <main className="relative bg-black text-white overflow-x-hidden">
      <ParticleCanvas />
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col">
        {/* Inner container: centered, max width, side padding */}
        <div className="flex-1 flex items-center max-w-[1200px] w-full mx-auto px-8 md:px-16 pt-28 pb-16 gap-16">

          {/* Left column */}
          <div className="flex flex-col w-full md:w-1/2 shrink-0">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16,1,0.3,1] }}
              className="font-mono text-[10px] tracking-[0.25em] text-cyan uppercase mb-7 flex items-center gap-3"
            >
              <span className="w-5 h-px bg-cyan shrink-0" />
              Zero Cup 2026 · Built on 0G
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.32, ease: [0.16,1,0.3,1] }}
              className="text-[clamp(42px,5.5vw,80px)] font-extrabold leading-[1.01] tracking-[-0.04em] mb-6"
            >
              The AI that<br />
              <span className="gradient-text">cannot be stopped.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.48, ease: [0.16,1,0.3,1] }}
              className="text-[clamp(15px,1.6vw,18px)] text-white/50 font-light leading-[1.8] max-w-[420px] mb-10"
            >
              Autonomous agent inside 0G&apos;s Trusted Execution Environment.{" "}
              <strong className="text-white/85 font-medium">Pays for its own compute.</strong>{" "}
              Runs under a contract with{" "}
              <strong className="text-white/85 font-medium">no admin key.</strong>{" "}
              No kill switch. Not even ours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.62, ease: [0.16,1,0.3,1] }}
              className="flex items-center gap-4 flex-wrap"
            >
              <a
                href="/dashboard"
                className="inline-block px-7 py-[14px] bg-cyan text-black text-[15px] font-semibold no-underline transition-all duration-200 hover:opacity-88 hover:scale-[1.03] active:scale-[0.97]"
                style={{ borderRadius: "980px" }}
              >
                Watch it think live
              </a>
              <a
                href="https://github.com/mimisco-git/ghost-0g"
                target="_blank"
                className="inline-block px-7 py-[14px] text-cyan text-[15px] font-normal no-underline transition-all duration-200 hover:bg-cyan/[0.07] hover:scale-[1.02]"
                style={{ borderRadius: "980px", border: "0.5px solid rgba(0,255,209,0.35)" }}
              >
                Read the code
              </a>
            </motion.div>

            {/* Proof badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="flex flex-wrap gap-2 mt-10"
            >
              {[
                { label: "0G Compute", cls: "text-cyan bg-cyan/[0.08] border-cyan/20" },
                { label: "0G Storage", cls: "text-purple bg-purple/[0.08] border-purple/20" },
                { label: "0G Chain", cls: "text-amber bg-amber/[0.08] border-amber/20" },
                { label: "ERC-7857", cls: "text-gray5 bg-white/[0.04] border-white/10" },
              ].map((b) => (
                <span
                  key={b.label}
                  className={`font-mono text-[10px] font-medium tracking-[0.1em] px-3 py-1 border ${b.cls}`}
                  style={{ borderRadius: "980px" }}
                >
                  {b.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right column: 3D Ghost */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16,1,0.3,1] }}
            className="hidden md:flex items-center justify-center w-1/2 shrink-0"
          >
            <div className="relative w-[clamp(300px,36vw,480px)] aspect-square">
              {/* Ambient rings — opacity only, no competing transforms */}
              {[5, -6, -18].map((inset, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border-[0.5px] border-cyan/10 animate-ring-fade"
                  style={{
                    inset: `${inset}%`,
                    animationDelay: `${i * 1.5}s`,
                    animationDuration: `${5 + i}s`,
                  }}
                />
              ))}

              {/* 3D Ghost canvas */}
              <div className="absolute inset-0 z-10">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src="/logo2.png"
                        alt="GHOST"
                        className="w-[75%] h-[75%] object-contain"
                        style={{
                          filter: "drop-shadow(0 0 40px rgba(0,255,209,0.3)) drop-shadow(0 0 80px rgba(0,255,209,0.12))",
                          animation: "float 8s ease-in-out infinite",
                        }}
                      />
                    </div>
                  }
                >
                  <GhostOrb />
                </Suspense>
              </div>

              {/* Floating badges */}
              <div
                className="absolute top-[8%] left-[-4%] z-20 px-3 py-2 rounded-xl font-mono hidden lg:block"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(0,255,209,0.2)" }}
              >
                <p className="text-[9px] text-gray3 tracking-[0.1em] uppercase mb-1">TEE Status</p>
                <p className="text-[12px] text-cyan font-medium">Enclave Active</p>
              </div>
              <div
                className="absolute bottom-[12%] right-[-4%] z-20 px-3 py-2 rounded-xl font-mono hidden lg:block"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(0,255,209,0.2)" }}
              >
                <p className="text-[9px] text-gray3 tracking-[0.1em] uppercase mb-1">Human Authorized</p>
                <p className="text-[12px] text-cyan font-medium">FALSE</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="flex flex-col items-center gap-2 pb-8 z-10">
          <span className="font-mono text-[9px] text-gray3 tracking-[0.15em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-cyan/50 to-transparent" />
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 overflow-hidden py-3"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}
      >
        <div className="flex gap-10 animate-marquee whitespace-nowrap w-max">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="flex items-center gap-2 font-mono text-[10px] text-gray3 tracking-[0.14em] shrink-0">
              <span className="w-[3px] h-[3px] rounded-full bg-cyan shrink-0" />{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── METRICS ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-8 md:px-16 py-20">
        <div
          className="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-2xl"
          style={{ gap: "1px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { val: cycles || 0, label: "Inference cycles\ncompleted on 0G", accent: false },
            { val: "0",         label: "Admin keys.\nNo owner exists.",     accent: true },
            { val: "3",         label: "0G layers.\nAll load-bearing.",     accent: false },
            { val: "FALSE",     label: "Human authorized.\nEvery cycle.",   accent: true },
          ].map((m, i) => (
            <Reveal key={i}>
              <Item d={i * 0.07}>
                <div className="bg-[#080808] hover:bg-[#0f0f0f] transition-colors duration-200 px-8 py-10 text-center">
                  <div className={`text-[clamp(26px,3.5vw,42px)] font-bold tracking-[-0.04em] leading-none mb-2 ${m.accent ? "text-cyan" : "text-white"}`}>
                    {m.val}
                  </div>
                  <div className="text-[11.5px] text-gray4 leading-[1.55] whitespace-pre-line">{m.label}</div>
                </div>
              </Item>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── ARCHITECTURE ─────────────────────────────────────────────────── */}
      <div id="architecture" className="relative z-10 max-w-[1200px] mx-auto px-8 md:px-16 py-20">
        <Reveal>
          <Item><p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase mb-4">Architecture</p></Item>
          <Item d={0.08}><h2 className="text-[clamp(32px,4.5vw,58px)] font-bold tracking-[-0.035em] leading-[1.08] mb-3">Three layers.<br />All load-bearing.</h2></Item>
          <Item d={0.16}><p className="text-[clamp(14px,1.6vw,17px)] text-gray4 font-light leading-[1.75] max-w-[500px] mb-14">Remove any one and GHOST fails. This is not a 0G bolt-on. 0G is the reason it exists at all.</p></Item>
        </Reveal>

        <div
          className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-2xl"
          style={{ gap: "1px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          {arch.map((c, i) => (
            <Reveal key={i} className={c.wide ? "md:col-span-2" : ""}>
              <Item d={i * 0.06}>
                <div className="group bg-[#080808] hover:bg-[#0f0f0f] transition-colors duration-200 p-8 h-full relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(0,255,209,0.03) 0%, transparent 60%)" }} />
                  <span className={`font-mono text-[9.5px] font-medium tracking-[0.12em] uppercase px-3 py-[4px] border inline-block mb-5 ${c.cls}`} style={{ borderRadius: "980px" }}>{c.tag}</span>
                  <h3 className="text-[clamp(15px,1.8vw,19px)] font-semibold tracking-[-0.02em] leading-[1.25] mb-3">{c.title}</h3>
                  <p className="text-[13.5px] text-gray4 font-light leading-[1.75]">{c.body}</p>
                </div>
              </Item>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── STEPS ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[900px] mx-auto px-8 md:px-16 py-20">
        <Reveal>
          <Item><p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase mb-4">Autonomous loop</p></Item>
          <Item d={0.08}><h2 className="text-[clamp(26px,3.5vw,44px)] font-bold tracking-[-0.03em] leading-[1.1] mb-12">What GHOST does every 6 minutes</h2></Item>
        </Reveal>

        <div className="rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
          {steps.map((s, i) => (
            <Reveal key={i}>
              <Item d={i * 0.06}>
                <div
                  className="flex items-center gap-6 px-8 py-6 hover:bg-white/[0.02] transition-colors"
                  style={{ background: "rgba(255,255,255,0.01)", borderBottom: i < steps.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <span className="font-mono text-[11px] text-white/[0.13] tracking-[0.08em] w-8 shrink-0">{s.n}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold tracking-[-0.02em] mb-1">{s.title}</p>
                    <p className="text-[13px] text-gray4 font-light leading-[1.6]">{s.desc}</p>
                  </div>
                  <span
                    className={`hidden md:inline-block font-mono text-[9.5px] font-medium px-3 py-[5px] border shrink-0 ${s.pc}`}
                    style={{ borderRadius: "980px" }}
                  >
                    {s.pill}
                  </span>
                </div>
              </Item>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── PROOF ────────────────────────────────────────────────────────── */}
      <div id="proof" className="relative z-10 py-24 px-8 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(0,255,209,0.055) 0%, transparent 70%)" }} />

        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <Item>
              <h2 className="text-[clamp(36px,5.5vw,68px)] font-bold tracking-[-0.04em] leading-[1.06] mb-5">
                Don&apos;t trust us.<br /><em className="text-cyan not-italic">Verify it.</em>
              </h2>
            </Item>
            <Item d={0.1}>
              <p className="text-[clamp(14px,1.6vw,18px)] text-gray4 font-light leading-[1.7] max-w-[440px] mx-auto mb-14">
                Every claim GHOST makes is independently checkable on 0G Chain. Not a promise. A cryptographic proof.
              </p>
            </Item>
            <Item d={0.22}>
              <div
                className="max-w-[720px] mx-auto rounded-2xl overflow-hidden text-left"
                style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.09)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 0.5px rgba(0,255,209,0.06) inset, 0 20px 40px rgba(0,0,0,0.5)" }}
              >
                <div className="flex items-center justify-between px-6 py-4" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-mono text-[10px] text-gray3 tracking-[0.1em] uppercase">Attestation Receipt · 0G Compute</span>
                  <span className="flex items-center gap-2 font-mono text-[10px] text-cyan px-3 py-1" style={{ background: "rgba(0,255,209,0.07)", border: "0.5px solid rgba(0,255,209,0.18)", borderRadius: "980px" }}>
                    <span className="w-[5px] h-[5px] rounded-full bg-cyan animate-breathe" />
                    TEEML · Verified
                  </span>
                </div>
                <div className="px-6 py-4 font-mono text-[11px]">
                  {attestRows.map(([k, v, c]) => (
                    <div key={k} className="flex gap-4 py-[7px]" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-gray3 w-[140px] shrink-0">{k}</span>
                      <span className={`break-all ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-mono text-[10px] text-gray3">0G Galileo Testnet · Chain ID 16602</span>
                  <a href="https://chainscan-galileo.0g.ai" target="_blank" className="font-mono text-[11px] text-cyan no-underline opacity-70 hover:opacity-100 transition-opacity">Verify on 0G Explorer →</a>
                </div>
              </div>
            </Item>
          </Reveal>
        </div>
      </div>

      {/* ── LIVE FEED ────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[800px] mx-auto px-8 md:px-16 pb-24">
        <Reveal>
          <Item d={0}>
            <p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase mb-4 text-center">Live agent activity</p>
          </Item>
          <Item d={0.08}>
            <LiveFeed />
          </Item>
        </Reveal>
      </div>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <div className="relative z-10 py-32 px-8 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(0,255,209,0.065) 0%, transparent 65%)" }} />
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <Item><p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase mb-6">Zero Cup 2026 · Group Stage</p></Item>
            <Item d={0.08}>
              <h2 className="text-[clamp(44px,7vw,90px)] font-extrabold tracking-[-0.05em] leading-[1.0] mb-5">
                The first AI<br />no one can <span className="text-cyan">kill.</span>
              </h2>
            </Item>
            <Item d={0.16}>
              <p className="text-[clamp(14px,1.6vw,18px)] text-gray4 font-light max-w-[420px] mx-auto mb-12 leading-[1.75]">
                Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties. That is not a feature. That is the architecture.
              </p>
            </Item>
            <Item d={0.24}>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a href="https://0g.ai/arena/zero-cup" target="_blank" className="inline-block px-8 py-4 bg-cyan text-black text-[15px] font-semibold no-underline hover:opacity-88 hover:scale-[1.03] active:scale-[0.97] transition-all" style={{ borderRadius: "980px" }}>Vote for GHOST</a>
                <a href="/dashboard" className="inline-block px-8 py-4 text-cyan text-[15px] font-normal no-underline hover:bg-cyan/[0.07] hover:scale-[1.02] transition-all" style={{ borderRadius: "980px", border: "0.5px solid rgba(0,255,209,0.35)" }}>Live dashboard</a>
              </div>
            </Item>
          </Reveal>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-14 grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ boxShadow: "0 0 0 1px rgba(0,255,209,0.15)" }}>
                <img src="/logo2.png" alt="Ghost" className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
              </div>
              <span className="font-mono text-[13px] text-cyan tracking-[0.18em] font-medium">GHOST</span>
            </div>
            <p className="text-[12px] text-gray3 leading-[1.7] max-w-[190px]">Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-[10px]">
              <span className="font-mono text-[9px] tracking-[0.18em] text-gray3 uppercase mb-1">Project</span>
              {["Architecture", "Proof", "Dashboard"].map(l => (
                <a key={l} href={l === "Dashboard" ? "/dashboard" : `#${l.toLowerCase()}`} className="text-[13px] text-gray4 no-underline hover:text-white transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex flex-col gap-[10px]">
              <span className="font-mono text-[9px] tracking-[0.18em] text-gray3 uppercase mb-1">Links</span>
              {[["GitHub", "https://github.com/mimisco-git/ghost-0g"], ["0G Docs", "https://docs.0g.ai"], ["Zero Cup", "https://0g.ai/arena/zero-cup"]].map(([l, h]) => (
                <a key={l} href={h} target="_blank" className="text-[13px] text-gray4 no-underline hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div className="md:text-right">
            {[["Compute:", "0G Compute Router"], ["Storage:", "0G Storage SDK"], ["Chain:", "0G Galileo · ID 16602"], ["Identity:", "ERC-7857 Agentic ID"]].map(([k, v]) => (
              <p key={k} className="font-mono text-[11px] text-gray3 leading-[2.2]">{k} <span className="text-cyan">{v}</span></p>
            ))}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-5 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
          <span className="font-mono text-[10px] text-gray3">GHOST · Zero Cup 2026 · 0G Ecosystem</span>
          <span className="font-mono text-[10px] text-gray3">ghost-rouge-five.vercel.app</span>
        </div>
      </footer>
    </main>
  );
}
