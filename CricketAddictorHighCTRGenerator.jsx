import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://hammerhead-app-jkdit.ondigitalocean.app";
const PAGE = 25;

export default function CricketAddictorHighCTRGenerator() {
  const [activeTab, setActiveTab] = useState("generate");
  
  // Generate tab states
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState({});
  const [processingTime, setProcessingTime] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imagePolling, setImagePolling] = useState(false);
  const [currentContentId, setCurrentContentId] = useState(null);
  const [imageCompleteNotification, setImageCompleteNotification] = useState(false);

  // Stored content tab states
  const [storedContent, setStoredContent] = useState([]);
  const [storedLoading, setStoredLoading] = useState(false);
  const [storedPage, setStoredPage] = useState(1);
  const [storedTotalPages, setStoredTotalPages] = useState(1);
  const [storedTotalCount, setStoredTotalCount] = useState(0);
  const [selectedStoredContent, setSelectedStoredContent] = useState(null);

  // Format date/time
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

  // Fetch stored articles from database
  const fetchStoredArticles = async (page = 1) => {
    console.log('📰 ========== FETCH STORED ARTICLES STARTED ==========');
    console.log('📄 Page:', page);
    console.log('🌐 API URL:', `${API}/api/cricket-addictor/stored-articles`);
    
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE;
      const url = `${API}/api/cricket-addictor/stored-articles?limit=${PAGE}&offset=${offset}&_=${Date.now()}`;
      console.log('📡 Making GET request to:', url);
      
      const response = await axios.get(url, { 
        headers: { "Cache-Control": "no-cache" },
        timeout: 30000
      });

      console.log('✅ API Response received');
      console.log('📦 Response data:', {
        success: response.data.success,
        articlesCount: response.data.articles?.length || 0,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages
      });

      if (response.data.success) {
        setArticles(response.data.articles || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
        console.log(`✅ Fetched ${response.data.articles?.length} stored articles`);
      } else {
        console.error('❌ API returned success: false');
        console.error('Error:', response.data.error);
        setError(response.data.error || "Failed to fetch articles");
        alert("Error fetching stored articles: " + response.data.error);
      }
    } catch (error) {
      console.error("❌ ========== ERROR FETCHING STORED ARTICLES ==========");
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      setError(error.message);
      alert("Error fetching stored articles: " + error.message);
    } finally {
      console.log('🏁 ========== FETCH STORED ARTICLES FINISHED ==========');
      setLoading(false);
    }
  };

  // Fetch stored generated content
  const fetchStoredContent = async (page = 1) => {
    console.log('📥 ========== FETCH STORED CONTENT STARTED ==========');
    console.log('📄 Page:', page);
    console.log('🌐 API URL:', `${API}/api/facebook-high-ctr/stored-content`);
    
    setStoredLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE;
      const url = `${API}/api/facebook-high-ctr/stored-content?limit=${PAGE}&offset=${offset}&_=${Date.now()}`;
      console.log('📡 Making GET request to:', url);
      
      const response = await axios.get(url, { 
        headers: { "Cache-Control": "no-cache" },
        timeout: 30000
      });

      console.log('✅ API Response received');
      console.log('📦 Response data:', {
        success: response.data.success,
        contentCount: response.data.content?.length || 0,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages
      });

      if (response.data.success) {
        const content = response.data.content || [];
        setStoredContent(content);
        setStoredTotalCount(response.data.totalCount || 0);
        setStoredTotalPages(response.data.totalPages || 1);
        setStoredPage(page);
        
        console.log(`✅ Fetched ${content.length} stored generated content`);
        
        // Check for images in stored content
        const itemsWithImages = content.filter(item => {
          try {
            const images = typeof item.generated_images === 'string' 
              ? JSON.parse(item.generated_images) 
              : item.generated_images;
            return images && images.length > 0;
          } catch {
            return false;
          }
        });
        console.log(`🖼️ Items with images: ${itemsWithImages.length}`);
      } else {
        const errorMsg = response.data.error || "Unknown error";
        console.error('❌ API returned success: false');
        console.error('Error:', errorMsg);
        setError("Error fetching stored content: " + errorMsg);
      }
    } catch (error) {
      console.error("❌ ========== ERROR FETCHING STORED CONTENT ==========");
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      const errorMsg = error.response?.data?.error || error.message || "Failed to fetch stored content";
      setError("Error fetching stored content: " + errorMsg);
    } finally {
      console.log('🏁 ========== FETCH STORED CONTENT FINISHED ==========');
      setStoredLoading(false);
    }
  };

  // Manual fetch articles from CricketAddictor API
  const manualFetch = async () => {
    console.log('📰 ========== MANUAL FETCH ARTICLES STARTED ==========');
    console.log('🌐 API URL:', `${API}/api/cricket-addictor/manual-fetch`);
    
    setFetching(true);
    setError(null);
    try {
      console.log('📡 Making POST request to fetch articles...');
      const response = await axios.post(`${API}/api/cricket-addictor/manual-fetch`, {
        limit: 50
      }, {
        timeout: 120000 // 2 minutes timeout
      });

      console.log('✅ API Response received');
      console.log('📦 Response:', response.data);

      if (response.data.success) {
        console.log('✅ Articles fetched successfully');
        alert("✅ " + response.data.message);
        await fetchStoredArticles(1);
        setCurrentPage(1);
      } else {
        console.error('❌ API returned success: false');
        console.error('Error:', response.data.error);
        setError(response.data.error || "Failed to fetch articles");
        alert("Error: " + response.data.error);
      }
    } catch (e) {
      console.error("❌ ========== ERROR IN MANUAL FETCH ==========");
      console.error("Error:", e);
      if (e.response) {
        console.error("Response status:", e.response.status);
        console.error("Response data:", e.response.data);
      }
      const errorMsg = e.response?.data?.error || e.message;
      setError(errorMsg);
      alert("Error: " + errorMsg);
    } finally {
      console.log('🏁 ========== MANUAL FETCH FINISHED ==========');
      setFetching(false);
    }
  };

  // Generate HIGH-CTR Facebook content
  const generateContent = async (articleId) => {
    console.log('🚀 ========== GENERATE CONTENT STARTED ==========');
    console.log('📝 Article ID:', articleId);
    console.log('🌐 API URL:', `${API}/api/cricket-addictor/generate-high-ctr`);
    console.log('⏰ Start Time:', new Date().toISOString());
    
    setBusy((m) => ({ ...m, [articleId]: true }));
    setError(null);
    setContent(null);
    setProcessingTime(null);
    setGeneratedImages([]);
    setImagePolling(false);
    setCurrentContentId(null);
    setImageCompleteNotification(false);
    
    try {
      console.log('📡 Step 1: Making API call for TEXT generation...');
      const requestStartTime = Date.now();
      
      // STEP 1: Generate TEXT ONLY (fast - 30-60s)
      const response = await axios.post(`${API}/api/cricket-addictor/generate-high-ctr`, {
        articleId: articleId
      }, {
        timeout: 120000 // 2 minutes for text generation
      });

      const requestTime = Date.now() - requestStartTime;
      console.log(`⏱️ TEXT Response received in ${(requestTime / 1000).toFixed(2)}s`);
      console.log('📦 Response data:', {
        success: response.data.success,
        hasContent: !!response.data.content,
        contentId: response.data.contentId,
        status: response.data.status
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to generate content");
      }

      const { contentId, content, status } = response.data;
      
      // Show text immediately
      setContent(content);
      setSelectedArticle(response.data.originalArticle);
      setProcessingTime(response.data.processingTime);
      setProvider(response.data.provider || 'OpenAI');
      setCurrentContentId(contentId);
      
      console.log("✅ TEXT content generated successfully");
      console.log(`📝 Content ID: ${contentId}`);
      console.log(`📊 Status: ${status}`);
      console.log(`📝 Content length: ${content?.length || 0} characters`);
      
      // Scroll to content
      setTimeout(() => {
        const contentElement = document.getElementById('generated-content');
        if (contentElement) {
          contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // STEP 2: Generate images in background
      console.log('🎨 Step 2: Starting image generation in background...');
      console.log(`📡 Making POST request to: ${API}/api/cricket-addictor/generate-images`);
      console.log(`📦 Request body: { contentId: ${contentId} }`);
      setImagePolling(true);
      
      // Trigger image generation (fire and forget - don't wait)
      const imageGenStartTime = Date.now();
      axios.post(`${API}/api/cricket-addictor/generate-images`, {
        contentId: contentId
      }, {
        timeout: 600000 // 10 minutes for image generation
      }).then(imgResponse => {
        const imageGenTime = Date.now() - imageGenStartTime;
        console.log(`✅ Image generation API call successful in ${(imageGenTime / 1000).toFixed(2)}s`);
        console.log('📦 Response:', imgResponse.data);
        if (imgResponse.data.success && imgResponse.data.images && imgResponse.data.images.length > 0) {
          console.log(`🖼️ Images received directly: ${imgResponse.data.images.length}`);
          // Set images immediately if received directly
          setGeneratedImages(imgResponse.data.images);
          setImagePolling(false);
          setImageCompleteNotification(true);
          
          // Clear polling interval since we got images directly
          if (window.currentPollInterval) {
            clearInterval(window.currentPollInterval);
            window.currentPollInterval = null;
          }
          
          // Refresh stored content
          setTimeout(() => {
            fetchStoredContent(1);
          }, 500);
          
          // Show notification
          alert(`🎉 IMAGES READY!\n\n✅ Successfully generated ${imgResponse.data.images.length} images!\n\nImages are now displayed below the content.`);
          
          // Auto-hide notification after 10 seconds
          setTimeout(() => {
            setImageCompleteNotification(false);
          }, 10000);
          
          // Scroll to images
          setTimeout(() => {
            const imagesElement = document.getElementById('generated-images-section');
            if (imagesElement) {
              imagesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }).catch(err => {
        const imageGenTime = Date.now() - imageGenStartTime;
        console.error(`❌ Image generation request error after ${(imageGenTime / 1000).toFixed(2)}s:`);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          response: err.response?.data,
          status: err.response?.status
        });
        // Don't set error - polling will catch it
        console.log('⚠️ Image generation request failed, but polling will continue to check status');
      });

      // STEP 3: Poll for status every 3 seconds
      let pollCount = 0;
      const maxPolls = 200; // 200 * 3s = 10 minutes max
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          const statusResponse = await axios.get(
            `${API}/api/cricket-addictor/high-ctr-status?contentId=${contentId}&_=${Date.now()}`,
            { 
              timeout: 10000,
              headers: { "Cache-Control": "no-cache" }
            }
          );

          if (statusResponse.data.success) {
            const { status, images, error } = statusResponse.data;
            
            const elapsedTime = Math.floor(pollCount * 3); // seconds
            console.log(`📊 [Poll ${pollCount}] Status: ${status}, Images: ${images.length}, Elapsed: ${elapsedTime}s`);

            if (status === 'done') {
              clearInterval(pollInterval);
              setImagePolling(false);
              setGeneratedImages(images);
              setImageCompleteNotification(true);
              console.log(`✅ Image generation complete! ${images.length} images received`);
              
              // Refresh stored content
              setTimeout(() => {
                fetchStoredContent(1);
              }, 500);
              
              // Show prominent notification
              alert(`🎉 IMAGES READY!\n\n✅ Successfully generated ${images.length} images!\n\nImages are now displayed below the content.`);
              
              // Auto-hide notification after 10 seconds
              setTimeout(() => {
                setImageCompleteNotification(false);
              }, 10000);
              
              // Scroll to images
              setTimeout(() => {
                const imagesElement = document.getElementById('generated-images-section');
                if (imagesElement) {
                  imagesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 500);
            } else if (status === 'failed') {
              clearInterval(pollInterval);
              setImagePolling(false);
              console.error('❌ Image generation failed:', error);
              setError(`Image generation failed: ${error || 'Unknown error'}`);
              alert(`⚠️ Image generation failed: ${error || 'Unknown error'}`);
            }
            // If status is 'processing_images', continue polling
          }
        } catch (pollError) {
          console.error(`❌ Status poll error (attempt ${pollCount}):`, pollError);
          // Continue polling even on error (network issues)
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setImagePolling(false);
          console.log('⏱️ Polling stopped after max attempts');
          setError('Image generation is taking longer than expected. Please check stored content tab later.');
        }
      }, 3000); // Poll every 3 seconds

      // Store interval ID to clear on unmount
      window.currentPollInterval = pollInterval;

      alert("✅ Content generated! Images are being generated in the background. They will appear automatically when ready (3-5 minutes).");

      // Always refresh stored content list after generation
      setTimeout(() => {
        fetchStoredContent(1);
      }, 500);

    } catch (error) {
      console.error("❌ ========== ERROR IN GENERATE CONTENT ==========");
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received from server");
        console.error("Request config:", error.config);
      }
      
      const errorMsg = error.response?.data?.error || error.message || "Failed to generate content";
      setError(errorMsg);
      setImagePolling(false);
      alert("Error generating content: " + errorMsg);
    } finally {
      console.log('🏁 ========== GENERATE CONTENT FINISHED ==========');
      setBusy((m) => ({ ...m, [articleId]: false }));
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
    
    const data = `HIGH-CTR FACEBOOK CONTENT\nGenerated with OpenAI\n\n${"=".repeat(50)}\n\n${contentToDownload}\n\n${"=".repeat(50)}\n\nGenerated at: ${new Date().toLocaleString("en-IN")}\nProcessing Time: ${articleInfo?.processing_time ? (articleInfo.processing_time / 1000).toFixed(2) + 's' : 'N/A'}\nOriginal Article: ${articleInfo?.article_title || "N/A"}\nSource: ${articleInfo?.source_name || "N/A"}\nArticle URL: ${articleInfo?.gnews_url || "N/A"}`;
    
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facebook-high-ctr-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load articles on component mount
  useEffect(() => {
    console.log('🎯 ========== COMPONENT MOUNTED/ACTIVE TAB CHANGED ==========');
    console.log('📱 Active Tab:', activeTab);
    console.log('🌐 API Base URL:', API);
    console.log('⏰ Current Time:', new Date().toISOString());
    
    if (activeTab === "generate") {
      console.log('📰 Fetching stored articles...');
      fetchStoredArticles(1);
    } else if (activeTab === "stored") {
      console.log('💾 Fetching stored content...');
      fetchStoredContent(1);
    }
  }, [activeTab]);
  
  // Log on initial mount
  useEffect(() => {
    console.log('🚀 ========== CRICKET ADDICTOR HIGH-CTR GENERATOR LOADED ==========');
    console.log('📅 Loaded at:', new Date().toISOString());
    console.log('🌐 API:', API);
    console.log('✅ Component ready');
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (window.currentPollInterval) {
        clearInterval(window.currentPollInterval);
        window.currentPollInterval = null;
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, background: "linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)", padding: 32, borderRadius: 16, color: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 32, fontWeight: 700 }}>📘 HIGH-CTR Facebook Content Generator</h1>
        <p style={{ margin: 0, fontSize: 16, opacity: 0.95 }}>Generate Facebook posts from CricketAddictor articles targeting 10,000+ organic clicks</p>
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

      {/* Image Complete Notification */}
      {imageCompleteNotification && (
        <div style={{ 
          background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)", 
          color: "white", 
          padding: 20, 
          borderRadius: 12, 
          marginBottom: 20,
          border: "2px solid #28a745",
          boxShadow: "0 4px 12px rgba(40,167,69,0.3)",
          animation: "slideDown 0.5s ease-out",
          position: "relative"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 32 }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                ✅ Images Generated Successfully!
              </div>
              <div style={{ fontSize: 14, opacity: 0.95 }}>
                {generatedImages.length} images are now displayed below. Scroll down to view them!
              </div>
            </div>
            <button
              onClick={() => setImageCompleteNotification(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Generate Tab Content */}
      {activeTab === "generate" && (
        <>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <button 
              disabled={loading} 
              onClick={() => fetchStoredArticles(currentPage)}
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
              disabled={fetching} 
              onClick={manualFetch}
              style={{
                padding: "10px 20px",
                background: fetching ? "#95a5a6" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: fetching ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: 14,
                boxShadow: fetching ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {fetching ? "⏳ Fetching..." : "📰 Fetch Latest 50 Articles"}
            </button>
          </div>

          {/* Articles Selection Section */}
          <div style={{ background: "#f8f9fa", padding: 24, borderRadius: 12, marginBottom: 32, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#333" }}>📰 CricketAddictor Articles</h2>
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
            
            {loading && articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading articles...</div>
              </div>
            ) : articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                <div>No articles found. Click "Fetch Latest 50 Articles" to get started.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {articles.map((article) => {
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
                              if (article.url) {
                                window.open(article.url, '_blank', 'noopener,noreferrer');
                              } else {
                                alert('No URL available');
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
                            <span>📰 Cricket Addictor</span>
                            {typeof article.word_count === "number" && <span>📝 {article.word_count} words</span>}
                          </div>
                          {article.description && (
                            <div style={{ marginTop: 8, fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                              {article.description.substring(0, 150)}...
                            </div>
                          )}
                          {article.url && (
                            <div style={{ marginTop: 8 }}>
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: "#1877f2", 
                                  textDecoration: "none",
                                  fontSize: 12,
                                  wordBreak: "break-all"
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                              >
                                🔗 {article.url}
                              </a>
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
                    onClick={() => fetchStoredArticles(1)}
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
                    onClick={() => fetchStoredArticles(currentPage - 1)}
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
                    onClick={() => fetchStoredArticles(currentPage + 1)}
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
                    onClick={() => fetchStoredArticles(totalPages)}
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

              {/* Generated Images Display - Grouped by Concept */}
              {generatedImages && generatedImages.length > 0 ? (
                <div id="generated-images-section" style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  border: "2px solid #1877f2",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: 24,
                  animation: imageCompleteNotification ? "bounce 0.6s ease-out" : "none"
                }}>
                  <h3 style={{ margin: 0, marginBottom: 20, color: "#1877f2", fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🖼️</span>
                    <span>Generated Images ({generatedImages.length} total - 3 Best-Match Concepts)</span>
                    {imageCompleteNotification && (
                      <span style={{ 
                        background: "#28a745", 
                        color: "white", 
                        padding: "4px 12px", 
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        animation: "pulse 2s infinite"
                      }}>
                        ✅ NEW!
                      </span>
                    )}
                  </h3>
                  
                  {/* Group images by concept */}
                  {[1, 2, 3].map(conceptNum => {
                    const conceptImages = generatedImages.filter(img => img.conceptIndex === conceptNum);
                    if (conceptImages.length === 0) return null;
                    
                    return (
                      <div key={conceptNum} style={{ 
                        marginBottom: 32, 
                        padding: 20, 
                        background: '#f8f9fa', 
                        borderRadius: 12,
                        border: '1px solid #e5e7eb'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          marginBottom: 16, 
                          color: "#1877f2", 
                          fontSize: 18,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <span style={{ 
                            background: '#1877f2', 
                            color: 'white', 
                            padding: '4px 12px', 
                            borderRadius: 20,
                            fontSize: 14,
                            fontWeight: 700
                          }}>
                            Concept {conceptNum}
                          </span>
                          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>
                            {conceptImages[0]?.headline_overlay || 'Image Concept'}
                          </span>
                          {conceptImages[0]?.scene_type && (
                            <span style={{ 
                              fontSize: 12, 
                              color: '#999', 
                              fontStyle: 'italic',
                              marginLeft: 8
                            }}>
                              ({conceptImages[0].scene_type})
                            </span>
                          )}
                        </h4>
                        
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {conceptImages.map((img, idx) => (
                            <div key={idx} style={{
                              flex: '1 1 300px',
                              maxWidth: '400px',
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "white",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}>
                              <img 
                                src={img.imageUrl} 
                                alt={`Concept ${conceptNum} - ${img.sizeLabel}`}
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  display: "block"
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
                                }}
                              />
                              <div style={{ display: "none", padding: 20, textAlign: "center", color: "#666" }}>
                                Image failed to load
                              </div>
                              <div style={{ padding: 12, background: "white" }}>
                                <div style={{ fontSize: 12, color: "#666", marginBottom: 4, fontWeight: 600 }}>
                                  Size: {img.sizeLabel || 'N/A'} ({img.dimensions || 'N/A'})
                                </div>
                                {img.headline_overlay && (
                                  <div style={{ fontSize: 11, color: "#1877f2", marginBottom: 4, fontStyle: "italic" }}>
                                    "{img.headline_overlay}"
                                  </div>
                                )}
                                {img.scene_type && (
                                  <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
                                    Type: {img.scene_type}
                                  </div>
                                )}
                                <a 
                                  href={img.imageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-block",
                                    marginTop: 8,
                                    padding: "6px 12px",
                                    background: "#1877f2",
                                    color: "white",
                                    textDecoration: "none",
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 600
                                  }}
                                >
                                  🔗 Open Full Size
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : content && (
                <div style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  border: "2px solid #e5e7eb",
                  marginBottom: 24,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>
                    {imagePolling ? "⏳ Images are being generated in the background..." : "⏳ Waiting for images..."}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                    This may take 3-5 minutes. Images will appear automatically when ready.
                  </div>
                  {imagePolling && (
                    <div style={{ fontSize: 11, color: "#1877f2", fontStyle: "italic" }}>
                      💡 Check browser console (F12) for detailed progress logs
                    </div>
                  )}
                  {imagePolling && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{
                        width: "100%",
                        height: "4px",
                        background: "#e5e7eb",
                        borderRadius: 2,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, #1877f2, #42a5f5)",
                          animation: "pulse 2s ease-in-out infinite"
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {/* Stored Content Tab - Same as FacebookHighCTRGenerator */}
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
                              <span>📰 {item.source_name || 'Cricket Addictor'}</span>
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
                                  🔗 Article URL: {item.gnews_url}
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
                            {/* Display Generated Images - Grouped by Concept */}
                            {item.generated_images && (() => {
                              try {
                                const images = typeof item.generated_images === 'string' 
                                  ? JSON.parse(item.generated_images) 
                                  : item.generated_images;
                                
                                if (images && images.length > 0) {
                                  return (
                                    <div style={{ marginBottom: 24 }}>
                                      <h4 style={{ margin: 0, marginBottom: 16, color: "#1877f2", fontSize: 16 }}>
                                        🖼️ Generated Images ({images.length} total)
                                      </h4>
                                      
                                      {/* Group images by concept */}
                                      {[1, 2, 3].map(conceptNum => {
                                        const conceptImages = images.filter(img => img.conceptIndex === conceptNum);
                                        if (conceptImages.length === 0) return null;
                                        
                                        return (
                                          <div key={conceptNum} style={{ 
                                            marginBottom: 20, 
                                            padding: 16, 
                                            background: '#f8f9fa', 
                                            borderRadius: 8,
                                            border: '1px solid #e5e7eb'
                                          }}>
                                            <div style={{ 
                                              marginBottom: 12, 
                                              fontSize: 14, 
                                              fontWeight: 600,
                                              color: '#1877f2',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 8
                                            }}>
                                              <span style={{ 
                                                background: '#1877f2', 
                                                color: 'white', 
                                                padding: '2px 8px', 
                                                borderRadius: 12,
                                                fontSize: 12
                                              }}>
                                                Concept {conceptNum}
                                              </span>
                                              {conceptImages[0]?.headline_overlay && (
                                                <span style={{ fontSize: 13, color: '#666' }}>
                                                  {conceptImages[0].headline_overlay}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                              {conceptImages.map((img, idx) => (
                                                <div key={idx} style={{
                                                  flex: '1 1 200px',
                                                  maxWidth: '250px',
                                                  border: "1px solid #e5e7eb",
                                                  borderRadius: 8,
                                                  overflow: "hidden",
                                                  background: "white"
                                                }}>
                                                  <img 
                                                    src={img.imageUrl} 
                                                    alt={`Concept ${conceptNum} - ${img.sizeLabel || idx + 1}`}
                                                    style={{
                                                      width: "100%",
                                                      height: "auto",
                                                      display: "block"
                                                    }}
                                                    onError={(e) => {
                                                      e.target.style.display = 'none';
                                                    }}
                                                  />
                                                  <div style={{ padding: 8, fontSize: 11, color: "#666" }}>
                                                    <div style={{ marginBottom: 4, fontWeight: 600 }}>
                                                      {img.sizeLabel || 'N/A'} ({img.dimensions || 'N/A'})
                                                    </div>
                                                    <a 
                                                      href={img.imageUrl} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      style={{
                                                        color: "#1877f2",
                                                        textDecoration: "none",
                                                        fontWeight: 600
                                                      }}
                                                    >
                                                      🔗 Open Full Size
                                                    </a>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                              } catch (e) {
                                console.error('Error parsing images:', e);
                              }
                              return null;
                            })()}

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
          <li><strong>Fetch Articles:</strong> Click "Fetch Latest 50 Articles" to get articles from CricketAddictor</li>
          <li><strong>Generate:</strong> Select any article and click "Generate HIGH-CTR" to create Facebook content</li>
          <li><strong>Stored Content:</strong> View all previously generated content with article URLs</li>
          <li><strong>Copy/Download:</strong> Use buttons to copy or download any content</li>
        </ol>
        <div style={{ marginTop: 16, padding: 12, background: "white", borderRadius: 8 }}>
          <strong>💡 Note:</strong> All generated content is automatically saved. Articles are fetched from CricketAddictor.com API.
        </div>
      </div>
      </div>
    </>
  );
}
