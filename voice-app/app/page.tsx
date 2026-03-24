"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useConversation } from "@11labs/react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";

const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

const FLOORS: {
  num: number;
  name: string;
  sub: string;
  badge: string;
  accent: string;
  live?: boolean;
}[] = [
  { num: 2,  name: "Main Stage",   sub: "Events & Keynotes",     badge: "EVT",    accent: "#f59e0b" },
  { num: 4,  name: "Robotics Lab", sub: "G1 + Spot",             badge: "ONLINE", accent: "#06b6d4" },
  { num: 6,  name: "Arts & Music", sub: "Creative Studio",       badge: "ART",    accent: "#f43f5e" },
  { num: 7,  name: "Makerspace",   sub: "4000 sqft Workshop",    badge: "ONLINE", accent: "#06b6d4" },
  { num: 8,  name: "Biotech",      sub: "Wet Labs & Neuro",      badge: "BIO",    accent: "#10b981" },
  { num: 9,  name: "AI Floor",     sub: "Hackathon HQ",          badge: "● LIVE", accent: "#8b5cf6", live: true },
  { num: 11, name: "Longevity",    sub: "VitaDAO Research",      badge: "LONG",   accent: "#3b82f6" },
  { num: 12, name: "Ethereum",     sub: "EF Innovation Hub",     badge: "ETH",    accent: "#3b82f6" },
];

/* ─── Scroll-triggered reveal ─── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");
  const orbContainerRef = useRef<HTMLDivElement>(null);

  /* ─── Magnetic orb physics ─── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 120 };
  const orbX = useSpring(mouseX, springConfig);
  const orbY = useSpring(mouseY, springConfig);

  const conversation = useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onError: () => {},
  });

  const isActive = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const handleSpeak = useCallback(async () => {
    if (isActive) {
      await conversation.endSession();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({ agentId: AGENT_ID, connectionType: "websocket" });
      } catch {
        // mic denied
      }
    }
  }, [isActive, conversation]);

  const handleOrbMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!orbContainerRef.current) return;
      const rect = orbContainerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set((e.clientX - centerX) * 0.12);
      mouseY.set((e.clientY - centerY) * 0.12);
    },
    [mouseX, mouseY],
  );

  const handleOrbMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const update = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="noise relative flex min-h-svh flex-col">
      {/* Atmospheric layers */}
      <div className="gradient-mesh">
        <div className="mesh-blob-3" />
      </div>
      <div className="light-beam" />
      <div className="scan-line" />

      {/* ─── NAV ─── */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 400,
              color: "var(--text-1)",
            }}
          >
            Tower<span className="text-gradient-violet">Mind</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono hidden text-[var(--text-4)] sm:block">{currentTime}</span>
          <Link href="/dashboard" className="nav-link">
            Insights →
          </Link>
        </div>
      </nav>

      {/* ─── MAIN ─── */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-5 pb-28 md:px-8">
        {/* ─── HERO ─── */}
        <section
          className="flex flex-col items-center text-center"
          style={{ paddingTop: 110, paddingBottom: 80 }}
        >
          {/* Location — letter-spacing reveal */}
          <p className="hero-location">FRONTIER TOWER · 995 MARKET ST · SAN FRANCISCO</p>

          {/* Title — serif, blur-to-sharp entrance */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="hero-title">TowerMind</h1>
            <span className="online-badge">
              <span className="pulse-dot">●</span> ONLINE
            </span>
          </motion.div>

          {/* Tagline — italic serif, scale entrance */}
          <motion.h2
            className="hero-tagline"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            Speak with the building.
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            AI concierge for Frontier Tower. Ask about floors, events, people, or anything
            happening right now.
          </motion.p>

          {/* ─── ORB — magnetic cursor tracking ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ marginTop: 56 }}
          >
            <div
              ref={orbContainerRef}
              className="orb-container"
              onMouseMove={handleOrbMouseMove}
              onMouseLeave={handleOrbMouseLeave}
            >
              <div className={`orb-ring orb-ring-1 ${isActive ? "active" : ""}`} />
              <div className={`orb-ring orb-ring-2 ${isActive ? "active" : ""}`} />
              <div className={`orb-ring orb-ring-3 ${isActive ? "active" : ""}`} />
              <motion.div
                className={`orb-core ${isActive ? "active" : ""}`}
                style={{ x: orbX, y: orbY }}
                onClick={handleSpeak}
                role="button"
                tabIndex={0}
                aria-label={isActive ? "End conversation" : "Start conversation"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSpeak();
                }}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={isActive ? (isSpeaking ? "speaking" : "listening") : "idle"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mono"
                style={{ marginTop: 16, textAlign: "center", color: "var(--text-3)", fontSize: 11 }}
              >
                {isActive && isSpeaking ? (
                  <span style={{ color: "var(--cyan-light)" }}>Speaking...</span>
                ) : isActive ? (
                  <span style={{ color: "var(--violet-light)" }}>Listening · tap to end</span>
                ) : (
                  "Tap to speak"
                )}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ─── TOWER FLOORS — vertical spine visualization ─── */}
        <Reveal className="w-full max-w-[920px]">
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <span className="section-label">ACTIVE FLOORS</span>
              <span
                className="mono"
                style={{ color: "var(--cyan-light)", letterSpacing: "0.1em" }}
              >
                {String(FLOORS.length).padStart(2, "0")} / 12 ONLINE
              </span>
            </div>
            <div style={{ height: 1, background: "var(--border-dim)" }} />

            <div className="tower-list" style={{ marginTop: 24 }}>
              <div className="tower-spine" />
              {FLOORS.map((f, idx) => (
                <motion.div
                  key={f.num}
                  className={`tower-floor-row ${f.live ? "live" : ""}`}
                  style={{ "--floor-accent": f.accent } as React.CSSProperties}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.055,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Node on spine */}
                  <div className={`tower-node ${f.live ? "live" : ""}`} />

                  {/* Floor number */}
                  <span className="tower-floor-num">{String(f.num).padStart(2, "0")}F</span>

                  {/* Floor info */}
                  <div className="tower-floor-info">
                    <span className="tower-floor-name">{f.name}</span>
                    <span className="tower-floor-sub">{f.sub}</span>
                  </div>

                  {/* Badge */}
                  <span className={`tower-floor-badge ${f.live ? "live" : ""}`}>
                    {f.badge === "● LIVE" ? (
                      <>
                        <span className="pulse-dot">●</span> LIVE
                      </>
                    ) : (
                      f.badge
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ─── STATS — large serif numbers ─── */}
        <Reveal className="w-full max-w-[920px]" delay={0.1}>
          <div className="stats-section" style={{ marginTop: 96 }}>
            {[
              { value: "1000+", label: "ATTENDEES", highlight: true },
              { value: "70+", label: "SPEAKERS", highlight: false },
              { value: "12", label: "FLOORS ACTIVE", highlight: false },
            ].map((stat) => (
              <div key={stat.label} className="stat-block">
                <p className={`stat-value ${stat.highlight ? "stat-highlight" : ""}`}>
                  {stat.value}
                </p>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      {/* ─── FOOTER ─── */}
      <Reveal>
        <footer className="site-footer mx-auto w-full max-w-[920px]">
          <span className="mono" style={{ color: "var(--text-4)", letterSpacing: "0.18em" }}>
            <span className="pulse-dot" style={{ color: "var(--emerald-light)", marginRight: 8 }}>
              ●
            </span>
            TOWERMIND
          </span>
          <span className="mono" style={{ color: "var(--text-4)", letterSpacing: "0.1em" }}>
            ELEVENLABS × CLAUDE SONNET 4.6
          </span>
        </footer>
      </Reveal>
    </div>
  );
}
