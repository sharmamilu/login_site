import { Boxes, HardDrive, Image } from "lucide-react";
import { Card, StateDot, Expandable, KeyVal, EmptyState, Meter } from "./ui.jsx";

export default function ContainersTab({ data }) {
  const dk = data.discovery.docker;

  if (!dk.installed) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Containers</h1>
          <p className="text-sm text-slate-400 mt-1">Docker workloads on the host.</p>
        </div>
        <Card>
          <EmptyState icon={Boxes} title="Docker is not installed on this host" hint="No container runtime was detected during discovery." />
        </Card>
      </div>
    );
  }

  const running = dk.containers.filter((c) => c.state === "running");
  const stopped = dk.containers.filter((c) => c.state !== "running");
  const parsePct = (v) => (v ? parseFloat(v) : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Containers</h1>
        <p className="text-sm text-slate-400 mt-1">Docker {dk.version || ""} · {running.length} running, {stopped.length} stopped.</p>
      </div>

      {/* Disk usage from docker system df */}
      {dk.df.length > 0 && (
        <Card title="Docker disk usage" icon={HardDrive} subtitle="Reclaimable space is safe to prune">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dk.df.map((row, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{row.type}</div>
                <div className="text-lg font-extrabold text-white mt-1">{row.size}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{row.count} total{row.reclaimable ? ` · ${row.reclaimable} reclaimable` : ""}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Containers" icon={Boxes} subtitle="Running vs stopped; expand for image, ports, and live stats">
        {dk.containers.length === 0 ? (
          <EmptyState icon={Boxes} title="No containers found" />
        ) : (
          <div className="space-y-2">
            {dk.containers.map((c) => (
              <Expandable
                key={c.name}
                defaultOpen={false}
                header={
                  <>
                    <StateDot state={c.state} label="" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate font-mono">{c.image}</div>
                    </div>
                  </>
                }
                badge={<span className="text-[11px] text-slate-400 truncate max-w-[140px] hidden sm:inline">{c.status}</span>}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-6">
                    <KeyVal label="Image" value={c.image} mono />
                    <KeyVal label="State" value={c.state} />
                    <KeyVal label="Status" value={c.status} />
                    <KeyVal label="Ports" value={c.ports || "none published"} mono />
                  </div>
                  {c.stats && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <Meter label="Container CPU" value={Math.round(parsePct(c.stats.cpu))} detail={`raw ${c.stats.cpu}`} />
                      <Meter label="Container memory" value={Math.round(parsePct(c.stats.memPct))} detail={c.stats.mem} />
                    </div>
                  )}
                </div>
              </Expandable>
            ))}
          </div>
        )}
      </Card>

      {dk.images.length > 0 && (
        <Card title="Images" icon={Image} subtitle={`${dk.images.length} local image${dk.images.length === 1 ? "" : "s"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/8">
                  <th className="pb-2.5 pr-3 font-semibold">Repository:Tag</th>
                  <th className="pb-2.5 pr-3 font-semibold text-right">Size</th>
                  <th className="pb-2.5 font-semibold text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dk.images.slice(0, 30).map((img, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-200 truncate max-w-[320px]">{img.name}</td>
                    <td className="py-2.5 pr-3 text-xs text-right text-slate-300 tabular-nums">{img.size}</td>
                    <td className="py-2.5 text-xs text-right text-slate-500">{img.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
