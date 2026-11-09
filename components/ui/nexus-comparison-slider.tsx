"use client";

import * as React from "react";
import { 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Building2,
  Grid
} from "lucide-react";

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

export function RollingPrice({ 
  value, 
  format, 
  reduced, 
  className = "" 
}: { 
  value: number; 
  format: (value: number) => string; 
  reduced: boolean; 
  className?: string; 
}) {
  const text = format(value);
  return (
    <span data-price={value} className={`inline-flex items-baseline whitespace-nowrap tabular-nums tracking-tight ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {Array.from(text).map((character, index) =>
          /\d/.test(character) ? (
            <span key={text.length - index} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
              <span
                data-digit
                style={{
                  transform: `translateY(-${Number(character)}em)`,
                  transition: reduced ? "none" : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="block"
              >
                {DIGITS.map((digit) => (
                  <span key={digit} className="block h-[1em] text-center leading-none">
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={text.length - index} className="leading-none">
              {character}
            </span>
          )
        )}
      </span>
    </span>
  );
}

const getPerkText = (saved: number) => {
  if (saved < 7000) {
    return "Equivalent to your annual camera gear insurance policy + 12TB encrypted cloud dailies backup.";
  } else if (saved < 14000) {
    return "Equivalent to a complete RED Komodo 6K cinema package rental for 4 commercial shoots.";
  } else if (saved < 24000) {
    return "Equivalent to 8 commercial shoot flights + 2 master anamorphic prime lens rentals.";
  } else {
    return "Equivalent to 100% of your annual creative studio lease in Brooklyn, Austin, or Berlin.";
  }
};

const PRESET_APERTURES = [
  { label: "$40,000", sub: "Part-time", value: 40000 },
  { label: "$80,000", sub: "Active DP", value: 80000 },
  { label: "$120,000", sub: "Commercial Dir", value: 120000 },
  { label: "$160,000", sub: "Lead Operator", value: 160000 },
  { label: "$200,000+", sub: "Studio Production", value: 200000 },
];

const TOTAL_BARS = 60;

/**
 * Editorial Commercial Console: Centralised Times New Roman Header & Architectural Vertical Lines
 * Section 02 / 04: Commercial Comparison Matrix & Retained Revenue Simulator
 */
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
    const handler = () => setReducedMotion(q.matches);
    q.addEventListener("change", handler);
    return () => q.removeEventListener("change", handler);
  }, []);

  React.useEffect(() => {
    const updateW = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth || 480);
      }
    };
    updateW();
    window.addEventListener("resize", updateW);
    return () => window.removeEventListener("resize", updateW);
  }, []);

  const upworkToll = Math.round(billings * 0.20);
  const upworkRetained = billings - upworkToll;
  const upwork5Yr = upworkToll * 5;

  const agencyToll = Math.round(billings * 0.30);
  const agencyRetained = billings - agencyToll;
  const agency5Yr = agencyToll * 5;

  const minVal = 20000;
  const maxVal = 200000;
  const pct = Math.max(0, Math.min(100, ((billings - minVal) / (maxVal - minVal)) * 100));

  // Active bar index for the 60-bar Gaussian wave
  const activeBarIndex = (pct / 100) * (TOTAL_BARS - 1);

  const fmt = (n: number) => n.toLocaleString("en-US");

  // Floating bubble horizontal offset
  const offsetPx = 10 - pct * 0.20;
  const bubbleX = (pct / 100) * containerWidth + offsetPx;

  // Interactive matrix row state ("open up" capability)
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [hoveredRowId, setHoveredRowId] = React.useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const rowsList = [
    "commission",
    "takehome",
    "extraction",
    "fiveyear",
    "escrow",
    "clientownership",
    "iprights",
    "billingmodel",
  ];

  const allExpanded = rowsList.every((id) => !!expandedRows[id]);

  const toggleAllRows = () => {
    const nextState = !allExpanded;
    const next: Record<string, boolean> = {};
    rowsList.forEach((id) => {
      next[id] = nextState;
    });
    setExpandedRows(next);
  };

  const comparisonItems = [
    {
      id: "commission",
      label: "Platform commission",
      nexus: {
        value: "0% (Zero toll)",
        badge: "Zero Toll",
        isWinner: true,
        audit: "Nexus Direct operates as a verified direct directory. 0% cut taken on invoices, milestones, or wires. 100% of client payout is received.",
      },
      upwork: {
        value: "20% on milestones",
        isPenalty: true,
        audit: "Upwork extracts 10% to 20% on milestone billing, plus 3% to 5% client payment processing and foreign exchange conversion deductions.",
      },
      agency: {
        value: "25 to 35% agency cut",
        isPenalty: true,
        audit: "Traditional creative representation agencies deduct 25% to 35% mandatory commission, or apply marked-up labor rates undisclosed to creators.",
      },
    },
    {
      id: "takehome",
      label: "Annual creator take-home",
      nexus: {
        value: `Keep $${fmt(billings)} (100%)`,
        badge: "Full Retention",
        isWinner: true,
        audit: `At $${fmt(billings)} annual production volume, you retain exactly $${fmt(billings)}. Zero intermediary deductions or holding accounts.`,
      },
      upwork: {
        value: `Creator keeps $${fmt(upworkRetained)} (80%)`,
        isPenalty: true,
        audit: `At $${fmt(billings)} billing, Upwork automatically strips $${fmt(upworkToll)} from your gross milestone payouts each year.`,
      },
      agency: {
        value: `Creator keeps $${fmt(agencyRetained)} (70%)`,
        isPenalty: true,
        audit: `Traditional agency commissions strip $${fmt(agencyToll)} from your annual earnings before sending you net settlement checks.`,
      },
    },
    {
      id: "extraction",
      label: "Annual platform extraction",
      nexus: {
        value: "$0.00 Platform Fee",
        badge: "Flat Membership",
        isWinner: true,
        audit: "Predictable, flat verified membership. Nexus never taxes career scaling or penalizes higher-value commercial projects.",
      },
      upwork: {
        value: `−$${fmt(upworkToll)} toll / yr`,
        isPenalty: true,
        audit: "Tolls compound indefinitely on every milestone. The more value you generate, the more dollars the platform extracts from your craft.",
      },
      agency: {
        value: `−$${fmt(agencyToll)} markup / yr`,
        isPenalty: true,
        audit: "Agency partner cuts and administrative overhead siphon creative gross profit, depressing your day-rate ceiling.",
      },
    },
    {
      id: "fiveyear",
      label: "5-Year compounded toll",
      nexus: {
        value: "$0 Lost (100% Retained)",
        badge: "Wealth Compounding",
        isWinner: true,
        audit: `Over five active production years at current volume, zero toll preserves an extra $${fmt(upwork5Yr)} to $${fmt(agency5Yr)} in creator wealth.`,
      },
      upwork: {
        value: `−$${fmt(upwork5Yr)} Lost`,
        isPenalty: true,
        audit: `Five years of milestone extraction costs $${fmt(upwork5Yr)} in unrecoverable platform tolling that could fund an entire camera package.`,
      },
      agency: {
        value: `−$${fmt(agency5Yr)} Lost`,
        isPenalty: true,
        audit: `Five years of agency representation extracts $${fmt(agency5Yr)} in creative labor capital that goes to corporate overhead.`,
      },
    },
    {
      id: "escrow",
      label: "Payout velocity & escrow",
      nexus: {
        value: "Same-day wire & ACH",
        isWinner: true,
        audit: "Direct client wire, ACH, or credit card settlement directly to your business checking. Zero intermediary holding periods.",
      },
      upwork: {
        value: "14 to 21 day escrow lockup",
        isPenalty: true,
        audit: "Mandatory security holds: 5-day client review, followed by 10-day platform clearing cycles before funds become withdrawable.",
      },
      agency: {
        value: "NET 60 to 90 payment delays",
        isPenalty: true,
        audit: "Agencies standardly pay creators only after their own client invoices clear, forcing creators to float production cash for months.",
      },
    },
    {
      id: "clientownership",
      label: "Direct client ownership",
      nexus: {
        value: "100% direct client ownership",
        isWinner: true,
        audit: "You own the client relationship. Message via Slack, email, cell, or in-person. Direct repeat bookings with zero restrictions.",
      },
      upwork: {
        value: "Platform gates chat",
        isPenalty: true,
        audit: "Strict platform non-circumvention rules threaten account suspension or legal action for off-platform communication or payments.",
      },
      agency: {
        value: "Agency holds client contract",
        isPenalty: true,
        audit: "Non-compete and exclusivity agreements legally prevent creators from contacting or signing direct contracts with agency clients.",
      },
    },
    {
      id: "iprights",
      label: "Master IP & deliverables",
      nexus: {
        value: "You retain 100% master IP",
        isWinner: true,
        audit: "Creator retains master files and grants license upon full payment. Full rights to use footage in personal portfolio and showreels.",
      },
      upwork: {
        value: "Standard platform TOS terms",
        isPenalty: true,
        audit: "Work subject to standardized platform TOS and automated dispute adjudication systems run by algorithm.",
      },
      agency: {
        value: "Work-for-hire rights to agency",
        isPenalty: true,
        audit: "Extensive work-for-hire agreements grant broad rights and raw assets to the agency and brand, restricting director reel usage.",
      },
    },
    {
      id: "billingmodel",
      label: "Commercial billing model",
      nexus: {
        value: "Flat verified membership",
        isWinner: true,
        audit: "Single verified membership fee. Predictable overhead. Grow your commercial rate from $800/day to $2,500/day without higher tolls.",
      },
      upwork: {
        value: "20% toll on every client $",
        isPenalty: true,
        audit: "Toll structure taxes creator growth. High-billing creators subsidize the infrastructure without proportional benefits.",
      },
      agency: {
        value: "Heavy agency markup on labor",
        isPenalty: true,
        audit: "Agencies inflate client invoice prices with heavy margins, often pricing senior directors out of nimble, high-craft brand budgets.",
      },
    },
  ];

  const handleSelect = (plan: string) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (typeof window !== "undefined" && (window as any).openInquiryModal) {
      (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
    }
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12 sm:pb-16 text-[#0F1115] font-sans relative">
      
      {/* ── Centralised Editorial Header in Times New Roman (Matching Above Section) ── */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 flex flex-col items-center">
        {/* Section Kicker Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/[0.04] border border-slate-900/[0.08] text-xs font-semibold text-slate-600 tracking-wide mb-3.5">
          <span className="font-bold text-slate-900">02 / 04</span>
          <span className="text-slate-300">·</span>
          <span>Zero Commission</span>
        </div>

        {/* Centralised Title in Times New Roman */}
        <h2 className="font-['Times_New_Roman',_Times,_Georgia,_serif] text-4xl sm:text-5xl md:text-[56px] font-normal tracking-tight text-[#14110F] leading-[1.06] text-balance">
          Find the right plan for your <span className="italic text-[#C55221]">production.</span>
        </h2>

        {/* Centralised Lead in Times New Roman Italic */}
        <p className="font-['Times_New_Roman',_Times,_Georgia,_serif] italic text-base sm:text-lg text-neutral-600 mt-3.5 max-w-2xl mx-auto leading-relaxed text-balance">
          Transparent commercial terms. Traditional freelance platforms take 20% on milestones plus escrow holds. 
          Nexus Direct is verified and direct: 100% day-rate retention and same-day client wire.
        </p>
      </div>

      {/* ── Two-Card Split Console: Matrix on Left, Simulator on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch relative z-10">
        
        {/* ── LEFT: Commercial Comparison Matrix Card (7 cols) ── */}
        <div data-ui="comparison-matrix" className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-7 flex flex-col justify-between border border-slate-900/[0.06]">
          <div>
            {/* Matrix Header with "Open Up" Forensic Audit Control */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="font-['Times_New_Roman',_Times,_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#0F1115] tracking-tight">
                  Commercial comparison matrix
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified direct directory vs legacy platform toll-gates
                </p>
              </div>

              {/* Master Open Up Button */}
              <button
                type="button"
                onClick={toggleAllRows}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/[0.04] hover:bg-slate-900/[0.08] text-xs font-semibold text-slate-700 transition-colors cursor-pointer w-fit self-start sm:self-auto"
                aria-expanded={allExpanded}
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>Collapse details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open forensic audit</span>
                  </>
                )}
                <span className="text-[10px] text-slate-400 font-semibold">8/8</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <table className="w-full min-w-[560px] text-left text-xs sm:text-[13px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="pb-3 text-xs font-medium text-neutral-500 w-[34%] pr-2">
                      Commercial terms
                    </th>
                    
                    {/* Nexus Direct Featured Column Header (Elevated, Image 3 Reference) */}
                    <th scope="col" className="pb-3 px-3 w-[28%] bg-[#FAF8F3] rounded-t-xl text-center">
                      <div className="flex flex-col items-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-800 tracking-wider mb-1.5 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          0% Take Rate
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-[#0F1115] leading-tight">Nexus Direct</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">Flat Membership</div>
                      </div>
                    </th>

                    {/* Upwork Column */}
                    <th scope="col" className="pb-3 px-2 w-[19%] text-center">
                      <div className="flex flex-col items-center">
                        <Grid className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Upwork / Freelance</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">20% Escrow Toll</div>
                      </div>
                    </th>

                    {/* Talent Agencies Column */}
                    <th scope="col" className="pb-3 px-2 w-[19%] text-center">
                      <div className="flex flex-col items-center">
                        <Building2 className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Talent Agencies</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">25 to 35% Markup</div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonItems.map((item, index) => {
                    const isExpanded = !!expandedRows[item.id];
                    const isHovered = hoveredRowId === item.id;
                    const isLast = index === comparisonItems.length - 1;

                    return (
                      <React.Fragment key={item.id}>
                        {/* Interactive Main Row with Hover Tracking (Image 3 Reference) */}
                        <tr
                          onMouseEnter={() => setHoveredRowId(item.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          onClick={() => toggleRow(item.id)}
                          className={`transition-colors duration-150 cursor-pointer select-none ${
                            isHovered ? "bg-[#F7F5EE]/80" : index % 2 === 0 ? "bg-transparent" : "bg-[#FAF8F3]/50"
                          } ${isExpanded ? "bg-[#F5F3EB]" : ""}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleRow(item.id);
                            }
                          }}
                          aria-expanded={isExpanded}
                        >
                          {/* Term Label with Chevron Indicator */}
                          <td className="py-3 px-3 text-[#14110F] font-medium pr-2">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className={`p-0.5 rounded transition-transform duration-200 text-neutral-400 ${
                                  isExpanded ? "rotate-180 text-slate-700" : ""
                                }`}
                                aria-hidden="true"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs sm:text-[13px] font-semibold text-neutral-800">
                                {item.label}
                              </span>
                            </div>
                          </td>

                          {/* Nexus Direct (Elevated Column, Image 2 & 3 Reference) */}
                          <td className={`py-3 px-3 bg-[#FAF8F3] ${isLast && !isExpanded ? "rounded-b-xl" : ""}`}>
                            <div className="flex items-center gap-2 justify-center font-bold text-center whitespace-nowrap">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                              <span className="text-xs sm:text-[13px] text-[#0F1115] font-bold">
                                {item.nexus.value}
                              </span>
                            </div>
                          </td>

                          {/* Upwork Column (Image 2 Hollow Ring / Muted Cross) */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center text-xs sm:text-[12px]">
                              {item.upwork.isPenalty ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 ring-1 ring-rose-200">
                                  <X className="w-2 h-2 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                              )}
                              <span className={item.upwork.isPenalty ? "text-neutral-700 font-medium" : "text-neutral-500"}>
                                {item.upwork.value}
                              </span>
                            </div>
                          </td>

                          {/* Talent Agencies Column (Image 2 Hollow Ring / Muted Cross) */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center text-xs sm:text-[12px]">
                              {item.agency.isPenalty ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 ring-1 ring-rose-200">
                                  <X className="w-2 h-2 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                              )}
                              <span className={item.agency.isPenalty ? "text-neutral-700 font-medium" : "text-neutral-500"}>
                                {item.agency.value}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Forensic Audit Drawer ("Open Up" State) */}
                        {isExpanded && (
                          <tr className={`bg-[#F5F3EB] ${isLast ? "rounded-b-xl" : ""}`}>
                            <td colSpan={4} className="p-3 sm:p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                {/* Nexus Forensic Box */}
                                <div className="bg-white rounded-xl p-3">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                    <span>Nexus Direct Reality</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-700 leading-relaxed font-sans">
                                    {item.nexus.audit}
                                  </p>
                                </div>

                                {/* Upwork Forensic Box */}
                                <div className="bg-white rounded-xl p-3">
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-800 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                    <span>Upwork Toll Reality</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                                    {item.upwork.audit}
                                  </p>
                                </div>

                                {/* Agency Forensic Box */}
                                <div className="bg-white rounded-xl p-3">
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-800 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                                    <span>Agency Margin Reality</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                                    {item.agency.audit}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Card Bottom Status & Action */}
            <div className="mt-5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>Every dollar negotiated is 100% retained by the creator.</span>
              </div>
              <button 
                type="button" 
                onClick={() => handleSelect("Commercial Audit")}
                className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-[#C55221] transition-colors cursor-pointer"
              >
                <span>Inspect membership terms</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Retained Revenue Simulator Card (5 cols) ── */}
        <div data-ui="revenue-simulator" className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-7 flex flex-col justify-between border border-slate-900/[0.06]">
          <div>
            {/* Simulator Header */}
            <div className="mb-4">
              <h3 className="font-['Times_New_Roman',_Times,_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#0F1115] tracking-tight">
                Retained revenue simulator
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Simulate annual take-home across billing volume
              </p>
            </div>

            {/* Hero Price Rolling Box */}
            <div className="text-center py-5 bg-[#F9F7F2] rounded-xl my-4">
              <div className="inline-flex items-baseline justify-center font-['Times_New_Roman',_Times,_Georgia,_serif] text-4xl sm:text-5xl font-bold tracking-tight text-[#0F1115] leading-none">
                <span className="text-2xl sm:text-3xl font-medium text-neutral-400 mr-1.5">$</span>
                <RollingPrice 
                  value={billings} 
                  format={(v) => v.toLocaleString("en-US")} 
                  reduced={reducedMotion} 
                />
                <span className="text-xs sm:text-sm font-medium text-neutral-500 ml-2 font-sans">/ yr</span>
              </div>

              {/* Retained Surplus Badge */}
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span>+ $</span>
                  <RollingPrice 
                    value={upworkToll} 
                    format={(v) => v.toLocaleString("en-US")} 
                    reduced={reducedMotion} 
                  />
                  <span> retained vs 20% toll</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-500 text-center max-w-sm mx-auto leading-relaxed mb-5 font-sans">
              Drag the precision slider to preview your retained earnings and platform savings. Zero extraction.
            </p>

            {/* Precision Interactive Slider & Gaussian Equalizer */}
            <div className="relative pt-6 pb-2" ref={containerRef}>
              
              {/* Floating Tooltip Pill */}
              <div 
                className="absolute top-0 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0F1115] text-white text-[11px] font-bold whitespace-nowrap pointer-events-none transition-transform duration-75"
                style={{ left: `${bubbleX}px` }}
              >
                ${fmt(billings)}
              </div>

              {/* Native Precision Slider */}
              <label htmlFor="impeccable-range" className="sr-only">
                Simulate annual billings volume
              </label>
              <input 
                id="impeccable-range"
                type="range"
                min={minVal}
                max={maxVal}
                step={5000}
                value={billings}
                onChange={(e) => setBillings(Number(e.target.value))}
                className="impeccable-slider relative z-20 w-full"
              />

              {/* 60 Gaussian Proximity Histogram Bars */}
              <div className="flex items-end justify-between h-8 mt-2 px-1 gap-[1px]" aria-hidden="true">
                {Array.from({ length: TOTAL_BARS }).map((_, idx) => {
                  const dist = Math.abs(idx - activeBarIndex);
                  let scale = 0.16;
                  const isActive = dist <= 3.5;
                  if (dist < 10) {
                    const gauss = Math.exp(-(dist * dist) / 18);
                    scale = 0.16 + gauss * 0.84;
                  }
                  return (
                    <span 
                      key={idx}
                      style={{ 
                        height: "100%",
                        transform: `scaleY(${scale.toFixed(3)})`,
                        transformOrigin: "bottom",
                        transition: reducedMotion ? "none" : "transform 0.08s ease"
                      }}
                      className={`inline-block flex-1 rounded-[1px] ${isActive ? "bg-[#0F1115]" : "bg-neutral-200"}`}
                    />
                  );
                })}
              </div>

              {/* Ruler Labels */}
              <div className="flex justify-between text-[11px] text-neutral-400 mt-2 px-0.5 font-sans" aria-hidden="true">
                <span>$20,000</span>
                <span>$65,000</span>
                <span>$110,000</span>
                <span>$155,000</span>
                <span>$200,000+</span>
              </div>
            </div>

            {/* 5 Preset Pill Buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-4" role="group" aria-label="Preset billing amounts">
              {PRESET_APERTURES.map((preset) => {
                const isActive = billings === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBillings(preset.value)}
                    className={`py-2 px-1 rounded-xl text-center transition-colors duration-150 cursor-pointer ${
                      isActive 
                        ? "bg-[#0F1115] text-white" 
                        : "bg-[#F8F7F4] text-neutral-700 hover:bg-[#EFECE6]"
                    }`}
                  >
                    <div className="text-[10px] sm:text-[11px] font-bold leading-tight">{preset.label}</div>
                    <div className="text-[9px] opacity-75 truncate mt-0.5">{preset.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Retained Purchasing Power Callout */}
            <div className="rounded-xl bg-[#F9F7F2] p-4 text-left mt-5">
              <div className="text-[11px] font-bold text-neutral-700 tracking-wider mb-1 font-sans">
                Retained purchasing power
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                {getPerkText(upworkToll)}
              </p>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => handleSelect("nexus")}
            className="w-full mt-6 py-4 px-6 rounded-full bg-[#0F1115] hover:bg-black text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
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
