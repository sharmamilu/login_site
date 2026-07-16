import { Network, ShieldCheck, Database, Globe, Server, ArrowRight } from "lucide-react";
import { Card, StatusBadge, Expandable, KeyVal, EmptyState } from "./ui.jsx";

function certStatus(daysLeft) {
  if (daysLeft == null) return "info";
  if (daysLeft < 0) return "critical";
  if (daysLeft <= 14) return "high";
  if (daysLeft <= 30) return "medium";
  return "good";
}

export default function WebTab({ data }) {
  const d = data.discovery;
  const { nginx, apache } = d.web;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Web, proxies & data</h1>
        <p className="text-sm text-slate-400 mt-1">Reverse proxy routing, TLS certificates, and infrastructure components found on the host.</p>
      </div>

      {/* Databases / caches */}
      <Card title="Databases & caches" icon={Database} accent="bg-amber-500/10 text-amber-400" subtitle="Detected from ports, processes, and containers">
        {d.databases.length === 0 ? (
          <EmptyState icon={Database} title="No data stores detected" hint="No database or cache engine was found running on this host." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.databases.map((db, i) => (
              <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{db.type}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">via {db.via}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{db.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Nginx */}
      {nginx.installed && (
        <Card title="Nginx" icon={Network} accent="bg-emerald-500/10 text-emerald-400" subtitle={nginx.version || "reverse proxy"}>
          {nginx.sites.length === 0 ? (
            <EmptyState title="Installed, but no server blocks parsed" hint="Config may require elevated permission to read." />
          ) : (
            <div className="space-y-2">
              {nginx.sites.map((s, i) => (
                <Expandable
                  key={i}
                  header={
                    <>
                      <Server size={15} className="text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {s.serverNames.length ? s.serverNames.join(", ") : "(default server)"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {s.proxyPass.length ? "proxy" : s.root ? "static root" : "listen " + s.listens.join(", ")}
                        </div>
                      </div>
                    </>
                  }
                  badge={s.ssl ? <StatusBadge status="good">TLS</StatusBadge> : <StatusBadge status="medium">No TLS</StatusBadge>}
                >
                  <div className="space-y-2">
                    <KeyVal label="Listen" value={s.listens.join(", ") || "—"} mono />
                    {s.root && <KeyVal label="Static root" value={s.root} mono />}
                    {s.upstreamTargets?.length > 0 && (
                      <div className="flex items-center gap-2 py-2 border-b border-white/5 text-xs">
                        <span className="text-slate-500">Routes to</span>
                        <ArrowRight size={12} className="text-slate-600" />
                        <span className="text-emerald-300 font-mono font-semibold">{s.upstreamTargets.join(", ")}</span>
                      </div>
                    )}
                    {s.sslCerts?.length > 0 && <KeyVal label="Certificate" value={s.sslCerts[0]} mono />}
                  </div>
                </Expandable>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Apache */}
      {apache.installed && (
        <Card title="Apache" icon={Network} accent="bg-emerald-500/10 text-emerald-400" subtitle={`${apache.vhosts.length} virtual host${apache.vhosts.length === 1 ? "" : "s"}`}>
          {apache.vhosts.length === 0 ? (
            <EmptyState title="Installed, no vhosts parsed" />
          ) : (
            <div className="space-y-0">
              {apache.vhosts.map((v, i) => <KeyVal key={i} label={`Port ${v.port}`} value={v.domain} mono />)}
            </div>
          )}
        </Card>
      )}

      {!nginx.installed && !apache.installed && (
        <Card title="Reverse proxy" icon={Network}>
          <EmptyState icon={Network} title="No Nginx or Apache detected" hint="Traffic may be served directly by an app process or a cloud load balancer." />
        </Card>
      )}

      {/* SSL certificates */}
      <Card title="TLS certificates" icon={ShieldCheck} accent="bg-emerald-500/10 text-emerald-400" subtitle="Let's Encrypt / certbot managed certificates">
        {d.ssl.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No local certificates found" hint="TLS may terminate at a load balancer or CDN instead of on the host." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.ssl.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white truncate">{c.domain}</span>
                  <StatusBadge status={certStatus(c.daysLeft)}>
                    {c.daysLeft == null ? "Unknown" : c.daysLeft < 0 ? "Expired" : `${c.daysLeft}d left`}
                  </StatusBadge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Expires {c.expires || "—"}</p>
                {c.issuer && <p className="text-[11px] text-slate-600 mt-0.5 truncate">{c.issuer}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edge / CDN summary (cross-links to network detail) */}
      {d.edge && d.edge.some((e) => e.cdn) && (
        <Card title="CDN & edge delivery" icon={Globe} accent="bg-sky-500/10 text-sky-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.edge.filter((e) => e.cdn).map((e, i) => (
              <div key={i} className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white truncate">{e.domain}</span>
                  <span className="text-[10px] font-bold uppercase text-sky-300">{e.cdn}</span>
                </div>
                {e.cname && <p className="text-[11px] text-slate-500 mt-1.5 font-mono truncate">→ {e.cname}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
