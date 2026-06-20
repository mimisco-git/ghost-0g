"use client";
import { useEffect, useRef } from "react";

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let scrollY = 0;
    let animId: number;

    interface Particle {
      x: number; y: number; r: number;
      vx: number; vy: number; alpha: number;
    }
    let particles: Particle[] = [];

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((W * H) / 22000), 65);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + Math.random() * 1.1,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          alpha: 0.07 + Math.random() * 0.22,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, W, H);
      const shift = scrollY * 0.05;

      for (const p of particles) {
        const py = p.y - (shift % H);
        ctx!.beginPath();
        ctx!.arc(p.x, py, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0,255,209,${p.alpha})`;
        ctx!.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = (particles[i].y - (shift % H)) - (particles[j].y - (shift % H));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y - (shift % H));
            ctx!.lineTo(particles[j].x, particles[j].y - (shift % H));
            ctx!.strokeStyle = `rgba(0,255,209,${0.03 * (1 - d / 100)})`;
            ctx!.lineWidth = 0.4;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    }

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
