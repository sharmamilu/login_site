import { useState } from "react";
import { Gauge, Cpu, MemoryStick } from "lucide-react";
import { Card, BarList, SERIES, EmptyState } from "./ui.jsx";

export default function ProcessesTab({ data }) {
  const d = data.discovery;
  const [sortBy, setSortBy] = useState("cpu");

  const procs = [...d.processes].sort((a, b) => b[sortBy] - a[sortBy]);
  const top = procs.slice(0, 10).map((p) => ({
    label: p.command.split(/\s/)[0].split("/").pop() || p.command,
    value: p[sortBy],
    color: p[sortBy] >= (sortBy === "cpu" ? 50 : 40) ? "#ef4444" : SERIES[0],
  }));

  const shortCmd = (c) => c.split(/\s/)[0].split("/").pop();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Active processes</h1>
        <p className="text-sm text-slate-400 mt-1">Top processes by resource use — spot runaway or memory-hungry workloads.</p>
      </div>

      <Card
        title={`Top processes by ${sortBy === "cpu" ? "CPU" : "memory"}`}
        icon={Gauge}
        right={
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/5">
            <button onClick={() => setSortBy("cpu")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${sortBy === "cpu" ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400"}`}><Cpu size={12} /> CPU</button>
            <button onClick={() => setSortBy("mem")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${sortBy === "mem" ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400"}`}><MemoryStick size={12} /> Memory</button>
          </div>
        }
      >
        {top.length ? <BarList items={top} unit="%" /> : <EmptyState icon={Gauge} title="No process data captured" />}
      </Card>

      <Card title="Process table" subtitle={`${procs.length} processes captured`} icon={Gauge}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/8">
                <th className="pb-2.5 pr-3 font-semibold">PID</th>
                <th className="pb-2.5 pr-3 font-semibold">User</th>
                <th className="pb-2.5 pr-3 font-semibold">Command</th>
                <th className="pb-2.5 pr-3 font-semibold text-right">CPU%</th>
                <th className="pb-2.5 pr-3 font-semibold text-right">MEM%</th>
                <th className="pb-2.5 pr-3 font-semibold text-right">RSS</th>
                <th className="pb-2.5 font-semibold text-right">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {procs.slice(0, 40).map((p) => {
                const hot = p.cpu >= 50 || p.mem >= 40;
                return (
                  <tr key={p.pid} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500 tabular-nums">{p.pid}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">{p.user}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-200 font-medium max-w-[280px] truncate" title={p.command}>{shortCmd(p.command)}</td>
                    <td className={`py-2.5 pr-3 text-xs text-right tabular-nums font-semibold ${hot && p.cpu >= 50 ? "text-red-400" : "text-slate-300"}`}>{p.cpu}</td>
                    <td className={`py-2.5 pr-3 text-xs text-right tabular-nums font-semibold ${hot && p.mem >= 40 ? "text-red-400" : "text-slate-300"}`}>{p.mem}</td>
                    <td className="py-2.5 pr-3 text-xs text-right tabular-nums text-slate-400">{p.rssMb} MB</td>
                    <td className="py-2.5 text-xs text-right text-slate-500 tabular-nums">{p.etime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
