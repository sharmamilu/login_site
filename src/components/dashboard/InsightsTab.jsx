import { useState } from "react";
import { Lightbulb, Copy, Check, Filter } from "lucide-react";
import { Card, StatusBadge, STATUS, EmptyState } from "./ui.jsx";

const CATEGORY_ORDER = ["Security", "Performance", "Reliability", "Cost", "Cleanup", "Health"];

function FixCommand({ cmd }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="mt-3 flex items-stretch gap-2">
      <code className="flex-1 text-[11px] font-mono text-slate-300 bg-slate-950/60 border border-white/5 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
        {cmd}
      </code>
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 px-3 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] text-[11px] font-semibold text-slate-300 transition"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function FindingCard({ f }) {
  const s = STATUS[f.severity] || STATUS.info;
  return (
    <div className={`rounded-2xl border ${s.border} bg-slate-900/30 p-5`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusBadge status={f.severity} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{f.category}</span>
        </div>
      </div>
      <h4 className="text-sm font-bold text-white">{f.title}</h4>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{f.detail}</p>
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-300 bg-white/[0.02] border border-white/5 rounded-lg p-3">
        <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <span>{f.recommendation}</span>
      </div>
      {f.fixCmd && <FixCommand cmd={f.fixCmd} />}
    </div>
  );
}

export default function InsightsTab({ data }) {
  const [filter, setFilter] = useState("all");
  const findings = data.insights || [];
  const sev = data.summary.bySeverity;

  const categories = CATEGORY_ORDER.filter((c) => data.summary.byCategory[c]);
  const shown = filter === "all" ? findings : findings.filter((f) => f.category === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Insights & recommendations</h1>
        <p className="text-sm text-slate-400 mt-1">
          {data.summary.actionable === 0
            ? "No action items — the scan came back clean."
            : `${data.summary.actionable} actionable finding${data.summary.actionable === 1 ? "" : "s"} from the current scan.`}
        </p>
      </div>

      {/* Severity scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["critical", "high", "medium", "low", "info"].map((k) => {
          const st = STATUS[k];
          const Icon = st.icon;
          return (
            <div key={k} className={`rounded-2xl border ${st.border} ${st.bg} p-4 flex flex-col items-center justify-center`}>
              <Icon size={16} className={st.text} />
              <div className="text-2xl font-extrabold text-white mt-1.5 tabular-nums">{sev[k] || 0}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>{st.label}</div>
            </div>
          );
        })}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-500" />
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                filter === c
                  ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200 border-white/5 bg-white/[0.02]"
              }`}
            >
              {c === "all" ? "All" : c}
              {c !== "all" && <span className="ml-1.5 text-slate-500">{data.summary.byCategory[c]}</span>}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <Card><EmptyState icon={Lightbulb} title="Nothing in this category" /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shown.map((f, i) => <FindingCard key={i} f={f} />)}
        </div>
      )}
    </div>
  );
}
