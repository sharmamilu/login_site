import { Network, Globe, Lock, Radio } from "lucide-react";
import { Card, StatusBadge, KeyVal, EmptyState } from "./ui.jsx";

export default function NetworkTab({ data }) {
  const d = data.discovery;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Network & ports</h1>
        <p className="text-sm text-slate-400 mt-1">Listening sockets, interfaces, and exposure. Public-facing ports are flagged.</p>
      </div>

      <Card title="Listening ports" icon={Radio} subtitle={`${d.ports.length} sockets · ${d.ports.filter((p) => p.public).length} reachable from any interface`}>
        {d.ports.length === 0 ? (
          <EmptyState icon={Radio} title="No listening ports captured" hint="The account may lack permission to read socket owners." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/8">
                  <th className="pb-2.5 pr-3 font-semibold">Port</th>
                  <th className="pb-2.5 pr-3 font-semibold">Proto</th>
                  <th className="pb-2.5 pr-3 font-semibold">Bind address</th>
                  <th className="pb-2.5 pr-3 font-semibold">Process</th>
                  <th className="pb-2.5 font-semibold text-right">Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {d.ports.map((p, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-mono text-sm text-white font-bold tabular-nums">{p.port}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400 uppercase">{p.proto}</td>
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-400">{p.address}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-200 font-medium">{p.process || "—"}</td>
                    <td className="py-2.5 text-right">
                      {p.public
                        ? <StatusBadge status={[27017, 3306, 5432, 6379, 11211, 9200].includes(p.port) ? "critical" : "medium"}>Public</StatusBadge>
                        : <StatusBadge status="good">Local</StatusBadge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Interfaces & routing" icon={Network}>
          <div className="space-y-0">
            {d.network.interfaces.map((iface, i) => (
              <KeyVal key={i} label={iface.name} value={iface.address} mono />
            ))}
            <KeyVal label="Default route" value={d.network.defaultRoute} mono />
            <KeyVal label="DNS servers" value={d.network.dns.join(", ") || "—"} mono />
          </div>
        </Card>

        <Card title="Edge & CDN" icon={Globe} accent="bg-sky-500/10 text-sky-400" subtitle="Resolved from discovered domains">
          {(!d.edge || d.edge.length === 0) ? (
            <EmptyState icon={Globe} title="No public domains detected" hint="No server_name / vhost / certificate domains were found to resolve." />
          ) : (
            <div className="space-y-2.5">
              {d.edge.map((e, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">{e.domain}</span>
                    {e.cdn
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded"><Globe size={10} />{e.cdn}</span>
                      : e.resolves
                      ? <span className="text-[10px] font-bold uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Direct</span>
                      : <span className="text-[10px] font-bold uppercase text-slate-400 bg-white/[0.03] border border-white/8 px-2 py-0.5 rounded">Unresolved</span>}
                  </div>
                  {e.cname && <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">CNAME → {e.cname}</p>}
                  {e.addresses?.length > 0 && <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">{e.addresses.join(", ")}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {d.security.sessions.length > 0 && (
        <Card title="Active sessions" icon={Lock} subtitle="Users currently logged in">
          <div className="space-y-1.5">
            {d.security.sessions.map((s, i) => (
              <div key={i} className="text-xs font-mono text-slate-400 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">{s}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
