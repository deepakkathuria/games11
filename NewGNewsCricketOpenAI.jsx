import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://hammerhead-app-jkdit.ondigitalocean.app";
const PAGE = 25;

export default function NewGNewsCricketOpenAI() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fmt = (v) => {
    if (!v) return { date: "-", time: "-" };
    const timeMatch = v.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      const hour24 = parseInt(hours);
      const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
      const ampm = hour24 >= 12 ? "pm" : "am";
      return {
        date: new Date(v).toLocaleDateString("en-IN"),
        time: `${hour12}:${minutes} ${ampm}`,
      };
    }
    return { date: "-", time: "-" };
  };

  const getPub = (row) => row.published_at_iso ?? row.published_at;

  const fetchStored = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (p - 1) * PAGE;
      const r = await axios.get(
        `${API}/api/cricket-openai/stored-news?limit=${PAGE}&offset=${offset}&sort=desc&_=${Date.now()}`,
        { headers: { "Cache-Control": "no-cache" }, timeout: 30000 }
      );
      if (r.data?.success) {
        setNews(r.data.news || []);
        const total = r.data.totalCount || 0;
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE)));
        setPage(p);
      } else {
        setError(r.data?.error || "Failed to load news");
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      showToast("error", "Error loading news: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const manualFetch = async () => {
    setFetching(true);
    setError(null);
    try {
      const r = await axios.post(
        `${API}/api/cricket-openai/manual-fetch-news`,
        {},
        { timeout: 120000 }
      );

      if (r.data?.success) {
        const msg = r.data.message || "Cricket news fetched successfully from GNews!";
        showToast("success", msg);
        await fetchStored(1);
      } else {
        const errMsg = r.data?.error || "Fetch failed";
        setError(errMsg);
        showToast("error", errMsg);
      }
    } catch (e) {
      const code = e.response?.data?.code;
      const msg = e.response?.data?.error || e.message;

      if (code === "GNEWS_LIMIT_EXCEEDED" || e.response?.status === 429) {
        const limitMsg = "⚠️ GNews API limit exceeded. Please try again later.";
        setError(limitMsg);
        showToast("error", limitMsg);
      } else {
        setError(msg);
        showToast("error", "GNews fetch error: " + msg);
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStored(1);
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "14px 22px",
            borderRadius: 10,
            color: "white",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            background: toast.type === "success" ? "#28a745" : "#dc3545",
            maxWidth: 420,
          }}
        >
          {toast.message}
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
          background: "linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)",
          padding: 28,
          borderRadius: 16,
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700 }}>
          📰 GNews Cricket OpenAI
        </h1>
        <p style={{ margin: 0, fontSize: 15, opacity: 0.95 }}>
          Manual GNews fetch — same backend as Cricket News OpenAI
        </p>
        <div style={{ fontSize: 12, marginTop: 12, opacity: 0.9 }}>
          🕒 {new Date().toLocaleString("en-IN")} | 🌐 {API}
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            onClick={manualFetch}
            disabled={fetching}
            style={{
              padding: "12px 28px",
              background: fetching ? "rgba(255,255,255,0.4)" : "#ff6f00",
              color: "white",
              border: "2px solid rgba(255,255,255,0.5)",
              borderRadius: 10,
              cursor: fetching ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: fetching ? "none" : "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {fetching ? "⏳ Fetching from GNews..." : "📰 Fetch Latest from GNews"}
          </button>
          <span style={{ fontSize: 11, opacity: 0.85 }}>
            POST /api/cricket-openai/manual-fetch-news — manual only, no auto sync
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: "#ffebee", color: "#c62828", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <button
          disabled={loading}
          onClick={() => fetchStored(page)}
          style={{
            padding: "10px 20px",
            background: loading ? "#95a5a6" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh List"}
        </button>
        <span
          style={{
            padding: "10px 16px",
            background: "#e3f2fd",
            borderRadius: 8,
            fontWeight: 600,
            color: "#1565c0",
          }}
        >
          Page {page} / {totalPages} ({totalCount} articles)
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && news.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>
        ) : news.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No articles. Click &quot;Fetch Latest from GNews&quot; above.
          </p>
        ) : (
          news.map((a) => {
            const { date, time } = fmt(getPub(a));
            return (
              <div
                key={a.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#1877f2",
                    cursor: a.source_url ? "pointer" : "default",
                    marginBottom: 8,
                  }}
                  onClick={() => a.source_url && window.open(a.source_url, "_blank", "noopener,noreferrer")}
                >
                  {a.title}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#666", flexWrap: "wrap" }}>
                  <span>📅 {date}</span>
                  <span>🕒 {time}</span>
                  <span>📰 {a.source_name || "—"}</span>
                  {typeof a.word_count === "number" && <span>📝 {a.word_count} words</span>}
                  {a.openai_processed && <span style={{ color: "#28a745" }}>✅ OpenAI</span>}
                  {a.deepseek_processed && <span style={{ color: "#6f42c1" }}>🤖 DeepSeek</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <button disabled={page === 1 || loading} onClick={() => fetchStored(1)}>
            First
          </button>
          <button disabled={page === 1 || loading} onClick={() => fetchStored(page - 1)}>
            Prev
          </button>
          <span style={{ padding: "6px 12px", background: "#1877f2", color: "white", borderRadius: 6 }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages || loading} onClick={() => fetchStored(page + 1)}>
            Next
          </button>
          <button disabled={page === totalPages || loading} onClick={() => fetchStored(totalPages)}>
            Last
          </button>
        </div>
      )}
    </div>
  );
}
