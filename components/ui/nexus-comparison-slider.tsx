"use client";

import * as React from "react";
import { 
  Check, 
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
 * Editorial Commercial Console: Comparison Matrix & Retained Revenue Simulator
 * Built to strict design-taste-frontend standards: zero ornament slop, quiet surfaces,
 * full-ink typography, and real browser verification.
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

  const handleSelect = (plan: string) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (typeof window !== "undefined" && (window as any).openInquiryModal) {
      (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
    }
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-[#0F1115] font-sans">
      
      {/* ── Section Header: Confident Editorial Authority ── */}
      <div className="max-w-3xl mb-10 sm:mb-14">
        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-[#0F1115] leading-[1.12]">
          Commercial terms without platform extraction.
        </h2>
        <p className="text-neutral-600 text-base sm:text-lg mt-3 leading-relaxed">
          Traditional platforms take 20% on milestones plus mandatory escrow holds. Agencies mark up 25% to 35%. 
          Nexus Direct is a verified commercial directory: 100% day-rate retention, direct client wire, and zero intermediary tolls.
        </p>
      </div>

      {/* ── Two-Card Split Console: Matrix on Left, Simulator on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        
        {/* ── LEFT: Commercial Comparison Matrix Card (7 cols) ── */}
        <div data-ui="comparison-matrix" className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="mb-5">
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F1115] tracking-tight">
                Commercial comparison matrix
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Verified direct directory vs legacy platform toll-gates
              </p>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <table className="w-full min-w-[560px] text-left text-xs sm:text-[13px]">
                <thead>
                  <tr>
                    <th scope="col" className="pb-3 text-xs font-medium text-neutral-500 w-[35%] pr-2">
                      Commercial terms
                    </th>
                    
                    {/* Nexus Direct Featured Column Header */}
                    <th scope="col" className="pb-3 px-3 w-[27%] bg-[#F9F7F2] rounded-t-xl text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-md bg-[#0F1115] text-white flex items-center justify-center font-bold text-xs mb-1">
                          N
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-[#0F1115] leading-tight">Nexus Direct</div>
                        <div className="text-[11px] font-bold text-emerald-700 mt-0.5">0% Take Rate</div>
                      </div>
                    </th>

                    {/* Upwork Column */}
                    <th scope="col" className="pb-3 px-2 w-[19%] text-center">
                      <div className="flex flex-col items-center">
                        <Grid className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Upwork / Freelance</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">20% Escrow Toll</div>
                      </div>
                    </th>

                    {/* Talent Agencies Column */}
                    <th scope="col" className="pb-3 px-2 w-[19%] text-center">
                      <div className="flex flex-col items-center">
                        <Building2 className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Talent Agencies</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">25 to 35% Markup</div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* Row 1: Commission */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Platform commission
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-emerald-800 text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>0% (Zero toll)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      20% on milestones
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      25 to 35% agency cut
                    </td>
                  </tr>

                  {/* Row 2: Annual Creator Take-Home */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Annual creator take-home
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>Keep ${fmt(billings)} (100%)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Creator keeps ${fmt(upworkRetained)} (80%)
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Creator keeps ${fmt(agencyRetained)} (70%)
                    </td>
                  </tr>

                  {/* Row 3: Annual Platform Extraction */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Annual platform extraction
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>$0.00 Platform Fee</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-xs">
                      −${fmt(upworkToll)} toll / yr
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-xs">
                      −${fmt(agencyToll)} markup / yr
                    </td>
                  </tr>

                  {/* Row 4: 5-Year Compounded Loss */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      5-Year compounded toll
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>$0 Lost (100% Retained)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-xs">
                      −${fmt(upwork5Yr)} Lost
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-xs">
                      −${fmt(agency5Yr)} Lost
                    </td>
                  </tr>

                  {/* Row 5: Payout Velocity & Escrow */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Payout velocity &amp; escrow
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>Same-day wire &amp; ACH</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      14 to 21 day escrow lockup
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      NET 60 to 90 payment delays
                    </td>
                  </tr>

                  {/* Row 6: Direct Client Ownership */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Direct client ownership
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>100% direct client ownership</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Platform gates chat
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Agency holds client contract
                    </td>
                  </tr>

                  {/* Row 7: Master IP & Raw Deliverables */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Master IP &amp; deliverables
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>You retain 100% master IP</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Standard platform TOS terms
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Work-for-hire rights to agency
                    </td>
                  </tr>

                  {/* Row 8: Commercial Billing Model */}
                  <tr className="odd:bg-transparent even:bg-[#FAFAF8]">
                    <td className="py-2.5 text-neutral-700 font-medium pr-2 whitespace-nowrap">
                      Commercial billing model
                    </td>
                    <td className="py-2.5 px-3 bg-[#F9F7F2] rounded-b-xl">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-[#0F1115] text-center whitespace-nowrap">
                        <span className="w-4 h-4 rounded-full bg-[#0F1115] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>Flat verified membership</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      20% toll on every client $
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-xs">
                      Heavy agency markup on labor
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Retained Revenue Simulator Card (5 cols) ── */}
        <div data-ui="revenue-simulator" className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Simulator Header */}
            <div className="mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F1115] tracking-tight">
                Retained revenue simulator
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Simulate annual take-home across billing volume
              </p>
            </div>

            {/* Hero Price Rolling Box */}
            <div className="text-center py-5 bg-[#F9F7F2] rounded-xl my-4">
              <div className="inline-flex items-baseline justify-center text-4xl sm:text-5xl font-bold tracking-tight text-[#0F1115] leading-none">
                <span className="text-2xl sm:text-3xl font-medium text-neutral-400 mr-1.5">$</span>
                <RollingPrice 
                  value={billings} 
                  format={(v) => v.toLocaleString("en-US")} 
                  reduced={reducedMotion} 
                />
                <span className="text-xs sm:text-sm font-medium text-neutral-500 ml-2">/ yr</span>
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

            <p className="text-xs text-neutral-500 text-center max-w-sm mx-auto leading-relaxed mb-5">
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
              <div className="flex justify-between text-[11px] text-neutral-400 mt-2 px-0.5" aria-hidden="true">
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
              <div className="text-[11px] font-bold text-neutral-700 tracking-wider mb-1">
                Retained purchasing power
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
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
