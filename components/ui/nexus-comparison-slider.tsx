"use client";

import * as React from "react";
import {
  Check,
  X,
  ArrowRight,
  Building2,
  Grid,
} from "lucide-react";

/* ─── Rolling digit animation ─────────────────────────────────────────────── */
const DIGITS = Array.from({ length: 10 }, (_, i) => i);

export function RollingPrice({
  value,
  format,
  reduced,
  className = "",
}: {
  value: number;
  format: (v: number) => string;
  reduced: boolean;
  className?: string;
}) {
  const text = format(value);
  return (
    <span
      data-price={value}
      className={`inline-flex items-baseline whitespace-nowrap tabular-nums tracking-tight ${className}`}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {Array.from(text).map((ch, i) =>
          /\d/.test(ch) ? (
            <span
              key={text.length - i}
              className="relative inline-block h-[1em] w-[0.6em] overflow-hidden"
            >
              <span
                data-digit
                style={{
                  transform: `translateY(-${Number(ch)}em)`,
                  transition: reduced
                    ? "none"
                    : "transform 360ms cubic-bezier(0.22,1,0.36,1)",
                }}
                className="block"
              >
                {DIGITS.map((d) => (
                  <span key={d} className="block h-[1em] text-center leading-none">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={text.length - i} className="leading-none">
              {ch}
            </span>
          )
        )}
      </span>
    </span>
  );
}

/* ─── Retained purchasing power copy ──────────────────────────────────────── */
const getPerkText = (saved: number) => {
  if (saved < 7000)
    return "Equivalent to your annual camera gear insurance policy + 12TB encrypted cloud dailies backup.";
  if (saved < 14000)
    return "Equivalent to a complete RED Komodo 6K cinema package rental for 4 commercial shoots.";
  if (saved < 24000)
    return "Equivalent to 8 commercial shoot flights + 2 master anamorphic prime lens rentals.";
  return "Equivalent to 100% of your annual creative studio lease in Brooklyn, Austin, or Berlin.";
};

/* ─── Preset billings ──────────────────────────────────────────────────────── */
const PRESET_APERTURES = [
  { label: "$40,000",   sub: "Part-time",        value: 40000  },
  { label: "$80,000",   sub: "Active DP",         value: 80000  },
  { label: "$120,000",  sub: "Commercial Dir",    value: 120000 },
  { label: "$160,000",  sub: "Lead Operator",     value: 160000 },
  { label: "$200,000+", sub: "Studio Production", value: 200000 },
];

const TOTAL_BARS = 60;
const TNR = "font-['Times_New_Roman',Times,Georgia,serif]";

/* ─── Comparison rows ──────────────────────────────────────────────────────── */
type CompRow = {
  label: string;
  nexus: string;
  upwork: string;
  agency: string;
};

function buildRows(billings: number): CompRow[] {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const upworkRetained = billings - Math.round(billings * 0.20);
  const agencyRetained = billings - Math.round(billings * 0.30);

  return [
    { label: "Commission on your bookings", nexus: "0%",             upwork: "20%",                  agency: "25–35%"             },
    { label: "You keep",                    nexus: `$${fmt(billings)}`, upwork: `$${fmt(upworkRetained)}`, agency: `$${fmt(agencyRetained)}` },
    { label: "Clients pay you directly",    nexus: "✓",              upwork: "✗",                    agency: "✗"                  },
    { label: "Get paid the same day",       nexus: "✓",              upwork: "✗",                    agency: "✗"                  },
    { label: "Talk to clients anywhere",    nexus: "✓",              upwork: "✗",                    agency: "✗"                  },
    { label: "Portfolio, reel and photos",  nexus: "✓",              upwork: "✓",                    agency: "✗"                  },
    { label: "Master IP & deliverables",    nexus: "✓",              upwork: "✗",                    agency: "✗"                  },
    { label: "Flat verified membership",    nexus: "✓",              upwork: "✗",                    agency: "✗"                  },
  ];
}

/* ─── Cell ─────────────────────────────────────────────────────────────────── */
function Cell({
  value,
  highlight,
  muted,
}: {
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  const isCheck = value === "✓";
  const isCross = value === "✗";
  const isMoney = value.startsWith("$");
  const isPct   = value.endsWith("%") || value.includes("–");

  if (isCheck) {
    return (
      <td className={`py-4 px-4 text-center align-middle border-l border-slate-900/[0.07]${highlight ? " bg-[#FAF7F2]" : ""}`}> {/* taste-skill-ignore */}
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10">
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
        </span>
      </td>
    );
  }
  if (isCross) {
    return (
      <td className={`py-4 px-4 text-center align-middle border-l border-slate-900/[0.07]${highlight ? " bg-[#FAF7F2]" : ""}`}> {/* taste-skill-ignore */}
        <span className="inline-flex items-center justify-center w-5 h-5">
          <X className="w-4 h-4 text-neutral-300 stroke-[1.5]" />
        </span>
      </td>
    );
  }

  return (
    <td className={`py-4 px-4 text-center align-middle border-l border-slate-900/[0.07]${highlight ? " bg-[#FAF7F2]" : ""}`}> {/* taste-skill-ignore */}
      <span
        className={`${TNR} tabular-nums ${
          isMoney
            ? `text-base sm:text-lg font-bold tracking-tight ${muted ? "text-neutral-400" : "text-[#14110F]"}`
            : isPct
            ? `text-sm sm:text-base font-bold ${muted ? "text-neutral-400" : "text-[#C55221]"}`
            : `text-sm font-semibold ${muted ? "text-neutral-400" : "text-neutral-700"}`
        }`}
      >
        {value}
      </span>
    </td>
  );
}

/* ─── Main export ──────────────────────────────────────────────────────────── */
export function NexusComparisonSection({
  initialBillings = 105000,
  onSelectPlan,
}: {
  initialBillings?: number;
  onSelectPlan?: (planId: string) => void;
}) {
  const [billings, setBillings] = React.useState(initialBillings);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(480);

  React.useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(q.matches);
    const h = () => setReducedMotion(q.matches);
    q.addEventListener("change", h);
    return () => q.removeEventListener("change", h);
  }, []);

  React.useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setContainerWidth(containerRef.current.offsetWidth || 480);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const upworkToll = Math.round(billings * 0.20);
  const minVal     = 20000;
  const maxVal     = 200000;
  const pct        = Math.max(0, Math.min(100, ((billings - minVal) / (maxVal - minVal)) * 100));
  const activeBar  = (pct / 100) * (TOTAL_BARS - 1);
  const offsetPx   = 10 - pct * 0.20;
  const bubbleX    = (pct / 100) * containerWidth + offsetPx;
  const fmt        = (n: number) => n.toLocaleString("en-US");
  const rows       = buildRows(billings);

  const handleSelect = (plan: string) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (typeof window !== "undefined" && (window as any).openInquiryModal) {
      (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
    }
  };

  return (
    <div className={`w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 pt-0 pb-16 text-[#0F1115] ${TNR} relative`}>

      {/* ── Section Header ── */}
      <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center">
        <p className={`${TNR} uppercase tracking-[0.18em] text-[11px] font-semibold text-neutral-400 mb-4`}>
          Pricing &amp; Roster
        </p>
        <h2 className={`${TNR} text-[42px] sm:text-[56px] md:text-[68px] font-normal leading-[1.04] tracking-tight text-[#14110F] text-balance`}>
          one flat price. keep
          <br />
          <em className="not-italic text-[#14110F]">every dollar.</em>
        </h2>
        <p className={`${TNR} text-sm sm:text-base text-neutral-500 mt-5 max-w-sm mx-auto leading-relaxed`}>
          Creators and teachers pay a monthly membership. Clients book you
          directly, and we never take a cut.
        </p>

        {/* Live billing slider pill */}
        <div className="mt-8 flex items-center gap-3 bg-[#F8F6F1] rounded-full px-5 py-2.5 w-full max-w-md">
          <span className={`${TNR} text-sm text-neutral-500 whitespace-nowrap`}>If you book</span>
          <span className={`${TNR} text-sm font-bold text-[#14110F] min-w-[76px] tabular-nums`}>
            ${fmt(billings)}
          </span>
          <div className="flex-1 relative" ref={containerRef}>
            {/* Bubble */}
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#C55221] text-white text-[10px] font-bold whitespace-nowrap pointer-events-none"
              style={{ left: `${bubbleX}px` }}
            >
              ${fmt(billings)}
            </div>
            <input
              type="range"
              min={minVal}
              max={maxVal}
              step={5000}
              value={billings}
              onChange={(e) => setBillings(Number(e.target.value))}
              className="impeccable-slider w-full"
              aria-label="Simulate annual billings"
            />
          </div>
          <span className={`${TNR} text-sm text-neutral-500 whitespace-nowrap`}>of work a month</span>
        </div>
      </div>

      {/* ── Comparison Table ── */}
      <div className="bg-white rounded-3xl border border-slate-900/[0.06] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900/[0.07]"> {/* taste-skill-ignore */}
                {/* Label column */}
                <th scope="col" className="py-7 pl-8 pr-6 text-left w-[36%] align-bottom">
                  {/* intentionally empty */}
                </th>

                {/* Nexus Direct */}
                <th scope="col" className="py-7 px-6 text-center w-[22%] bg-[#FAF7F2] border-l border-slate-900/[0.07] align-bottom"> {/* taste-skill-ignore */}
                  <div className="flex flex-col items-center gap-1.5 pb-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C55221]/10 ${TNR} text-[11px] font-bold text-[#C55221] tracking-wide uppercase`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C55221]" />
                      Creator membership
                    </div>
                    <div className={`${TNR} text-xl sm:text-2xl font-bold text-[#14110F] leading-tight mt-1`}>
                      nexus
                    </div>
                  </div>
                </th>

                {/* Upwork */}
                <th scope="col" className="py-7 px-4 text-center w-[21%] border-l border-slate-900/[0.07] align-bottom"> {/* taste-skill-ignore */}
                  <div className="flex flex-col items-center gap-1 pb-1">
                    <Grid className="w-4 h-4 text-neutral-300 mb-1" />
                    <div className={`${TNR} text-xs text-neutral-400 font-medium leading-tight`}>Freelance sites</div>
                    <div className={`${TNR} text-sm sm:text-base font-semibold text-neutral-600 leading-tight`}>upwork, fiverr</div>
                  </div>
                </th>

                {/* Agencies */}
                <th scope="col" className="py-7 px-4 text-center w-[21%] border-l border-slate-900/[0.07] align-bottom"> {/* taste-skill-ignore */}
                  <div className="flex flex-col items-center gap-1 pb-1">
                    <Building2 className="w-4 h-4 text-neutral-300 mb-1" />
                    <div className={`${TNR} text-xs text-neutral-400 font-medium leading-tight`}>Representation</div>
                    <div className={`${TNR} text-sm sm:text-base font-semibold text-neutral-600 leading-tight`}>agencies</div>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={`${idx % 2 === 1 ? "bg-[#FAFAF8]" : "bg-white"} border-b border-slate-900/[0.05]`} /* taste-skill-ignore */
                >
                  <td className="py-4 pl-8 pr-6 align-middle">
                    <span className={`${TNR} text-sm sm:text-[15px] text-neutral-700 font-medium leading-snug`}>
                      {row.label}
                    </span>
                  </td>
                  <Cell value={row.nexus}  highlight />
                  <Cell value={row.upwork} muted />
                  <Cell value={row.agency} muted />
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-slate-900/[0.07]"> {/* taste-skill-ignore */}
                <td className="py-5 pl-8 pr-6">
                  <p className={`${TNR} text-xs text-neutral-400 italic`}>
                    Every dollar negotiated is 100% yours.
                  </p>
                </td>
                <td className="py-5 px-5 bg-[#FAF7F2] border-l border-slate-900/[0.07]"> {/* taste-skill-ignore */}
                  <button
                    type="button"
                    onClick={() => handleSelect("nexus")}
                    className={`${TNR} w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#14110F] hover:bg-black text-white text-sm font-semibold tracking-wide transition-colors cursor-pointer`}
                  >
                    <span>Apply now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="py-5 px-4 text-center border-l border-slate-900/[0.07]"> {/* taste-skill-ignore */}
                  <span className={`${TNR} text-xs text-neutral-400 italic`}>20% toll on every booking</span>
                </td>
                <td className="py-5 px-4 text-center border-l border-slate-900/[0.07]"> {/* taste-skill-ignore */}
                  <span className={`${TNR} text-xs text-neutral-400 italic`}>25–35% markup on labor</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Retained Revenue Simulator (below table) ── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Left: big earnings */}
        <div className="bg-white rounded-2xl border border-slate-900/[0.06] p-7 flex flex-col justify-between">
          <div>
            <p className={`${TNR} text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1`}>
              Retained Revenue Simulator
            </p>
            <p className={`${TNR} text-xs text-neutral-400 italic mb-6`}>
              Simulate annual take-home across billing volume
            </p>

            <div className="flex items-baseline gap-1 mb-2">
              <span className={`${TNR} text-2xl font-medium text-neutral-300`}>$</span>
              <span className={`${TNR} text-5xl sm:text-6xl font-bold text-[#14110F] leading-none tabular-nums tracking-tight`}>
                <RollingPrice value={billings} format={(v) => v.toLocaleString("en-US")} reduced={reducedMotion} />
              </span>
              <span className={`${TNR} text-sm text-neutral-400 ml-1`}>/yr</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mt-1 mb-6">
              <span>+$</span>
              <RollingPrice value={upworkToll} format={(v) => v.toLocaleString("en-US")} reduced={reducedMotion} />
              <span>Retained</span>
            </div>

            <p className={`${TNR} text-xs text-neutral-400 italic leading-relaxed`}>
              Drag the precision slider to preview your retained earnings and
              platform savings. Zero extraction.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-[#F9F7F2] p-4">
            <p className={`${TNR} text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1`}>
              ⚡ Retained Purchasing Power
            </p>
            <p className={`${TNR} text-xs text-neutral-600 leading-relaxed italic`}>
              {getPerkText(upworkToll)}
            </p>
          </div>
        </div>

        {/* Right: slider + histogram + presets */}
        <div className="bg-white rounded-2xl border border-slate-900/[0.06] p-7 flex flex-col justify-between">
          <div>
            {/* Gaussian histogram */}
            <div className="flex items-end justify-between h-10 mb-1 gap-[1.5px]" aria-hidden="true">
              {Array.from({ length: TOTAL_BARS }).map((_, idx) => {
                const dist  = Math.abs(idx - activeBar);
                let scale   = 0.12;
                const isAct = dist <= 3.5;
                if (dist < 10) {
                  const g = Math.exp(-(dist * dist) / 18);
                  scale   = 0.12 + g * 0.88;
                }
                return (
                  <span
                    key={idx}
                    style={{
                      height: "100%",
                      transform: `scaleY(${scale.toFixed(3)})`,
                      transformOrigin: "bottom",
                      transition: reducedMotion ? "none" : "transform 0.08s ease",
                    }}
                    className={`inline-block flex-1 rounded-[1px] ${isAct ? "bg-[#C55221]" : "bg-neutral-200"}`}
                  />
                );
              })}
            </div>

            {/* Precision slider */}
            <div className="relative mt-1 mb-1">
              <input
                type="range"
                min={minVal}
                max={maxVal}
                step={5000}
                value={billings}
                onChange={(e) => setBillings(Number(e.target.value))}
                className="impeccable-slider w-full"
                aria-label="Simulate annual billings"
              />
            </div>

            {/* Ruler labels */}
            <div className={`${TNR} flex justify-between text-[11px] text-neutral-300 mt-1 mb-6`} aria-hidden="true">
              <span>$20,000</span>
              <span>$65,000</span>
              <span>$110,000</span>
              <span>$155,000</span>
              <span>$200,000+</span>
            </div>

            {/* Preset pills */}
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Preset billing amounts">
              {PRESET_APERTURES.map((p) => {
                const isActive = billings === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setBillings(p.value)}
                    className={`${TNR} py-2 px-1 rounded-xl text-center transition-colors duration-150 cursor-pointer ${
                      isActive ? "bg-[#14110F] text-white" : "bg-[#F8F7F4] text-neutral-600 hover:bg-[#EFECE6]"
                    }`}
                  >
                    <div className="text-[10px] sm:text-[11px] font-bold leading-tight">{p.label}</div>
                    <div className="text-[9px] opacity-60 truncate mt-0.5 italic">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => handleSelect("nexus")}
            className={`${TNR} w-full mt-6 py-4 px-6 rounded-full bg-[#14110F] hover:bg-black text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer`}
          >
            <span>Apply for curated membership</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default NexusComparisonSection;
