"use client";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

const COLORS: Record<string, string> = {
  clean: "#22c55e", toxic: "#f59e0b", offensive: "#f59e0b", hate: "#ef4444", hate_speech: "#ef4444", vulgar: "#f97316",
  LABEL_0: "#22c55e", LABEL_1: "#f59e0b", LABEL_2: "#ef4444", LABEL_3: "#f97316",
};

const LABEL_DISPLAY: Record<string, string> = {
  clean: "CLEAN", toxic: "TOXIC", offensive: "TOXIC", hate: "HATE", hate_speech: "HATE", vulgar: "VULGAR",
  LABEL_0: "CLEAN", LABEL_1: "TOXIC", LABEL_2: "HATE", LABEL_3: "VULGAR",
};

const SAMPLE_TWEETS = [
  { text: "Just had amazing chai in Jaipur ☕", username: "@priya_sharma" },
  { text: "You are the dumbest person alive", username: "@anon_user" },
  { text: "These people are disgusting and should disappear", username: "@troll99" },
  { text: "Beautiful sunset from my rooftop today 🌅", username: "@raj_photos" },
  { text: "I want to kill all these idiots seriously", username: "@angry_user" },
  { text: "Great match yesterday, loved every moment!", username: "@cricket_fan" },
];

interface FeedItem {
  id: number;
  username: string;
  original: string;
  redacted: string;
  label: string;
  confidence: number;
  flagged: boolean;
  color: string;
  time: string;
}

interface Stats {
  total: number;
  flagged: number;
  clean: number;
  offensive: number;
  hate: number;
  vulgar: number;
}

export default function Dashboard() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("@you");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, flagged: 0, clean: 0, offensive: 0, hate: 0, vulgar: 0 });

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
    loadDemoFeed();
  }, []);

  const updateStats = (feedData: FeedItem[]) => {
    setStats({
      total: feedData.length,
      flagged: feedData.filter(f => f.flagged).length,
      clean: feedData.filter(f => ["clean", "LABEL_0"].includes(f.label)).length,
      offensive: feedData.filter(f => ["toxic", "offensive", "LABEL_1"].includes(f.label)).length,
      hate: feedData.filter(f => ["hate", "hate_speech", "LABEL_2"].includes(f.label)).length,
      vulgar: feedData.filter(f => ["vulgar", "LABEL_3"].includes(f.label)).length,
    });
  };

  const loadDemoFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweets: SAMPLE_TWEETS }),
      });
      const data = await res.json();
      const withTime = data.map((item: FeedItem, i: number) => ({
        ...item, id: i, time: `${(i + 1) * 2}m ago`,
      }));
      setFeed(withTime);
      updateStats(withTime);
      setApiStatus("online");
    } catch (err: any) {
      console.error("Fetch error:", err);
      setApiStatus("offline");
      setErrorMsg(err.message || "Unknown connection error");
    }
    setLoading(false);
  };

  const analyzeTweet = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, username }),
      });
      const data = await res.json();
      const newItem: FeedItem = { ...data, id: Date.now(), time: "just now" };
      const newFeed = [newItem, ...feed];
      setFeed(newFeed);
      updateStats(newFeed);
      setInput("");
    } catch {
      alert("API is offline. Make sure backend is running on port 8000.");
    }
    setLoading(false);
  };

  const pieData = [
    { name: "Clean", value: stats.clean, color: "#22c55e" },
    { name: "Toxic", value: stats.offensive, color: "#f59e0b" },
    { name: "Hate", value: stats.hate, color: "#ef4444" },
    { name: "Vulgar", value: stats.vulgar, color: "#f97316" },
  ].filter(d => d.value > 0);

  return (
    <main style={{ fontFamily: "monospace", background: "#0a0a0f", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2d2d3f; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d0d15", borderBottom: "1px solid #1e1e2e", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              GUARDIAN<span style={{ color: "#6366f1" }}>AI</span>
            </div>
            <div style={{ fontSize: 10, color: "#4a4a6a", letterSpacing: "0.1em" }}>TWITTER CONTENT MODERATION</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "online" ? "#22c55e" : "#ef4444", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 11, color: "#4a4a6a" }}>API {apiStatus.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "TOTAL ANALYZED", value: stats.total, color: "#6366f1" },
            { label: "FLAGGED", value: stats.flagged, color: "#ef4444" },
            { label: "CLEAN", value: stats.clean, color: "#22c55e" },
            { label: "TOXIC", value: stats.offensive, color: "#f59e0b" },
            { label: "HATE", value: stats.hate, color: "#ef4444" },
            { label: "VULGAR", value: stats.vulgar, color: "#f97316" },
          ].map(s => (
            <div key={s.label} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#4a4a6a", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Input */}
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: "0.1em", marginBottom: 12 }}>ANALYZE A TWEET</div>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="@username"
                style={{ width: "100%", background: "#0d0d15", border: "1px solid #1e1e2e", borderRadius: 8, padding: "8px 12px", color: "#6366f1", fontFamily: "monospace", fontSize: 13, marginBottom: 8, outline: "none" }}
              />
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste any tweet here..."
                style={{ width: "100%", background: "#0d0d15", border: "1px solid #1e1e2e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 13, resize: "none", height: 80, outline: "none", marginBottom: 12 }}
              />
              <button
                onClick={analyzeTweet}
                disabled={loading || !input.trim()}
                style={{ width: "100%", background: loading ? "#3730a3" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "⟳ ANALYZING..." : "▶ ANALYZE TWEET"}
              </button>
            </div>

            {/* Feed */}
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: "0.1em" }}>CONTENT FEED</div>
                <button onClick={loadDemoFeed} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "1px solid #6366f1", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontFamily: "monospace" }}>
                  ↺ RELOAD DEMO
                </button>
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {feed.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#4a4a6a", fontSize: 13 }}>
                    {apiStatus === "offline" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>⚠️ API OFFLINE</div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>Attempting to reach: {API}</div>
                        <div style={{ fontSize: 10, color: "#ef4444" }}>Error: {errorMsg}</div>
                        <div style={{ fontSize: 10 }}>Start backend on port 8000 (Local) or check Railway URL</div>
                      </div>
                    ) : "Loading..."}
                  </div>
                ) : feed.map(item => {
                  const color = COLORS[item.label] || "#888";
                  return (
                    <div key={item.id} style={{ padding: "14px 20px", borderBottom: "1px solid #0d0d15", display: "flex", gap: 12 }}>
                      <div style={{ width: 4, background: color, borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#6366f1" }}>{item.username}</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 10, color, background: `${color}20`, padding: "2px 8px", borderRadius: 4 }}>
                              {LABEL_DISPLAY[item.label] || item.label}
                            </span>
                            <span style={{ fontSize: 10, color: "#4a4a6a" }}>{item.confidence}%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: item.flagged ? "#6b7280" : "#9ca3af", wordBreak: "break-word" }}>
                          {item.redacted}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Pie */}
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: "0.1em", marginBottom: 8 }}>DISTRIBUTION</div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", fontSize: 11, fontFamily: "monospace" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "#4a4a6a", padding: 40, fontSize: 12 }}>No data yet</div>
              )}
            </div>

            {/* Model Info */}
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: "0.1em", marginBottom: 14 }}>MODEL INFO</div>
              {[
                ["Base Model", "Guardian-AI-Twitter"],
                ["F1 Score", "0.7503"],
                ["Accuracy", "90.48%"],
                ["Classes", "3 labels"],
                ["Max Tokens", "512"],
                ["Status", "Active ✅"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#4a4a6a" }}>{k}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Redaction Rules */}
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: "0.1em", marginBottom: 14 }}>REDACTION RULES</div>
              {[
                { label: "✅ CLEAN", action: "Content allowed", color: "#22c55e" },
                { label: "⚠️  TOXIC", action: "Partial redaction", color: "#f59e0b" },
                { label: "🚫 HATE", action: "Full removal", color: "#ef4444" },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 10, padding: "8px 10px", background: `${r.color}15`, borderRadius: 6, border: `1px solid ${r.color}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 2 }}>{r.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}