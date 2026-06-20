"use client";
import { useEffect, useRef } from "react";

export default function GhostOrb() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle mouse tracking for depth illusion
    const handleMouse = (e: MouseEvent) => {
      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      orbRef.current.style.setProperty("--rx", `${dy * 8}deg`);
      orbRef.current.style.setProperty("--ry", `${-dx * 8}deg`);
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div
      ref={orbRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{
        perspective: "1200px",
        "--rx": "0deg",
        "--ry": "0deg",
      } as React.CSSProperties}
    >
      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: "90%",
          height: "90%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,255,209,0.14) 0%, rgba(0,255,209,0.04) 45%, transparent 70%)",
          filter: "blur(20px)",
          animation: "glow-breathe 5s ease-in-out infinite",
        }}
      />

      {/* Rotating ring 1 */}
      <div
        className="absolute rounded-full border-[0.5px]"
        style={{
          width: "92%",
          height: "92%",
          borderColor: "rgba(0,255,209,0.12)",
          animation: "ring-spin 18s linear infinite",
        }}
      />

      {/* Rotating ring 2 — opposite direction */}
      <div
        className="absolute rounded-full border-[0.5px]"
        style={{
          width: "108%",
          height: "108%",
          borderColor: "rgba(0,255,209,0.06)",
          animation: "ring-spin-rev 26s linear infinite",
        }}
      />

      {/* Static outer ring */}
      <div
        className="absolute rounded-full border-[0.5px]"
        style={{
          width: "120%",
          height: "120%",
          borderColor: "rgba(0,255,209,0.03)",
        }}
      />

      {/* Main orb — the liquid glass shell */}
      <div
        className="relative rounded-full"
        style={{
          width: "72%",
          height: "72%",
          transform: "rotateX(var(--rx)) rotateY(var(--ry))",
          transformStyle: "preserve-3d",
          transition: "transform 0.12s ease-out",
          animation: "orb-float 8s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        {/* Base layer: deep white ceramic body */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(ellipse at 38% 32%, #ffffff 0%, #e8f5f2 30%, #c8ede6 60%, #a0d8cc 85%, #7bc4b8 100%)",
            boxShadow: `
              0 0 0 1px rgba(0,255,209,0.15),
              0 8px 32px rgba(0,0,0,0.4),
              0 24px 64px rgba(0,0,0,0.3),
              0 48px 80px rgba(0,0,0,0.15),
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -2px 4px rgba(0,0,0,0.08)
            `,
          }}
        />

        {/* Primary specular highlight — Vision Pro front glass */}
        <div
          className="absolute rounded-full"
          style={{
            top: "5%",
            left: "12%",
            width: "52%",
            height: "38%",
            background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.15) 70%, transparent 100%)",
            filter: "blur(1px)",
            transform: "rotate(-15deg)",
          }}
        />

        {/* Secondary highlight — ceramic rim light */}
        <div
          className="absolute"
          style={{
            top: "18%",
            left: "8%",
            width: "18%",
            height: "42%",
            background: "linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)",
            borderRadius: "50%",
            filter: "blur(3px)",
          }}
        />

        {/* Cyan subsurface scatter — the glow from within */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(ellipse at 55% 65%, rgba(0,255,209,0.18) 0%, rgba(0,255,209,0.06) 50%, transparent 75%)",
            animation: "inner-pulse 5s ease-in-out infinite",
          }}
        />

        {/* Bottom edge rim — AirPods ceramic bottom curve */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "70%",
            height: "30%",
            background: "radial-gradient(ellipse at 50% 100%, rgba(0,255,209,0.3) 0%, rgba(0,255,209,0.08) 60%, transparent 100%)",
            filter: "blur(6px)",
          }}
        />

        {/* Reflection band — internal glass reflection */}
        <div
          className="absolute"
          style={{
            top: "48%",
            left: "5%",
            right: "5%",
            height: "12%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(2px)",
          }}
        />

        {/* Left eye — black socket with depth */}
        <div
          className="absolute rounded-full"
          style={{
            width: "16%",
            height: "18%",
            top: "34%",
            left: "26%",
            background: "radial-gradient(ellipse at 40% 35%, #1a1a1a 0%, #000000 60%)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.1)",
          }}
        >
          {/* Left iris */}
          <div
            className="absolute rounded-full"
            style={{
              width: "55%",
              height: "55%",
              top: "22%",
              left: "22%",
              background: "radial-gradient(ellipse at 35% 30%, #00FFD1 0%, #00c8a8 60%, #008870 100%)",
              boxShadow: "0 0 6px rgba(0,255,209,0.8), 0 0 12px rgba(0,255,209,0.4)",
              animation: "eye-pulse 4s ease-in-out infinite",
            }}
          />
          {/* Left pupil shine */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: "20%",
              height: "20%",
              top: "18%",
              left: "58%",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Right eye */}
        <div
          className="absolute rounded-full"
          style={{
            width: "16%",
            height: "18%",
            top: "34%",
            left: "56%",
            background: "radial-gradient(ellipse at 40% 35%, #1a1a1a 0%, #000000 60%)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.1)",
          }}
        >
          {/* Right iris */}
          <div
            className="absolute rounded-full"
            style={{
              width: "55%",
              height: "55%",
              top: "22%",
              left: "22%",
              background: "radial-gradient(ellipse at 35% 30%, #00FFD1 0%, #00c8a8 60%, #008870 100%)",
              boxShadow: "0 0 6px rgba(0,255,209,0.8), 0 0 12px rgba(0,255,209,0.4)",
              animation: "eye-pulse 4s ease-in-out infinite 0.3s",
            }}
          />
          {/* Right pupil shine */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: "20%",
              height: "20%",
              top: "18%",
              left: "58%",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Glass edge — the very edge of the sphere */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "transparent",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25), inset 0 0 0 2px rgba(255,255,255,0.06)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes orb-float {
          0%, 100% { transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(0px); }
          50%       { transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(-16px); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.05); }
        }
        @keyframes inner-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes eye-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(0,255,209,0.8), 0 0 12px rgba(0,255,209,0.4); }
          50%       { box-shadow: 0 0 10px rgba(0,255,209,1), 0 0 20px rgba(0,255,209,0.6); }
        }
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ring-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
