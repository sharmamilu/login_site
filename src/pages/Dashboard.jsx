import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  BarChart3,
  Cpu,
  Layers,
  Settings,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  Globe,
  Database,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Activity,
  Terminal,
  Key,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [systemStats, setSystemStats] = useState({
    cpuLoad: "0.0%",
    ramUsage: "0.0%",
    uptime: "0.0 hrs",
    totalUsers: 0,
    dbStatus: "Checking...",
    platform: "Loading..."
  });
  const [cpuHistory, setCpuHistory] = useState([10, 15, 12, 18, 14, 22, 20, 25, 22, 24]);
  const [ramHistory, setRamHistory] = useState([45, 46, 45, 47, 48, 48, 49, 50, 48, 49]);
  const [usersList, setUsersList] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    username: "Milan",
    email: "milan@milancodes.shop"
  });

  // System diagnostics state
  const [sshHost, setSshHost] = useState("3.80.37.65");
  const [sshUsername, setSshUsername] = useState("ubuntu");
  const [pemKeyContent, setPemKeyContent] = useState("");
  const [pemFileName, setPemFileName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchMe();
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  const triggerSshDiagnostics = async (keyContent, passVal) => {
    setDiagnosticsLoading(true);
    setDiagnosticsError("");
    try {
      const response = await axios.post("/api/system/ssh-diagnose", {
        pemKey: keyContent,
        passphrase: passVal,
        host: sshHost,
        username: sshUsername
      });
      if (response.data && response.data.success) {
        setDiagnosticsResult(response.data);
        setShowPassphrasePrompt(false);
      } else {
        setDiagnosticsError("Could not retrieve active system port logs.");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.passphraseRequired) {
        setShowPassphrasePrompt(true);
        setDiagnosticsError("Passphrase Required: This private key is encrypted. Please enter the passphrase below.");
      } else {
        const msg = err.response?.data?.message || "Failed to establish SSH connection. Please verify key credentials.";
        setDiagnosticsError(msg);
      }
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handlePemUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPemFileName(file.name);
    setDiagnosticsError("");
    setDiagnosticsResult(null);
    setShowPassphrasePrompt(false);
    setPassphrase("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setPemKeyContent(content);
      triggerSshDiagnostics(content, "");
    };
    reader.onerror = () => {
      setDiagnosticsError("Failed to read PEM file contents.");
    };
    reader.readAsText(file);
  };

  const handlePassphraseSubmit = (e) => {
    e.preventDefault();
    if (!pemKeyContent) return;
    triggerSshDiagnostics(pemKeyContent, passphrase);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/system/stats");
        setSystemStats(response.data);
        
        // Track stats history for SVG analytics charts
        const newCpu = parseFloat(response.data.cpuLoad) || 0;
        const newRam = parseFloat(response.data.ramUsage) || 0;
        setCpuHistory(prev => [...prev.slice(1), newCpu]);
        setRamHistory(prev => [...prev.slice(1), newRam]);

        // Fetch real user list from database
        const usersResponse = await axios.get("/api/system/users");
        setUsersList(usersResponse.data);
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSvgPath = (data, width = 500, height = 180) => {
    if (data.length === 0) return "";
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - (val / 100) * height;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  const getAreaPath = (data, width = 500, height = 180) => {
    if (data.length === 0) return "";
    const linePath = getSvgPath(data, width, height);
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  };

  // Mock deployments data
  const deployments = [
    {
      id: "dep_98a7c",
      project: "Aura Landing Page",
      branch: "main",
      status: "Active",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      time: "2 mins ago",
      url: "aura-landing.auracloud.app",
    },
    {
      id: "dep_23b5d",
      project: "Customer Dashboard API",
      branch: "dev-v2",
      status: "Deploying",
      statusColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse",
      time: "Just now",
      url: "api-dev.auracloud.app",
    },
    {
      id: "dep_81f2a",
      project: "Authentication Service",
      branch: "main",
      status: "Failed",
      statusColor: "text-red-400 bg-red-500/10 border-red-500/20",
      time: "1 hour ago",
      url: "auth.auracloud.app",
    },
    {
      id: "dep_45c9e",
      project: "Billing Webhook",
      branch: "main",
      status: "Active",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      time: "3 hours ago",
      url: "billing.auracloud.app",
    },
  ];

  // Mock stats
  const stats = [
    {
      title: "CPU Load",
      value: systemStats.cpuLoad,
      trend: "Real-time",
      icon: Cpu,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10",
      progress: systemStats.cpuLoad,
    },
    {
      title: "RAM Usage",
      value: systemStats.ramUsage,
      trend: "Memory",
      icon: Activity,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/10",
      progress: systemStats.ramUsage,
    },
    {
      title: "Registered Users",
      value: systemStats.totalUsers.toString(),
      trend: "Database",
      icon: Globe,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
      subtext: `Total Accounts`,
    },
    {
      title: "Database Status",
      value: systemStats.dbStatus,
      trend: "MongoDB",
      icon: Database,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/10",
      subtext: systemStats.dbName && systemStats.dbName !== 'none' ? `DB: ${systemStats.dbName} (${systemStats.numCollections} collections, ${systemStats.dbDataSize})` : `Status: ${systemStats.dbStatus}`,
    },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans bg-slate-950">
      {/* Background glowing morphing orbs */}
      <div className="orb-1 opacity-60" />
      <div className="orb-2 opacity-60" />
      <div className="orb-3 opacity-40" />

      {/* Dotted Grid overlay */}
      <div className="absolute inset-0 dotted-grid pointer-events-none opacity-50" />

      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl relative z-10 p-6 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25">
              <svg
                className="text-white w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
              Aura Cloud
            </span>
          </div>

          {/* Navigation items */}
          <nav className="space-y-1">
            {[
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Deployments", icon: Layers },
              { name: "Analytics", icon: BarChart3 },
              { name: "Settings", icon: Settings },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === item.name
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <IconComp size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-extrabold text-white shadow-md shadow-indigo-500/15">
              {getInitials(currentUser.username)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{currentUser.username}</h4>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 hover:border-red-500/20 bg-white/[0.01] hover:bg-red-500/5 text-sm font-semibold text-slate-400 hover:text-red-400 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-6 md:px-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            {/* Search bar */}
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search deployments, keys, databases..."
                className="w-full bg-white/[0.03] border border-white/5 focus:border-indigo-500/30 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Live Server Platform Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform: <strong className="text-slate-200 font-bold">{systemStats.platform}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto sm:ml-0">
            {/* Notification trigger */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition duration-200 cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </button>

            {/* Mobile LogOut Link */}
            <Link
              to="/login"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={18} />
            </Link>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {activeTab === "Dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>{getGreeting()}, {currentUser.username.split(' ')[0]}</span>
                    <span className="animate-wave origin-[70% 70%] inline-block">👋</span>
                  </h1>
                  <p className="text-slate-400 mt-1 text-sm">
                    Here's a live overview of your Aura Cloud nodes and cluster operations.
                  </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/20 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer">
                  <span>New Deployment</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                  const IconComp = stat.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-5 hover:border-white/10 transition-all duration-300 hover:scale-[1.01] hover:bg-slate-900/45 flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2.5 rounded-xl border border-white/5 ${stat.color}`}>
                            <IconComp size={18} />
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md text-indigo-400 bg-indigo-500/5 border border-indigo-500/10">
                            {stat.trend}
                          </span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                          {stat.title}
                        </p>
                      </div>
                      
                      {/* Visual Progress Bar for CPU/RAM */}
                      {stat.progress && (
                        <div className="mt-4 space-y-1.5">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-700 ease-out" 
                              style={{ width: stat.progress }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Pulsing Dot Status for MongoDB */}
                      {stat.title === "Database Status" && (
                        <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-400 font-medium bg-white/[0.02] border border-white/5 rounded-xl p-2">
                          <span className={`h-2 w-2 rounded-full ${systemStats.dbStatus === 'Optimal' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                          <span>DB Engine: <strong className="text-emerald-400">Online</strong></span>
                        </div>
                      )}

                      {/* Subtext info for Users */}
                      {stat.title === "Registered Users" && (
                        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-white/[0.02] border border-white/5 rounded-xl p-2">
                          <span>Total Users:</span>
                          <span className="text-white font-bold">{systemStats.totalUsers}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registered Users Table Card */}
                <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Registered Accounts</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time user profiles from MongoDB</p>
                    </div>
                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer">
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                          <th className="pb-3">Username</th>
                          <th className="pb-3">Email Address</th>
                          <th className="pb-3">User ID</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-8 text-center text-xs text-slate-500">
                              No registered user profiles found in database.
                            </td>
                          </tr>
                        ) : (
                          usersList.map((user, i) => (
                            <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                              <td className="py-4 pr-3 font-semibold text-white max-w-[150px] truncate">
                                {user.username}
                              </td>
                              <td className="py-4 pr-3 text-xs text-slate-400">
                                {user.email}
                              </td>
                              <td className="py-4 pr-3 text-xs font-mono text-slate-500">
                                {user._id}
                              </td>
                              <td className="py-4 text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 ml-auto">
                                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions / Integration Card */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Security & API Keys</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage credentials</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition duration-200">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Default API Token</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Expires in 28 days</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-300 hover:text-white transition duration-200 cursor-pointer">
                        Rotate
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition duration-200">
                      <div>
                        <h4 className="text-sm font-semibold text-white">MFA Authentication</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Secure your dashboard login</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition duration-200">
                      <div>
                        <h4 className="text-sm font-semibold text-white">SSH Deploy Keys</h4>
                        <p className="text-xs text-slate-500 mt-0.5">2 keys configured</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-300 hover:text-white transition duration-200 cursor-pointer">
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Resource usage alert bar */}
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Total Cluster RAM</span>
                      <span className="text-indigo-400 font-bold">{systemStats.ramUsage}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: systemStats.ramUsage }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Analytics" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">System Analytics</h1>
                <p className="text-slate-400 mt-1 text-sm">Real-time performance graphs and logs from your EC2 node.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CPU Chart */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">CPU Performance</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time load average over the last minute</p>
                    </div>
                    <span className="text-2xl font-black text-indigo-400">{systemStats.cpuLoad}</span>
                  </div>

                  <div className="relative h-48 w-full bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden p-4">
                    <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="45" x2="500" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="135" x2="500" y2="135" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Area Fill */}
                      <path d={getAreaPath(cpuHistory)} fill="url(#cpuGradient)" />
                      
                      {/* Stroke Line */}
                      <path d={getSvgPath(cpuHistory)} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* RAM Chart */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Memory Allocation</h3>
                      <p className="text-xs text-slate-500 mt-0.5">RAM consumption percentage</p>
                    </div>
                    <span className="text-2xl font-black text-blue-400">{systemStats.ramUsage}</span>
                  </div>

                  <div className="relative h-48 w-full bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden p-4">
                    <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="45" x2="500" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="135" x2="500" y2="135" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Area Fill */}
                      <path d={getAreaPath(ramHistory)} fill="url(#ramGradient)" />
                      
                      {/* Stroke Line */}
                      <path d={getSvgPath(ramHistory)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Server Spec Details Grid */}
              <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">EC2 Instance Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specifications of the hosting server environment</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Uptime</span>
                    <h4 className="text-lg font-bold text-white mt-1">{systemStats.uptime}</h4>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Platform OS</span>
                    <h4 className="text-lg font-bold text-white mt-1">{systemStats.platform}</h4>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">MongoDB Port</span>
                    <h4 className="text-lg font-bold text-white mt-1">27017 (Secured)</h4>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Connection Origin</span>
                    <h4 className="text-lg font-bold text-white mt-1">Nginx Proxy</h4>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Deployments" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Deployment Pipelines</h1>
                <p className="text-slate-400 mt-1 text-sm">Monitor continuous integration tasks and deployment pipeline status.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pipeline Status */}
                <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">CI/CD Run History</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Automated GitHub Actions logs</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      Pipeline Passing
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { job: "Build React Static Bundle", step: "npx vite build", status: "Completed", time: "2 mins ago" },
                      { job: "Push Assets to EC2 via SSH", step: "rsync -r dist/ ubuntu@3.80.37.65:/var/www/html", status: "Completed", time: "3 mins ago" },
                      { job: "Restart Node Server", step: "pm2 reload all", status: "Completed", time: "3 mins ago" },
                      { job: "Nginx Reload & Cache Purge", step: "sudo systemctl reload nginx", status: "Completed", time: "4 mins ago" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition duration-200">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                          <div>
                            <h4 className="text-sm font-semibold text-white">{step.job}</h4>
                            <code className="text-[11px] text-slate-500 font-mono mt-0.5 block">{step.step}</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-emerald-400 font-semibold">{step.status}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Git Repository Info */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Repository Config</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Connected Git triggers</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Repository</span>
                      <h4 className="text-sm font-bold text-white mt-1 truncate">sharmamilu/login_site</h4>
                    </div>

                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Deployment Branch</span>
                      <code className="text-xs text-indigo-400 font-mono mt-1 block">main</code>
                    </div>

                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">CI Trigger</span>
                      <h4 className="text-sm font-bold text-slate-300 mt-1">git push origin main</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & Configurations</h1>
                <p className="text-slate-400 mt-1 text-sm">Review environment configurations, SSL certificate state, and database authorization parameters.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cryptographic Encryption Details */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-white/5 bg-indigo-500/10 text-indigo-400">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Payload Encryption</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Symmetric AES-256 security parameters</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <div>
                        <h4 className="text-sm font-semibold text-white">AES-256 Encryption</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Active in transit</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                        Enabled
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Encryption secret key</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Loaded from environment file</p>
                      </div>
                      <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                        ••••••••••••••••
                      </span>
                    </div>
                  </div>
                </div>

                {/* MongoDB Cluster Config */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-white/5 bg-amber-500/10 text-amber-400">
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Database Authentication</h3>
                      <p className="text-xs text-slate-500 mt-0.5">MongoDB security parameters</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <div>
                        <h4 className="text-sm font-semibold text-white">MongoDB Auth Mode</h4>
                        <p className="text-xs text-slate-500 mt-0.5">mongod.conf authorization enabled</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                        Hardened
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Local/Remote Failover</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Dynamic fallback on localhost</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Ports & Services Diagnostics */}
                <div className="md:col-span-2 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl border border-white/5 bg-indigo-500/10 text-indigo-400">
                        <Terminal size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">System Ports & Services Diagnostics</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Upload server private key to scan active ports and background services automatically.</p>
                      </div>
                    </div>
                  </div>

                  {/* Host IP and Username Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Host Server IP / Domain</label>
                      <input 
                        type="text" 
                        value={sshHost} 
                        onChange={(e) => setSshHost(e.target.value)} 
                        placeholder="e.g. 3.80.37.65" 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SSH Username</label>
                      <input 
                        type="text" 
                        value={sshUsername} 
                        onChange={(e) => setSshUsername(e.target.value)} 
                        placeholder="e.g. ubuntu" 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* PEM File Dropzone */}
                  <div 
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-indigo-500/30 bg-white/[0.01] hover:bg-white/[0.02] rounded-2xl transition duration-200 relative group cursor-pointer"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept=".pem,.txt,*"
                      onChange={handlePemUpload}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <Key className="text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" size={32} />
                    <span className="text-sm font-semibold text-slate-300">
                      {pemFileName ? `Selected: ${pemFileName}` : "Drag and drop or click to upload your .pem key file"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">AWS EC2 private key file</span>
                  </div>

                  {/* Manual scan execution button if key is uploaded */}
                  {pemKeyContent && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => triggerSshDiagnostics(pemKeyContent, passphrase)}
                        disabled={diagnosticsLoading}
                        className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw size={14} className={diagnosticsLoading ? "animate-spin" : ""} />
                        <span>Execute Server Scan</span>
                      </button>
                    </div>
                  )}

                  {/* Passphrase prompt */}
                  {showPassphrasePrompt && (
                    <form onSubmit={handlePassphraseSubmit} className="space-y-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 animate-fade-in">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={14} />
                        <span>Private Key Passphrase Required</span>
                      </div>
                      <div className="flex gap-3">
                        <input 
                          type="password"
                          value={passphrase}
                          onChange={(e) => setPassphrase(e.target.value)}
                          placeholder="Enter PEM passphrase"
                          className="flex-1 bg-white/[0.02] border border-white/10 focus:border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                        />
                        <button
                          type="submit"
                          disabled={diagnosticsLoading}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition disabled:opacity-50 cursor-pointer"
                        >
                          Decrypt & Scan
                        </button>
                      </div>
                    </form>
                  )}

                  {diagnosticsLoading && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Loader2 className="animate-spin text-indigo-400" size={32} />
                      <span className="text-xs text-slate-400 font-medium">Scanning server ports...</span>
                    </div>
                  )}

                  {diagnosticsError && !showPassphrasePrompt && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                      <AlertCircle size={16} />
                      <span>{diagnosticsError}</span>
                    </div>
                  )}

                  {/* Diagnostic Results Section */}
                  {diagnosticsResult && !diagnosticsLoading && (
                    <div className="space-y-6 border-t border-white/5 pt-6 animate-fade-in">
                      
                      {/* Infrastructure Design Validation */}
                      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Infrastructure Design Validation</h4>
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/10 font-bold uppercase">
                            {diagnosticsResult.simulated ? "Simulated Scan" : "Live Server Scan"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Database Card */}
                          <div className={`p-4 rounded-xl border ${diagnosticsResult.databaseSeparated ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'} flex items-start gap-3`}>
                            <div className={`p-2 rounded-lg ${diagnosticsResult.databaseSeparated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              <Database size={18} />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-white">Database Layer</h5>
                              <p className="text-[11px] text-slate-400">{diagnosticsResult.databaseDetails}</p>
                              <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${diagnosticsResult.databaseSeparated ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                {diagnosticsResult.databaseSeparated ? "✓ Decoupled / Cloud" : "⚠️ Local / Colocated"}
                              </span>
                            </div>
                          </div>

                          {/* Frontend Card */}
                          <div className={`p-4 rounded-xl border ${diagnosticsResult.frontendSeparated ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'} flex items-start gap-3`}>
                            <div className={`p-2 rounded-lg ${diagnosticsResult.frontendSeparated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              <Globe size={18} />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-white">Frontend Presentation</h5>
                              <p className="text-[11px] text-slate-400">{diagnosticsResult.frontendDetails}</p>
                              <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${diagnosticsResult.frontendSeparated ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                {diagnosticsResult.frontendSeparated ? "✓ Decoupled / CDN" : "⚠️ Local / Colocated"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Overall Infrastructure Quality Banner */}
                        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${diagnosticsResult.databaseSeparated && diagnosticsResult.frontendSeparated ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
                          <AlertCircle size={16} />
                          <span>
                            {diagnosticsResult.databaseSeparated && diagnosticsResult.frontendSeparated 
                              ? "🔥 Perfect DevOps Setup: Presentation and database layers are fully decoupled from your compute server!" 
                              : "⚠️ Recommendation: Keep separating your infrastructure layers. Keep databases and static files off the compute server to maximize performance."}
                          </span>
                        </div>
                      </div>

                      {/* Server Resource Usage Metrics */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Host Server Resource Metrics</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* CPU */}
                          <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-semibold">CPU Usage</span>
                              <Cpu size={14} className="text-indigo-400" />
                            </div>
                            <div className="text-lg font-extrabold text-white">{diagnosticsResult.metrics?.cpuUsage || "0%"}</div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: diagnosticsResult.metrics?.cpuUsage || "0%" }}
                              />
                            </div>
                          </div>

                          {/* RAM */}
                          <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-semibold">RAM Usage</span>
                              <Activity size={14} className="text-indigo-400" />
                            </div>
                            <div className="text-lg font-extrabold text-white">{diagnosticsResult.metrics?.ramUsage || "0%"}</div>
                            <div className="text-[9px] text-slate-500 truncate font-semibold">{diagnosticsResult.metrics?.ramDetail}</div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: diagnosticsResult.metrics?.ramUsage || "0%" }}
                              />
                            </div>
                          </div>

                          {/* Disk */}
                          <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-semibold">Storage</span>
                              <Layers size={14} className="text-indigo-400" />
                            </div>
                            <div className="text-lg font-extrabold text-white">{diagnosticsResult.metrics?.diskUsage || "0%"}</div>
                            <div className="text-[9px] text-slate-500 truncate font-semibold">{diagnosticsResult.metrics?.diskDetail}</div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: diagnosticsResult.metrics?.diskUsage || "0%" }}
                              />
                            </div>
                          </div>

                          {/* Uptime */}
                          <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-semibold">Server Uptime</span>
                              <Terminal size={14} className="text-indigo-400" />
                            </div>
                            <div className="text-xs font-extrabold text-white pt-1 truncate font-semibold">{diagnosticsResult.metrics?.sysUptime || "Unknown"}</div>
                            <span className="text-[9px] text-slate-500">Continuous execution</span>
                          </div>
                        </div>
                      </div>

                      {/* Server File Capacity & Memory details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project directory and swap file status */}
                        <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storage Capacity & VM Status</h4>
                          
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-xs text-slate-400">Project Directory Size</span>
                            <span className="text-xs text-white font-bold">{diagnosticsResult.projectSize || "Unknown"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2">
                            <span className="text-xs text-slate-400">Virtual Swap File</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${diagnosticsResult.swapSize > 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/10' : 'text-rose-400 bg-rose-500/10 border border-rose-500/10 animate-pulse'}`}>
                              {diagnosticsResult.swapSize > 0 ? `Active (${diagnosticsResult.swapSize} MB)` : "Inactive (OOM Crash Risk)"}
                            </span>
                          </div>
                        </div>

                        {/* Docker disk space usage */}
                        <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Docker Space Allocation (docker system df)</h4>
                          {diagnosticsResult.dockerDf && diagnosticsResult.dockerDf.length > 0 ? (
                            <div className="space-y-2">
                              {diagnosticsResult.dockerDf.map((df, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.03] last:border-0">
                                  <span className="text-slate-400">{df.type}</span>
                                  <span className="text-white font-bold">{df.size} ({df.count} total)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">No Docker storage information available.</div>
                          )}
                        </div>
                      </div>

                      {/* Actionable DevOps Recommendations */}
                      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-indigo-400">Actionable Infrastructure Optimizations</h4>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold border ${diagnosticsResult.recommendations?.length > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/10' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10'}`}>
                            {diagnosticsResult.recommendations?.length > 0 ? `${diagnosticsResult.recommendations.length} SUGGESTIONS` : "FULLY OPTIMIZED"}
                          </span>
                        </div>

                        {diagnosticsResult.recommendations && diagnosticsResult.recommendations.length > 0 ? (
                          <div className="space-y-4">
                            {diagnosticsResult.recommendations.map((rec, idx) => (
                              <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    rec.priority === 'high' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/10' : 
                                    rec.priority === 'medium' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/10' : 
                                    'text-sky-400 bg-sky-500/10 border border-sky-500/10'
                                  }`}>
                                    {rec.priority} Priority
                                  </span>
                                  <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{rec.description}</p>
                                
                                <div className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[10px] text-indigo-300 flex items-center justify-between group">
                                  <span className="truncate pr-4 select-all">{rec.fixCmd}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(rec.fixCmd);
                                      alert("Copied command to clipboard! Paste it into your EC2 terminal.");
                                    }}
                                    className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white transition cursor-pointer select-none active:scale-95 shrink-0"
                                  >
                                    Copy Command
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
                            <span>🎉 Congratulations! Your host server config is fully optimized with swap memory active and no legacy containers.</span>
                          </div>
                        )}
                      </div>

                      {/* Database Inventory (Mongoose Details) */}
                      {diagnosticsResult.dbMetrics && diagnosticsResult.dbMetrics.connected && (
                        <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Database Statistics</h4>
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/10 font-bold uppercase">
                              {diagnosticsResult.dbMetrics.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/[0.03] space-y-0.5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">Collections</span>
                              <span className="text-sm font-extrabold text-white">{diagnosticsResult.dbMetrics.numCollections}</span>
                            </div>
                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/[0.03] space-y-0.5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">Documents</span>
                              <span className="text-sm font-extrabold text-white">{diagnosticsResult.dbMetrics.objects}</span>
                            </div>
                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/[0.03] space-y-0.5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">Data Size</span>
                              <span className="text-sm font-extrabold text-white">{diagnosticsResult.dbMetrics.dataSize}</span>
                            </div>
                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/[0.03] space-y-0.5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">Registered Users</span>
                              <span className="text-sm font-extrabold text-white">{diagnosticsResult.dbMetrics.totalUsers}</span>
                            </div>
                          </div>

                          {diagnosticsResult.dbMetrics.collections && diagnosticsResult.dbMetrics.collections.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">Discovered Collections</span>
                              <div className="flex flex-wrap gap-2">
                                {diagnosticsResult.dbMetrics.collections.map((col, idx) => (
                                  <span key={idx} className="text-[10px] text-indigo-300 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-white/5 font-semibold">
                                    📁 {col}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Running Docker Containers */}
                      {diagnosticsResult.dockerContainers && diagnosticsResult.dockerContainers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Docker Containers</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {diagnosticsResult.dockerContainers.map((container, i) => (
                              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-extrabold text-indigo-400">
                                    🐳
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-white truncate max-w-[150px]">{container.name}</h5>
                                    <span className="text-[10px] text-slate-500 font-medium">Up since {container.uptime}</span>
                                  </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 uppercase tracking-wider">
                                  {container.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Discovered Listening Ports */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discovered Active Listening Ports & Services</h4>
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/10 font-bold">
                            {diagnosticsResult.parsedData.length} ACTIVE PORTS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {diagnosticsResult.parsedData.map((svc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-extrabold text-emerald-400">
                                  {svc.port}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-white">{svc.name}</h5>
                                  <span className="text-[10px] text-slate-500 font-medium">{svc.protocol} protocol</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 uppercase tracking-wider">
                                {svc.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nginx & SSL configurations */}
                <div className="md:col-span-2 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-white/5 bg-emerald-500/10 text-emerald-400">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Nginx Server & SSL Configuration</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Transport layer certificates details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">SSL Certificate</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-bold text-white">Let's Encrypt SSL</h4>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Target Domain</span>
                      <h4 className="text-sm font-bold text-white mt-1">milancodes.shop</h4>
                    </div>

                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Proxy Target</span>
                      <h4 className="text-sm font-bold text-white mt-1">127.0.0.1:5000</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
