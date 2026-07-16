import { useState } from "react";
import { Activity, Package, Search, Boxes } from "lucide-react";
import { Card, StateDot, Expandable, KeyVal, EmptyState } from "./ui.jsx";

export default function ServicesTab({ data }) {
  const d = data.discovery;
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("running"); // running | all | inactive | failed

  const match = (s) => {
    if (q && !(`${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (scope === "running") return s.active === "active";
    if (scope === "inactive") return s.active !== "active" && s.active !== "failed";
    if (scope === "failed") return s.active === "failed" || s.sub === "failed";
    return true;
  };
  const services = d.services.filter(match);

  const counts = {
    running: d.services.filter((s) => s.active === "active").length,
    inactive: d.services.filter((s) => s.active !== "active" && s.active !== "failed").length,
    failed: d.services.filter((s) => s.active === "failed" || s.sub === "failed").length,
    all: d.services.length,
  };

  const stateFor = (s) => (s.active === "active" ? "running" : s.active === "failed" ? "failed" : "inactive");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Services & packages</h1>
        <p className="text-sm text-slate-400 mt-1">Installed systemd units and the package footprint discovered on the host.</p>
      </div>

      {/* Package summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4"><div className="flex items-center gap-3"><Package size={18} className="text-indigo-400" /><div><div className="text-xl font-extrabold text-white">{d.packages.count ?? "—"}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{d.packages.manager} packages</div></div></div></Card>
        <Card className="!p-4"><div className="flex items-center gap-3"><Activity size={18} className="text-emerald-400" /><div><div className="text-xl font-extrabold text-white">{counts.running}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active services</div></div></div></Card>
        <Card className="!p-4"><div className="flex items-center gap-3"><Boxes size={18} className="text-sky-400" /><div><div className="text-xl font-extrabold text-white">{d.packages.upgradable ?? "—"}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Updates pending</div></div></div></Card>
        <Card className="!p-4"><div className="flex items-center gap-3"><Activity size={18} className="text-red-400" /><div><div className="text-xl font-extrabold text-white">{counts.failed}</div><div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Failed units</div></div></div></Card>
      </div>

      <Card
        title="Systemd services"
        icon={Activity}
        subtitle="Essential (enabled at boot) vs optional; running vs stopped"
        right={
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="w-44 bg-white/[0.03] border border-white/8 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/30"
            />
          </div>
        }
      >
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[
            ["running", "Running", counts.running],
            ["inactive", "Stopped", counts.inactive],
            ["failed", "Failed", counts.failed],
            ["all", "All", counts.all],
          ].map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                scope === id ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/25" : "text-slate-400 border-white/5 bg-white/[0.02] hover:text-slate-200"
              }`}
            >
              {label} <span className="text-slate-500 ml-1">{n}</span>
            </button>
          ))}
        </div>

        {services.length === 0 ? (
          <EmptyState icon={Activity} title="No services match" hint="Try a different filter or clear the search." />
        ) : (
          <div className="space-y-2">
            {services.slice(0, 80).map((s) => (
              <Expandable
                key={s.unit}
                header={
                  <>
                    <StateDot state={stateFor(s)} label="" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                      {s.description && <div className="text-[11px] text-slate-500 truncate">{s.description}</div>}
                    </div>
                  </>
                }
                badge={
                  s.enabled === "enabled"
                    ? <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">Essential</span>
                    : <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-white/[0.03] border border-white/8 px-2 py-0.5 rounded">Optional</span>
                }
              >
                <div className="grid grid-cols-2 gap-x-6">
                  <KeyVal label="Unit" value={s.unit} mono />
                  <KeyVal label="Load state" value={s.load} />
                  <KeyVal label="Active state" value={s.active} />
                  <KeyVal label="Sub state" value={s.sub} />
                  <KeyVal label="Start at boot" value={s.enabled || "—"} />
                </div>
              </Expandable>
            ))}
            {services.length > 80 && (
              <p className="text-[11px] text-slate-500 text-center pt-2">Showing first 80 of {services.length} matching units.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
