"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Stats {
  totalConversations: number;
  successfulCount: number;
  totalDuration: number;
  avgDuration: number;
  totalMessages: number;
  meaningfulQuestions: number;
}

interface TimelineEntry {
  id: string;
  time: number;
  duration: number;
  summary: string;
  messageCount: number;
  userQuestions: string[];
}

interface RankedTheme {
  theme: string;
  questions: string[];
  count: number;
}

interface InsightsData {
  stats: Stats;
  floorMentions: Record<string, number>;
  summaries: string[];
  timeline: TimelineEntry[];
  rankedThemes: RankedTheme[];
  topQuestions: string[];
}

function formatTime(unix: number): string {
  if (!unix || isNaN(unix)) return "Recent";
  const d = new Date(unix * 1000);
  if (isNaN(d.getTime())) return "Recent";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs) || secs <= 0) return "< 1s";
  if (secs < 60) return `${Math.round(secs)}s`;
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
}

const FLOOR_COLORS: Record<string, string> = {
  "Floor 2": "var(--violet)", "Floor 4": "var(--cyan)", "Floor 6": "var(--rose)",
  "Floor 7": "var(--amber)", "Floor 8": "var(--emerald)", "Floor 9": "var(--violet)",
  "Floor 11": "var(--blue)", "Floor 12": "var(--cyan)", "Floor 14": "var(--emerald)",
};

const THEME_COLORS: Record<string, { bg: string; color: string }> = {
  "Wayfinding": { bg: "var(--cyan-dim)", color: "var(--cyan-light)" },
  "Events & Schedule": { bg: "var(--amber-dim)", color: "var(--amber-light)" },
  "People & Networking": { bg: "var(--violet-dim)", color: "var(--violet-light)" },
  "Hackathon": { bg: "var(--rose-dim)", color: "var(--rose-light)" },
  "Building & Membership": { bg: "var(--blue-dim)", color: "var(--blue-light)" },
  "Food & Logistics": { bg: "var(--emerald-dim)", color: "var(--emerald-light)" },
  "Tech & Demos": { bg: "var(--cyan-dim)", color: "var(--cyan-light)" },
  "Tips & Recommendations": { bg: "var(--amber-dim)", color: "var(--amber-light)" },
  "General": { bg: "var(--violet-dim)", color: "var(--violet-light)" },
};

function getFloorColor(floor: string): string {
  for (const [key, color] of Object.entries(FLOOR_COLORS)) {
    if (floor.includes(key)) return color;
  }
  return "var(--violet)";
}

export default function Dashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError("");
    } catch {
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="noise flex h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="orb-container" style={{ width: 80, height: 80 }}>
            <div className="orb-core" style={{ width: 40, height: 40 }} />
          </div>
          <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
            LOADING INTELLIGENCE...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="noise flex h-svh flex-col items-center justify-center gap-4">
        <p style={{ fontSize: 14, color: "var(--rose)" }}>{error}</p>
        <button onClick={fetchData} className="btn-ghost">Retry</button>
      </div>
    );
  }

  const sortedFloors = Object.entries(data.floorMentions).sort(([, a], [, b]) => b - a);
  const maxMentions = sortedFloors.length > 0 ? sortedFloors[0][1] : 1;
  const successRate = data.stats.totalConversations > 0
    ? Math.round((data.stats.successfulCount / data.stats.totalConversations) * 100) : 0;

  return (
    <div className="noise grid-bg relative min-h-svh flex flex-col">
      <div className="scan-line" />

      {/* NAV */}
      <nav className="nav-glass sticky top-0 z-30 flex items-center justify-between px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-[var(--font-mono)]"
            style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none", letterSpacing: "0.06em", transition: "color 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-light)"; e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.textDecoration = "none"; }}
          >
            ← TowerMind
          </Link>
          <span style={{ color: "var(--text-4)" }}>/</span>
          <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>INSIGHTS</span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="font-[var(--font-mono)] hidden md:block" style={{ fontSize: 11, color: "var(--text-4)" }}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--emerald-light)", letterSpacing: "0.14em" }}>LIVE</span>
          </div>
          <button onClick={fetchData} className="btn-ghost">Refresh</button>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="relative z-10 mx-auto w-full max-w-[920px] flex-1 px-5 md:px-8" style={{ paddingTop: 64, paddingBottom: 0 }}>

        {/* HEADER */}
        <div className="anim-location">
          <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em", marginBottom: 24 }}>
            EVENT ORGANIZER INTELLIGENCE · FRONTIER TOWER
          </p>
          <h1 className="font-[var(--font-ui)]"
            style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 300, color: "var(--text-1)", lineHeight: 1.1 }}>
            What visitors are asking
          </h1>
          <p className="font-[var(--font-ui)]" style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, marginTop: 16, maxWidth: 560 }}>
            Ranked insights from live voice conversations — noise filtered, themes extracted, questions prioritized for organizer action.
          </p>
        </div>

        {/* KEY METRICS */}
        <div
          className="stats-bar anim-name"
          style={{ marginTop: 64, display: "flex", flexDirection: "row", borderTop: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border-dim)" }}
        >
          {[
            { value: String(data.stats.totalConversations), label: "SESSIONS", gradient: true },
            { value: String(data.stats.meaningfulQuestions), label: "REAL QUESTIONS", gradient: false },
            { value: `${successRate}%`, label: "SUCCESS RATE", gradient: false },
            { value: formatDuration(data.stats.totalDuration), label: "TOTAL TALK TIME", gradient: false },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ flex: 1, padding: "32px 0 32px 24px", borderRight: i < arr.length - 1 ? "1px solid var(--border-dim)" : "none" }}>
              <p className="font-[var(--font-ui)]" style={{
                fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 300, lineHeight: 1,
                ...(stat.gradient ? { background: "linear-gradient(135deg, var(--violet-light), var(--cyan-light))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } : { color: "var(--text-1)" }),
              }}>{stat.value}</p>
              <p className="font-[var(--font-mono)]" style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.18em", marginTop: 8 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* RANKED THEMES — what visitors care about most */}
        <section className="anim-tagline" style={{ marginTop: 64 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              QUESTION THEMES · RANKED
            </span>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--violet-dim)", color: "var(--violet-light)" }}>
              {data.rankedThemes.length} CATEGORIES
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border-dim)", marginBottom: 24 }} />

          {data.rankedThemes.length === 0 ? (
            <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", padding: "48px 0" }}>
              NO THEMES DETECTED YET
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.rankedThemes.map((t, idx) => {
                const colors = THEME_COLORS[t.theme] || THEME_COLORS.General;
                const isExpanded = expandedTheme === t.theme;
                return (
                  <div key={t.theme}>
                    <div
                      onClick={() => setExpandedTheme(isExpanded ? null : t.theme)}
                      style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                        background: idx === 0 ? "var(--surface-1)" : "transparent",
                        borderRadius: 8, cursor: "pointer", transition: "background 0.15s ease",
                        ...(idx === 0 ? { boxShadow: "inset 3px 0 0 var(--violet)" } : {}),
                      }}
                      onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.background = "var(--surface-0)"; }}
                      onMouseLeave={(e) => { if (idx !== 0) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Rank */}
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 20, fontWeight: 700, color: idx === 0 ? "var(--violet-light)" : "var(--text-4)", minWidth: 32 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {/* Theme name */}
                      <span className="font-[var(--font-ui)]" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-1)", flex: 1 }}>
                        {t.theme}
                      </span>
                      {/* Count badge */}
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: colors.bg, color: colors.color }}>
                        {t.count} {t.count === 1 ? "ASK" : "ASKS"}
                      </span>
                      {/* Expand arrow */}
                      <span style={{ color: "var(--text-4)", fontSize: 12, transition: "transform 0.2s ease", transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}>
                        ▸
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div style={{ padding: "8px 20px 20px 68px", display: "flex", flexDirection: "column", gap: 6 }}>
                            {t.questions.map((q, qi) => (
                              <div key={qi} style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid var(--border-dim)", background: "var(--surface-0)", fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>
                                <span style={{ color: colors.color, marginRight: 8 }}>&rsaquo;</span>{q}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FLOOR DEMAND + AI ANALYSIS side by side */}
        <div className="anim-subtitle grid gap-0 lg:grid-cols-2" style={{ marginTop: 64, borderTop: "1px solid var(--border-dim)" }}>

          {/* FLOOR DEMAND */}
          <div style={{ padding: "32px 32px 32px 0", borderRight: "1px solid var(--border-dim)" }} className="floor-interest-col">
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              FLOOR DEMAND
            </span>
            {sortedFloors.length === 0 ? (
              <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 32, textAlign: "center" }}>
                NO MENTIONS YET
              </p>
            ) : (
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {sortedFloors.map(([floor, count], idx) => {
                  const color = getFloorColor(floor);
                  return (
                    <div key={floor}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <span className="font-[var(--font-ui)]" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{floor}</span>
                        <span className="font-[var(--font-mono)]" style={{ fontSize: 13, fontWeight: 700, color }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxMentions) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                          className="progress-fill"
                          style={{
                            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, white))`,
                            boxShadow: `0 0 12px color-mix(in srgb, ${color} 25%, transparent)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI ANALYSIS */}
          <div style={{ padding: "32px 0 32px 32px" }} className="questions-col">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
                AI SUMMARY
              </span>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--amber-dim)", color: "var(--amber-light)" }}>
                AUTO
              </span>
            </div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {data.summaries.length === 0 ? (
                <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 16, textAlign: "center" }}>
                  NO SUMMARIES YET
                </p>
              ) : (
                data.summaries.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 3, flexShrink: 0, alignSelf: "stretch", borderRadius: 2, background: "linear-gradient(180deg, var(--violet), var(--cyan), transparent)" }} />
                    <p className="font-[var(--font-ui)]" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-2)" }}>{s}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CONVERSATION LOG — collapsed, expandable */}
        <section className="anim-speak" style={{ marginTop: 64 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              SESSION LOG
            </span>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--emerald-dim)", color: "var(--emerald-light)" }}>
              {data.timeline.length} SESSIONS
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border-dim)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.timeline.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.1em" }}>WAITING FOR CONVERSATIONS</p>
              </div>
            ) : (
              data.timeline.map((conv) => (
                <div key={conv.id}>
                  <div
                    onClick={() => setSelectedConv(selectedConv === conv.id ? null : conv.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderRadius: 6, cursor: "pointer", transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-0)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, var(--violet), var(--cyan))", flexShrink: 0 }} />
                    <span className="font-[var(--font-mono)]" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", minWidth: 72 }}>
                      {formatTime(conv.time)}
                    </span>
                    <span className="font-[var(--font-ui)]" style={{ fontSize: 13, color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.summary.length > 100 ? conv.summary.slice(0, 100) + "..." : conv.summary}
                    </span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--text-4)" }}>
                        {formatDuration(conv.duration)}
                      </span>
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--text-4)" }}>
                        {conv.messageCount} msgs
                      </span>
                    </div>
                    <span style={{ color: "var(--text-4)", fontSize: 12, transition: "transform 0.2s ease", transform: selectedConv === conv.id ? "rotate(90deg)" : "rotate(0)" }}>▸</span>
                  </div>
                  <AnimatePresence>
                    {selectedConv === conv.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div style={{ padding: "8px 16px 16px 34px" }}>
                          <p className="font-[var(--font-ui)]" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", marginBottom: 12 }}>
                            {conv.summary}
                          </p>
                          {conv.userQuestions.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border-dim)", paddingTop: 12 }}>
                              {conv.userQuestions.map((q, i) => (
                                <div key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-3)" }}>
                                  <span style={{ color: "var(--violet-light)", marginRight: 8 }}>&rsaquo;</span>{q}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[920px] mx-auto" style={{
        marginTop: 64, borderTop: "1px solid var(--border-dim)", padding: "28px 20px 64px",
        display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1,
      }}>
        <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.18em" }}>
          <span style={{ animation: "pulse-dot 2.4s ease-in-out infinite", display: "inline-block", color: "var(--emerald-light)", marginRight: 8 }}>●</span>
          TOWERMIND INSIGHTS
        </span>
        <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.1em" }}>
          ELEVENLABS × CLAUDE SONNET 4.6
        </span>
      </footer>
    </div>
  );
}
