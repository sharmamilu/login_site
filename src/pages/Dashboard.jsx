import { useState } from "react";
import { Link } from "react-router-dom";
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
  Activity
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

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
      value: "28.4%",
      trend: "+2.1%",
      icon: Cpu,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10",
    },
    {
      title: "Active Connections",
      value: "14,809",
      trend: "+12.4%",
      icon: Activity,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/10",
    },
    {
      title: "Bandwidth Used",
      value: "842.1 GB",
      trend: "-4.3%",
      icon: Globe,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
    },
    {
      title: "Database Cluster",
      value: "99.98%",
      trend: "Optimal",
      icon: Database,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/10",
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
              JD
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">John Doe</h4>
              <p className="text-xs text-slate-500 truncate">john@company.com</p>
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
          {/* Search bar */}
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search deployments, keys, databases..."
              className="w-full bg-white/[0.03] border border-white/5 focus:border-indigo-500/30 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
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
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Dashboard
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Overview of cloud nodes, clusters, and active deployment stacks.
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
                  className="rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-5 hover:border-white/10 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl border border-white/5 ${stat.color}`}>
                      <IconComp size={18} />
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        stat.trend.startsWith("-")
                          ? "text-red-400 bg-red-500/5"
                          : stat.trend.startsWith("+")
                          ? "text-emerald-400 bg-emerald-500/5"
                          : "text-slate-400 bg-slate-500/5"
                      }`}
                    >
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{stat.value}</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    {stat.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deployments Table Card */}
            <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Recent Deployments</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Continuous integration logs</p>
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
                      <th className="pb-3">Project</th>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3 text-right">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                    {deployments.map((dep, i) => (
                      <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 pr-3 font-semibold text-white max-w-[150px] truncate">
                          {dep.project}
                        </td>
                        <td className="py-4 pr-3 text-xs font-semibold text-slate-500">
                          <code className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-md font-mono text-[10px]">
                            {dep.branch}
                          </code>
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${dep.statusColor}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {dep.status}
                          </span>
                        </td>
                        <td className="py-4 pr-3 text-xs text-slate-500">{dep.time}</td>
                        <td className="py-4 text-right">
                          <a
                            href={`https://${dep.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors font-semibold"
                          >
                            <span className="hidden sm:inline">{dep.url}</span>
                            <ExternalLink size={12} className="opacity-60" />
                          </a>
                        </td>
                      </tr>
                    ))}
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
                  <span className="text-indigo-400 font-bold">78%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
