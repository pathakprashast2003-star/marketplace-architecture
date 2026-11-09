"use client";

import * as React from "react";
import { 
  ArrowUpRight, 
  Check, 
  X, 
  Zap, 
  SlidersHorizontal 
} from "lucide-react";
import { 
  UsageSliderPricingTable, 
  type UsagePricingPlan, 
  type UsagePricingRow, 
  type UsagePricingAxis
} from "./usage-slider-pricing-table";

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

function RollingPrice({ value, format, reduced }: { value: number; format: (value: number) => string; reduced: boolean }) {
  const text = format(value);
  return (
    <span data-price={value} className="inline-flex items-baseline whitespace-nowrap font-semibold tabular-nums tracking-tight">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {Array.from(text).map((character, index) =>
          /\d/.test(character) ? (
            <span key={text.length - index} className="relative inline-block h-[1em] w-[0.62em] overflow-hidden">
              <span
                data-digit
                style={{
                  transform: `translateY(-${Number(character)}em)`,
                  transition: reduced ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
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

// ── 1. Plan Definitions tailored to the Nexus Commercial Comparison Section ──
export const NEXUS_COMPARISON_PLANS: UsagePricingPlan[] = [
  {
    id: "nexus",
    name: "Nexus Direct",
    basePrice: 0,
    highlights: ["0% Take Rate", "100% Retained", "Direct Wire"],
  },
  {
    id: "upwork",
    name: "Upwork / Freelance",
    basePrice: 0,
    perSeat: 0.20,
    highlights: ["20% Escrow Toll", "14-21 Day Holds", "TOS Monitoring"],
  },
  {
    id: "agency",
    name: "Talent Agencies",
    basePrice: 0,
    perSeat: 0.30,
    highlights: ["25 to 35% Markup", "Net 60-90 Terms", "IP Surrender"],
  },
];

// ── 2. Billings Volume Axis ($20,000 to $200,000 in $5,000 steps) ──
export const BILLINGS_AXIS: UsagePricingAxis = {
  key: "seats",
  min: 20000,
  max: 200000,
  step: 5000,
  format: (value: number) => `$${value.toLocaleString("en-US")}`,
  label: "Annual Billings Volume",
};

// ── Dynamic Studio Gear Reinvestment Packages ──
const GEAR_TIERS = [
  {
    threshold: 55000,
    items: [
      { cat: 'Cinema Camera', name: 'Sony FX6 Cinema Kit', val: '$3,200', desc: 'Full-frame 4K camera body, V-mount batteries & monitor for 2nd unit ops' },
      { cat: 'Travel & Crew', name: '4× Location Flights', val: '$2,400', desc: 'Roundtrip commercial scouting flights with heavy pelican case baggage' },
      { cat: 'Post Storage', name: '12TB NVMe RAID Array', val: '$1,400', desc: 'Blazing fast Thunderbolt 4 working volume for 6K ProRes RAW dailies' },
      { cat: 'Equipment Shield', name: 'Gear Floater Policy', val: '$1,000', desc: 'Worldwide camera & lens loss/theft protection with zero deductible' }
    ]
  },
  {
    threshold: 105000,
    items: [
      { cat: 'Cinema Camera', name: 'RED Komodo 6K Package', val: '$6,800', desc: 'Global shutter cinema body, cage, breakout box & RF mount cine lenses' },
      { cat: 'Travel & Crew', name: '8× Commercial Flights', val: '$4,800', desc: 'Cross-country production scout flights + 2nd unit DP travel accommodation' },
      { cat: 'Studio Compute', name: 'M3 Max 128GB Workstation', val: '$3,200', desc: 'Real-time 8K playback, color grading & DaVinci Resolve Studio surface' },
      { cat: 'Equipment Shield', name: 'Comprehensive E&O Policy', val: '$1,200', desc: 'Errors and omissions liability policy for national commercial distribution' }
    ]
  },
  {
    threshold: 155000,
    items: [
      { cat: 'Cinema Optics', name: 'Atlas Orion Anamorphic Set', val: '$11,500', desc: '2× anamorphic prime lenses for cinematic commercial look & oval bokeh' },
      { cat: 'Lighting Kit', name: 'Aputure Electro Storm Kit', val: '$7,200', desc: 'Point-source BLAIR LED fixtures for commercial daylight simulation' },
      { cat: 'Studio Compute', name: 'Mac Studio Ultra 192GB', val: '$4,500', desc: 'Dual ProRes engines running uncompressed open-gate raw workflows' },
      { cat: 'Studio Space', name: 'Production Loft Space', val: '$8,800', desc: 'Dedicated downtown edit suite & client review screening lounge' }
    ]
  },
  {
    threshold: Infinity,
    items: [
      { cat: 'Flagship Camera', name: 'ARRI Alexa Mini LF Package', val: '$18,000', desc: 'Large format cinema package rental for premium global fashion & auto spots' },
      { cat: 'Grip & Electric', name: 'Complete 3-Ton Grip Van', val: '$8,500', desc: 'Full commercial grip truck rental with dana dolly & modern rigging gear' },
      { cat: 'Studio Space', name: 'Annual Loft Lease Deposit', val: '$9,500', desc: 'High-ceiling industrial studio space in Brooklyn or Los Angeles Arts District' },
      { cat: 'Legal Counsel', name: 'Production Legal Retainer', val: '$4,000', desc: 'Retained commercial entertainment attorney for contract & buy-out review' }
    ]
  }
];

const getPerkText = (saved: number) => {
  if (saved < 7000) {
    return 'Equivalent to your annual camera gear insurance policy + 12TB encrypted cloud dailies backup.';
  } else if (saved < 14000) {
    return 'Equivalent to a complete RED Komodo 6K cinema package rental for 4 commercial shoots.';
  } else if (saved < 24000) {
    return 'Equivalent to 8 commercial shoot flights + 2 master anamorphic prime lens rentals.';
  } else {
    return 'Equivalent to 100% of your annual creative studio lease in Brooklyn, Austin, or Berlin.';
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
 * Editorial Two-Column Comparison & Retained Revenue Simulator
 * Matches screenshot media_1794205285106_c198f12d.jpg with high-fidelity
 * React number flipping (RollingPrice) and smooth slider interactivity.
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
  const [containerWidth, setContainerWidth] = React.useState(720);

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
        setContainerWidth(containerRef.current.offsetWidth || 720);
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

  // Current gear tier
  const gearTier = GEAR_TIERS.find(t => billings <= t.threshold) || GEAR_TIERS[GEAR_TIERS.length - 1];

  const fmt = (n: number) => n.toLocaleString("en-US");

  // Floating bubble horizontal offset
  const offsetPx = 14 - pct * 0.28;
  const bubbleX = (pct / 100) * containerWidth + offsetPx;

  return (
    <div className="nx-comparison-root nx-comparison-wrapper w-full">
      {/* ── Monolith Header (Section 02 / 04) ── */}
      <div className="nx-monolith-header is-in">
        <div className="nx-compare-kicker-pill" aria-hidden="true">
          <span>Compare platforms</span>
        </div>
        <h2 className="nx-monolith-h2">How does Nexus compare to traditional platforms?</h2>
        <p className="nx-monolith-lead">
          Traditional freelance platforms take around 20% of every project plus mandatory escrow holds. 
          Nexus is a verified direct directory: one flat membership, 100% day-rate retention, and direct client wire.
        </p>
      </div>

      {/* ── The Unified Editorial Split Console: Table on Left, Calculator on Right ── */}
      <div className="nx-compare-layout is-in">
        
        {/* LEFT: Commercial Comparison Matrix Panel */}
        <div className="nx-table-panel">
          <div className="nx-panel-header">
            <span className="nx-panel-tag">Commercial comparison matrix</span>
            <span className="nx-panel-sub">Verified direct directory vs legacy platform toll-gates</span>
          </div>

          <div className="nx-annot-table-wrap">
            <table className="nx-annot-table" aria-label="Nexus vs Traditional Marketplaces comparison">
              <thead>
                <tr>
                  <th className="nx-th-feat">Commercial terms</th>
                  
                  {/* Nexus Direct Featured Column */}
                  <th className="nx-th-nexus">
                    <div className="nx-col-brand-header">
                      <div className="nx-col-logo-badge" aria-hidden="true">N</div>
                      <div className="nx-col-logo">Nexus Direct</div>
                      <div className="nx-col-take-rate">0% Take Rate</div>
                    </div>
                  </th>

                  {/* Upwork Column */}
                  <th className="nx-th-trad">
                    <div className="nx-col-brand-header">
                      <div className="nx-col-logo-muted" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="6" height="6" rx="1.5"></rect>
                          <rect x="11" y="3" width="6" height="6" rx="1.5"></rect>
                          <rect x="3" y="11" width="6" height="6" rx="1.5"></rect>
                          <rect x="11" y="11" width="6" height="6" rx="1.5"></rect>
                        </svg>
                      </div>
                      <div className="nx-col-muted-title">Upwork / Freelance</div>
                      <div className="nx-col-muted-rate">20% Escrow Toll</div>
                    </div>
                  </th>

                  {/* Talent Agencies Column */}
                  <th className="nx-th-agency">
                    <div className="nx-col-brand-header">
                      <div className="nx-col-logo-muted" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 17.5h14"></path>
                          <path d="M5 17.5v-12a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12"></path>
                          <path d="M8 8h1"></path>
                          <path d="M11 8h1"></path>
                          <path d="M8 11h1"></path>
                          <path d="M11 11h1"></path>
                          <path d="M8 14h1"></path>
                          <path d="M11 14h1"></path>
                        </svg>
                      </div>
                      <div className="nx-col-muted-title">Talent Agencies</div>
                      <div className="nx-col-muted-rate">25 to 35% Markup</div>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Row 1: Commission */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="6.5" cy="6.5" r="2.5"></circle>
                        <circle cx="13.5" cy="13.5" r="2.5"></circle>
                        <line x1="15.5" y1="4.5" x2="4.5" y2="15.5"></line>
                      </svg>
                      <span>Platform commission</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <strong className="nx-win-figure">0% (Zero toll)</strong>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">20% on milestones</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">25 to 35% agency cut</span>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Annual Creator Take-Home */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2.5" y="5.5" width="15" height="10" rx="2"></rect>
                        <path d="M14.5 10.5h.01"></path>
                        <path d="M5.5 5.5v-1a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Annual creator take-home</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <strong className="nx-win-figure">Keep ${fmt(billings)} (100% Retained)</strong>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">Creator keeps ${fmt(upworkRetained)} (80%)</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">Creator keeps ${fmt(agencyRetained)} (70%)</span>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Annual Platform Extraction */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="16.5 13.5 11 8 7.5 11.5 3.5 7.5"></polyline>
                        <polyline points="12.5 13.5 16.5 13.5 16.5 9.5"></polyline>
                      </svg>
                      <span>Annual platform extraction</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <strong className="nx-win-figure">$0.00 Platform Fee</strong>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">−${fmt(upworkToll)} toll / yr</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">−${fmt(agencyToll)} markup / yr</span>
                    </div>
                  </td>
                </tr>

                {/* Row 4: 5-Year Compounded Loss */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="10" cy="10" r="7.5"></circle>
                        <polyline points="10 6 10 10 13 11.5"></polyline>
                      </svg>
                      <span>5-Year compounded loss</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <strong className="nx-win-figure">$0 Lost (100% Retained)</strong>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">−${fmt(upwork5Yr)} Lost</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span className="nx-loss-figure">−${fmt(agency5Yr)} Lost</span>
                    </div>
                  </td>
                </tr>

                {/* Row 5: Payout Velocity and Escrow */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="11 2.5 4.5 11 9.5 11 8.5 17.5 15.5 9 10.5 9 11 2.5"></polygon>
                      </svg>
                      <span>Payout velocity and escrow</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <span>Same-day wire &amp; ACH</span>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>14 to 21 day escrow lockup</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>NET 60 to 90 payment delays</span>
                    </div>
                  </td>
                </tr>

                {/* Row 6: Client Communication */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="10" cy="6" r="3.5"></circle>
                        <path d="M3.5 16.5c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"></path>
                      </svg>
                      <span>Direct client ownership</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <span>100% direct client ownership</span>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>Platform gates &amp; monitors chat</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>Agency holds client contract</span>
                    </div>
                  </td>
                </tr>

                {/* Row 7: Master IP */}
                <tr>
                  <td className="nx-td-feat">
                    <div className="nx-feat-content">
                      <svg className="nx-feat-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4.5v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8l-5-5H6a2 2 0 0 0-2 2z"></path>
                        <polyline points="11 2.5 11 7.5 16 7.5"></polyline>
                      </svg>
                      <span>Master IP and raw deliverables</span>
                    </div>
                  </td>
                  <td className="nx-td-nexus">
                    <div className="nx-cell-content">
                      <span className="nx-check-circle" aria-label="Included">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2.5 6.2L4.6 8.3L9.5 3.5"></path>
                        </svg>
                      </span>
                      <span>You retain 100% master IP</span>
                    </div>
                  </td>
                  <td className="nx-td-trad">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>Standard platform TOS terms</span>
                    </div>
                  </td>
                  <td className="nx-td-agency">
                    <div className="nx-cell-content">
                      <span className="nx-cross-circle" aria-label="Excluded">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"></path>
                        </svg>
                      </span>
                      <span>Work-for-hire rights to agency</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Retained Revenue Simulator Panel */}
        <div className="nx-calc-panel">
          <div className="nx-panel-header">
            <span className="nx-panel-tag">Retained revenue simulator</span>
            <span className="nx-panel-sub">Simulate annual take-home across billing volume</span>
          </div>

          <div className="nx-calc-body">
            
            {/* Hero Rolling Odometer Box */}
            <div className="nx-odometer-hero-box">
              <div className="nx-odo-price-group">
                <span className="nx-odo-currency">$</span>
                <div className="nx-odo-reel-wrap">
                  <RollingPrice 
                    value={billings} 
                    format={(v: number) => v.toLocaleString("en-US")} 
                    reduced={reducedMotion} 
                  />
                </div>
                <span className="nx-odo-unit">/ yr</span>
              </div>

              {/* Synchronized Surplus Badge with Rolling Retained Value */}
              <div>
                <span className="nx-odo-surplus-badge" id="nxSave">
                  <span>+ $</span>
                  <RollingPrice 
                    value={upworkToll} 
                    format={(v: number) => v.toLocaleString("en-US")} 
                    reduced={reducedMotion} 
                  />
                  <span> Retained</span>
                </span>
              </div>
            </div>

            <div className="nx-scrubber-subtext">
              Drag the precision slider to preview your retained earnings and platform savings. Zero extraction.
            </div>

            {/* Slider Container with Floating Speech Bubble & 60-Bar Gaussian Wave */}
            <div className="nx-slider-container" ref={containerRef}>
              
              {/* Floating Tooltip Bubble */}
              <div 
                className="nx-slider-bubble"
                style={{ 
                  transform: `translateX(${bubbleX}px) translateX(-50%)`
                }} 
              >
                <span>$</span>
                <RollingPrice 
                  value={billings} 
                  format={(v: number) => v.toLocaleString("en-US")} 
                  reduced={reducedMotion} 
                />
              </div>

              {/* Native Precision Slider */}
              <label htmlFor="nxEarn" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}>
                Adjust yearly billings
              </label>
              <input 
                id="nxEarn"
                type="range"
                min={minVal}
                max={maxVal}
                step={5000}
                value={billings}
                onChange={(e) => setBillings(Number(e.target.value))}
                className="nx-precision-slider"
                style={{
                  ["--range-pct" as string]: `${pct}%`
                }}
              />

              {/* 60 Gaussian Proximity Histogram Bars */}
              <div className="nx-histogram-bars" aria-hidden="true">
                {Array.from({ length: TOTAL_BARS }).map((_, idx) => {
                  const dist = Math.abs(idx - activeBarIndex);
                  let scale = 0.18;
                  const isActive = dist <= 3.5;
                  if (dist < 10) {
                    const gauss = Math.exp(-(dist * dist) / 18);
                    scale = 0.18 + gauss * 0.82;
                  }
                  return (
                    <span 
                      key={idx}
                      style={{ 
                        transform: `scaleY(${scale.toFixed(3)})`,
                        transformOrigin: "bottom",
                        transition: reducedMotion ? "none" : "transform 0.08s ease, background-color 0.12s ease"
                      }}
                      className={`nx-hist-bar ${isActive ? "is-active" : ""}`}
                    />
                  );
                })}
              </div>

              {/* Ruler Labels */}
              <div className="nx-ruler-labels" aria-hidden="true">
                <span>$20,000</span>
                <span>$65,000</span>
                <span>$110,000</span>
                <span>$155,000</span>
                <span>$200,000+</span>
              </div>
            </div>

            {/* 5 Aperture Presets */}
            <div className="nx-aperture-stops" role="group" aria-label="Preset annual billings">
              {PRESET_APERTURES.map((preset) => {
                const isActive = billings === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBillings(preset.value)}
                    className={`nx-aperture-stop ${isActive ? "is-active" : ""}`}
                  >
                    <span>{preset.label}</span>
                    <small>{preset.sub}</small>
                  </button>
                );
              })}
            </div>

            {/* Retained Purchasing Power Callout Box */}
            <div className="nx-calc-impact-box">
              <div className="nx-impact-header">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 2.5 4.5 11 9.5 11 8.5 17.5 15.5 9 10.5 9 11 2.5"></polygon>
                </svg>
                <span>Retained purchasing power</span>
              </div>
              <div className="nx-impact-body">
                {getPerkText(upworkToll)}
              </div>
            </div>

            {/* Dynamic 4-Item Gear Reinvestment Grid */}
            <div className="nx-reinvest-grid">
              {gearTier.items.map((item, idx) => (
                <div key={idx} className="nx-reinvest-card">
                  <div>
                    <div className="nx-card-cat">{item.cat}</div>
                    <div className="nx-card-name">{item.name}</div>
                  </div>
                  <div>
                    <div className="nx-card-val">{item.val} / yr</div>
                    <div className="nx-card-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a 
              className="nx-monolith-cta-btn" 
              href="#roster"
              onClick={(e) => {
                if (onSelectPlan) {
                  e.preventDefault();
                  onSelectPlan("nexus");
                }
              }}
            >
              <span>Apply for curated membership</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </a>

          </div>
        </div>

      </div>
    </div>
  );
}

export default NexusComparisonSection;
