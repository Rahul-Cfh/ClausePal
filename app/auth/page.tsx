"use client";

import "./auth.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const friendlyError = (msg: string) => {
    if (msg.includes("Invalid login credentials")) return "Wrong email or password.";
    if (msg.includes("User already registered") || msg.includes("already been registered"))
      return "An account with this email already exists. Try logging in.";
    if (msg.includes("Password should be")) return "Password must be at least 6 characters.";
    if (msg.includes("Unable to validate email") || msg.includes("valid email"))
      return "Please enter a valid email address.";
    if (msg.includes("Email not confirmed"))
      return "Please confirm your email before logging in.";
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created! Check your email for a confirmation link, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/analyze");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: "login" | "signup") => {
    setTab(t);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="auth-root">
      {/* corner marks */}
      <span className="corner-mark cm-tl">§ ClausePal</span>
      <span className="corner-mark cm-tr">Secure access</span>
      <span className="corner-mark cm-bl">SOC 2 Type II</span>
      <span className="corner-mark cm-br">Issue 042</span>

      {/* brand */}
      <div className="auth-brand">
        <Link href="/" className="auth-brand-row" style={{ textDecoration: "none" }}>
          <div className="auth-badge">§</div>
          <div className="auth-brand-name">ClausePal</div>
        </Link>
        <div className="auth-tagline">
          Deciphering the <b>fine print.</b>
        </div>
      </div>

      {/* card */}
      <div className="auth-card">
        {/* tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab${tab === "signup" ? " active" : ""}`}
            onClick={() => switchTab("signup")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* name field — signup only */}
          {tab === "signup" && (
            <div className="auth-field">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Jordan Avery"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {tab === "login" && (
            <div className="auth-forgot">
              <a href="#">Forgot password?</a>
            </div>
          )}

          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}

          <button type="submit" className="auth-cta" disabled={loading}>
            {loading
              ? "Please wait..."
              : tab === "login"
              ? "Log In →"
              : "Create account →"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="auth-sso">
            <span className="g">G</span> Continue with Google
          </button>
        </form>
      </div>

      <div className="auth-prompt">
        {tab === "login" ? (
          <>Don&apos;t have an account?{" "}
            <button type="button" onClick={() => switchTab("signup")}>Sign up</button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button type="button" onClick={() => switchTab("login")}>Log in</button>
          </>
        )}
      </div>

      <p className="auth-legal">
        By continuing you agree to ClausePal&apos;s{" "}
        <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
        ClausePal provides analysis, not legal advice.
      </p>
    </div>
  );
}
