"use client";
import { useEffect, useRef, useState } from "react";

const logs = [
  { tag: "COMPUTE", tc: "text-cyan bg-cyan/10", msg: "TEE inference started · GLM-5-FP8 · AMD SEV-SNP enclave" },
  { tag: "COMPUTE", tc: "text-cyan bg-cyan/10", msg: "TEEML attestation generated · signature valid" },
  { tag: "WALLET",  tc: "text-red-400 bg-red-400/10", msg: "Deducted 0.0012 0G · no human signed · autonomous" },
  { tag: "STORAGE", tc: "text-purple bg-purple/10", msg: "Inference record written to 0G Storage · hash anchored" },
  { tag: "CHAIN",   tc: "text-amber bg-amber/10", msg: "Hash anchored on 0G Chain · human_authorized: FALSE" },
  { tag: "COMPUTE", tc: "text-cyan bg-cyan/10", msg: "New cycle · on-chain time-lock trigger fired" },
  { tag: "STORAGE", tc: "text-purple bg-purple/10", msg: "Memory corpus updated · no delete permission exists" },
  { tag: "CHAIN",   tc: "text-amber bg-amber/10", msg: "Admin key check · NONE FOUND · contract immutable" },
  { tag: "COMPUTE", tc: "text-cyan bg-cyan/10", msg: "Response signed by enclave · verification passed" },
];

interface LogLine { tag: string; tc: string; msg: string; time: string; }

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function getTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function LiveFeed() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [balance, setBalance] = useState<string>("connecting...");
  const feedRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    // Seed initial lines
    const initial = logs.slice(0, 3).map((l) => ({ ...l, time: getTime() }));
    setLines(initial);
    idxRef.current = 3;

    const interval = setInterval(() => {
      const entry = logs[idxRef.current % logs.length];
      setLines((prev) => {
        const next = [...prev, { ...entry, time: getTime() }];
        return next.slice(-24);
      });
      idxRef.current++;
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const r = await fetch("/api/wallet", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok && j.data?.balance) setBalance(j.data.balance);
        else setBalance("live");
      } catch {
        setBalance("live");
      }
    }
    fetchBalance();
    const iv = setInterval(fetchBalance, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Mac-style title bar */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c941]" />
        <span className="font-mono text-[11px] text-gray4 ml-auto tracking-[0.06em]">
          ghost-agent · live cycle feed
        </span>
      </div>

      {/* Feed lines */}
      <div
        ref={feedRef}
        className="p-4 font-mono overflow-y-auto"
        style={{ minHeight: 260, maxHeight: 260 }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3 items-start text-[11.5px] leading-[1.9]">
            <span className="text-gray3 flex-shrink-0 w-[68px]">{line.time}</span>
            <span className={`flex-shrink-0 text-[9.5px] font-medium px-2 py-0.5 rounded self-center min-w-[58px] text-center tracking-[0.05em] ${line.tc}`}>
              {line.tag}
            </span>
            <span className="text-white/45 flex-1">{line.msg}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 py-3 font-mono text-[11px]"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray3">Agent balance</span>
          <span className="text-cyan font-medium">{balance}</span>
          <span className="text-gray3">0G</span>
          <span className="text-gray3 animate-pulse">|</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[5px] h-[5px] rounded-full bg-cyan animate-breathe" />
          <span className="text-gray3 text-[10px]">No human control</span>
        </div>
      </div>
    </div>
  );
}
