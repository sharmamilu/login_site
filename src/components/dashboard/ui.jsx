import { useState } from "react";
import { AlertTriangle, ShieldAlert, AlertCircle, Info, CheckCircle2, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Validated categorical palette (dataviz skill; passes CVD + contrast on the
// #0f172a-ish card surface). Order is the CVD-safety ordering, not cosmetic.
//   1 indigo  2 sky/blue  3 emerald  4 amber  5 red
// ---------------------------------------------------------------------------
export const SERIES = ["#6366f1", "#0284c7", "#059669", "#d97706", "#ef4444"];

// Status ramp — reserved, never reused as a series color. Each pairs with an
// icon + label so meaning never rides on color alone.
export const STATUS = {
  critical: { color: "#f87171", bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-300", icon: ShieldAlert, label: "Critical" },
  high:     { color: "#fb923c", bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-300", icon: AlertTriangle, label: "High" },
  medium:   { color: "#fbbf24", bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300", icon: AlertCircle, label: "Medium" },
  low:      { color: "#38bdf8", bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-300", icon: Info, label: "Low" },
  info:     { color: "#94a3b8", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-300", icon: Info, label: "Info" },
  good:     { color: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", icon: CheckCircle2, label: "Healthy" },
};

export function Card({ title, subtitle, icon: Icon, right, children, className = "", accent }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-slate-900/30 backdrop-blur-xl p-5 sm:p-6 ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`p-2 rounded-xl border border-white/5 shrink-0 ${accent || "bg-indigo-500/10 text-indigo-400"}`}>
                <Icon size={17} />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-base font-bold text-white truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// icon + label status pill — identity never color-alone
export function StatusBadge({ status, children, size = "sm" }) {
  const s = STATUS[status] || STATUS.info;
  const Icon = s.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide border ${s.bg} ${s.border} ${s.text} ${pad}`}>
      <Icon size={size === "sm" ? 11 : 12} />
      {children || s.label}
    </span>
  );
}

// Running / stopped / neutral dot with label
export function StateDot({ state, label }) {
  const map = {
    running: "bg-emerald-400",
    active: "bg-emerald-400",
    stopped: "bg-slate-500",
    exited: "bg-slate-500",
    inactive: "bg-slate-500",
    failed: "bg-red-400 animate-pulse",
    dead: "bg-slate-600",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
      <span className={`h-1.5 w-1.5 rounded-full ${map[state] || "bg-slate-500"}`} />
      {label}
    </span>
  );
}

// Meter: fill carries severity, track is a lighter step of the same ramp.
export function Meter({ value, label, detail, thresholds = { warn: 75, danger: 90 } }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const hue = pct >= thresholds.danger ? "#f87171" : pct >= thresholds.warn ? "#fbbf24" : "#6366f1";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-sm font-bold text-white tabular-nums">{value == null ? "—" : `${pct}%`}</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: hue }} />
      </div>
      {detail && <p className="text-[11px] text-slate-500 tabular-nums">{detail}</p>}
    </div>
  );
}

// 2px sparkline, round joins, end marker with surface ring.
export function Sparkline({ data = [], color = SERIES[0], width = 120, height = 32, max }) {
  if (!data.length) return <div style={{ width, height }} />;
  const hi = max ?? Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * (width - 4) + 2;
    const y = height - 3 - (Math.max(0, v) / hi) * (height - 6);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r="3.5" fill={color} stroke="#0b1120" strokeWidth="2" />
    </svg>
  );
}

// Horizontal bar list — thin marks, 4px rounded data-end, value labels at the tip.
export function BarList({ items, unit = "%", color = SERIES[0], max, formatValue }) {
  const hi = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => {
        const w = Math.max(2, (it.value / hi) * 100);
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-32 sm:w-40 shrink-0 text-xs text-slate-300 truncate font-medium" title={it.label}>
              {it.label}
            </div>
            <div className="flex-1 h-4 relative">
              <div
                className="absolute inset-y-0 left-0 rounded-r-[4px] rounded-l-[1px]"
                style={{ width: `${w}%`, background: it.color || color }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-xs font-bold text-white tabular-nums">
              {formatValue ? formatValue(it.value) : `${it.value}${unit}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Collapsible drill-down row.
export function Expandable({ header, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.02] transition text-left"
      >
        <div className="flex items-center gap-3 min-w-0">{header}</div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-white/5">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {Icon && <Icon size={26} className="text-slate-600 mb-3" />}
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-600 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function KeyVal({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs text-slate-200 font-semibold text-right truncate ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
