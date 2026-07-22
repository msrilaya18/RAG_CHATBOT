"use client";

import React, { useState } from "react";

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getApiBase = () => {
    if (typeof window !== "undefined") {
      if (window.location.port === "3000") {
        return "http://localhost:8000";
      }
    }
    return "";
  };
  const API_BASE = getApiBase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Authentication failed");
      }

      const data = await res.json();
      localStorage.setItem("auth_token", data.access_token);
      onLoginSuccess(username);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-close-btn" onClick={onClose}>&times;</button>
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? "Login to save and view your video comparisons."
            : "Sign up to start saving your video comparisons."}
        </p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="auth-switch-btn">
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>

      <style jsx>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .auth-modal {
          background: var(--surface);
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          border: 1px solid var(--border);
        }
        .auth-close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .auth-subtitle {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .auth-submit {
          margin-top: 0.5rem;
          width: 100%;
        }
        .auth-error {
          background: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .auth-switch {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
        }
        .auth-switch-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-weight: 600;
        }
        .auth-switch-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
