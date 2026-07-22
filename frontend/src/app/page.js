"use client";

import React, { useState, useEffect } from "react";
import InputForm from "../components/InputForm";
import VideoCard from "../components/VideoCard";
import ChatPanel from "../components/ChatPanel";
import AuthModal from "../components/AuthModal";
import Dashboard from "../components/Dashboard";

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  if (typeof window !== "undefined") {
    // In dev mode, Next.js runs on 3000 and FastAPI on 8000
    if (window.location.port === "3000") {
      return "http://localhost:8000";
    }
  }
  // In production (single-container Docker), FastAPI serves frontend, so relative paths work
  return "";
};
const API_BASE = getApiBase();

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [videoA, setVideoA] = useState(null);
  const [videoB, setVideoB] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Auth & Dashboard State
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recover session and user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Decode token roughly to get user or just assume logged in for UI
      setCurrentUser("User"); // We can just set a dummy name or decode the JWT
    }
    const savedSession = localStorage.getItem("rag_session");
    if (savedSession) {
      try {
        const { session_id, video_a, video_b } = JSON.parse(savedSession);
        if (session_id && video_a && video_b) {
          // Verify session still valid on backend
          setIsRecovering(true);
          fetch(`${API_BASE}/api/session/${session_id}`)
            .then((res) => {
              if (res.ok) {
                setSessionId(session_id);
                setVideoA(video_a);
                setVideoB(video_b);
              } else {
                // Session expired — clean up
                localStorage.removeItem("rag_session");
              }
            })
            .catch(() => localStorage.removeItem("rag_session"))
            .finally(() => setIsRecovering(false));
        }
      } catch {
        localStorage.removeItem("rag_session");
      }
    }
  }, []);

  const handleAnalyze = async (urls) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(urls),
      });

      if (!response.ok) {
        let errorMsg = `Analysis failed (${response.status})`;
        try {
          const errDetail = await response.json();
          errorMsg = errDetail.detail || errDetail.message || errorMsg;
        } catch {
          try { errorMsg = await response.text() || errorMsg; } catch { /* ignore */ }
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setVideoA(data.video_a);
      setVideoB(data.video_b);
      // Persist session so page refresh doesn't lose state
      localStorage.setItem(
        "rag_session",
        JSON.stringify({
          session_id: data.session_id,
          video_a: data.video_a,
          video_b: data.video_b,
        })
      );
    } catch (err) {
      console.error("Error analyzing videos:", err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = async () => {
    if (sessionId) {
      // Best-effort delete session from backend
      try {
        await fetch(`${API_BASE}/api/session/${sessionId}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
    setSessionId("");
    setVideoA(null);
    setVideoB(null);
    setError(null);
    localStorage.removeItem("rag_session");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setShowDashboard(false);
  };

  const handleSaveSession = async () => {
    if (!sessionId || !videoA || !videoB) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/save-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          video_a_meta: videoA,
          video_b_meta: videoB
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save session. Make sure you are logged in.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isRecovering) {
    return (
      <main className="app-main-container">
        <div className="recovery-loader">
          <div className="spinner"></div>
          <p>Recovering session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main-container">
      <header className="app-header">
        <div className="header-logo" style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px'}} onClick={() => setShowDashboard(false)}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <h1>Agentic Social RAG</h1>
            <span className="logo-badge">IBM Capstone</span>
          </div>
          <span style={{fontSize: '11px', color: '#94a3b8', paddingLeft: '2px'}}>By Srilaya M</span>
        </div>
        <div className="header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {sessionId && !showDashboard && (
            <button className="btn btn-secondary reset-btn" onClick={handleReset}>
              New Comparison
            </button>
          )}
          {currentUser ? (
            <>
              {!showDashboard && (
                <button className="btn btn-secondary" onClick={() => setShowDashboard(true)}>
                  Dashboard
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={(username) => {
            setCurrentUser(username);
            setShowAuthModal(false);
          }} 
        />
      )}

      {error && (
        <div className="error-alert-banner">
          <div className="alert-content">
            <strong>Analysis Failed:</strong> {error}
          </div>
          <button className="alert-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {showDashboard ? (
        <Dashboard onBack={() => setShowDashboard(false)} />
      ) : !sessionId ? (
        <div className="welcome-section">
          <InputForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          
          <div className="features-preview-grid">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <h4>Deep Script Insights</h4>
              <p>Compare scripts, dialogue hooks, and CTA strategies inside transcripts.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h4>Engagement Metrics</h4>
              <p>Extract likes, comments, and views to calculate true engagement rates automatically.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <h4>Multi-turn Chat</h4>
              <p>Ask follow-up questions with full conversational history and cited sources.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-sidebar">
            <div className="sidebar-section-title">Analyzed Content</div>
            <div className="video-cards-stack">
              <VideoCard video={videoA} label="Video A" />
              <VideoCard video={videoB} label="Video B" />
            </div>
            {currentUser && (
              <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
                <button 
                  className={`btn ${saveSuccess ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{width: '100%'}}
                  onClick={handleSaveSession}
                  disabled={isSaving || saveSuccess}
                >
                  {saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save this Comparison"}
                </button>
              </div>
            )}
          </div>
          <div className="workspace-content">
            <ChatPanel sessionId={sessionId} videoData={{ video_a: videoA, video_b: videoB }} />
          </div>
        </div>
      )}
    </main>
  );
}
