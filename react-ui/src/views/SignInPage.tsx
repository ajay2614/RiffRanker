import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/client";

export default function SignInPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim().length >= 3 && password.length > 0, [username, password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    try {
      const u = username.trim();
      if (mode === "register") {
        await api.auth.register(u, password);
      }
      const res = await api.auth.login(u, password);
      setAuthToken(res.token);
      nav("/");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>Sign in</h2>
        <Link className="pill" to="/">← Home</Link>
      </div>

      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button
          type="button"
          className={mode === "login" ? "primary" : ""}
          onClick={() => setMode("login")}
          disabled={busy}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "register" ? "primary" : ""}
          onClick={() => setMode("register")}
          disabled={busy}
        >
          Register
        </button>
      </div>

      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <div className="row">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </div>
        <div style={{ marginTop: 12 }} className="row">
          <button className="primary" type="submit" disabled={busy || !canSubmit}>
            {busy ? "Working…" : mode === "register" ? "Register & Login" : "Login"}
          </button>
        </div>
      </form>

      {message ? <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#ffb4b4" }}>{message}</div> : null}
    </div>
  );
}

