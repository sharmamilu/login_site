import {
  Cpu, MemoryStick, HardDrive, Server, Globe, Database, Boxes,
  Network, ShieldCheck, Clock, Activity
} from "lucide-react";
import { Card, Meter, StatusBadge, STATUS, KeyVal, EmptyState } from "./ui.jsx";
import Topology from "./Topology.jsx";

const fmtGb = (mb) => (mb == null ? "—" : mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

function ScoreTile({ label, value, sub, icon: Icon, tone = "text-indigo-400 bg-indigo-500/10" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900/30 backdrop-blur-xl p-5 flex flex-col justify-between min-h-[128px]">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl border border-white/5 ${tone}`}><Icon size={16} /></div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-1 truncate">{sub}</div>}
      </div>
    </div>
  );
}

export default function OverviewTab({ data }) {
  const d = data.discovery;
  const o = d.overview;
  const rootDisk = d.disks.find((x) => x.mount === "/") || d.disks[0];
  const sev = data.summary.bySeverity;
  const healthTone =
    sev.critical ? STATUS.critical : sev.high ? STATUS.high : sev.medium ? STATUS.medium : STATUS.good;

  const runningServices = d.services.filter((s) => s.active === "active").length;
  const runningContainers = d.docker.installed ? d.docker.containers.filter((c) => c.state === "running").length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Host banner */}
      <div className="rounded-2xl border border-white/8 bg-slate-900/30 backdrop-blur-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Server className="text-white" size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-white tracking-tight truncate">
              {o.hostname || data.connectedTo.host}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {[o.os, o.arch, o.virtualization && `${o.virtualization} VM`].filter(Boolean).join(" · ") || "Linux host"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400"><Globe size={13} /> {o.publicIp || data.connectedTo.host}</span>
          <span className="flex items-center gap-1.5 text-slate-400"><Clock size={13} /> up {o.uptime || "—"}</span>
          <span className="flex items-center gap-1.5 text-slate-400"><Cpu size={13} /> {o.cores ?? "?"} vCPU</span>
          <StatusBadge status={healthTone === STATUS.good ? "good" : healthTone === STATUS.critical ? "critical" : healthTone === STATUS.high ? "high" : "medium"}>
            {data.summary.actionable === 0 ? "Healthy" : `${data.summary.actionable} finding${data.summary.actionable === 1 ? "" : "s"}`}
          </StatusBadge>
        </div>
      </div>

      {/* Score tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreTile icon={Activity} label="Running services" value={runningServices} sub={`${d.services.length} total units`} />
        <ScoreTile icon={Boxes} label="Containers" value={d.docker.installed ? `${runningContainers}/${d.docker.containers.length}` : "—"} sub={d.docker.installed ? "running / total" : "Docker not present"} tone="text-sky-400 bg-sky-500/10" />
        <ScoreTile icon={Database} label="Data stores" value={d.databases.length} sub={d.databases.map((x) => x.type).slice(0, 2).join(", ") || "none detected"} tone="text-emerald-400 bg-emerald-500/10" />
        <ScoreTile icon={Network} label="Listening ports" value={d.ports.length} sub={`${d.ports.filter((p) => p.public).length} public`} tone="text-amber-400 bg-amber-500/10" />
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="CPU" icon={Cpu} subtitle={o.cpuModel ? o.cpuModel.trim().slice(0, 40) : `${o.cores ?? "?"} cores`}>
          <Meter
            label="Utilization"
            value={d.cpu.usagePct != null ? Math.round(d.cpu.usagePct) : null}
            detail={d.cpu.load1 != null ? `load avg ${d.cpu.load1} / ${d.cpu.load5} / ${d.cpu.load15} · ${o.cores ?? "?"} cores` : undefined}
          />
        </Card>
        <Card title="Memory" icon={MemoryStick} accent="bg-sky-500/10 text-sky-400" subtitle={`${fmtGb(d.memory.totalMb)} total`}>
          <Meter
            label="RAM used"
            value={d.memory.usagePct != null ? Math.round(d.memory.usagePct) : null}
            detail={`${fmtGb(d.memory.usedMb)} used · ${fmtGb(d.memory.availableMb)} available${d.memory.swapTotalMb ? ` · swap ${fmtGb(d.memory.swapTotalMb)}` : " · no swap"}`}
          />
        </Card>
        <Card title="Disk" icon={HardDrive} accent="bg-emerald-500/10 text-emerald-400" subtitle={rootDisk ? rootDisk.mount : "root"}>
          {rootDisk ? (
            <Meter
              label="Storage used"
              value={rootDisk.usePct}
              detail={`${fmtGb(rootDisk.usedMb)} used · ${fmtGb(rootDisk.availMb)} free of ${fmtGb(rootDisk.sizeMb)}`}
            />
          ) : (
            <EmptyState title="No disk data" />
          )}
        </Card>
      </div>

      {/* Topology dependency graph */}
      <Card title="Service topology" subtitle="How traffic flows through the discovered stack" icon={Network}>
        <Topology data={d} />
      </Card>

      {/* Quick facts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="System" icon={Server}>
          <div className="space-y-0">
            <KeyVal label="Hostname" value={o.hostname} />
            <KeyVal label="Operating system" value={o.os} />
            <KeyVal label="Kernel" value={o.kernel} mono />
            <KeyVal label="Architecture" value={o.arch} />
            <KeyVal label="Virtualization" value={o.virtualization || "bare metal / unknown"} />
            <KeyVal label="Booted" value={o.booted} />
          </div>
        </Card>
        <Card title="Security posture" icon={ShieldCheck} accent="bg-emerald-500/10 text-emerald-400">
          <div className="space-y-0">
            <KeyVal label="Root SSH login" value={d.security.sshd.permitRootLogin || "default"} />
            <KeyVal label="Password auth" value={d.security.sshd.passwordAuthentication || "default"} />
            <KeyVal label="SSH port" value={d.security.sshd.port || "22"} />
            <KeyVal label="Host firewall" value={d.security.firewall} />
            <KeyVal label="Active sessions" value={d.security.sessions.length || 0} />
            <KeyVal label="Pending updates" value={d.packages.upgradable ?? "unknown"} />
          </div>
        </Card>
      </div>
    </div>
  );
}
