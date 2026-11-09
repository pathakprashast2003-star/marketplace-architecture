"use client";

import React from "react";
import ReactDOM from "react-dom/client";
import { 
  Check, 
  X, 
  ArrowUpRight 
} from "lucide-react";
import { 
  UsageSliderPricingTable, 
  type UsagePricingPlan, 
  type UsagePricingRow, 
  type UsagePricingAxis 
} from "../components/ui/usage-slider-pricing-table";
import "../styles/globals.css";

// ── 1. Plan Definitions tailored to the Nexus Commercial Comparison ──
export const NEXUS_COMPARISON_PLANS: UsagePricingPlan[] = [
  {
    id: "nexus",
    name: "Nexus Direct",
    basePrice: 0, // 0% platform extraction on creator billings
    highlights: ["0% Take Rate", "100% Retained", "Direct Client Wire"],
  },
  {
    id: "upwork",
    name: "Upwork / Freelance",
    basePrice: 0,
    perSeat: 0.20, // 20% platform escrow cut
    highlights: ["20% Escrow Toll", "14-21 Day Holds", "TOS Monitoring"],
  },
  {
    id: "agency",
    name: "Talent Agencies",
    basePrice: 0,
    perSeat: 0.30, // 30% agency fee markup
    highlights: ["25 to 35% Markup", "Net 60-90 Terms", "IP Surrender"],
  },
];

// ── 2. Billings Volume Axis ($20,000 to $200,000 in $5,000 increments) ──
export const BILLINGS_AXIS: UsagePricingAxis = {
  key: "seats",
  min: 20000,
  max: 200000,
  step: 5000,
  format: (value: number) => `$${value.toLocaleString("en-US")}`,
  label: "Annual Billings Volume",
};

// ── 3. Feature Comparison Rows matching all platform criteria ──
export const NEXUS_COMPARISON_ROWS: UsagePricingRow[] = [
  {
    label: "% Platform commission",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> 0% (Zero toll)
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-neutral-500">
            <X className="size-3 text-neutral-400" /> 20% on milestones
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <X className="size-3 text-neutral-400" /> 25 to 35% agency cut
        </span>
      );
    },
  },
  {
    label: "Annual creator take-home",
    values: (plan, quote) => {
      const billings = quote.seats;
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> Keep ${billings.toLocaleString("en-US")} (100% Retained)
          </span>
        );
      }
      if (plan.id === "upwork") {
        const retained = Math.round(billings * 0.8);
        return (
          <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <X className="size-3 text-neutral-400" /> Creator keeps ${retained.toLocaleString("en-US")} (80%)
          </span>
        );
      }
      const agencyRetained = Math.round(billings * 0.7);
      return (
        <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <X className="size-3 text-neutral-400" /> Creator keeps ${agencyRetained.toLocaleString("en-US")} (70%)
        </span>
      );
    },
  },
  {
    label: "Annual platform extraction",
    values: (plan, quote) => {
      const billings = quote.seats;
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> $0.00 Platform Fee
          </span>
        );
      }
      if (plan.id === "upwork") {
        const toll = Math.round(billings * 0.2);
        return <span className="font-semibold text-rose-600 dark:text-rose-400">−${toll.toLocaleString("en-US")} toll / yr</span>;
      }
      const agencyToll = Math.round(billings * 0.3);
      return <span className="font-semibold text-rose-600 dark:text-rose-400">−${agencyToll.toLocaleString("en-US")} markup / yr</span>;
    },
  },
  {
    label: "5-Year compounded loss",
    values: (plan, quote) => {
      const billings = quote.seats;
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> $0 Lost (100% Retained)
          </span>
        );
      }
      if (plan.id === "upwork") {
        const toll5Yr = Math.round(billings * 0.2 * 5);
        return <span className="font-semibold text-rose-600 dark:text-rose-400">−${toll5Yr.toLocaleString("en-US")} Lost</span>;
      }
      const agency5Yr = Math.round(billings * 0.3 * 5);
      return <span className="font-semibold text-rose-600 dark:text-rose-400">−${agency5Yr.toLocaleString("en-US")} Lost</span>;
    },
  },
  {
    label: "Payout velocity and escrow",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
            <Check className="size-3.5 stroke-[2.5]" /> Same-day direct wire &amp; ACH
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-neutral-500">
            <X className="size-3 text-neutral-400" /> 14 to 21 day escrow lockup
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <X className="size-3 text-neutral-400" /> NET 60 to 90 payment delays
        </span>
      );
    },
  },
  {
    label: "Direct client ownership",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
            <Check className="size-3.5 stroke-[2.5]" /> 100% direct client ownership
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-neutral-500">
            <X className="size-3 text-neutral-400" /> Platform gates &amp; monitors chat
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <X className="size-3 text-neutral-400" /> Agency holds client contract
        </span>
      );
    },
  },
  {
    label: "Master IP & raw deliverables",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
            <Check className="size-3.5 stroke-[2.5]" /> You retain 100% master IP
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-neutral-500">
            <X className="size-3 text-neutral-400" /> Standard platform TOS terms
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-neutral-500">
          <X className="size-3 text-neutral-400" /> Work-for-hire rights to agency
        </span>
      );
    },
  },
];

// ── 4. Mounted Section Component ──
export function NexusPricingSection() {
  const [billings, setBillings] = React.useState(105000);

  return (
    <div className="w-full max-w-[1040px] mx-auto py-8 px-2 sm:px-4">
      {/* Editorial Section Header */}
      <div className="nx-monolith-header text-center mb-8 space-y-3">
        <div className="nx-compare-kicker-pill inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold tracking-wide text-amber-900 bg-amber-500/10 border border-amber-500/20 rounded-full" aria-hidden="true">
          <span>Compare platforms</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
          How does Nexus compare to traditional platforms?
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Traditional freelance platforms take around 20% of every project plus mandatory escrow holds. 
          Nexus is a verified direct directory: one flat membership, 100% day-rate retention, and direct client wire.
        </p>
      </div>

      {/* The UsageSliderPricingTable Component as given, with our required fields */}
      <UsageSliderPricingTable
        plans={NEXUS_COMPARISON_PLANS}
        rows={NEXUS_COMPARISON_ROWS}
        axis={BILLINGS_AXIS}
        defaultValue={105000}
        value={billings}
        onValueChange={setBillings}
        recommend={() => "nexus"}
        onSelect={(planId) => {
          if (typeof window !== "undefined" && (window as any).openInquiryModal) {
            (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
          } else {
            alert(`Selected ${planId === "nexus" ? "Nexus Direct (100% Retained)" : planId}`);
          }
        }}
      />
    </div>
  );
}

// ── 5. Mount into DOM ──
const mountEl = document.getElementById("nexus-pricing-root");
if (mountEl) {
  const root = ReactDOM.createRoot(mountEl);
  root.render(<NexusPricingSection />);
}

export default NexusPricingSection;
