import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Server, Key, Lock, Loader2, AlertCircle, ArrowRight,
  ShieldCheck, LogOut, Terminal, FileKey, Eye, EyeOff
} from "lucide-react";

// The connect gate. No server data is requested or shown until this succeeds —
// on success it hands the full discovery payload up to the dashboard.
export default function ConnectScreen({ onConnected, currentUser }) {
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [port, setPort] = useState("22");
  const [authMethod, setAuthMethod] = useState("key"); // 'key' | 'password'

  const [pemContent, setPemContent] = useState("");
  const [pemFileName, setPemFileName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [needsPassphrase, setNeedsPassphrase] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const readPemFile = (file) => {
    if (!file) return;
    setPemFileName(file.name);
    setError("");
    setNeedsPassphrase(false);
    setPassphrase("");
    const reader = new FileReader();
    reader.onload = (e) => setPemContent(e.target.result);
    reader.onerror = () => setError("Could not read that PEM file.");
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) readPemFile(e.dataTransfer.files[0]);
  };

  const canSubmit = () => {
    if (!host.trim()) return false;
    if (authMethod === "key") return !!pemContent && (!needsPassphrase || !!passphrase);
    return !!password;
  };

  const handleConnect = async (e) => {
    e?.preventDefault();
    if (!canSubmit()) return;
    setLoading(true);
    setError("");
    const creds = {
      host: host.trim(),
      port: port.trim() || "22",
      username: username.trim(),
      authMethod,
      pemKey: authMethod === "key" ? pemContent : undefined,
      passphrase: authMethod === "key" ? passphrase : undefined,
      password: authMethod === "password" ? password : undefined,
    };
    try {
      const { data } = await axios.post("/api/system/discover", creds);
      // Surface the creds so the dashboard can re-scan without re-prompting.
      onConnected(data, creds);
    } catch (err) {
      const code = err.response?.data?.error;
      const msg = err.response?.data?.message || "Connection failed. Please check the details and try again.";
      if (code === "PASSPHRASE_REQUIRED" || code === "BAD_PASSPHRASE") {
        setNeedsPassphrase(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="orb-1 opacity-50" />
      <div className="orb-2 opacity-50" />
      <div className="absolute inset-0 dotted-grid pointer-events-none opacity-40" />

      {/* top-right identity / sign out */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-3">
        {currentUser?.username && (
          <span className="text-xs text-slate-400 hidden sm:block">
            Signed in as <strong className="text-slate-200">{currentUser.username}</strong>
          </span>
        )}
        <Link
          to="/login"
          onClick={() => localStorage.removeItem("token")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30 mb-4">
            <Server className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Connect to a server</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
            Provide SSH access and we'll automatically discover everything running on it. Nothing is loaded until you connect.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleConnect}
          className="rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-2xl p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/40"
        >
          {/* Host + port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Public IP / Domain</label>
              <input
                autoFocus
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. 54.201.14.9"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Port</label>
              <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="22" className={inputClass} />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Username <span className="text-slate-600 normal-case font-medium">— optional, defaults to ubuntu</span>
            </label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ubuntu" className={inputClass} />
          </div>

          {/* Auth method toggle */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authentication</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/5">
              {[
                { id: "key", label: "PEM Key", icon: Key },
                { id: "password", label: "Password", icon: Lock },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = authMethod === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => { setAuthMethod(opt.id); setError(""); }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                      active ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25" : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key auth */}
          {authMethod === "key" && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center px-4 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition ${
                  dragging
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : pemFileName
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 hover:border-indigo-500/30 bg-white/[0.01] hover:bg-white/[0.03]"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pem,.key,.txt,*" onChange={(e) => readPemFile(e.target.files[0])} className="hidden" />
                {pemFileName ? <FileKey className="text-emerald-400 mb-2" size={26} /> : <Key className="text-slate-500 mb-2" size={26} />}
                <span className="text-sm font-semibold text-slate-200 text-center break-all px-2">
                  {pemFileName || "Drop your .pem key or click to browse"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Private key stays in memory for this scan only</span>
              </div>

              {needsPassphrase && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={12} /> Key passphrase required
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter the private key passphrase"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* Password auth */}
          {authMethod === "password" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SSH Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit() || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Connecting & scanning…</span>
              </>
            ) : (
              <>
                <span>Connect & Discover</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Terminal size={12} />
              <span>Running read-only discovery over SSH — this can take up to a minute.</span>
            </div>
          )}
        </form>

        <div className="flex items-center justify-center gap-2 mt-5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500/70" />
          <span>Credentials are used only to run this scan and are never stored.</span>
        </div>
      </div>
    </div>
  );
}
