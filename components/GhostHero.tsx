"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── SEQUENCER LOADER ────────────────────────────────────────────────────────
// Assembles the ghost line by line before revealing the hero
const loaderLines = [
  "GHOST v1.0 · Initializing...",
  "Loading 0G Compute Router...",
  "Verifying TEE enclave...",
  "Authenticating wallet: 0xD040...ed40",
  "Checking 0G Storage index...",
  "Storage hash: 0xd967...ba5a ✓",
  "TEEML attestation: VERIFIED ✓",
  "human_authorized: FALSE ✓",
  "Admin keys: NONE ✓",
  "Autonomous mode: ACTIVE",
  "GHOST ONLINE.",
];

function SequencerLoader({ onDone }: { onDone: () => void }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setVisibleLines(prev => [...prev, loaderLines[i]]);
      i++;
      if (i >= loaderLines.length) {
        clearInterval(iv);
        setTimeout(() => {
          setDone(true);
          setTimeout(onDone, 600);
        }, 400);
      }
    }, 160);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#05070f",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Ghost assembles from top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 40 }}
      >
        <img
          src="/logo2.png"
          alt="GHOST"
          style={{
            width: 80, height: 80,
            objectFit: "contain",
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 20px rgba(0,255,209,0.4))",
          }}
        />
      </motion.div>

      {/* Terminal lines */}
      <div style={{
        width: 480, fontFamily: "JetBrains Mono, monospace",
        fontSize: 11, lineHeight: 2.2,
        padding: "20px 24px",
        background: "rgba(11,17,32,0.5)",
        border: "0.5px solid rgba(31,41,61,0.6)",
        borderRadius: 12,
      }}>
        {visibleLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              color: line.includes("✓") ? "#00ff66"
                : line.includes("ONLINE") ? "#00FFD1"
                : line.includes("FALSE") || line.includes("NONE") ? "#00FFD1"
                : "rgba(139,148,158,0.85)",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ color: "rgba(55,65,81,0.8)", flexShrink: 0 }}>
              {String(i).padStart(2, "0")}
            </span>
            {line}
            {i === visibleLines.length - 1 && !done && (
              <span style={{ display: "inline-block", width: 7, height: 14, background: "#00FFD1", marginLeft: 4, animation: "blink .7s steps(1) infinite" }} />
            )}
          </motion.div>
        ))}
      </div>

      <style>{`@keyframes blink{50%{opacity:0}}`}</style>
    </motion.div>
  );
}

// ── INTERACTIVE GHOST ───────────────────────────────────────────────────────
export function InteractiveGhost({ size = 420 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Ghost body tilt
      if (ghostRef.current) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        ghostRef.current.style.transform =
          `perspective(1200px) rotateX(${dy * 10}deg) rotateY(${-dx * 10}deg) translateZ(0)`;
      }

      // Eye tracking — pupils follow cursor
      [leftEyeRef, rightEyeRef].forEach(eyeRef => {
        if (!eyeRef.current) return;
        const eye = eyeRef.current.getBoundingClientRect();
        const ex = eye.left + eye.width / 2;
        const ey = eye.top + eye.height / 2;
        const angle = Math.atan2(e.clientY - ey, e.clientX - ex);
        const dist = Math.min(
          Math.hypot(e.clientX - ex, e.clientY - ey),
          eye.width * 0.22
        );
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        eyeRef.current.style.transform = `translate(${px}px, ${py}px)`;
      });
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: size, height: size,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", width: "82%", height: "82%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,255,209,0.14) 0%, transparent 70%)",
        filter: "blur(32px)",
        animation: "gB 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Orbital rings */}
      {[94, 112, 128].map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${s}%`, height: `${s}%`,
          borderRadius: "50%",
          border: `0.5px solid rgba(0,255,209,${0.1 - i * 0.03})`,
          animation: i === 0 ? "rA 22s linear infinite" : i === 1 ? "rB 32s linear infinite" : "none",
          pointerEvents: "none",
        }} />
      ))}

      {/* Ghost body with 3D tilt */}
      <div
        ref={ghostRef}
        style={{
          position: "relative", zIndex: 2,
          width: "76%", height: "76%",
          transformStyle: "preserve-3d",
          transition: "transform 0.08s ease-out",
          animation: "gF 8s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        {/* The ghost image */}
        <img
          src="/logo2.png"
          alt="GHOST"
          style={{
            width: "100%", height: "100%",
            objectFit: "contain",
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 40px rgba(0,255,209,0.38)) drop-shadow(0 0 80px rgba(0,255,209,0.14)) brightness(1.08)",
            pointerEvents: "none", userSelect: "none",
            display: "block",
          }}
        />

        {/* LEFT EYE PUPIL OVERLAY — positioned over the ghost image eye */}
        <div
          style={{
            position: "absolute",
            top: "35%", left: "28%",
            width: "12%", height: "10%",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            ref={leftEyeRef}
            style={{
              width: "55%", height: "55%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 35% 30%, rgba(0,255,209,0.9), rgba(0,200,168,0.7))",
              boxShadow: "0 0 8px rgba(0,255,209,0.9), 0 0 16px rgba(0,255,209,0.5)",
              transition: "transform 0.06s ease-out",
              willChange: "transform",
            }}
          />
        </div>

        {/* RIGHT EYE PUPIL OVERLAY */}
        <div
          style={{
            position: "absolute",
            top: "35%", left: "57%",
            width: "12%", height: "10%",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            ref={rightEyeRef}
            style={{
              width: "55%", height: "55%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 35% 30%, rgba(0,255,209,0.9), rgba(0,200,168,0.7))",
              boxShadow: "0 0 8px rgba(0,255,209,0.9), 0 0 16px rgba(0,255,209,0.5)",
              transition: "transform 0.06s ease-out",
              willChange: "transform",
            }}
          />
        </div>
      </div>

      {/* Data badges */}
      {[
        { top: "8%",  left: "-10%", label: "TEE Status",        val: "Enclave Active",  color: "#00FFD1" },
        { bottom: "14%", right: "-10%", label: "Human Authorized", val: "FALSE",          color: "#00FFD1" },
        { top: "42%", right: "-14%", label: "Storage",           val: "0G Network",      color: "#7c6af7" },
      ].map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: b.top, bottom: (b as any).bottom,
            left: b.left, right: (b as any).right,
            padding: "10px 16px", borderRadius: 10,
            background: "rgba(3,7,18,0.88)",
            backdropFilter: "blur(20px)",
            border: `0.5px solid ${b.color}35`,
            fontFamily: "JetBrains Mono, monospace",
            boxShadow: `0 8px 24px rgba(0,0,0,0.55), 0 0 0 0.5px ${b.color}12 inset`,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 8.5, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{b.label}</div>
          <div style={{ fontSize: 12, color: b.color, fontWeight: 600 }}>{b.val}</div>
        </motion.div>
      ))}

      <style>{`
        @keyframes gF  { 0%,100%{transform:perspective(1200px) translateY(0px)} 50%{transform:perspective(1200px) translateY(-18px)} }
        @keyframes gB  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes rA  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rB  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>
    </div>
  );
}

// ── HERO SECTION EXPORT ────────────────────────────────────────────────────
export default function GhostHero({ onDone }: { onDone?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Skip loader if already visited this session
  useEffect(() => {
    const seen = sessionStorage.getItem("ghost-loaded");
    if (seen) {
      setShowLoader(false);
      setLoaded(true);
      onDone?.();
    }
  }, []);

  function handleLoaderDone() {
    sessionStorage.setItem("ghost-loaded", "1");
    setShowLoader(false);
    setLoaded(true);
    onDone?.();
  }

  return (
    <>
      <AnimatePresence>
        {showLoader && <SequencerLoader onDone={handleLoaderDone} />}
      </AnimatePresence>
    </>
  );
}
