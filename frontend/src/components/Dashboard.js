"use client";

import React, { useState, useEffect } from "react";

export default function Dashboard({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getApiBase = () => {
    if (typeof window !== "undefined") {
      if (window.location.port === "3000") {
        return "http://localhost:8000";
      }
    }
    return "";
  };
  const API_BASE = getApiBase();

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/my-sessions`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch sessions");
        }
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>My Saved Comparisons</h2>
        <button className="btn btn-secondary" onClick={onBack}>&larr; Back to Tool</button>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">Loading saved comparisons...</div>
      ) : error ? (
        <div className="dashboard-error">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="dashboard-empty">
          <p>You haven't saved any comparisons yet.</p>
          <button className="btn btn-primary mt-4" onClick={onBack}>Start a Comparison</button>
        </div>
      ) : (
        <div className="saved-sessions-grid">
          {sessions.map((s, idx) => (
            <div key={idx} className="saved-session-card">
              <div className="saved-date">
                {new Date(s.created_at).toLocaleDateString()}
              </div>
              <div className="vs-section">
                <div className="vs-video">
                  <span className="platform youtube">YT</span> {s.video_a.title.substring(0, 30)}...
                </div>
                <div className="vs-divider">VS</div>
                <div className="vs-video">
                  <span className="platform instagram">IG</span> {s.video_b.title.substring(0, 30)}...
                </div>
              </div>
              {/* Note: Clicking this could load the session into Chat, but for now we just show it */}
              <div className="saved-card-footer">Session ID: {s.session_id.substring(0,8)}...</div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 2rem 0;
          width: 100%;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .dashboard-loading, .dashboard-error, .dashboard-empty {
          text-align: center;
          padding: 3rem;
          background: var(--surface);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .dashboard-error {
          color: #c62828;
        }
        .saved-sessions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .saved-session-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s;
        }
        .saved-session-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .saved-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .vs-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .vs-video {
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vs-divider {
          text-align: center;
          font-weight: bold;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .platform {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
          margin-right: 6px;
        }
        .platform.youtube { background: #ff0000; }
        .platform.instagram { background: #e1306c; }
        
        .saved-card-footer {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          border-top: 1px solid var(--border);
          padding-top: 0.75rem;
        }
      `}</style>
    </div>
  );
}
