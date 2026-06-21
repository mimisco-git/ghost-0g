"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const BG     = "#030712";
const CARD   = "rgba(11,15,25,0.6)";
const BORDER = "rgba(31,41,61,0.6)";
const CYAN   = "#00FFD1";
const AMBER  = "#ffb800";
const PURPLE = "#7c6af7";
const WHITE  = "#f3f4f6";
const MUTED  = "#6b7280";
const DIMMED = "#374151";

// ── MOBILE HOOK ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

// ── PARTICLES ───────────────────────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let W = 0, H = 0, sy = 0, af: number;
    type P = { x:number;y:number;vx:number;vy:number;a:number;r:number };
    const pts: P[] = [];
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    const init = () => {
      pts.length = 0;
      const n = Math.min(Math.floor(W*H/28000), 45);
      for (let i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*.1,a:.03+Math.random()*.12,r:.3+Math.random()*.8});
    };
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const sh=sy*.03;
      for (const p of pts) {
        const py=p.y-(sh%H);
        ctx.beginPath();ctx.arc(p.x,py,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,255,209,${p.a})`;ctx.fill();
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      }
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=(pts[i].y-sh%H)-(pts[j].y-sh%H),d=Math.sqrt(dx*dx+dy*dy);
        if(d<80){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y-sh%H);ctx.lineTo(pts[j].x,pts[j].y-sh%H);ctx.strokeStyle=`rgba(0,255,209,${.018*(1-d/80)})`;ctx.lineWidth=.3;ctx.stroke();}
      }
      af=requestAnimationFrame(draw);
    };
    window.addEventListener("scroll",()=>sy=window.scrollY,{passive:true});
    window.addEventListener("resize",()=>{resize();init();});
    resize();init();draw();
    return ()=>cancelAnimationFrame(af);
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
}

// ── APPLE LIQUID GLASS CARD ─────────────────────────────────────────────────
// Three layers: frosted surface + specular rim + inner light refraction
function Card({children,style={},glow}:{children:React.ReactNode;style?:React.CSSProperties;glow?:string}) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.03)",
      border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 18,
      backdropFilter: "saturate(180%) blur(40px)",
      WebkitBackdropFilter: "saturate(180%) blur(40px)",
      // Layer 1: drop shadow for depth
      boxShadow: [
        glow ? `0 0 0 0.5px ${glow}15 inset` : "",
        "inset 0 1px 0 rgba(255,255,255,0.12)",   // top specular rim
        "inset 0 -1px 0 rgba(0,0,0,0.25)",          // bottom shadow
        "inset 1px 0 0 rgba(255,255,255,0.06)",     // left rim
        "0 24px 48px rgba(0,0,0,0.5)",
        glow ? `0 0 80px ${glow}06` : "",
      ].filter(Boolean).join(", "),
      overflow: "hidden",
      ...style,
    }}>
      {/* Layer 2: inner light refraction — top-left corner glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.06) 0%, transparent 55%)",
        borderRadius: 18,
      }} />
      {/* Layer 3: bottom-right dark shadow for depth */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 85% 100%, rgba(0,0,0,0.15) 0%, transparent 55%)",
        borderRadius: 18,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ── ARCH CARD — glass quality + equal heights ─────────────────────────────
function ArchCard({tag,color,title,body}:{tag:string;color:string;title:string;body:string}) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.025)",
      padding:"28px 24px",
      height:"100%",
      boxSizing:"border-box" as const,
      display:"flex",
      flexDirection:"column" as const,
      justifyContent:"flex-start",
      transition:"background 0.25s, box-shadow 0.25s",
      overflow: "hidden",
    }}
    onMouseEnter={e=>{
      (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";
      (e.currentTarget as HTMLElement).style.boxShadow="inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 0.5px rgba(255,255,255,0.06)";
    }}
    onMouseLeave={e=>{
      (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.025)";
      (e.currentTarget as HTMLElement).style.boxShadow="none";
    }}
    >
      {/* Top-left light refraction on hover */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",pointerEvents:"none"}} />
      <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase" as const,padding:"3px 10px",borderRadius:5,border:`0.5px solid ${color}30`,background:`${color}0c`,color,display:"inline-block",marginBottom:16,position:"relative"}}>{tag}</span>
      <h3 style={{fontSize:17,fontWeight:700,letterSpacing:"-0.025em",lineHeight:1.3,margin:"0 0 10px",color:WHITE,position:"relative"}}>{title}</h3>
      <p style={{fontSize:13.5,color:MUTED,lineHeight:1.8,fontWeight:300,margin:0,flex:1,position:"relative"}}>{body}</p>
    </div>
  );
}

// ── REVEAL ──────────────────────────────────────────────────────────────────
function R({children,d=0}:{children:React.ReactNode;d?:number}) {
  return (
    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"0px 0px -40px 0px"}} transition={{duration:0.75,delay:d,ease:[0.16,1,0.3,1]}}>
      {children}
    </motion.div>
  );
}

function Tag({label,color}:{label:string;color:string}) {
  return <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase" as const,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${color}30`,background:`${color}0c`,color,display:"inline-block"}}>{label}</span>;
}

function Btn({href,primary,children,target}:{href:string;primary?:boolean;children:React.ReactNode;target?:string}) {
  return (
    <a href={href} target={target} style={{
      display:"inline-flex",alignItems:"center",gap:8,
      padding:primary?"14px 28px":"13px 28px",
      borderRadius:10,fontSize:14,fontWeight:primary?600:500,
      textDecoration:"none",cursor:"pointer",transition:"all 0.2s",
      background:primary?CYAN:"rgba(255,255,255,0.05)",
      color:primary?"#000":WHITE,
      border:primary?"none":"0.5px solid rgba(255,255,255,0.12)",
      fontFamily:primary?"inherit":"JetBrains Mono,monospace",
      letterSpacing:primary?"normal":"0.05em",
      backdropFilter:primary?"none":"saturate(180%) blur(20px)",
      WebkitBackdropFilter:primary?"none":"saturate(180%) blur(20px)",
      boxShadow:primary
        ?`0 0 24px ${CYAN}35, inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.3)`
        :"inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {children}
    </a>
  );
}

function Sec({children,id,center,style={}}:{children:React.ReactNode;id?:string;center?:boolean;style?:React.CSSProperties}) {
  return (
    <div id={id} style={{width:"100%",padding:"80px clamp(20px,5vw,60px)",display:"flex",flexDirection:"column",alignItems:center?"center":"flex-start",...style}}>
      <div style={{width:"100%",maxWidth:1160,margin:"0 auto"}}>{children}</div>
    </div>
  );
}

function Eyebrow({children,color=CYAN}:{children:React.ReactNode;color?:string}) {
  return (
    <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase" as const,color,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
      <span style={{width:18,height:1,background:color,display:"inline-block",flexShrink:0}} />
      {children}
    </div>
  );
}

// ── MARQUEE with edge fade ───────────────────────────────────────────────────
const MARQUEE_ITEMS = ["TEEML ATTESTATION VERIFIED","0G COMPUTE · SEALED INFERENCE","0G STORAGE · PERMANENT MEMORY","0G CHAIN · ZERO ADMIN KEYS","AUTONOMOUS PAYMENT LOOP","HUMAN AUTHORIZED: FALSE","NO KILL SWITCH · ALWAYS ON","ZERO CUP 2026","ERC-7857 AGENTIC ID"];

function Marquee({overlay}:{overlay?:boolean}) {
  return (
    <div style={{
      position:overlay?"absolute":"relative",
      bottom:overlay?0:undefined,left:0,right:0,
      zIndex:20,
      borderTop:`0.5px solid ${BORDER}`,
      background:overlay?`${BG}cc`:"rgba(11,15,25,0.4)",
      backdropFilter:"blur(20px)",
      padding:"11px 0",
      overflow:"hidden",
      // Gemini point 1: fade mask on both sides
      maskImage:"linear-gradient(to right, transparent, white 8%, white 92%, transparent)",
      WebkitMaskImage:"linear-gradient(to right, transparent, white 8%, white 92%, transparent)",
    }}>
      <div style={{display:"flex",gap:40,animation:"mq 30s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
        {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((t,i)=>(
          <span key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:9.5,color:MUTED,letterSpacing:"0.14em",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{width:3,height:3,borderRadius:"50%",background:CYAN,display:"inline-block",opacity:0.6}} />{t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── GHOST HERO (interactive orb) ─────────────────────────────────────────────
function GhostHero({size=420}:{size?:number}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const ghostRef      = useRef<HTMLDivElement>(null);
  const ringsRef      = useRef<HTMLDivElement>(null);
  const badge1Ref     = useRef<HTMLDivElement>(null);
  const badge2Ref     = useRef<HTMLDivElement>(null);
  const badge3Ref     = useRef<HTMLDivElement>(null);
  const leftPupilRef  = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const onMouse=(e:MouseEvent)=>{
      if(!containerRef.current) return;
      const rect=containerRef.current.getBoundingClientRect();
      const rawX=((e.clientX-rect.left)/rect.width)*2-1;
      const rawY=((e.clientY-rect.top)/rect.height)*2-1;
      const sx=Math.atan(rawX*1.2)/(Math.PI/2);
      const sy=Math.atan(rawY*1.2)/(Math.PI/2);

      if(ringsRef.current){ringsRef.current.style.transform=`translate3d(${sx*5}px,${sy*5}px,0)`;ringsRef.current.style.transition="transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)";}
      if(ghostRef.current){ghostRef.current.style.transform=`perspective(1200px) translate3d(${sx*16}px,${sy*16}px,0) rotateY(${sx*10}deg) rotateX(${-sy*10}deg)`;ghostRef.current.style.transition="transform 0.15s cubic-bezier(0.25,0.46,0.45,0.94)";}

      [[badge1Ref,28],[badge2Ref,36],[badge3Ref,32]].forEach(([ref,spd])=>{
        const r=ref as React.RefObject<HTMLDivElement>;
        if(!r.current) return;
        r.current.style.transform=`translate3d(${sx*(spd as number)}px,${sy*(spd as number)}px,0)`;
        r.current.style.transition="transform 0.08s cubic-bezier(0.25,0.46,0.45,0.94)";
      });

      [leftPupilRef,rightPupilRef].forEach(ref=>{
        if(!ref.current) return;
        const eye=ref.current.parentElement!.getBoundingClientRect();
        const ex=eye.left+eye.width/2,ey=eye.top+eye.height/2;
        const angle=Math.atan2(e.clientY-ey,e.clientX-ex);
        const dist=Math.min(Math.hypot(e.clientX-ex,e.clientY-ey),eye.width*0.28);
        ref.current.style.transform=`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`;
        ref.current.style.transition="transform 0.04s ease-out";
      });
    };
    window.addEventListener("mousemove",onMouse,{passive:true});
    return ()=>window.removeEventListener("mousemove",onMouse);
  },[]);

  const eyeStyle=(top:string,left:string)=>({
    position:"absolute" as const,top,left,width:"16%",height:"15%",borderRadius:"50%",
    background:"radial-gradient(ellipse at 40% 35%, #0a0a0a, #000)",
    display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none" as const,
    boxShadow:"inset 0 3px 8px rgba(0,0,0,1), inset 0 0 0 1px rgba(0,255,209,0.08)",
  });
  const pupilStyle={position:"relative" as const,width:"46%",height:"46%",borderRadius:"50%",background:"radial-gradient(ellipse at 32% 28%, #00FFD1 0%, #00c8a8 45%, #007a66 75%, #004d42 100%)",boxShadow:"0 0 12px rgba(0,255,209,1), 0 0 28px rgba(0,255,209,0.7), 0 0 48px rgba(0,255,209,0.3)",willChange:"transform" as const};
  const shineStyle={position:"absolute" as const,top:"12%",right:"14%",width:"22%",height:"22%",borderRadius:"50%",background:"#fff",opacity:0.88};

  return (
    <div ref={containerRef} style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {/* Rings layer */}
      <div ref={ringsRef} style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",willChange:"transform"}}>
        <div style={{position:"absolute",width:"84%",height:"84%",borderRadius:"50%",background:`radial-gradient(ellipse, ${CYAN}14 0%, transparent 70%)`,filter:"blur(36px)",animation:"gB 5s ease-in-out infinite",pointerEvents:"none"}} />
        {[94,112,130].map((s,i)=>(
          <div key={i} style={{position:"absolute",width:`${s}%`,height:`${s}%`,borderRadius:"50%",border:`0.5px solid rgba(0,255,209,${0.1-i*0.03})`,animation:i===0?"rA 24s linear infinite":i===1?"rB 34s linear infinite":"none",pointerEvents:"none"}} />
        ))}
      </div>

      {/* Ghost + eyes */}
      <div style={{position:"relative",zIndex:2,width:"clamp(220px,100%,440px)",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div ref={ghostRef} style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",transformStyle:"preserve-3d",willChange:"transform",position:"relative",animation:"gF 8s ease-in-out infinite"}}>
          <img src="/logo2.png" alt="GHOST" style={{width:"84%",height:"84%",objectFit:"contain",mixBlendMode:"screen",filter:`drop-shadow(0 0 44px ${CYAN}55) drop-shadow(0 0 88px ${CYAN}20) brightness(1.1)`,pointerEvents:"none",userSelect:"none"}} />
          <div style={eyeStyle("29%","22%")}>
            <div ref={leftPupilRef} style={pupilStyle}><div style={shineStyle}/></div>
          </div>
          <div style={eyeStyle("29%","58%")}>
            <div ref={rightPupilRef} style={pupilStyle}><div style={shineStyle}/></div>
          </div>
        </div>

        {/* Badges */}
        <div ref={badge1Ref} style={{position:"absolute",top:"8%",left:"-8%",willChange:"transform"}}>
          <div style={{padding:"10px 16px",borderRadius:12,
            background:"rgba(255,255,255,0.06)",
            backdropFilter:"saturate(180%) blur(32px)",
            WebkitBackdropFilter:"saturate(180%) blur(32px)",
            border:"0.5px solid rgba(255,255,255,0.14)",
            fontFamily:"JetBrains Mono,monospace",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3}}>TEE Status</div>
            <div style={{fontSize:12,color:CYAN,fontWeight:600}}>Enclave Active</div>
          </div>
        </div>
        <div ref={badge2Ref} style={{position:"absolute",bottom:"14%",right:"-8%",willChange:"transform"}}>
          <div style={{padding:"10px 16px",borderRadius:12,
            background:"rgba(255,255,255,0.06)",
            backdropFilter:"saturate(180%) blur(32px)",
            WebkitBackdropFilter:"saturate(180%) blur(32px)",
            border:"0.5px solid rgba(255,255,255,0.14)",
            fontFamily:"JetBrains Mono,monospace",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3}}>Human Authorized</div>
            <div style={{fontSize:12,color:CYAN,fontWeight:600}}>FALSE</div>
          </div>
        </div>
        <div ref={badge3Ref} style={{position:"absolute",top:"42%",right:"-12%",willChange:"transform"}}>
          <div style={{padding:"10px 16px",borderRadius:12,
            background:"rgba(255,255,255,0.06)",
            backdropFilter:"saturate(180%) blur(32px)",
            WebkitBackdropFilter:"saturate(180%) blur(32px)",
            border:"0.5px solid rgba(255,255,255,0.14)",
            fontFamily:"JetBrains Mono,monospace",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3}}>Storage</div>
            <div style={{fontSize:12,color:PURPLE,fontWeight:600}}>0G Network</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SHARED CONSTANTS ─────────────────────────────────────────────────────────
const SOCIALS = [
  {href:"https://x.com/sir_mimisco",label:"X",svg:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>},
  {href:"https://github.com/mimisco-git/ghost-0g",label:"GitHub",svg:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>},
  {href:"https://t.me/sir_mimisco",label:"Telegram",svg:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>},
  {href:"https://discord.com/users/sir_mimisco",label:"Discord",svg:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.13 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>},
];

const SHARED_CSS = `
  @keyframes sh{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes gB{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
  @keyframes gF{0%,100%{transform:translateY(0px)}50%{transform:translateY(-14px)}}
  @keyframes rA{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes rB{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
  @keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sD{0%{transform:scaleY(0);transform-origin:top;opacity:0}40%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);transform-origin:bottom;opacity:0}}
  *{box-sizing:border-box;}body{margin:0;}
  ::selection{background:#00FFD122;color:#00FFD1;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.15);border-radius:2px;}
  a{transition:opacity 0.2s;}a:hover{opacity:0.82;}
`;

// ── MOBILE GLASS CARD ────────────────────────────────────────────────────────
// ── MOBILE HOME: Gemini blueprint applied ────────────────────────────────────
// SVG ghost (no PNG), touch tilt, vertical telemetry stack, no orbit rings
function MobileHome() {
  const [cycles, setCycles] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [lines, setLines] = useState<{tag:string;tc:string;msg:string;time:string}[]>([]);
  const [feedVisible, setFeedVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);
  const storageHash = "0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a";
  const P = 20;

  // Fetch stats
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats", { signal: AbortSignal.timeout(3000) });
        const j = await r.json();
        if (j.ok) setCycles(j.data?.completedCycles ?? 0);
      } catch {}
    }
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  // Touch tilt handler per Gemini blueprint
  function handleMove(clientX: number, clientY: number) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  }

  // Live feed
  const logs = [
    {tag:"COMPUTE",tc:CYAN,msg:"TEE inference · GLM-5-FP8 · AMD SEV-SNP"},
    {tag:"COMPUTE",tc:CYAN,msg:"TEEML attestation · signature valid"},
    {tag:"WALLET",tc:"#f87171",msg:"Deducted 0.0012 0G · no human signed"},
    {tag:"STORAGE",tc:PURPLE,msg:"Record written to 0G Storage"},
    {tag:"CHAIN",tc:AMBER,msg:"Hash anchored · human_authorized: FALSE"},
    {tag:"COMPUTE",tc:CYAN,msg:"New cycle · time-lock trigger fired"},
    {tag:"STORAGE",tc:PURPLE,msg:"Memory updated · no delete permission"},
  ];
  function pad(n: number) { return n < 10 ? "0"+n : ""+n; }
  function getTime() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  useEffect(() => {
    setLines(logs.slice(0, 3).map(l => ({ ...l, time: getTime() })));
    idxRef.current = 3;
    const iv = setInterval(() => {
      setLines(prev => [...prev.slice(-14), { ...logs[idxRef.current % logs.length], time: getTime() }]);
      idxRef.current++;
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [lines]);

  // Ghost SVG tilt transform
  const ghostTransform = `perspective(1000px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg)`;

  // Shared glass row style
  const glassRow = (accent: string) => ({
    background: "rgba(11,16,29,0.7)",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 16px rgba(0,0,0,0.4), 0 0 0 0.5px ${accent}10 inset`,
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={e => handleMove(e.clientX, e.clientY)}
      onTouchMove={e => { if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY); }}
      style={{ background: "#020408", color: WHITE, fontFamily: "-apple-system,'SF Pro Display',Inter,'Helvetica Neue',sans-serif", WebkitFontSmoothing: "antialiased", overflowX: "hidden", minHeight: "100vh", userSelect: "none" }}
    >
      <Particles />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${P}px`, background: "rgba(2,4,8,0.88)", backdropFilter: "saturate(200%) blur(40px)", WebkitBackdropFilter: "saturate(200%) blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid rgba(31,41,61,0.6)" }}>
            <img src="/logo2.png" alt="Ghost" style={{ width: 32, height: 32, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
          </div>
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: WHITE }}>GHOST</span>
        </div>
        <a href="https://0g.ai/arena/zero-cup" target="_blank" style={{ display: "inline-flex", alignItems: "center", padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", background: CYAN, color: "#000", letterSpacing: "0.02em", boxShadow: `0 0 16px ${CYAN}44, inset 0 1px 0 rgba(255,255,255,0.4)` }}>
          Vote
        </a>
      </nav>

      {/* HERO: full viewport, centered column */}
      <section style={{ paddingTop: 52, minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `84px ${P}px 60px`, position: "relative", zIndex: 10, textAlign: "center" }}>

        {/* Eyebrow */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <span style={{ display: "inline-block", fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: CYAN, textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 6, background: `${CYAN}08`, border: `0.5px solid ${CYAN}20`, marginBottom: 24 }}>
            Zero Cup 2026 - Built on 0G
          </span>
        </motion.div>

        {/* Ghost SVG: touch-tilt reactive, Gemini zero-pixel blueprint */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 20, position: "relative", willChange: "transform" }}
        >
          {/* Ambient glow behind ghost */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(ellipse, ${CYAN}18 0%, transparent 70%)`, filter: "blur(24px)", pointerEvents: "none", animation: "gB 5s ease-in-out infinite" }} />

          {/* SVG Ghost: Gemini vector blueprint, 8K sharp on all screens */}
          <div style={{ transform: ghostTransform, transition: "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)", willChange: "transform", position: "relative", zIndex: 2, animation: "gF 7s ease-in-out infinite" }}>
            <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 160, height: 200, filter: `drop-shadow(0 0 28px ${CYAN}55) drop-shadow(0 0 56px ${CYAN}22)` }}>
              <path
                d="M50 5C25 5 5 25 5 55V115C5 120 12 122 16 118C21 113 29 113 34 118C39 123 47 123 52 118C57 113 65 113 70 118C75 123 83 123 88 118C92 114 95 116 95 121V55C95 25 75 5 50 5Z"
                fill="url(#ghostGrad)"
              />
              {/* Left eye socket */}
              <circle cx="34" cy="53" r="7" fill="#050505" />
              {/* Left iris: cyan radial gradient */}
              <circle cx="34" cy="53" r="3.5" fill="url(#irisL)" />
              <circle cx="35.5" cy="51.5" r="1" fill="#fff" opacity="0.9" />
              {/* Right eye socket */}
              <circle cx="66" cy="53" r="7" fill="#050505" />
              {/* Right iris */}
              <circle cx="66" cy="53" r="3.5" fill="url(#irisR)" />
              <circle cx="67.5" cy="51.5" r="1" fill="#fff" opacity="0.9" />
              <defs>
                <linearGradient id="ghostGrad" x1="50" y1="5" x2="50" y2="125" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" stopOpacity="0.97" />
                  <stop offset="0.55" stopColor="#d4f5ef" />
                  <stop offset="0.82" stopColor="#9fd8cc" />
                  <stop offset="1" stopColor="#3ca68e" />
                </linearGradient>
                <radialGradient id="irisL" cx="35%" cy="30%" r="60%">
                  <stop stopColor="#00FFD1" />
                  <stop offset="0.6" stopColor="#00c8a8" />
                  <stop offset="1" stopColor="#004d42" />
                </radialGradient>
                <radialGradient id="irisR" cx="35%" cy="30%" r="60%">
                  <stop stopColor="#00FFD1" />
                  <stop offset="0.6" stopColor="#00c8a8" />
                  <stop offset="1" stopColor="#004d42" />
                </radialGradient>
              </defs>
            </svg>
            {/* Brand text under ghost */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ display: "block", fontFamily: "JetBrains Mono,monospace", fontSize: 18, fontWeight: 900, letterSpacing: "0.25em", color: WHITE, textTransform: "uppercase" as const }}>GHOST</span>
              <span style={{ display: "block", fontFamily: "JetBrains Mono,monospace", fontSize: 8, letterSpacing: "0.3em", color: MUTED, textTransform: "uppercase" as const, marginTop: 2 }}>AUTONOMOUS AI</span>
            </div>
          </div>
        </motion.div>

        {/* H1 */}
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.16,1,0.3,1] }} style={{ fontSize: "clamp(30px,8vw,46px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.06, margin: "0 0 14px" }}>
          The AI that<br />
          <span style={{ color: "transparent", backgroundImage: `linear-gradient(135deg, ${WHITE}, #c2f7ec, #3ca68e)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            cannot be stopped.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }} style={{ fontSize: 14, color: MUTED, fontWeight: 300, lineHeight: 1.75, margin: "0 0 28px", maxWidth: 300 }}>
          Autonomous agent inside 0G&apos;s TEE. <strong style={{ color: WHITE, fontWeight: 500 }}>Pays for its own compute.</strong> No admin key. No kill switch.
        </motion.p>

        {/* CTAs: full width, stacked */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.7 }} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300, marginBottom: 28 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "15px 24px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", background: CYAN, color: "#000", boxShadow: `0 0 24px ${CYAN}44, inset 0 1px 0 rgba(255,255,255,0.4)`, letterSpacing: "-0.01em" }}>
            Watch it think live
          </a>
          <a href="https://github.com/mimisco-git/ghost-0g" target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 24px", borderRadius: 13, fontSize: 13, fontWeight: 500, textDecoration: "none", background: "rgba(255,255,255,0.05)", color: WHITE, border: "0.5px solid rgba(255,255,255,0.13)", backdropFilter: "blur(20px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", fontFamily: "JetBrains Mono,monospace", letterSpacing: "0.04em" }}>
            Read the code
          </a>
        </motion.div>

        {/* Gemini blueprint: vertical telemetry stack (not floating badges) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }} style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={glassRow(CYAN)}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 600 }}>TEE Status</span>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: CYAN, fontWeight: 700 }}>Enclave Active</span>
          </div>
          <div style={glassRow(PURPLE)}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 600 }}>Storage Network</span>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: PURPLE, fontWeight: 700 }}>0G Network</span>
          </div>
          <div style={glassRow("#ff4d6a")}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9.5, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 600 }}>Human Authorized</span>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: "#ff4d6a", fontWeight: 700 }}>FALSE</span>
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
          {[[CYAN,"0G Compute"],[PURPLE,"0G Storage"],[AMBER,"0G Chain"],[MUTED,"ERC-7857"]].map(([c,l]) => (
            <span key={l} style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "4px 10px", borderRadius: 5, border: `0.5px solid ${c}30`, background: `${c}0c`, color: c }}>{l}</span>
          ))}
        </motion.div>

        {/* Marquee: overlaid at hero bottom with fade mask */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, borderTop: "0.5px solid rgba(31,41,61,0.6)", background: "rgba(2,4,8,0.85)", backdropFilter: "blur(20px)", padding: "9px 0", overflow: "hidden", maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)" }}>
          <div style={{ display: "flex", gap: 28, animation: "mq 26s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
              <span key={i} style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, color: MUTED, letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: CYAN, display: "inline-block", opacity: 0.5 }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS 2x2 */}
      <section style={{ padding: `0 ${P}px 24px` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", border: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          {[{val:cycles||0,label:"Cycles",sub:"TEE verified",c:CYAN},{val:"0",label:"Admin keys",sub:"No owner",c:CYAN},{val:"3",label:"0G layers",sub:"All load-bearing",c:WHITE},{val:"FALSE",label:"Human auth",sub:"Every cycle",c:CYAN}].map((m,i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", padding: "18px 14px", textAlign: "center", backdropFilter: "blur(40px)" }}>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 24, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: m.c, marginBottom: 3 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: DIMMED }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" style={{ padding: `0 ${P}px 24px` }}>
        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: CYAN, textTransform: "uppercase" as const, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 1, background: CYAN, display: "inline-block" }} />Architecture
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 14px" }}>Three layers. All load-bearing.</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {[
            {tag:"0G Compute",c:CYAN,title:"Verifiable inference",body:"Every inference runs inside a Confidential VM with AMD SEV-SNP. TEEML attestation proves the model ran unmodified."},
            {tag:"0G Storage",c:PURPLE,title:"Permanent memory",body:"Every output is written to decentralized storage with a content hash. No delete function exists. History is permanent."},
            {tag:"0G Chain",c:AMBER,title:"Ownerless contract",body:"No admin key. No pause function. No upgrade path. GHOST pays for its own compute. No human signature required."},
            {tag:"Autonomous",c:MUTED,title:"Self-sustaining entity",body:"Wakes on-chain, runs inference, pays wallet, writes storage, anchors hash, sleeps. No human action needed."},
          ].map((c,i,arr) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderBottom: i < arr.length-1 ? "0.5px solid rgba(255,255,255,0.06)" : "none", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }} />
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 5, border: `0.5px solid ${c.c}30`, background: `${c.c}0c`, color: c.c, display: "inline-block", marginBottom: 9 }}>{c.tag}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 5px", color: WHITE }}>{c.title}</h3>
              <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: `0 ${P}px 24px` }}>
        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: CYAN, textTransform: "uppercase" as const, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 1, background: CYAN, display: "inline-block" }} />Autonomous loop
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Every 6 minutes</h2>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.4)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)", pointerEvents: "none", borderRadius: 14 }} />
          {[
            {n:"01",title:"Wake on-chain",pill:"0G Chain",pc:AMBER},
            {n:"02",title:"Run inference in TEE",pill:"TEEML",pc:CYAN},
            {n:"03",title:"Pay for compute",pill:"Auto pay",pc:AMBER},
            {n:"04",title:"Write to 0G Storage",pill:"Storage",pc:PURPLE},
            {n:"05",title:"Anchor hash on chain",pill:"Immutable",pc:AMBER},
            {n:"06",title:"Sleep. Repeat.",pill:"Always on",pc:MUTED},
          ].map((s,i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < 5 ? "0.5px solid rgba(255,255,255,0.06)" : "none", position: "relative" }}>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: DIMMED, width: 22, flexShrink: 0, fontWeight: 600 }}>{s.n}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, letterSpacing: "-0.01em" }}>{s.title}</span>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8, fontWeight: 600, padding: "3px 9px", borderRadius: 5, border: `0.5px solid ${s.pc}30`, background: `${s.pc}0c`, color: s.pc, flexShrink: 0, letterSpacing: "0.07em" }}>{s.pill}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 0G STORAGE */}
      <section id="storage" style={{ padding: `0 ${P}px 24px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase" as const, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 14, height: 1, background: PURPLE, display: "inline-block" }} />0G Storage
          </div>
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, color: PURPLE, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: PURPLE, display: "inline-block", animation: "pulse 2.5s infinite" }} />LIVE
          </span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>Every cycle, permanently stored.</h2>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 32px rgba(0,0,0,0.4)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)", pointerEvents: "none", borderRadius: 14 }} />
          <div style={{ padding: "11px 16px", background: `${PURPLE}06`, borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Latest Record</span>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, color: PURPLE, fontWeight: 600 }}>PERMANENT</span>
          </div>
          <div style={{ padding: "12px 16px", fontFamily: "JetBrains Mono,monospace", fontSize: 10.5, position: "relative" }}>
            {[["network","0G Galileo Testnet",WHITE],["root_hash",storageHash.slice(0,20)+"...",PURPLE],["replicated","TRUE",CYAN],["deletable","FALSE",CYAN]].map(([k,v,c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", gap: 8 }}>
                <span style={{ color: MUTED, flexShrink: 0 }}>{k}</span>
                <span style={{ color: c, textAlign: "right" as const }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)", position: "relative" }}>
            <a href="https://storagescan-galileo.0g.ai/submission/126985" target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: 10, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, fontFamily: "JetBrains Mono,monospace", fontSize: 11, fontWeight: 700, color: PURPLE, textDecoration: "none", boxShadow: `0 0 16px ${PURPLE}18` }}>
              Verify on StorageScan
            </a>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" style={{ padding: `0 ${P}px 24px` }}>
        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: CYAN, textTransform: "uppercase" as const, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 1, background: CYAN, display: "inline-block" }} />Proof
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 14px" }}>
          Don&apos;t trust us. <em style={{ color: CYAN, fontStyle: "normal" }}>Verify it.</em>
        </h2>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 32px rgba(0,0,0,0.4), 0 0 0 0.5px ${CYAN}08 inset`, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)", pointerEvents: "none", borderRadius: 14 }} />
          <div style={{ padding: "11px 16px", background: `${CYAN}05`, borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Attestation Receipt</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, color: CYAN, fontWeight: 600 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2.5s infinite" }} />TEEML VERIFIED
            </span>
          </div>
          <div style={{ padding: "12px 16px", fontFamily: "JetBrains Mono,monospace", fontSize: 10.5, position: "relative" }}>
            {[["agent","ghost-v1.0 · 0xD040...ed40",WHITE],["model","GLM-5-FP8 · 0G Compute",AMBER],["enclave","AMD SEV-SNP",CYAN],["human_auth","FALSE",CYAN],["tampered","FALSE",CYAN]].map(([k,v,c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", gap: 8 }}>
                <span style={{ color: MUTED, flexShrink: 0 }}>{k}</span>
                <span style={{ color: c, textAlign: "right" as const }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, position: "relative" }}>
            <a href="https://chainscan-galileo.0g.ai" target="_blank" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: `${CYAN}0c`, border: `0.5px solid ${CYAN}30`, fontFamily: "JetBrains Mono,monospace", fontSize: 11, fontWeight: 700, color: CYAN, textDecoration: "none" }}>0G Chain</a>
            <a href="https://storagescan-galileo.0g.ai/submission/126985" target="_blank" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 9, background: `${PURPLE}0c`, border: `0.5px solid ${PURPLE}30`, fontFamily: "JetBrains Mono,monospace", fontSize: 11, fontWeight: 700, color: PURPLE, textDecoration: "none" }}>StorageScan</a>
          </div>
        </div>
      </section>

      {/* LIVE FEED: collapsible to save space */}
      <section style={{ padding: `0 ${P}px 24px` }}>
        <button
          onClick={() => setFeedVisible(v => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: feedVisible ? "14px 14px 0 0" : 14, padding: "14px 16px", cursor: "pointer", color: WHITE, fontFamily: "JetBrains Mono,monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulse 2s infinite" }} />Live agent feed
          </span>
          <span style={{ color: MUTED, fontSize: 12, transform: feedVisible ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>
        {feedVisible && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.1)", borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
            <div ref={feedRef} style={{ padding: "10px 14px", height: 180, overflowY: "auto", fontFamily: "JetBrains Mono,monospace", display: "flex", flexDirection: "column", gap: 1 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ fontSize: 10, lineHeight: 1.85, display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: DIMMED, flexShrink: 0, width: 54, fontSize: 9.5 }}>{l.time}</span>
                  <span style={{ flexShrink: 0, fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 3, alignSelf: "center", background: `${l.tc}14`, color: l.tc, border: `0.5px solid ${l.tc}22`, letterSpacing: "0.06em", minWidth: 50, textAlign: "center" as const }}>{l.tag}</span>
                  <span style={{ color: "rgba(243,244,246,0.38)", flex: 1 }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ padding: `0 ${P}px 40px`, textAlign: "center" }}>
        <div style={{ background: `radial-gradient(ellipse at 50% 0%, ${CYAN}09 0%, transparent 70%)`, padding: "36px 16px 32px", borderRadius: 20 }}>
          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: CYAN, textTransform: "uppercase" as const, marginBottom: 12 }}>Zero Cup 2026</div>
          <h2 style={{ fontSize: "clamp(30px,8vw,44px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.0, margin: "0 0 12px" }}>
            The first AI<br />no one can <span style={{ color: CYAN }}>kill.</span>
          </h2>
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.75, margin: "0 auto 24px", maxWidth: 260 }}>
            Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 280, margin: "0 auto" }}>
            <a href="https://0g.ai/arena/zero-cup" target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "15px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", background: CYAN, color: "#000", boxShadow: `0 0 24px ${CYAN}44, inset 0 1px 0 rgba(255,255,255,0.4)` }}>Vote for GHOST</a>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "13px", borderRadius: 13, fontSize: 12, fontWeight: 500, textDecoration: "none", background: "rgba(255,255,255,0.04)", color: WHITE, border: "0.5px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", fontFamily: "JetBrains Mono,monospace", letterSpacing: "0.04em" }}>Live dashboard</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(2,4,8,0.7)", backdropFilter: "saturate(180%) blur(40px)", WebkitBackdropFilter: "saturate(180%) blur(40px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <div style={{ padding: `22px ${P}px 20px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, overflow: "hidden", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid rgba(31,41,61,0.6)" }}>
              <img src="/logo2.png" alt="Ghost" style={{ width: 30, height: 30, objectFit: "cover", objectPosition: "center 10%", mixBlendMode: "screen" }} />
            </div>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12, color: WHITE, letterSpacing: "0.18em", fontWeight: 700 }}>GHOST</span>
          </div>
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, margin: "0 0 18px" }}>Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.16em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 2 }}>Project</span>
              {[["Architecture","#architecture"],["Storage","#storage"],["Proof","#proof"],["Dashboard","/dashboard"]].map(([l,h]) => <a key={l} href={h} style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>{l}</a>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.16em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 2 }}>Links</span>
              {[["GitHub","https://github.com/mimisco-git/ghost-0g"],["0G Docs","https://docs.0g.ai"],["Zero Cup","https://0g.ai/arena/zero-cup"],["StorageScan","https://storagescan-galileo.0g.ai"]].map(([l,h]) => <a key={l} href={h} target="_blank" style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>{l}</a>)}
            </div>
          </div>
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, fontWeight: 700, color: WHITE, margin: "0 0 2px" }}>GHOST · Zero Cup 2026</p>
              <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: DIMMED, margin: 0 }}>2026 GHOST · 0G Ecosystem</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" aria-label={s.label} style={{ color: MUTED, textDecoration: "none", display: "flex" }}>{s.svg}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{SHARED_CSS + `@keyframes gF{0%,100%{transform:translateY(0px)}50%{transform:translateY(-12px)}}`}</style>
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile();

  // ALL hooks before any conditional return (React rules of hooks)
  const [cycles,setCycles]=useState(0);
  const [storageHash]=useState("0xd967a299b7e5f34da189b0e4d5c146bf4cee5980265374cbd0d2e808fe52ba5a");
  const [lines,setLines]=useState<{tag:string;tc:string;msg:string;time:string}[]>([]);
  const feedRef=useRef<HTMLDivElement>(null);
  const idxRef=useRef(0);
  const {scrollY}=useScroll();
  const rawY=useTransform(scrollY,[0,700],[0,-80]);
  const heroY=useSpring(rawY,{stiffness:80,damping:22});

  const logs=[
    {tag:"COMPUTE",tc:CYAN,msg:"TEE inference · GLM-5-FP8 · AMD SEV-SNP enclave"},
    {tag:"COMPUTE",tc:CYAN,msg:"TEEML attestation generated · signature valid"},
    {tag:"WALLET",tc:"#f87171",msg:"Deducted 0.0012 0G · autonomous · no human signed"},
    {tag:"STORAGE",tc:PURPLE,msg:"Record written to 0G Storage · hash anchored"},
    {tag:"CHAIN",tc:AMBER,msg:"Hash anchored on 0G Chain · human_authorized: FALSE"},
    {tag:"COMPUTE",tc:CYAN,msg:"New cycle · on-chain time-lock trigger fired"},
    {tag:"STORAGE",tc:PURPLE,msg:"Memory corpus updated · no delete permission"},
    {tag:"CHAIN",tc:AMBER,msg:"Admin key check · NONE FOUND · contract immutable"},
  ];
  function pad(n:number){return n<10?"0"+n:""+n;}
  function getTime(){const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;}

  useEffect(()=>{
    async function load(){try{const r=await fetch("/api/stats",{signal:AbortSignal.timeout(3000)});const j=await r.json();if(j.ok)setCycles(j.data?.completedCycles??0);}catch{}}
    load();const si=setInterval(load,30000);return()=>clearInterval(si);
  },[]);

  useEffect(()=>{
    setLines(logs.slice(0,3).map(l=>({...l,time:getTime()})));idxRef.current=3;
    const iv=setInterval(()=>{setLines(prev=>[...prev.slice(-22),{...logs[idxRef.current%logs.length],time:getTime()}]);idxRef.current++;},2800);
    return ()=>clearInterval(iv);
  },[]);

  useEffect(()=>{if(feedRef.current)feedRef.current.scrollTop=feedRef.current.scrollHeight;},[lines]);

  // Safe to branch now: all hooks have been called
  if (isMobile) return <MobileHome />;

  const arch=[
    {tag:"0G Compute",color:CYAN,title:"Verifiable inference",body:"Every inference runs inside a Confidential VM with AMD SEV-SNP. TEEML attestation cryptographically proves the exact model ran unmodified. Not even 0G sees the input."},
    {tag:"0G Storage",color:PURPLE,title:"Permanent memory",body:"Every output and attestation is written to decentralized storage with a content hash. No delete function exists. The complete history is permanent and tamper-proof."},
    {tag:"0G Chain",color:AMBER,title:"Ownerless contract",body:"No admin key. No pause function. No upgrade path. GHOST holds its own wallet and pays for compute. No human signature is ever required."},
    {tag:"Autonomous",color:DIMMED,title:"Self-sustaining entity",body:"Wakes on-chain, runs inference, pays from its wallet, writes to storage, anchors hash, sleeps. Runs indefinitely without any human action.",wide:true},
    {tag:"ERC-7857",color:DIMMED,title:"Coming: GHOST mints itself",body:"After cycle 10, GHOST mints its own Agentic ID with complete memory encrypted inside. Ownable, transferable. The buyer receives a running agent."},
  ];

  const steps=[
    {n:"01",title:"Wake on-chain",desc:"Time-locked trigger fires on 0G Chain. No human initiates this.",pill:"0G Chain",pc:AMBER},
    {n:"02",title:"Run inference in TEE",desc:"0G Compute routes to hardware enclave. TEEML attestation generated.",pill:"TEEML",pc:CYAN},
    {n:"03",title:"Pay for its own compute",desc:"Deducts cost from its own on-chain wallet. No human signs. Contract settles.",pill:"Auto pay",pc:AMBER},
    {n:"04",title:"Write to 0G Storage",desc:"Full record written with content hash. Permanent. Verifiable on StorageScan.",pill:"0G Storage",pc:PURPLE},
    {n:"05",title:"Anchor hash on chain",desc:"Content hash anchored on 0G Chain. Tamper-proof forever.",pill:"Immutable",pc:AMBER},
    {n:"06",title:"Sleep. Repeat.",desc:"Self-sustaining. No human required at any step.",pill:"Always on",pc:DIMMED},
  ];

  return (
    <div style={{background:BG,color:WHITE,fontFamily:"-apple-system,'SF Pro Display',Inter,'Helvetica Neue',sans-serif",WebkitFontSmoothing:"antialiased",overflowX:"hidden",minHeight:"100vh"}}>
      <Particles />

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:1000,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 40px",background:"rgba(3,7,18,0.72)",backdropFilter:"saturate(200%) blur(40px)",WebkitBackdropFilter:"saturate(200%) blur(40px)",borderBottom:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 -0.5px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(0,0,0,0.4)"}}>
        <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
          <div style={{width:30,height:30,borderRadius:8,overflow:"hidden",background:"#0a0f1a",display:"flex",alignItems:"center",justifyContent:"center",border:"0.5px solid rgba(31,41,61,0.6)"}}>
            <img src="/logo2.png" alt="Ghost" style={{width:34,height:34,objectFit:"cover",objectPosition:"center 10%",mixBlendMode:"screen"}} />
          </div>
          <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,letterSpacing:"0.2em",color:WHITE}}>GHOST</span>
        </a>
        <div style={{display:"flex",gap:32,position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
          {[["Architecture","#architecture"],["Proof","#proof"],["Storage","#storage"],["Dashboard","/dashboard"]].map(([l,h])=>(
            <a key={l} href={h} style={{fontSize:13,color:MUTED,textDecoration:"none",fontWeight:400}}>{l}</a>
          ))}
        </div>
        <a href="https://0g.ai/arena/zero-cup" target="_blank" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none",background:CYAN,color:"#000",boxShadow:`0 0 20px ${CYAN}40, 0 4px 12px rgba(0,0,0,0.3)`}}>
          Vote on Zero Cup
        </a>
      </nav>

      {/* HERO */}
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"110px 60px 60px",position:"relative",zIndex:10}}>
        <motion.div style={{y:heroY,width:"100%",maxWidth:1160,display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
          <div>
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.1,ease:[0.16,1,0.3,1]}}>
              <Eyebrow>Zero Cup 2026 · Built on 0G · Sealed Inference</Eyebrow>
            </motion.div>
            <motion.h1 initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:1,delay:0.25,ease:[0.16,1,0.3,1]}} style={{fontSize:"clamp(40px,5.2vw,76px)",fontWeight:800,letterSpacing:"-0.05em",lineHeight:1.01,margin:"0 0 24px",color:WHITE}}>
              The AI that<br />
              <span style={{background:`linear-gradient(135deg,${WHITE} 0%,${CYAN} 52%,${WHITE} 100%)`,backgroundSize:"200% 200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"sh 6s ease-in-out infinite"}}>
                cannot be stopped.
              </span>
            </motion.h1>
            <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.9,delay:0.4,ease:[0.16,1,0.3,1]}} style={{fontSize:"clamp(15px,1.5vw,17px)",fontWeight:300,color:MUTED,lineHeight:1.85,margin:"0 0 40px",maxWidth:460}}>
              Autonomous agent inside 0G&apos;s TEE.{" "}<strong style={{color:WHITE,fontWeight:500}}>Pays for its own compute.</strong>{" "}Runs under a contract with{" "}<strong style={{color:WHITE,fontWeight:500}}>no admin key.</strong>{" "}No kill switch. Not even ours.
            </motion.p>
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.9,delay:0.55,ease:[0.16,1,0.3,1]}} style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:36}}>
              <Btn href="/dashboard" primary>Watch it think live</Btn>
              <Btn href="https://github.com/mimisco-git/ghost-0g" target="_blank">Read the code</Btn>
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1,delay:0.75}} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Tag label="0G Compute" color={CYAN} />
              <Tag label="0G Storage" color={PURPLE} />
              <Tag label="0G Chain" color={AMBER} />
              <Tag label="ERC-7857" color={MUTED} />
            </motion.div>
          </div>

          <motion.div initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} transition={{duration:1.3,delay:0.3,ease:[0.16,1,0.3,1]}} style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            <GhostHero size={440} />
          </motion.div>
        </motion.div>

        <div style={{position:"absolute",bottom:"5rem",left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,zIndex:10}}>
          <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:DIMMED,letterSpacing:"0.18em",textTransform:"uppercase"}}>Scroll</span>
          <div style={{width:1,height:32,background:`linear-gradient(to bottom,${CYAN}60,transparent)`,animation:"sD 2.2s ease-in-out infinite"}} />
        </div>

        <Marquee overlay />
      </div>

      {/* METRICS */}
      <Sec style={{padding:"56px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(255,255,255,0.06)",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
          {[{val:cycles||0,label:"Inference cycles",sub:"TEE verified",color:CYAN},{val:"0",label:"Admin keys",sub:"No owner exists",color:CYAN},{val:"3",label:"0G layers",sub:"All load-bearing",color:WHITE},{val:"FALSE",label:"Human authorized",sub:"Every single cycle",color:CYAN}].map((m,i)=>(
            <R key={i} d={i*0.07}>
              <div style={{background:"rgba(255,255,255,0.02)",padding:"28px 20px",textAlign:"center",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)"}}>
                <div style={{fontSize:9.5,fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:MUTED,marginBottom:8}}>{m.label}</div>
                <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:"clamp(22px,3vw,40px)",fontWeight:700,letterSpacing:"-0.04em",lineHeight:1,color:m.color,marginBottom:5}}>{m.val}</div>
                <div style={{fontSize:10,color:DIMMED}}>{m.sub}</div>
              </div>
            </R>
          ))}
        </div>
      </Sec>

      {/* ARCHITECTURE */}
      <Sec id="architecture" style={{paddingTop:0,padding:"0 60px 80px"}}>
        <R><Eyebrow>Architecture</Eyebrow></R>
        <R d={0.08}><h2 style={{fontSize:"clamp(28px,4.5vw,54px)",fontWeight:700,letterSpacing:"-0.035em",lineHeight:1.06,margin:"0 0 12px"}}>Three layers.<br />All load-bearing.</h2></R>
        <R d={0.16}><p style={{fontSize:15,color:MUTED,fontWeight:300,lineHeight:1.8,maxWidth:500,margin:"0 0 40px"}}>Remove any one and GHOST fails. 0G is the reason it exists at all.</p></R>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.4)",border:"0.5px solid rgba(255,255,255,0.08)"}}>
          {arch.map((c,i)=>(
            <R key={i} d={i*0.06}>
              <div style={{gridColumn:(c as any).wide?"span 2":undefined,height:"100%"}}>
                <ArchCard tag={c.tag} color={c.color} title={c.title} body={c.body} />
              </div>
            </R>
          ))}
        </div>
      </Sec>

      {/* STEPS */}
      <Sec style={{paddingTop:0,padding:"0 60px 80px"}}>
        <div style={{maxWidth:880,margin:"0 auto",width:"100%"}}>
          <R><Eyebrow>Autonomous loop</Eyebrow></R>
          <R d={0.08}><h2 style={{fontSize:"clamp(22px,3.5vw,42px)",fontWeight:700,letterSpacing:"-0.03em",margin:"0 0 32px"}}>What GHOST does every 6 minutes</h2></R>
          <Card glow={CYAN}>
            {steps.map((s,i)=>(
              <R key={i} d={i*0.05}>
                <div style={{display:"flex",alignItems:"center",gap:16,padding:"20px 26px",borderBottom:i<5?`0.5px solid rgba(255,255,255,0.06)`:"none",background:"rgba(255,255,255,0.01)",transition:"background 0.15s"}}>
                  <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:DIMMED,width:28,flexShrink:0,fontWeight:600}}>{s.n}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:14,fontWeight:600,letterSpacing:"-0.02em",margin:"0 0 3px"}}>{s.title}</p>
                    <p style={{fontSize:12.5,color:MUTED,fontWeight:300,lineHeight:1.65,margin:0}}>{s.desc}</p>
                  </div>
                  <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,padding:"5px 12px",borderRadius:6,border:`0.5px solid ${s.pc}30`,background:`${s.pc}0c`,color:s.pc,flexShrink:0,letterSpacing:"0.08em"}}>{s.pill}</span>
                </div>
              </R>
            ))}
          </Card>
        </div>
      </Sec>

      {/* 0G STORAGE */}
      <Sec id="storage" style={{paddingTop:0,padding:"0 60px 80px"}}>
        <R>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <Eyebrow color={PURPLE}>0G Storage</Eyebrow>
            <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:8.5,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase" as const,padding:"3px 9px",borderRadius:5,background:`${PURPLE}0c`,border:`0.5px solid ${PURPLE}30`,color:PURPLE}}>LIVE</span>
          </div>
        </R>
        <R d={0.08}><h2 style={{fontSize:"clamp(20px,3.5vw,42px)",fontWeight:700,letterSpacing:"-0.03em",margin:"0 0 12px"}}>Every cycle, permanently stored.</h2></R>
        <R d={0.16}><p style={{fontSize:15,color:MUTED,fontWeight:300,lineHeight:1.8,maxWidth:520,margin:"0 0 36px"}}>Every inference GHOST produces is written to 0G Storage with a content hash. Verifiable by anyone on StorageScan. No delete button exists.</p></R>
        <R d={0.24}>
          <Card glow={PURPLE}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"rgba(124,106,247,0.04)",borderBottom:`0.5px solid rgba(255,255,255,0.06)`}}>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9.5,color:MUTED,letterSpacing:"0.12em",textTransform:"uppercase" as const}}>Latest Storage Record · 0G Network</span>
              <span style={{display:"flex",alignItems:"center",gap:6,fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,color:PURPLE,padding:"4px 12px",borderRadius:6,background:`${PURPLE}0c`,border:`0.5px solid ${PURPLE}30`}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:PURPLE,display:"inline-block",animation:"pulse 2.5s infinite"}} />PERMANENT
              </span>
            </div>
            <div style={{padding:"16px 20px",fontFamily:"JetBrains Mono,monospace",fontSize:12}}>
              {[["network","0G Galileo Testnet · Chain ID 16602",WHITE],["root_hash",storageHash,PURPLE],["content","GHOST agent inference record + attestation",WHITE],["replicated","TRUE · distributed across 0G storage nodes",CYAN],["deletable","FALSE · no delete function exists",CYAN]].map(([k,v,c])=>(
                <div key={k} style={{display:"flex",gap:16,padding:"8px 0",borderBottom:`0.5px solid rgba(255,255,255,0.05)`}}>
                  <span style={{color:MUTED,width:100,flexShrink:0}}>{k}</span>
                  <span style={{color:c,wordBreak:"break-all" as const}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderTop:`0.5px solid rgba(255,255,255,0.06)`}}>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:MUTED}}>0G Storage Network · Galileo Testnet</span>
              <a href="https://storagescan-galileo.0g.ai/submission/126985" target="_blank" style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:PURPLE,textDecoration:"none",fontWeight:600}}>View on StorageScan</a>
            </div>
          </Card>
        </R>
      </Sec>

      {/* PROOF */}
      <Sec id="proof" center style={{paddingTop:0,padding:"0 60px 80px"}}>
        <R><h2 style={{fontSize:"clamp(32px,5vw,62px)",fontWeight:700,letterSpacing:"-0.04em",lineHeight:1.05,margin:"0 0 14px",textAlign:"center"}}>Don&apos;t trust us.<br /><em style={{color:CYAN,fontStyle:"normal"}}>Verify it.</em></h2></R>
        <R d={0.1}><p style={{fontSize:15,color:MUTED,fontWeight:300,lineHeight:1.8,maxWidth:420,margin:"0 auto 44px",textAlign:"center"}}>Every claim is independently checkable on 0G Chain and StorageScan. Not a promise. A cryptographic proof.</p></R>
        <R d={0.22}>
          <div style={{maxWidth:720,margin:"0 auto",textAlign:"left",width:"100%"}}>
            <Card glow={CYAN}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:`${CYAN}04`,borderBottom:`0.5px solid rgba(255,255,255,0.06)`}}>
                <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9.5,color:MUTED,letterSpacing:"0.12em",textTransform:"uppercase" as const}}>Attestation Receipt · 0G Compute</span>
                <span style={{display:"flex",alignItems:"center",gap:6,fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,color:CYAN,padding:"4px 12px",borderRadius:6,background:`${CYAN}0c`,border:`0.5px solid ${CYAN}30`}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:CYAN,display:"inline-block",animation:"pulse 2.5s infinite"}} />TEEML VERIFIED
                </span>
              </div>
              <div style={{padding:"14px 20px",fontFamily:"JetBrains Mono,monospace",fontSize:12}}>
                {[["agent_id","ghost-v1.0 · 0xD040...ed40",WHITE],["model","zai-org/GLM-5-FP8 · 0G Compute Router",AMBER],["verifiability","TEEML · hardware enclave confirmed",CYAN],["enclave_type","Confidential VM · AMD SEV-SNP",WHITE],["human_authorized","FALSE · autonomous execution confirmed",CYAN],["tampered","FALSE · signature valid · enclave genuine",CYAN]].map(([k,v,c])=>(
                  <div key={k} style={{display:"flex",gap:16,padding:"8px 0",borderBottom:`0.5px solid rgba(255,255,255,0.05)`}}>
                    <span style={{color:MUTED,width:140,flexShrink:0}}>{k}</span>
                    <span style={{color:c,wordBreak:"break-all" as const}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:16,padding:"12px 20px",borderTop:`0.5px solid rgba(255,255,255,0.06)`,justifyContent:"space-between"}}>
                <a href="https://chainscan-galileo.0g.ai" target="_blank" style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:CYAN,textDecoration:"none",fontWeight:600}}>Verify on 0G Chain</a>
                <a href="https://storagescan-galileo.0g.ai/submission/126985" target="_blank" style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:PURPLE,textDecoration:"none",fontWeight:600}}>Verify on StorageScan</a>
              </div>
            </Card>
          </div>
        </R>
      </Sec>

      {/* LIVE FEED */}
      <Sec style={{paddingTop:0,padding:"0 60px 80px"}}>
        <div style={{maxWidth:820,margin:"0 auto",width:"100%"}}>
          <R><Eyebrow>Live agent activity</Eyebrow></R>
          <R d={0.08}>
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"12px 18px",background:"rgba(11,15,25,0.6)",borderBottom:`0.5px solid rgba(255,255,255,0.06)`}}>
                {[["#ff5f57"],["#ffbd2e"],["#28c941"]].map(([c])=><div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}} />)}
                <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:MUTED,marginLeft:"auto",letterSpacing:"0.06em"}}>ghost-agent · live cycle feed</span>
              </div>
              <div ref={feedRef} style={{padding:"12px 16px",minHeight:220,maxHeight:220,overflowY:"auto",fontFamily:"JetBrains Mono,monospace",display:"flex",flexDirection:"column",gap:2}}>
                {lines.map((l,i)=>(
                  <div key={i} style={{fontSize:11.5,lineHeight:1.9,display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{color:DIMMED,flexShrink:0,width:68}}>{l.time}</span>
                    <span style={{flexShrink:0,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:4,alignSelf:"center",minWidth:58,textAlign:"center" as const,letterSpacing:"0.08em",background:`${l.tc}15`,color:l.tc,border:`0.5px solid ${l.tc}25`}}>{l.tag}</span>
                    <span style={{color:"rgba(243,244,246,0.4)",flex:1}}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </Card>
          </R>
        </div>
      </Sec>

      {/* CTA */}
      <Sec center style={{paddingTop:0,padding:"0 60px 80px"}}>
        <R><Eyebrow>Zero Cup 2026 · Group Stage</Eyebrow></R>
        <R d={0.08}><h2 style={{fontSize:"clamp(40px,7vw,86px)",fontWeight:800,letterSpacing:"-0.05em",lineHeight:1.0,margin:"0 0 16px",textAlign:"center"}}>The first AI<br />no one can <span style={{color:CYAN}}>kill.</span></h2></R>
        <R d={0.16}><p style={{fontSize:16,color:MUTED,fontWeight:300,maxWidth:440,margin:"0 auto 40px",lineHeight:1.8,textAlign:"center"}}>Not us. Not 0G. Not anyone. Once deployed, GHOST runs until its wallet empties. That is not a feature. That is the architecture.</p></R>
        <R d={0.24}>
          <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
            <Btn href="https://0g.ai/arena/zero-cup" target="_blank" primary>Vote for GHOST</Btn>
            <Btn href="/dashboard">Live dashboard</Btn>
          </div>
        </R>
      </Sec>

      {/* FOOTER */}
      <footer style={{borderTop:"0.5px solid rgba(255,255,255,0.07)",position:"relative",zIndex:10,background:"rgba(3,7,18,0.6)",backdropFilter:"saturate(180%) blur(40px)",WebkitBackdropFilter:"saturate(180%) blur(40px)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:1160,margin:"0 auto",padding:"48px 60px 28px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:48,alignItems:"start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:26,height:26,borderRadius:7,overflow:"hidden",background:"#0a0f1a",display:"flex",alignItems:"center",justifyContent:"center",border:`0.5px solid rgba(31,41,61,0.6)`}}>
                <img src="/logo2.png" alt="Ghost" style={{width:30,height:30,objectFit:"cover",objectPosition:"center 10%",mixBlendMode:"screen"}} />
              </div>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,color:WHITE,letterSpacing:"0.18em",fontWeight:700}}>GHOST</span>
            </div>
            <p style={{fontSize:13,color:MUTED,lineHeight:1.75,maxWidth:200,margin:0}}>Verifiable compute. Permanent memory. No kill switch. Built on 0G.</p>
          </div>
          <div style={{display:"flex",gap:48}}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,letterSpacing:"0.18em",color:MUTED,textTransform:"uppercase" as const,marginBottom:4}}>Project</span>
              {[["Architecture","#architecture"],["Proof","#proof"],["Storage","#storage"],["Dashboard","/dashboard"]].map(([l,h])=><a key={l} href={h} style={{fontSize:13,color:MUTED,textDecoration:"none"}}>{l}</a>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,fontWeight:600,letterSpacing:"0.18em",color:MUTED,textTransform:"uppercase" as const,marginBottom:4}}>Links</span>
              {[["GitHub","https://github.com/mimisco-git/ghost-0g"],["0G Docs","https://docs.0g.ai"],["Zero Cup","https://0g.ai/arena/zero-cup"],["StorageScan","https://storagescan-galileo.0g.ai"]].map(([l,h])=><a key={l} href={h} target="_blank" style={{fontSize:13,color:MUTED,textDecoration:"none"}}>{l}</a>)}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            {[["Compute:","0G Compute Router",CYAN],["Storage:","0G Storage SDK",PURPLE],["Chain:","0G Galileo · ID 16602",AMBER],["Identity:","ERC-7857 Agentic ID",MUTED]].map(([k,v,c])=>(
              <p key={k} style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:MUTED,lineHeight:2.4,margin:0}}>{k} <span style={{color:c}}>{v}</span></p>
            ))}
          </div>
        </div>
        <div style={{borderTop:`0.5px solid rgba(255,255,255,0.06)`,maxWidth:1160,margin:"0 auto",padding:"18px 60px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontFamily:"JetBrains Mono,monospace",fontSize:12,fontWeight:700,color:WHITE,margin:"0 0 2px",letterSpacing:"0.05em"}}>GHOST · Zero Cup 2026</p>
            <p style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:DIMMED,margin:0}}>© 2026 GHOST · 0G Ecosystem</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            {SOCIALS.map(s=>(
              <a key={s.label} href={s.href} target="_blank" aria-label={s.label} style={{color:MUTED,textDecoration:"none",display:"flex",alignItems:"center",transition:"color 0.2s"}}
                onMouseEnter={e=>(e.currentTarget.style.color=WHITE)}
                onMouseLeave={e=>(e.currentTarget.style.color=MUTED)}
              >{s.svg}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{SHARED_CSS}</style>
    </div>
  );
}
