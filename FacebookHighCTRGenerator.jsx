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
  const [processingTime, setProcessingTime] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

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
      await fetchStoredNews(1);
      setCurrentPage(1);
      alert("✅ News fetched successfully!");
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
  const downloadContent = () => {
    if (!content) return;
    
    const data = `HIGH-CTR FACEBOOK CONTENT\nGenerated with OpenAI\n\n${"=".repeat(50)}\n\n${content}\n\n${"=".repeat(50)}\n\nGenerated at: ${new Date().toLocaleString("en-IN")}\nProcessing Time: ${processingTime ? (processingTime / 1000).toFixed(2) + 's' : 'N/A'}\nOriginal Article: ${selectedArticle?.title || "N/A"}\nSource: ${selectedArticle?.source?.name || "N/A"}`;
    
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facebook-high-ctr-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse content into sections
  const parseContent = (content) => {
    if (!content) return null;
    
    const sections = {
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      step5: ''
    };
    
    const step1Match = content.match(/STEP 1[:\s]*ANALYZE[^]*?(?=STEP 2|$)/i);
    const step2Match = content.match(/STEP 2[:\s]*CREATE[^]*?(?=STEP 3|$)/i);
    const step3Match = content.match(/STEP 3[:\s]*CREATE[^]*?(?=STEP 4|$)/i);
    const step4Match = content.match(/STEP 4[:\s]*IMAGE[^]*?(?=STEP 5|$)/i);
    const step5Match = content.match(/STEP 5[:\s]*HASHTAGS[^]*?$/i);
    
    if (step1Match) sections.step1 = step1Match[0].trim();
    if (step2Match) sections.step2 = step2Match[0].trim();
    if (step3Match) sections.step3 = step3Match[0].trim();
    if (step4Match) sections.step4 = step4Match[0].trim();
    if (step5Match) sections.step5 = step5Match[0].trim();
    
    return sections;
  };

  // Load news on component mount
  useEffect(() => {
    fetchStoredNews(1);
  }, []);

  const parsedContent = parseContent(content);

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>❌ Error:</strong> {error}
              {(error.includes('402') || error.includes('Payment')) && (
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                  💡 Tip: System will automatically try DeepSeek as fallback if OpenAI fails.
                </div>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#c62828",
                cursor: "pointer",
                fontSize: 20,
                padding: "0 8px"
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                  onClick={downloadContent}
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
          <li><strong>Select Article:</strong> Browse cricket news articles and click on any article</li>
          <li><strong>Generate:</strong> Click "Generate HIGH-CTR" button to create content</li>
          <li><strong>Review:</strong> Content includes 5 captions, 3 image ideas, AI prompts, hashtags & posting tips</li>
          <li><strong>Copy/Download:</strong> Use the buttons to copy or download the content</li>
        </ol>
        <div style={{ marginTop: 16, padding: 12, background: "white", borderRadius: 8 }}>
          <strong>💡 Note:</strong> This generator uses OpenAI GPT-4o-mini with a specialized prompt targeting 10,000+ organic clicks through high-CTR strategies, emotional triggers, and viral content techniques.
        </div>
      </div>
    </div>
  );
}
