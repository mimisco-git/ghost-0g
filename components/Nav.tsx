"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[1000] h-[56px] flex items-center justify-between px-10"
      style={{
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "saturate(180%) blur(40px)",
        WebkitBackdropFilter: "saturate(180%) blur(40px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <Link href="/" className="flex items-center gap-3 no-underline">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(0,255,209,0.18)" }}>
          <Image src="/logo2.png" alt="Ghost" fill className="object-cover" style={{ objectPosition: "center 20%" }} />
        </div>
        <span className="font-mono text-sm font-medium tracking-[0.2em] text-cyan">GHOST</span>
      </Link>

      <ul className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 list-none">
        {["Architecture", "Proof", "Dashboard", "GitHub"].map((item) => (
          <li key={item}>
            <Link
              href={
                item === "GitHub"
                  ? "https://github.com/mimisco-git/ghost-0g"
                  : item === "Dashboard"
                  ? "/dashboard"
                  : `#${item.toLowerCase()}`
              }
              className="text-[13px] text-white/65 hover:text-white transition-colors duration-200 no-underline"
              target={item === "GitHub" ? "_blank" : undefined}
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>

      <a
        href="https://0g.ai/arena/zero-cup"
        target="_blank"
        className="font-mono text-[11px] font-medium px-5 py-2 text-cyan no-underline transition-all duration-200"
        style={{
          border: "0.5px solid rgba(0,255,209,0.4)",
          borderRadius: "980px",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "rgba(0,255,209,0.08)";
          (e.target as HTMLElement).style.borderColor = "#00FFD1";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "transparent";
          (e.target as HTMLElement).style.borderColor = "rgba(0,255,209,0.4)";
        }}
      >
        Vote on Zero Cup
      </a>
    </motion.nav>
  );
}
