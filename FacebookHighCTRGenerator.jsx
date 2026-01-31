import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://hammerhead-app-jkdit.ondigitalocean.app";
const PAGE = 25;

export default function FacebookHighCTRGenerator() {
  const [activeTab, setActiveTab] = useState("generate"); // "generate" or "stored"
  
  // Generate tab states
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [newsArticles, setNewsArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState({});
  const [processingTime, setProcessingTime] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  // Stored content tab states
  const [storedContent, setStoredContent] = useState([]);
  const [storedLoading, setStoredLoading] = useState(false);
  const [storedPage, setStoredPage] = useState(1);
  const [storedTotalPages, setStoredTotalPages] = useState(1);
  const [storedTotalCount, setStoredTotalCount] = useState(0);
  const [selectedStoredContent, setSelectedStoredContent] = useState(null);

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
    setError(null);
    try {
      const offset = (page - 1) * PAGE;
      const response = await axios.get(
        `${API}/api/viral/stored-news?limit=${PAGE}&offset=${offset}&sort=desc&_=${Date.now()}`,
        { headers: { "Cache-Control": "no-cache" } }
      );

      if (response.data.success) {
        setNewsArticles(response.data.news || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
        console.log(`✅ Fetched ${response.data.news?.length} stored articles`);
      } else {
        setError(response.data.error || "Failed to fetch news");
        alert("Error fetching stored news: " + response.data.error);
      }
    } catch (error) {
      console.error("Error fetching stored news:", error);
      setError(error.message);
      alert("Error fetching stored news: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stored generated content
  const fetchStoredContent = async (page = 1) => {
    setStoredLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE;
      const response = await axios.get(
        `${API}/api/facebook-high-ctr/stored-content?limit=${PAGE}&offset=${offset}&_=${Date.now()}`,
        { 
          headers: { "Cache-Control": "no-cache" },
          timeout: 30000
        }
      );

      if (response.data.success) {
        setStoredContent(response.data.content || []);
        setStoredTotalCount(response.data.totalCount || 0);
        setStoredTotalPages(response.data.totalPages || 1);
        setStoredPage(page);
        console.log(`✅ Fetched ${response.data.content?.length} stored generated content`);
      } else {
        const errorMsg = response.data.error || "Unknown error";
        setError("Error fetching stored content: " + errorMsg);
        console.error("Error response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stored content:", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to fetch stored content";
      setError("Error fetching stored content: " + errorMsg);
      console.error("Full error:", error.response?.data || error);
    } finally {
      setStoredLoading(false);
    }
  };

  // Generate HIGH-CTR Facebook content
  const generateContent = async (articleId) => {
    setBusy((m) => ({ ...m, [articleId]: true }));
    setError(null);
    setContent(null);
    setProcessingTime(null);
    
    try {
      const response = await axios.post(`${API}/api/facebook-high-ctr/generate`, {
        articleId: articleId
      });

      if (response.data.success) {
        setContent(response.data.content);
        setSelectedArticle(response.data.originalArticle);
        setProcessingTime(response.data.processingTime);
        setProvider(response.data.provider || 'OpenAI');
        console.log("✅ HIGH-CTR Facebook content generated successfully");
        alert("✅ Content generated and saved successfully! Check 'Stored Content' tab to view all saved content.");
        
        // Always refresh stored content list after generation (for both tabs)
        setTimeout(() => {
          fetchStoredContent(1); // Refresh to page 1 to see the latest
        }, 500);
        
        // Scroll to content
        setTimeout(() => {
          const contentElement = document.getElementById('generated-content');
          if (contentElement) {
            contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        setError(response.data.error || "Failed to generate content");
        alert("Error generating content: " + response.data.error);
      }
    } catch (error) {
      console.error("Error generating HIGH-CTR Facebook content:", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to generate content";
      setError(errorMsg);
      alert("Error generating content: " + errorMsg);
    } finally {
      setBusy((m) => ({ ...m, [articleId]: false }));
    }
  };

  // Manual fetch news
  const manualFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API}/api/manual-fetch-news`);
      // Wait a bit for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchStoredNews(1);
      setCurrentPage(1);
      alert("✅ News fetched successfully! Latest news should now appear.");
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      setError(errorMsg);
      alert("Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ Content copied to clipboard!");
    }).catch(() => {
      alert("❌ Failed to copy content");
    });
  };

  // Download content as text file
  const downloadContent = (contentToDownload, articleInfo) => {
    if (!contentToDownload) return;
    
    const data = `HIGH-CTR FACEBOOK CONTENT\nGenerated with OpenAI\n\n${"=".repeat(50)}\n\n${contentToDownload}\n\n${"=".repeat(50)}\n\nGenerated at: ${new Date().toLocaleString("en-IN")}\nProcessing Time: ${articleInfo?.processing_time ? (articleInfo.processing_time / 1000).toFixed(2) + 's' : 'N/A'}\nOriginal Article: ${articleInfo?.article_title || "N/A"}\nSource: ${articleInfo?.source_name || "N/A"}\nGNews URL: ${articleInfo?.gnews_url || "N/A"}`;
    
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
    if (activeTab === "generate") {
      fetchStoredNews(1);
    } else if (activeTab === "stored") {
      fetchStoredContent(1);
    }
  }, [activeTab]);

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, background: "linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)", padding: 32, borderRadius: 16, color: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 32, fontWeight: 700 }}>📘 HIGH-CTR Facebook Content Generator</h1>
        <p style={{ margin: 0, fontSize: 16, opacity: 0.95 }}>Generate Facebook posts targeting 10,000+ organic clicks using OpenAI</p>
        <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.9 }}>
          🕒 {new Date().toLocaleString("en-IN")} | 🌐 API: {API} | 🤖 Powered by OpenAI GPT-4o-mini
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setActiveTab("generate")}
          style={{
            padding: "12px 24px",
            background: activeTab === "generate" ? "#1877f2" : "transparent",
            color: activeTab === "generate" ? "white" : "#666",
            border: "none",
            borderBottom: activeTab === "generate" ? "3px solid #1877f2" : "3px solid transparent",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 16,
            transition: "all 0.2s"
          }}
        >
          ✨ Generate New
        </button>
        <button
          onClick={() => {
            setActiveTab("stored");
            if (storedContent.length === 0) {
              fetchStoredContent(1);
            }
          }}
          style={{
            padding: "12px 24px",
            background: activeTab === "stored" ? "#1877f2" : "transparent",
            color: activeTab === "stored" ? "white" : "#666",
            border: "none",
            borderBottom: activeTab === "stored" ? "3px solid #1877f2" : "3px solid transparent",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 16,
            transition: "all 0.2s"
          }}
        >
          💾 Stored Content ({storedTotalCount})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 20,
          border: "1px solid #ef5350"
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Generate Tab Content */}
      {activeTab === "generate" && (
        <>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <button 
              disabled={loading} 
              onClick={() => fetchStoredNews(currentPage)}
              style={{
                padding: "10px 20px",
                background: loading ? "#95a5a6" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: 14,
                boxShadow: loading ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {loading ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
            <button 
              disabled={loading} 
              onClick={manualFetch}
              style={{
                padding: "10px 20px",
                background: loading ? "#95a5a6" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: 14,
                boxShadow: loading ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {loading ? "⏳ Fetching..." : "📰 Fetch New News"}
            </button>
          </div>

          {/* News Selection Section */}
          <div style={{ background: "#f8f9fa", padding: 24, borderRadius: 12, marginBottom: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#333" }}>📰 Latest Stored News</h2>
              <span style={{ 
                background: "#1877f2", 
                color: "white", 
                padding: "6px 12px", 
                borderRadius: 20, 
                fontSize: 14, 
                fontWeight: 600 
              }}>
                Page {currentPage} of {totalPages} ({totalCount} articles)
              </span>
            </div>
            
            {loading && newsArticles.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading articles...</div>
              </div>
            ) : newsArticles.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                <div>No articles found. Click "Fetch New News" to get started.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {newsArticles.map((article) => {
                    const { date, time } = fmt(getPub(article));
                    const isBusy = !!busy[article.id];
                    return (
                      <div 
                        key={article.id} 
                        style={{ 
                          background: "white",
                          border: "2px solid #e5e7eb", 
                          borderRadius: 12, 
                          padding: 20, 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          transition: "all 0.2s",
                          boxShadow: selectedArticle?.title === article.title ? "0 4px 12px rgba(24,119,242,0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 16 }}>
                          <div 
                            style={{ 
                              fontWeight: 700, 
                              marginBottom: 8, 
                              color: "#1877f2", 
                              cursor: "pointer",
                              textDecoration: "none",
                              fontSize: 16,
                              lineHeight: 1.4
                            }}
                            onClick={() => {
                              if (article.source_url) {
                                window.open(article.source_url, '_blank', 'noopener,noreferrer');
                              } else {
                                alert('No source URL available');
                              }
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                          >
                            {article.title}
                          </div>
                          <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 13, flexWrap: "wrap" }}>
                            <span>📅 {date}</span>
                            <span>🕒 {time}</span>
                            <span>📰 {article.source_name}</span>
                            {typeof article.word_count === "number" && <span>📝 {article.word_count} words</span>}
                          </div>
                          {article.description && (
                            <div style={{ marginTop: 8, fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                              {article.description.substring(0, 150)}...
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            generateContent(article.id);
                          }}
                          disabled={isBusy}
                          style={{ 
                            padding: "12px 20px", 
                            background: isBusy ? "#95a5a6" : "#1877f2", 
                            color: "#fff", 
                            border: "none", 
                            borderRadius: 8,
                            fontWeight: "bold",
                            fontSize: 14,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            boxShadow: isBusy ? "none" : "0 2px 8px rgba(24,119,242,0.3)",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap"
                          }}
                          onMouseEnter={(e) => {
                            if (!isBusy) e.target.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isBusy) e.target.style.transform = "scale(1)";
                          }}
                        >
                          {isBusy ? "⏳ Generating..." : "📘 Generate HIGH-CTR"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: 20, flexWrap: "wrap" }}>
                  <button 
                    disabled={currentPage === 1 || loading} 
                    onClick={() => fetchStoredNews(1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: currentPage === 1 ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    First
                  </button>
                  <button 
                    disabled={currentPage === 1 || loading} 
                    onClick={() => fetchStoredNews(currentPage - 1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: currentPage === 1 ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ 
                    padding: "8px 16px", 
                    background: "#1877f2", 
                    color: "white", 
                    borderRadius: 6,
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: "center"
                  }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages || loading} 
                    onClick={() => fetchStoredNews(currentPage + 1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: currentPage === totalPages ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Next
                  </button>
                  <button 
                    disabled={currentPage === totalPages || loading} 
                    onClick={() => fetchStoredNews(totalPages)}
                    style={{ 
                      padding: "8px 16px", 
                      background: currentPage === totalPages ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Last
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Content Display */}
          {content && (
            <div id="generated-content" style={{ marginTop: 32 }}>
              <div style={{ 
                background: "linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)", 
                color: "white", 
                padding: 24, 
                borderRadius: 12, 
                marginBottom: 24,
                boxShadow: "0 4px 12px rgba(24,119,242,0.3)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>✅ Generated HIGH-CTR Facebook Content</h2>
                    {selectedArticle && (
                      <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 4 }}>
                        📰 {selectedArticle.title}
                      </div>
                    )}
                    {processingTime && (
                      <div style={{ fontSize: 12, opacity: 0.9 }}>
                        ⏱️ Generated in {(processingTime / 1000).toFixed(2)}s
                      </div>
                    )}
                    {provider && (
                      <div style={{ fontSize: 12, opacity: 0.9 }}>
                        🤖 Provider: {provider}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setActiveTab("stored");
                        setTimeout(() => fetchStoredContent(1), 300);
                      }}
                      style={{
                        padding: "10px 20px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 14,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      💾 View in Stored Tab
                    </button>
                    <button
                      onClick={() => copyToClipboard(content)}
                      style={{
                        padding: "10px 20px",
                        background: "white",
                        color: "#1877f2",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 14,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      📋 Copy All
                    </button>
                    <button
                      onClick={() => downloadContent(content, { 
                        processing_time: processingTime,
                        article_title: selectedArticle?.title,
                        source_name: selectedArticle?.source_name,
                        gnews_url: selectedArticle?.source_url
                      })}
                      style={{
                        padding: "10px 20px",
                        background: "white",
                        color: "#1877f2",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 14,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Display with Better Formatting */}
              <div style={{
                background: "#fff",
                padding: 32,
                borderRadius: 12,
                border: "2px solid #1877f2",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}>
                <div style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "#333"
                }}>
                  {content.split('\n').map((line, idx) => {
                    // Style different sections
                    if (line.match(/^STEP \d+/i)) {
                      return (
                        <div key={idx} style={{ 
                          marginTop: idx > 0 ? 32 : 0, 
                          marginBottom: 16,
                          padding: "12px 16px",
                          background: "#e3f2fd",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 18,
                          color: "#1877f2",
                          borderLeft: "4px solid #1877f2"
                        }}>
                          {line}
                        </div>
                      );
                    }
                    if (line.match(/^(POST|CAPTION|IMAGE|HASHTAG)/i)) {
                      return (
                        <div key={idx} style={{ 
                          marginTop: 16, 
                          marginBottom: 8,
                          fontWeight: 600,
                          color: "#1976d2",
                          fontSize: 16
                        }}>
                          {line}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stored Content Tab */}
      {activeTab === "stored" && (
        <>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <button 
              disabled={storedLoading} 
              onClick={() => fetchStoredContent(storedPage)}
              style={{
                padding: "10px 20px",
                background: storedLoading ? "#95a5a6" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: storedLoading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: 14,
                boxShadow: storedLoading ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {storedLoading ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
          </div>

          <div style={{ background: "#f8f9fa", padding: 24, borderRadius: 12, marginBottom: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#333" }}>💾 Stored Generated Content</h2>
              <span style={{ 
                background: "#1877f2", 
                color: "white", 
                padding: "6px 12px", 
                borderRadius: 20, 
                fontSize: 14, 
                fontWeight: 600 
              }}>
                Page {storedPage} of {storedTotalPages} ({storedTotalCount} items)
              </span>
            </div>

            {storedLoading && storedContent.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading stored content...</div>
              </div>
            ) : storedContent.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                <div>No stored content found. Generate some content first!</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {storedContent.map((item) => {
                    const { date, time } = fmt(item.created_at_iso || item.created_at);
                    const isSelected = selectedStoredContent?.id === item.id;
                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          background: "white",
                          border: isSelected ? "2px solid #1877f2" : "2px solid #e5e7eb", 
                          borderRadius: 12, 
                          padding: 20,
                          boxShadow: isSelected ? "0 4px 12px rgba(24,119,242,0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 700, 
                              marginBottom: 8, 
                              color: "#1877f2", 
                              fontSize: 16,
                              lineHeight: 1.4
                            }}>
                              {item.article_title}
                            </div>
                            <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 13, flexWrap: "wrap", marginBottom: 8 }}>
                              <span>📅 {date}</span>
                              <span>🕒 {time}</span>
                              <span>📰 {item.source_name || 'Unknown'}</span>
                              {item.processing_time && (
                                <span>⏱️ {(item.processing_time / 1000).toFixed(2)}s</span>
                              )}
                              <span>🤖 {item.provider || 'OpenAI'}</span>
                            </div>
                            {item.gnews_url && (
                              <div style={{ marginTop: 8, marginBottom: 8 }}>
                                <a 
                                  href={item.gnews_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: "#1877f2", 
                                    textDecoration: "none",
                                    fontSize: 13,
                                    wordBreak: "break-all"
                                  }}
                                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                >
                                  🔗 GNews URL: {item.gnews_url}
                                </a>
                              </div>
                            )}
                            {item.article_description && (
                              <div style={{ marginTop: 8, fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                                {item.article_description.substring(0, 200)}...
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStoredContent(null);
                                } else {
                                  setSelectedStoredContent(item);
                                }
                              }}
                              style={{ 
                                padding: "8px 16px", 
                                background: isSelected ? "#28a745" : "#1877f2", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: 8,
                                fontWeight: "bold",
                                fontSize: 13,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {isSelected ? "👁️ Hide" : "👁️ View"}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.generated_content)}
                              style={{ 
                                padding: "8px 16px", 
                                background: "#6c757d", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: 8,
                                fontWeight: "bold",
                                fontSize: 13,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              📋 Copy
                            </button>
                            <button
                              onClick={() => downloadContent(item.generated_content, item)}
                              style={{ 
                                padding: "8px 16px", 
                                background: "#17a2b8", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: 8,
                                fontWeight: "bold",
                                fontSize: 13,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              💾 Download
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content View */}
                        {isSelected && (
                          <div style={{
                            marginTop: 16,
                            padding: 20,
                            background: "#f8f9fa",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb"
                          }}>
                            <div style={{
                              whiteSpace: "pre-wrap",
                              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                              fontSize: 14,
                              lineHeight: 1.8,
                              color: "#333"
                            }}>
                              {item.generated_content.split('\n').map((line, idx) => {
                                if (line.match(/^STEP \d+/i)) {
                                  return (
                                    <div key={idx} style={{ 
                                      marginTop: idx > 0 ? 24 : 0, 
                                      marginBottom: 12,
                                      padding: "10px 14px",
                                      background: "#e3f2fd",
                                      borderRadius: 6,
                                      fontWeight: 700,
                                      fontSize: 16,
                                      color: "#1877f2",
                                      borderLeft: "4px solid #1877f2"
                                    }}>
                                      {line}
                                    </div>
                                  );
                                }
                                if (line.match(/^(POST|CAPTION|IMAGE|HASHTAG)/i)) {
                                  return (
                                    <div key={idx} style={{ 
                                      marginTop: 12, 
                                      marginBottom: 6,
                                      fontWeight: 600,
                                      color: "#1976d2",
                                      fontSize: 15
                                    }}>
                                      {line}
                                    </div>
                                  );
                                }
                                return (
                                  <div key={idx} style={{ marginBottom: 6 }}>
                                    {line}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: 20, flexWrap: "wrap" }}>
                  <button 
                    disabled={storedPage === 1 || storedLoading} 
                    onClick={() => fetchStoredContent(1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: storedPage === 1 ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: storedPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    First
                  </button>
                  <button 
                    disabled={storedPage === 1 || storedLoading} 
                    onClick={() => fetchStoredContent(storedPage - 1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: storedPage === 1 ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: storedPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ 
                    padding: "8px 16px", 
                    background: "#1877f2", 
                    color: "white", 
                    borderRadius: 6,
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: "center"
                  }}>
                    {storedPage} / {storedTotalPages}
                  </span>
                  <button 
                    disabled={storedPage === storedTotalPages || storedLoading} 
                    onClick={() => fetchStoredContent(storedPage + 1)}
                    style={{ 
                      padding: "8px 16px", 
                      background: storedPage === storedTotalPages ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: storedPage === storedTotalPages ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Next
                  </button>
                  <button 
                    disabled={storedPage === storedTotalPages || storedLoading} 
                    onClick={() => fetchStoredContent(storedTotalPages)}
                    style={{ 
                      padding: "8px 16px", 
                      background: storedPage === storedTotalPages ? "#e0e0e0" : "#f3f4f6", 
                      border: "1px solid #ddd", 
                      borderRadius: 6, 
                      cursor: storedPage === storedTotalPages ? "not-allowed" : "pointer",
                      fontWeight: 500
                    }}
                  >
                    Last
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Instructions */}
      <div style={{ 
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)", 
        padding: 24, 
        borderRadius: 12, 
        marginTop: 32,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: 0, marginBottom: 16, color: "#1565c0" }}>📋 How to Use</h3>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: "#333" }}>
          <li><strong>Generate Tab:</strong> Select article and generate HIGH-CTR Facebook content</li>
          <li><strong>Stored Content Tab:</strong> View all previously generated content with GNews URLs</li>
          <li><strong>View Content:</strong> Click "View" to see full generated content</li>
          <li><strong>Copy/Download:</strong> Use buttons to copy or download any stored content</li>
        </ol>
        <div style={{ marginTop: 16, padding: 12, background: "white", borderRadius: 8 }}>
          <strong>💡 Note:</strong> All generated content is automatically saved to database. You can access it anytime from the "Stored Content" tab.
        </div>
      </div>
    </div>
  );
}
