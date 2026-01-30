import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://hammerhead-app-jkdit.ondigitalocean.app";
const PAGE = 25;

export default function FacebookHighCTRGenerator() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [newsArticles, setNewsArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState({});

  // --- SIMPLE FIX for timezone ---
  const fmt = (v) => {
    if (!v) return { date: "-", time: "-" };
    
    const timeMatch = v.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      const hour24 = parseInt(hours);
      const hour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
      const ampm = hour24 >= 12 ? 'pm' : 'am';
      const formattedTime = `${hour12}:${minutes} ${ampm}`;
      
      return {
        date: new Date(v).toLocaleDateString("en-IN"),
        time: formattedTime,
      };
    }
    
    return { date: "-", time: "-" };
  };

  const getPub = (row) => row.published_at_iso ?? row.published_at;

  // Fetch stored news from database
  const fetchStoredNews = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE;
      const response = await axios.get(`${API}/api/viral/stored-news`, {
        params: {
          limit: PAGE,
          offset: offset
        }
      });

      if (response.data.success) {
        setNewsArticles(response.data.news || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
        console.log(`✅ Fetched ${response.data.news?.length} stored articles`);
      } else {
        alert("Error fetching stored news: " + response.data.error);
      }
    } catch (error) {
      console.error("Error fetching stored news:", error);
      alert("Error fetching stored news: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate HIGH-CTR Facebook content
  const generateContent = async (articleId) => {
    setBusy((m) => ({ ...m, [articleId]: true }));
    try {
      const response = await axios.post(`${API}/api/facebook-high-ctr/generate`, {
        articleId: articleId
      });

      if (response.data.success) {
        setContent(response.data.content);
        setSelectedArticle(response.data.originalArticle);
        console.log("✅ HIGH-CTR Facebook content generated successfully");
      } else {
        alert("Error generating content: " + response.data.error);
      }
    } catch (error) {
      console.error("Error generating HIGH-CTR Facebook content:", error);
      alert("Error generating content: " + error.message);
    } finally {
      setBusy((m) => ({ ...m, [articleId]: false }));
    }
  };

  // Manual fetch news
  const manualFetch = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/manual-fetch-news`);
      await fetchStoredNews(1);
      setCurrentPage(1);
      alert("News fetched successfully!");
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Content copied to clipboard!");
  };

  // Download content as text file
  const downloadContent = () => {
    const data = `HIGH-CTR FACEBOOK CONTENT\n\n${content}\n\nGenerated at: ${new Date().toLocaleString("en-IN")}\nOriginal Article: ${selectedArticle?.title || "N/A"}`;
    
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facebook-high-ctr-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load news on component mount
  useEffect(() => {
    fetchStoredNews(1);
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, Arial" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1>📘 HIGH-CTR Facebook Content Generator</h1>
        <p>Generate Facebook posts targeting 10,000+ organic clicks</p>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          Current Time: {new Date().toLocaleString("en-IN")} | API: {API}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 14 }}>
        <button 
          disabled={loading} 
          onClick={() => fetchStoredNews(currentPage)}
          style={{
            padding: "8px 16px",
            background: loading ? "#95a5a6" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "⏳ Refreshing..." : "🔄 Refresh"}
        </button>
        <button 
          disabled={loading} 
          onClick={manualFetch}
          style={{
            padding: "8px 16px",
            background: loading ? "#95a5a6" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "⏳ Fetching..." : "📰 Fetch New News"}
        </button>
      </div>

      {/* News Selection Section */}
      <div>
        <h2>Latest Stored News (Page {currentPage} of {totalPages})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {newsArticles.map((article) => {
            const { date, time } = fmt(getPub(article));
            const isBusy = !!busy[article.id];
            return (
              <div 
                key={article.id} 
                style={{ 
                  border: "1px solid #e5e7eb", 
                  borderRadius: 10, 
                  padding: 16, 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}
              >
                <div style={{ flex: 1, paddingRight: 12 }}>
                  <div 
                    style={{ 
                      fontWeight: 700, 
                      marginBottom: 6, 
                      color: "#007bff", 
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                    onClick={() => {
                      if (article.source_url) {
                        window.open(article.source_url, '_blank', 'noopener,noreferrer');
                      } else {
                        alert('No source URL available');
                      }
                    }}
                  >
                    {article.title}
                  </div>
                  <div style={{ display: "flex", gap: 14, color: "#666", fontSize: 12 }}>
                    <span>📅 {date}</span>
                    <span>🕒 {time}</span>
                    <span>{article.source_name}</span>
                    {typeof article.word_count === "number" && <span>📝 {article.word_count} words</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedArticle(article);
                    generateContent(article.id);
                  }}
                  disabled={isBusy}
                  style={{ 
                    padding: "10px 14px", 
                    background: isBusy ? "#95a5a6" : "#1877f2", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 8,
                    fontWeight: "bold"
                  }}
                >
                  {isBusy ? "⏳ Generating..." : "📘 Generate HIGH-CTR Content"}
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16 }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => fetchStoredNews(1)}
            style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}
          >
            First
          </button>
          <button 
            disabled={currentPage === 1} 
            onClick={() => fetchStoredNews(currentPage - 1)}
            style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}
          >
            Prev
          </button>
          <span style={{ padding: "6px 12px", background: "#1877f2", color: "white", borderRadius: 4 }}>
            {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => fetchStoredNews(currentPage + 1)}
            style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}
          >
            Next
          </button>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => fetchStoredNews(totalPages)}
            style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}
          >
            Last
          </button>
          <span style={{ marginLeft: 8, color: "#666" }}>
            Page {currentPage} of {totalPages} ({totalCount})
          </span>
        </div>
      </div>

      {/* Content Display */}
      {content && (
        <div style={{ marginTop: 32 }}>
          <div style={{ background: "#1877f2", color: "white", padding: 16, borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>✅ Generated HIGH-CTR Facebook Content</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(content)}
                  style={{
                    padding: "8px 12px",
                    background: "white",
                    color: "#1877f2",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadContent}
                  style={{
                    padding: "8px 12px",
                    background: "white",
                    color: "#1877f2",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  💾 Download
                </button>
              </div>
            </div>
            {selectedArticle && (
              <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
                📰 Original Article: {selectedArticle.title}
              </div>
            )}
          </div>

          <div style={{
            background: "#fff",
            padding: 24,
            borderRadius: 12,
            border: "2px solid #1877f2",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 14,
            lineHeight: 1.8,
            maxHeight: 800,
            overflow: "auto",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            {content}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ background: "#e3f2fd", padding: 20, borderRadius: 12, marginTop: 24 }}>
        <h3>📋 How to Use</h3>
        <ol>
          <li><strong>Select Article:</strong> Browse and click on any cricket news article</li>
          <li><strong>Generate:</strong> Click "Generate HIGH-CTR Content" button</li>
          <li><strong>Review:</strong> Content includes 5 captions, 3 image ideas, AI prompts, hashtags & posting tips</li>
          <li><strong>Copy/Download:</strong> Use the content for your Facebook posts</li>
        </ol>
        <p><strong>Note:</strong> This generator uses a specialized prompt targeting 10,000+ organic clicks with high-CTR strategies.</p>
      </div>
    </div>
  );
}
