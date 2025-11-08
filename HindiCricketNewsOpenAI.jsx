import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://hammerhead-app-jkdit.ondigitalocean.app";
// const API = "http://localhost:5000";

const PAGE = 25;

export default function HindiCricketNewsOfEnglishWithOpenAI() {
  const [stored, setStored] = useState([]);
  const [processedOpenAI, setProcessedOpenAI] = useState([]);
  const [processedDeepSeek, setProcessedDeepSeek] = useState([]);
  const [compared, setCompared] = useState([]);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("stored");
  const [busy, setBusy] = useState({});

  const [sp, setSp] = useState(1);
  const [stp, setStp] = useState(1);
  const [stc, setStc] = useState(0);

  const [ppo, setPpo] = useState(1);
  const [ptpo, setPtpo] = useState(1);
  const [ptco, setPtco] = useState(0);

  const [ppd, setPpd] = useState(1);
  const [ptpd, setPtpd] = useState(1);
  const [ptcd, setPtcd] = useState(0);

  const [pcp, setPcp] = useState(1);
  const [ptcp, setPtcp] = useState(1);
  const [ptcc, setPtcc] = useState(0);

  const headers = { headers: { "Cache-Control": "no-cache" } };

  const fmt = (v) => {
    if (!v) return { date: "-", time: "-" };
    const match = v.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, hours, minutes] = match;
      const hour24 = parseInt(hours, 10);
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
  const getProcOpenAI = (row) => row.hindi_processed_at_iso ?? row.hindi_processed_at;
  const getProcDeepSeek = (row) => row.deepseek_processed_at_iso ?? row.deepseek_processed_at;

  const fetchStored = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE;
      const r = await axios.get(
        `${API}/api/hindi-cricket-news/stored-news?limit=${PAGE}&offset=${offset}&_=${Date.now()}`,
        headers
      );
      if (r.data?.success) {
        setStored(r.data.news || []);
        const total = r.data.totalCount || 0;
        setStc(total);
        setStp(Math.max(1, Math.ceil(total / PAGE)));
        setSp(page);
      }
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessedOpenAI = async (page = 1) => {
    try {
      const offset = (page - 1) * PAGE;
      const r = await axios.get(
        `${API}/api/hindi-cricket-news/processed-news?limit=${PAGE}&offset=${offset}&_=${Date.now()}`,
        headers
      );
      if (r.data?.success) {
        setProcessedOpenAI(r.data.news || []);
        const total = r.data.totalCount || 0;
        setPtco(total);
        setPtpo(Math.max(1, Math.ceil(total / PAGE)));
        setPpo(page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProcessedDeepSeek = async (page = 1) => {
    try {
      const offset = (page - 1) * PAGE;
      const r = await axios.get(
        `${API}/api/cricket-deepseek/processed-news?limit=${PAGE}&offset=${offset}&_=${Date.now()}`,
        headers
      );
      if (r.data?.success) {
        setProcessedDeepSeek(r.data.news || []);
        const total = r.data.totalCount || 0;
        setPtcd(total);
        setPtpd(Math.max(1, Math.ceil(total / PAGE)));
        setPpd(page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCompared = async (page = 1) => {
    try {
      const offset = (page - 1) * PAGE;
      const r = await axios.get(
        `${API}/api/cricket-compare/compared-news?limit=${PAGE}&offset=${offset}&_=${Date.now()}`,
        headers
      );
      if (r.data?.success) {
        setCompared(r.data.news || []);
        const total = r.data.totalCount || 0;
        setPtcc(total);
        setPtcp(Math.max(1, Math.ceil(total / PAGE)));
        setPcp(page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStored(1);
    fetchProcessedOpenAI(1);
    fetchProcessedDeepSeek(1);
    fetchCompared(1);
  }, []);

  const gen = async (id, provider) => {
    const key = `${id}-${provider}`;
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const endpoint =
        provider === "deepseek"
          ? `${API}/api/cricket-deepseek/articles/${id}/generate`
          : `${API}/api/hindi-cricket-news/articles/${id}/generate`;

      const r = await axios.post(endpoint);
      if (!r.data?.success) throw new Error(r.data?.error || "Failed");

      await Promise.all([
        fetchStored(sp),
        fetchProcessedOpenAI(ppo),
        fetchProcessedDeepSeek(ppd),
        fetchCompared(pcp),
      ]);

      alert(
        `✅ Hindi cricket article generated successfully with ${
          provider === "deepseek" ? "DeepSeek" : "OpenAI"
        }!`
      );
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (text, label = "HTML") => {
    navigator.clipboard
      .writeText(text || "")
      .then(() => alert(`✅ ${label} copied to clipboard!`))
      .catch(() => alert("❌ Failed to copy"));
  };

  const downloadHTML = (html, filename) => {
    const blob = new Blob([html || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const aTag = document.createElement("a");
    aTag.href = url;
    aTag.download = `${filename}.html`;
    aTag.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = () => {
    fetchStored(sp);
    fetchProcessedOpenAI(ppo);
    fetchProcessedDeepSeek(ppd);
    fetchCompared(pcp);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>🏏 Hindi Cricket News Generator</h1>
        <p style={styles.subtitle}>
          English Cricket News → Hindi Articles • OpenAI & DeepSeek Powered
        </p>
        <div style={styles.systemInfo}>
          🕒 {new Date().toLocaleString("en-IN")} | 🌐 API: {API} | 📊 Using cricket_news table
        </div>
      </div>

      <div style={styles.tabContainer}>
        <TabButton active={tab === "stored"} color="#007bff" onClick={() => setTab("stored")}>📰 English Cricket News ({stc})</TabButton>
        <TabButton active={tab === "openai"} color="#28a745" onClick={() => setTab("openai")}>✅ OpenAI Hindi Articles ({ptco})</TabButton>
        <TabButton active={tab === "deepseek"} color="#6f42c1" onClick={() => setTab("deepseek")}>🤖 DeepSeek Hindi Articles ({ptcd})</TabButton>
        <TabButton active={tab === "compare"} color="#ff6b35" onClick={() => setTab("compare")}>🔄 Compare ({ptcc})</TabButton>
      </div>

      {tab === "stored" && (
        <StoredNewsTab
          stored={stored}
          sp={sp}
          stp={stp}
          stc={stc}
          busy={busy}
          gen={gen}
          fmt={fmt}
          getPub={getPub}
          fetchStored={fetchStored}
          loading={loading}
          refreshAll={refreshAll}
        />
      )}

      {tab === "openai" && (
        <ProcessedNewsTab
          processed={processedOpenAI}
          page={ppo}
          totalPages={ptpo}
          totalCount={ptco}
          onChange={fetchProcessedOpenAI}
          fmt={fmt}
          getProc={getProcOpenAI}
          copyToClipboard={copyToClipboard}
          downloadHTML={downloadHTML}
          titleKey="hindi_final_title"
          metaKey="hindi_final_meta"
          slugKey="hindi_final_slug"
          htmlKey="hindi_ready_article"
          badgeText="🤖 Generated with: OpenAI"
          badgeColor="#e8f5e8"
        />
      )}

      {tab === "deepseek" && (
        <ProcessedNewsTab
          processed={processedDeepSeek}
          page={ppd}
          totalPages={ptpd}
          totalCount={ptcd}
          onChange={fetchProcessedDeepSeek}
          fmt={fmt}
          getProc={getProcDeepSeek}
          copyToClipboard={copyToClipboard}
          downloadHTML={downloadHTML}
          titleKey="deepseek_final_title"
          metaKey="deepseek_final_meta"
          slugKey="deepseek_final_slug"
          htmlKey="deepseek_ready_article"
          badgeText="🤖 Generated with: DeepSeek"
          badgeColor="#ede7f6"
        />
      )}

      {tab === "compare" && (
        <CompareTab
          compared={compared}
          page={pcp}
          totalPages={ptcp}
          totalCount={ptcc}
          onChange={fetchCompared}
          fmt={fmt}
          getPub={getPub}
          copyToClipboard={copyToClipboard}
          downloadHTML={downloadHTML}
        />
      )}
    </div>
  );
}

function TabButton({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tab,
        background: active ? color : styles.tabInactive.background,
        color: active ? "#fff" : styles.tabInactive.color,
      }}
    >
      {children}
    </button>
  );
}

function StoredNewsTab({ stored, sp, stp, stc, busy, gen, fmt, getPub, fetchStored, loading, refreshAll }) {
  return (
    <div>
      <div style={styles.actionButtons}>
        <button
          disabled={loading}
          onClick={refreshAll}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? "⏳ Refreshing…" : "🔄 Refresh All"}
        </button>
      </div>

      <h2 style={styles.sectionTitle}>📰 English Cricket News → Convert to Hindi (Page {sp} of {stp})</h2>
      <div style={styles.cardContainer}>
        {stored.map((a) => {
          const { date, time } = fmt(getPub(a));
          const busyOpenAI = !!busy[`${a.id}-openai`];
          const busyDeepSeek = !!busy[`${a.id}-deepseek`];

          return (
            <div key={a.id} style={styles.card}>
              <div style={styles.cardContent}>
                <div
                  style={styles.cardTitle}
                  onClick={() => {
                    if (a.source_url) {
                      window.open(a.source_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  {a.title}
                </div>
                <div style={styles.cardMeta}>
                  <span>📅 {date}</span>
                  <span>🕒 {time}</span>
                  <span>📰 {a.source_name}</span>
                  {typeof a.word_count === "number" && <span>📝 {a.word_count} words</span>}
                  {a.hindi_processed && <span style={styles.badgeSuccess}>✅ OpenAI Ready</span>}
                  {a.deepseek_processed && <span style={styles.badgeDeepSeek}>🤖 DeepSeek Ready</span>}
                </div>
              </div>
              <div style={styles.dualButtonGroup}>
                <button
                  onClick={() => gen(a.id, "openai")}
                  disabled={busyOpenAI || a.hindi_processed}
                  style={{
                    ...styles.button,
                    ...styles.buttonGenerate,
                    background: a.hindi_processed ? "#28a745" : styles.buttonGenerate.background,
                    ...(busyOpenAI ? styles.buttonDisabled : {}),
                  }}
                >
                  {busyOpenAI ? "⏳ OpenAI…" : a.hindi_processed ? "✅ OpenAI Done" : "🎨 Convert (OpenAI)"}
                </button>
                <button
                  onClick={() => gen(a.id, "deepseek")}
                  disabled={busyDeepSeek || a.deepseek_processed}
                  style={{
                    ...styles.button,
                    ...styles.buttonDeepSeek,
                    background: a.deepseek_processed ? "#6f42c1" : styles.buttonDeepSeek.background,
                    ...(busyDeepSeek ? styles.buttonDisabled : {}),
                  }}
                >
                  {busyDeepSeek ? "⏳ DeepSeek…" : a.deepseek_processed ? "✅ DeepSeek Done" : "🤖 Convert (DeepSeek)"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Pager page={sp} total={stp} totalCount={stc} onChange={fetchStored} />
    </div>
  );
}

function ProcessedNewsTab({
  processed,
  page,
  totalPages,
  totalCount,
  onChange,
  fmt,
  getProc,
  copyToClipboard,
  downloadHTML,
  titleKey,
  metaKey,
  slugKey,
  htmlKey,
  badgeText,
  badgeColor,
}) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>Hindi Cricket Articles (Page {page} of {totalPages})</h2>
      <div style={styles.cardContainer}>
        {processed.map((a) => {
          const { date, time } = fmt(getProc(a));
          const title = a[titleKey] || a.title;
          const meta = a[metaKey] || "";
          const slug = a[slugKey] || "article";
          const html = a[htmlKey] || "";

          return (
            <div key={a.id} style={styles.processedCard}>
              <div style={styles.processedHeader}>
                <div style={styles.processedTitle}>{title}</div>
                <div style={styles.processedMeta}>
                  <div>{date} {time}</div>
                  <div>📰 {a.source_name}</div>
                </div>
              </div>

              <div style={styles.metaBox}>
                <div><strong>Hindi Title:</strong> {title}</div>
                {meta && <div><strong>Hindi Meta Description:</strong> {meta}</div>}
                <div><strong>Slug:</strong> {slug}</div>
                <div style={{ marginTop: 8, padding: 8, background: badgeColor, borderRadius: 4, fontSize: "0.85rem" }}>
                  {badgeText}
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => copyToClipboard(html, "Hindi HTML")}
                  style={{ ...styles.button, ...styles.buttonInfo }}
                >
                  📋 Copy Hindi HTML
                </button>
                <button
                  onClick={() => downloadHTML(html, slug)}
                  style={{ ...styles.button, ...styles.buttonSuccess }}
                >
                  💾 Download Hindi HTML
                </button>
                <button
                  onClick={() => copyToClipboard(title, "Hindi Title")}
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                >
                  📝 Copy Hindi Title
                </button>
                <button
                  onClick={() => copyToClipboard(meta, "Hindi Meta")}
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                >
                  📄 Copy Hindi Meta
                </button>
              </div>

              <div style={styles.previewContainer}>
                <iframe
                  title={`preview-${a.id}`}
                  srcDoc={html}
                  style={styles.iframe}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Pager page={page} total={totalPages} totalCount={totalCount} onChange={onChange} />
    </div>
  );
}

function CompareTab({ compared, page, totalPages, totalCount, onChange, fmt, getPub, copyToClipboard, downloadHTML }) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>🔄 OpenAI vs DeepSeek Comparison (Page {page} of {totalPages})</h2>
      <div style={styles.compareContainer}>
        {compared.map((a) => {
          const base = fmt(getPub(a));
          const openaiTime = fmt(a.openai_processed_at_iso || a.openai_processed_at);
          const deepseekTime = fmt(a.deepseek_processed_at_iso || a.deepseek_processed_at);

          return (
            <div key={a.id} style={styles.compareCard}>
              <div style={styles.compareHeader}>
                <div style={styles.compareTitle}>{a.title}</div>
                <div style={styles.compareMeta}>
                  <span>📰 {a.source_name}</span>
                  <span>📅 Original: {base.date} {base.time}</span>
                </div>
              </div>

              <div style={styles.compareGrid}>
                <ComparePanel
                  label="✅ OpenAI"
                  date={openaiTime.date}
                  time={openaiTime.time}
                  title={a.hindi_final_title || a.title}
                  meta={a.hindi_final_meta || ""}
                  slug={`${a.hindi_final_slug || "article"}-openai`}
                  html={a.hindi_ready_article || ""}
                  color="#28a745"
                  copyToClipboard={copyToClipboard}
                  downloadHTML={downloadHTML}
                />

                <ComparePanel
                  label="🤖 DeepSeek"
                  date={deepseekTime.date}
                  time={deepseekTime.time}
                  title={a.deepseek_final_title || a.title}
                  meta={a.deepseek_final_meta || ""}
                  slug={`${a.deepseek_final_slug || "article"}-deepseek`}
                  html={a.deepseek_ready_article || ""}
                  color="#6f42c1"
                  copyToClipboard={copyToClipboard}
                  downloadHTML={downloadHTML}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Pager page={page} total={totalPages} totalCount={totalCount} onChange={onChange} />
    </div>
  );
}

function ComparePanel({ label, date, time, title, meta, slug, html, color, copyToClipboard, downloadHTML }) {
  return (
    <div style={{ ...styles.comparePanel, borderColor: color }}>
      <div style={styles.comparePanelHeader}>
        <div style={{ fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>{date} {time}</div>
      </div>
      <div style={styles.comparePanelMeta}>
        <div><strong>Title:</strong> {title}</div>
        {meta && <div><strong>Meta:</strong> {meta}</div>}
      </div>
      <div style={styles.comparePanelButtons}>
        <button
          onClick={() => copyToClipboard(html, `${label} HTML`)}
          style={{ ...styles.button, ...styles.buttonInfo, background: color }}
        >
          📋 Copy HTML
        </button>
        <button
          onClick={() => downloadHTML(html, slug)}
          style={{ ...styles.button, ...styles.buttonSuccess, background: color }}
        >
          💾 Download HTML
        </button>
      </div>
      <div style={{ ...styles.previewContainer, borderColor: `${color}55` }}>
        <iframe title={`${label}-preview-${slug}`} srcDoc={html} style={styles.iframe} />
      </div>
    </div>
  );
}

function Pager({ page, total, totalCount, onChange }) {
  const nums = [];
  const max = 5;
  let start = Math.max(1, page - Math.floor(max / 2));
  let end = Math.min(total, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div style={styles.pagerContainer}>
      <button
        disabled={page === 1}
        onClick={() => onChange(1)}
        style={{
          ...styles.pagerButton,
          ...(page === 1 ? styles.pagerButtonDisabled : {}),
        }}
      >
        First
      </button>
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        style={{
          ...styles.pagerButton,
          ...(page === 1 ? styles.pagerButtonDisabled : {}),
        }}
      >
        Prev
      </button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            ...styles.pagerButton,
            ...(n === page ? styles.pagerButtonActive : {}),
          }}
        >
          {n}
        </button>
      ))}
      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        style={{
          ...styles.pagerButton,
          ...(page === total ? styles.pagerButtonDisabled : {}),
        }}
      >
        Next
      </button>
      <button
        disabled={page === total}
        onClick={() => onChange(total)}
        style={{
          ...styles.pagerButton,
          ...(page === total ? styles.pagerButtonDisabled : {}),
        }}
      >
        Last
      </button>
      <span style={styles.pagerInfo}>
        Page {page} of {total} ({totalCount} total)
      </span>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
    padding: "30px",
    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
    borderRadius: "15px",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  mainTitle: {
    margin: "0 0 10px 0",
    fontSize: "2.5rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "0 0 15px 0",
    fontSize: "1.1rem",
    opacity: "0.95",
    fontWeight: "400",
  },
  systemInfo: {
    fontSize: "0.85rem",
    opacity: "0.8",
    fontFamily: "monospace",
  },
  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
    flexWrap: "wrap",
  },
  tab: {
    padding: "12px 24px",
    border: "none",
    borderRadius: "10px 10px 0 0",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  tabInactive: {
    background: "#f3f4f6",
    color: "#666",
  },
  actionButtons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
  },
  button: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  buttonPrimary: {
    background: "#007bff",
    color: "#fff",
  },
  buttonSuccess: {
    background: "#28a745",
    color: "#fff",
  },
  buttonInfo: {
    background: "#17a2b8",
    color: "#fff",
  },
  buttonSecondary: {
    background: "#6c757d",
    color: "#fff",
  },
  buttonGenerate: {
    background: "#ff6b6b",
    color: "#fff",
    minWidth: "160px",
  },
  buttonDeepSeek: {
    background: "#9c27b0",
    color: "#fff",
    minWidth: "160px",
  },
  buttonDisabled: {
    background: "#95a5a6",
    cursor: "not-allowed",
    opacity: "0.7",
  },
  sectionTitle: {
    marginBottom: "20px",
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#2c3e50",
  },
  cardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "25px",
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardContent: {
    flex: 1,
    paddingRight: "20px",
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: "10px",
    color: "#ff6b6b",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "1.1rem",
    lineHeight: "1.4",
  },
  cardMeta: {
    display: "flex",
    gap: "15px",
    color: "#666",
    fontSize: "0.9rem",
    flexWrap: "wrap",
  },
  badgeSuccess: {
    color: "#28a745",
    fontWeight: "700",
    background: "#d4edda",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  badgeDeepSeek: {
    color: "#6f42c1",
    fontWeight: "700",
    background: "#ede7f6",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  dualButtonGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  processedCard: {
    border: "2px solid #ff6b6b",
    borderRadius: "12px",
    padding: "25px",
    background: "#fff",
    boxShadow: "0 4px 15pxrgba(0,0,0,0.08)",
  },
  processedHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
    flexWrap: "wrap",
    gap: "15px",
  },
  processedTitle: {
    fontWeight: "700",
    fontSize: "1.3rem",
    color: "#2c3e50",
    flex: 1,
  },
  processedMeta: {
    fontSize: "0.85rem",
    color: "#666",
    textAlign: "right",
  },
  metaBox: {
    background: "#ffe8e8",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "0.9rem",
    lineHeight: "1.8",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  previewContainer: {
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#fff",
  },
  iframe: {
    width: "100%",
    height: "600px",
    border: "none",
    background: "#fff",
  },
  compareContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "25px",
  },
  compareCard: {
    border: "2px solid #ff6b35",
    borderRadius: "12px",
    padding: "20px",
    background: "#fff5f2",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  compareHeader: {
    borderBottom: "2px solid #ff6b35",
    paddingBottom: "12px",
    marginBottom: "16px",
  },
  compareTitle: {
    fontWeight: "700",
    fontSize: "1.2rem",
    color: "#2c3e50",
  },
  compareMeta: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    fontSize: "0.9rem",
    color: "#666",
  },
  compareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  comparePanel: {
    border: "2px solid #28a745",
    borderRadius: "10px",
    padding: "12px",
    background: "#f9f9ff",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  comparePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comparePanelMeta: {
    background: "#f0f0ff",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "0.95rem",
  },
  comparePanelButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  pagerContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    padding: "25px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  pagerButton: {
    padding: "8px 15px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    background: "#ff6b6b",
    color: "#fff",
    transition: "all 0.2s ease",
  },
  pagerButtonActive: {
    background: "#ee5a24",
    transform: "scale(1.1)",
  },
  pagerButtonDisabled: {
    background: "#e0e0e0",
    color: "#999",
    cursor: "not-allowed",
  },
  pagerInfo: {
    marginLeft: "15px",
    color: "#666",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};
