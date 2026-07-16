import { Globe, Server, Boxes, Database, Cloud, Network } from "lucide-react";
import { EmptyState } from "./ui.jsx";

// Dependency graph built entirely from discovered data. Layers left→right:
//   Edge (CDN/domains) → Reverse proxy → App workloads → Data stores
// Each column is derived; empty columns are omitted so the graph reflects the
// actual server rather than a fixed template.
export default function Topology({ data }) {
  const layers = [];

  // Edge layer: domains + any detected CDN/edge
  const edgeNodes = (data.edge || []).map((e) => ({
    label: e.domain,
    sub: e.cdn || (e.resolves ? "DNS A record" : "unresolved"),
    icon: e.cdn ? Cloud : Globe,
    tone: e.cdn ? "sky" : "slate",
  }));
  if (edgeNodes.length) layers.push({ key: "edge", title: "Edge / DNS", nodes: edgeNodes.slice(0, 4) });

  // Reverse proxy layer
  const proxyNodes = [];
  if (data.web?.nginx?.installed) {
    proxyNodes.push({
      label: "Nginx",
      sub: `${data.web.nginx.sites.length} server block${data.web.nginx.sites.length === 1 ? "" : "s"}`,
      icon: Network,
      tone: "emerald",
    });
  }
  if (data.web?.apache?.installed) {
    proxyNodes.push({
      label: "Apache",
      sub: `${data.web.apache.vhosts.length} vhost${data.web.apache.vhosts.length === 1 ? "" : "s"}`,
      icon: Network,
      tone: "emerald",
    });
  }
  if (proxyNodes.length) layers.push({ key: "proxy", title: "Reverse proxy", nodes: proxyNodes });

  // App workload layer: running containers, else notable listening app ports
  const appNodes = [];
  if (data.docker?.installed && data.docker.containers.length) {
    for (const c of data.docker.containers.filter((c) => c.state === "running").slice(0, 5)) {
      appNodes.push({ label: c.name, sub: c.image.split("/").pop().slice(0, 22), icon: Boxes, tone: "indigo" });
    }
  }
  if (!appNodes.length) {
    const appPorts = data.ports.filter((p) => p.process && ![22, 53].includes(p.port) && p.proto === "tcp");
    const seen = new Set();
    for (const p of appPorts) {
      if (seen.has(p.process)) continue;
      seen.add(p.process);
      appNodes.push({ label: p.process, sub: `:${p.port}`, icon: Server, tone: "indigo" });
      if (appNodes.length >= 5) break;
    }
  }
  if (appNodes.length) layers.push({ key: "app", title: "Applications", nodes: appNodes });

  // Data layer
  const dbNodes = data.databases.slice(0, 5).map((db) => ({
    label: db.type,
    sub: db.via + (db.port ? ` :${db.port}` : ""),
    icon: Database,
    tone: "amber",
  }));
  if (dbNodes.length) layers.push({ key: "db", title: "Data stores", nodes: dbNodes });

  if (layers.length < 1) {
    return <EmptyState icon={Network} title="Not enough topology detected" hint="No web server, containers, or databases were found to map." />;
  }

  const toneMap = {
    sky: "border-sky-500/25 bg-sky-500/5 text-sky-300",
    emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
    indigo: "border-indigo-500/25 bg-indigo-500/5 text-indigo-300",
    amber: "border-amber-500/25 bg-amber-500/5 text-amber-300",
    slate: "border-white/10 bg-white/[0.02] text-slate-300",
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch gap-3 min-w-max py-2">
        {layers.map((layer, li) => (
          <div key={layer.key} className="flex items-stretch gap-3">
            <div className="flex flex-col gap-3 min-w-[150px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">{layer.title}</div>
              <div className="flex flex-col gap-2.5 justify-center flex-1">
                {layer.nodes.map((n, ni) => {
                  const Icon = n.icon;
                  return (
                    <div key={ni} className={`rounded-xl border px-3 py-2.5 ${toneMap[n.tone]}`}>
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{n.label}</div>
                          <div className="text-[10px] opacity-70 truncate">{n.sub}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* connector arrow between layers */}
            {li < layers.length - 1 && (
              <div className="flex items-center text-slate-600 self-stretch">
                <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                  <path d="M2 8 H18 M14 3 L19 8 L14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
