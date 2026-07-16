import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Lightbulb, Activity, Gauge, Network, Boxes, Globe,
  LogOut, RefreshCw, Server, ChevronLeft, Loader2
} from "lucide-react";
import ConnectScreen from "../components/connect/ConnectScreen.jsx";
import OverviewTab from "../components/dashboard/OverviewTab.jsx";
import InsightsTab from "../components/dashboard/InsightsTab.jsx";
import ServicesTab from "../components/dashboard/ServicesTab.jsx";
import ProcessesTab from "../components/dashboard/ProcessesTab.jsx";
import NetworkTab from "../components/dashboard/NetworkTab.jsx";
import ContainersTab from "../components/dashboard/ContainersTab.jsx";
import WebTab from "../components/dashboard/WebTab.jsx";
import { STATUS } from "../components/dashboard/ui.jsx";

const NAV = [
  { id: "Overview", icon: LayoutDashboard, component: OverviewTab },
  { id: "Insights", icon: Lightbulb, component: InsightsTab },
  { id: "Services", icon: Activity, component: ServicesTab },
  { id: "Processes", icon: Gauge, component: ProcessesTab },
  { id: "Network", icon: Network, component: NetworkTab },
  { id: "Containers", icon: Boxes, component: ContainersTab },
  { id: "Web & Data", icon: Globe, component: WebTab },
];

export default function Dashboard() {
  const [connection, setConnection] = useState(null); // full discover payload
  const [lastCreds, setLastCreds] = useState(null); // creds used, for re-scan
  const [activeTab, setActiveTab] = useState("Overview");
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: "", email: "" });

  useEffect(() => {
    axios.get("/api/auth/me").then((r) => setCurrentUser(r.data)).catch(() => {});
  }, []);

  const handleConnected = (payload, creds) => {
    setConnection(payload);
    if (creds) setLastCreds(creds);
    setActiveTab("Overview");
  };

  const handleRefresh = async () => {
    if (!lastCreds) return;
    setRefreshing(true);
    try {
      const { data } = await axios.post("/api/system/discover", lastCreds);
      setConnection(data);
    } catch (_) {
      // A transient re-scan failure shouldn't wipe the current view.
    } finally {
      setRefreshing(false);
    }
  };

  const disconnect = () => {
    setConnection(null);
    setLastCreds(null);
  };

  // Not connected → show only the connect gate. No server data anywhere yet.
  if (!connection) {
    return <ConnectScreen onConnected={handleConnected} currentUser={currentUser} />;
  }

  const ActiveComponent = NAV.find((n) => n.id === activeTab)?.component || OverviewTab;
  const sev = connection.summary.bySeverity;
  const health = sev.critical ? "critical" : sev.high ? "high" : sev.medium ? "medium" : "good";
  const scannedAgo = new Date(connection.scannedAt).toLocaleTimeString();

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      <div className="orb-1 opacity-40" />
      <div className="orb-2 opacity-40" />
      <div className="absolute inset-0 dotted-grid pointer-events-none opacity-40" />

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-slate-950/50 backdrop-blur-2xl relative z-10 p-5 justify-between">
        <div className="space-y-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
              <Server className="text-white" size={17} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">ServerScope</span>
          </div>

          {/* Connected host chip */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS[health].color }} />
              <span className="text-xs font-bold text-white truncate">{connection.discovery.overview.hostname || connection.connectedTo.host}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">{connection.connectedTo.username}@{connection.connectedTo.host}</p>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const badge = item.id === "Insights" && connection.summary.actionable > 0 ? connection.summary.actionable : null;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    active ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1 text-left">{item.id}</span>
                  {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">{badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2">
          <button onClick={disconnect} className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-white/5 transition">
            <ChevronLeft size={16} /> Disconnect
          </button>
          <Link to="/login" onClick={() => localStorage.removeItem("token")} className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-white/5 hover:border-red-500/20 transition">
            <LogOut size={16} /> Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <header className="flex h-16 items-center justify-between px-5 md:px-8 border-b border-white/5 bg-slate-950/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="md:hidden bg-white/[0.03] border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {NAV.map((n) => <option key={n.id} value={n.id} className="bg-slate-900">{n.id}</option>)}
            </select>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Scanned {scannedAgo}{connection.durationMs ? ` · ${(connection.durationMs / 1000).toFixed(1)}s` : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || !lastCreds}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-slate-300 transition disabled:opacity-40"
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span className="hidden sm:inline">{refreshing ? "Re-scanning…" : "Re-scan"}</span>
            </button>
            <Link to="/login" onClick={() => localStorage.removeItem("token")} className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-slate-400">
              <LogOut size={16} />
            </Link>
          </div>
        </header>

        <div className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
          <ActiveComponent data={connection} />
        </div>
      </main>
    </div>
  );
}
