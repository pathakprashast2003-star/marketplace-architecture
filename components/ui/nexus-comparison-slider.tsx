"use client";

import * as React from "react";
import { 
  Check, 
  Zap, 
  ArrowRight,
  Percent,
  Wallet,
  TrendingDown,
  Clock,
  Send,
  Users,
  FileCheck,
  CreditCard,
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
 * Impeccable Design System: Editorial Times New Roman & Apple-Style Commercial Console
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

  const handleSelect = (plan: string) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (typeof window !== "undefined" && (window as any).openInquiryModal) {
      (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-neutral-900 font-sans">
      
      {/* ── Editorial Section Header: Times New Roman + Apple Balance + Film Collage ── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-8 sm:mb-10 relative">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.22em] text-neutral-500 uppercase font-sans mb-3">
            PRICING &amp; ROSTER
          </p>
          <h2 className="font-['Times_New_Roman',_Times,_Georgia,_serif] text-4xl sm:text-5xl md:text-[52px] font-normal tracking-tight text-neutral-950 leading-[1.08]">
            Find the right plan<br />
            for your <span className="italic text-[#C55221]">production.</span>
          </h2>
          <p className="text-neutral-500 text-sm sm:text-base font-normal mt-3 font-sans leading-relaxed">
            Transparent pricing. Maximum value.
          </p>
        </div>

        {/* Artistic Photographic Collage: Burnt Orange Sun + 35mm Strip + Polaroid */}
        <div className="hidden sm:flex items-center justify-end shrink-0 pointer-events-none select-none relative">
          <img 
            src="assets/editorial_header_art_transparent.png" 
            alt="Editorial film and cinema production collage" 
            className="w-[300px] sm:w-[350px] md:w-[390px] h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* ── Apple-Grade Two-Card Console: Matrix on Left, Simulator on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
        
        {/* ── LEFT: Commercial Comparison Matrix Card (7 cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8E2D9] p-5 sm:p-7 shadow-[0_20px_50px_-15px_rgba(40,30,20,0.06)] relative flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Curled Film Negative at bottom-left */}
          <img 
            src="assets/editorial_corner_film_transparent.png" 
            alt="" 
            className="absolute -bottom-2 -left-2 w-20 pointer-events-none select-none opacity-85 z-0" 
            aria-hidden="true" 
          />

          <div className="relative z-10">
            {/* Card Header */}
            <div className="mb-5">
              <h3 className="font-['Times_New_Roman',_Times,_Georgia,_serif] text-2xl sm:text-[26px] font-semibold text-neutral-950 tracking-tight">
                Commercial Comparison Matrix
              </h3>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                Verified direct directory vs legacy platform toll-gates
              </p>
            </div>

            {/* Matrix Table with Continuous Nexus Column Pill */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs" aria-label="Commercial comparison matrix">
                <thead>
                  <tr className="border-b border-[#F0EBE3]">
                    <th scope="col" className="pb-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider w-[34%]">
                      Commercial terms
                    </th>
                    
                    {/* Nexus Direct Featured Column Header */}
                    <th scope="col" className="pb-3 px-2.5 w-[26%] bg-[#FFF7F1] border-t border-x border-[#FADCD0] rounded-t-2xl text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-md bg-[#C55221] text-white flex items-center justify-center font-bold text-xs mb-1 shadow-xs">
                          N
                        </div>
                        <div className="font-bold text-xs text-neutral-900 leading-tight">Nexus Direct</div>
                        <div className="text-[11px] font-bold text-[#C55221] mt-0.5">0% Take Rate</div>
                      </div>
                    </th>

                    {/* Upwork Column */}
                    <th scope="col" className="pb-3 px-2 w-[20%] text-center">
                      <div className="flex flex-col items-center">
                        <Grid className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Upwork / Freelance</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">20% Escrow Toll</div>
                      </div>
                    </th>

                    {/* Talent Agencies Column */}
                    <th scope="col" className="pb-3 px-2 w-[20%] text-center">
                      <div className="flex flex-col items-center">
                        <Building2 className="w-4 h-4 text-neutral-400 mb-1" />
                        <div className="font-semibold text-xs text-neutral-700 leading-tight">Talent Agencies</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">25 to 35% Markup</div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F2EDE5]">
                  {/* Row 1: Commission */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Platform commission</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>0% (Zero toll)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      20% on milestones
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      25 to 35% agency cut
                    </td>
                  </tr>

                  {/* Row 2: Annual Creator Take-Home */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Annual creator take-home</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>Keep ${fmt(billings)} (100% Retained)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Creator keeps ${fmt(upworkRetained)} (80%)
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Creator keeps ${fmt(agencyRetained)} (70%)
                    </td>
                  </tr>

                  {/* Row 3: Annual Platform Extraction */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Annual platform extraction</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>$0.00 Platform Fee</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-[11px]">
                      −${fmt(upworkToll)} toll / yr
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-[11px]">
                      −${fmt(agencyToll)} markup / yr
                    </td>
                  </tr>

                  {/* Row 4: 5-Year Compounded Loss */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>5-Year compounded loss</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>$0 Lost (100% Retained)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-[11px]">
                      −${fmt(upwork5Yr)} Lost
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-600 font-medium text-[11px]">
                      −${fmt(agency5Yr)} Lost
                    </td>
                  </tr>

                  {/* Row 5: Payout Velocity & Escrow */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Payout velocity and escrow</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>Same-day wire &amp; ACH</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      14 to 21 day escrow lockup
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      NET 60 to 90 payment delays
                    </td>
                  </tr>

                  {/* Row 6: Direct Client Ownership */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Direct client ownership</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>100% direct client ownership</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Platform gates &amp; monitors chat
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Agency holds client contract
                    </td>
                  </tr>

                  {/* Row 7: Master IP & Raw Deliverables */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Master IP and raw deliverables</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-x border-[#FADCD0]">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>You retain 100% master IP</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Standard platform TOS terms
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Work-for-hire rights to agency
                    </td>
                  </tr>

                  {/* Row 8: Commercial Billing Model */}
                  <tr>
                    <td className="py-2.5 text-neutral-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Commercial billing model</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 bg-[#FFF7F1] border-b border-x border-[#FADCD0] rounded-b-2xl">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-neutral-900 text-center whitespace-nowrap">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#C55221] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                        <span>Flat verified membership</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      20% toll on every client $
                    </td>
                    <td className="py-2.5 px-2 text-center text-neutral-500 text-[11px]">
                      Heavy agency markup on labor
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Retained Revenue Simulator Card (5 cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8E2D9] p-5 sm:p-7 shadow-[0_20px_50px_-15px_rgba(40,30,20,0.06)] flex flex-col justify-between">
          <div>
            {/* Simulator Header */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-600 uppercase font-sans">
                <span className="w-2 h-2 rounded-full bg-[#C55221] inline-block animate-pulse" />
                <span>RETAINED REVENUE SIMULATOR</span>
              </div>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                Simulate annual take-home across billing volume
              </p>
            </div>

            {/* Hero Times New Roman Price Rolling Box */}
            <div className="text-center py-4 border-y border-[#F2ECE4] my-3">
              <div className="inline-flex items-baseline justify-center font-['Times_New_Roman',_Times,_Georgia,_serif] text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 leading-none">
                <span className="text-2xl sm:text-3xl font-normal text-neutral-400 mr-1.5">$</span>
                <RollingPrice 
                  value={billings} 
                  format={(v) => v.toLocaleString("en-US")} 
                  reduced={reducedMotion} 
                />
                <span className="text-xs sm:text-sm font-normal text-neutral-500 font-sans ml-2">/ yr</span>
              </div>

              {/* Synchronized Retained Surplus Badge */}
              <div className="mt-2.5 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF9F0] border border-[#C3E6CB] text-[#1E7E34] text-xs font-semibold shadow-xs">
                  <span className="text-[10px]">✦</span>
                  <span>+ $</span>
                  <RollingPrice 
                    value={upworkToll} 
                    format={(v) => v.toLocaleString("en-US")} 
                    reduced={reducedMotion} 
                  />
                  <span> Retained</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 text-center max-w-sm mx-auto leading-relaxed font-sans mb-4">
              Drag the precision slider to preview your retained earnings and platform savings. Zero extraction.
            </p>

            {/* Precision Interactive Slider & 60-Bar Gaussian Equalizer */}
            <div className="relative pt-6 pb-2" ref={containerRef}>
              
              {/* Floating Tooltip Pill */}
              <div 
                className="absolute top-0 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white border border-[#E5DFD5] text-[#C55221] font-mono text-[11px] font-bold shadow-sm whitespace-nowrap pointer-events-none transition-transform duration-75"
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
                      className={`inline-block flex-1 rounded-[1px] ${isActive ? "bg-[#C55221]" : "bg-[#F0A882]/50"}`}
                    />
                  );
                })}
              </div>

              {/* Ruler Labels */}
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-2 px-0.5" aria-hidden="true">
                <span>$20,000</span>
                <span>$65,000</span>
                <span>$110,000</span>
                <span>$155,000</span>
                <span>$200,000+</span>
              </div>
            </div>

            {/* 5 Aperture Preset Pill Buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-4" role="group" aria-label="Preset billing amounts">
              {PRESET_APERTURES.map((preset) => {
                const isActive = billings === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBillings(preset.value)}
                    className={`py-1.5 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                      isActive 
                        ? "bg-[#FFF8F3] border-[#FADCD0] text-neutral-950 shadow-xs ring-1 ring-[#C55221]/20" 
                        : "bg-neutral-50/70 border-neutral-200/70 text-neutral-600 hover:bg-neutral-100/80"
                    }`}
                  >
                    <div className="text-[10px] sm:text-[11px] font-bold leading-tight">{preset.label}</div>
                    <div className="text-[9px] text-neutral-400 truncate mt-0.5">{preset.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Retained Purchasing Power Callout */}
            <div className="rounded-2xl bg-[#FFF6F0] border border-[#FADCD0] p-3.5 text-left mt-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C55221] tracking-wider uppercase mb-1">
                <Zap className="w-3.5 h-3.5 fill-[#C55221] text-[#C55221]" />
                <span>RETAINED PURCHASING POWER</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                {getPerkText(upworkToll)}
              </p>
            </div>
          </div>

          {/* Primary CTA Button (Apple Style) */}
          <button
            type="button"
            onClick={() => handleSelect("nexus")}
            className="w-full mt-5 py-3.5 px-6 rounded-full bg-[#161616] hover:bg-black text-white text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
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
