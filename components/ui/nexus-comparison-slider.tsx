"use client";

import * as React from "react";
import { 
  ArrowUpRight, 
  Check, 
  X, 
  SlidersHorizontal, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Briefcase, 
  FileText, 
  Layers 
} from "lucide-react";
import { 
  UsageSliderPricingTable, 
  type UsagePricingPlan, 
  type UsagePricingRow, 
  type UsagePricingAxis,
  type UsagePricingQuote
} from "./usage-slider-pricing-table";

// ── 1. Plan Definitions tailored to the Nexus Commercial Comparison Section ──
export const NEXUS_COMPARISON_PLANS: UsagePricingPlan[] = [
  {
    id: "nexus",
    name: "Nexus Direct",
    basePrice: 0, // 0% take rate on creator billings
    highlights: ["0% Take Rate", "100% Retained", "Direct Wire"],
  },
  {
    id: "upwork",
    name: "Upwork / Freelance",
    basePrice: 0,
    perSeat: 0.20, // 20% commission toll
    highlights: ["20% Escrow Toll", "14-21 Day Holds", "TOS Monitoring"],
  },
  {
    id: "agency",
    name: "Talent Agencies",
    basePrice: 0,
    perSeat: 0.30, // 30% cut
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

// ── 3. Feature Comparison Rows matching the screenshot matrix ──
export const NEXUS_COMPARISON_ROWS: UsagePricingRow[] = [
  {
    label: "% Platform commission",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> 0% (Zero toll)
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <X className="size-3.5 text-muted-foreground/70" /> 20% on milestones
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <X className="size-3.5 text-muted-foreground/70" /> 25 to 35% agency cut
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
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> Keep ${billings.toLocaleString("en-US")} (100% Retained)
          </span>
        );
      }
      if (plan.id === "upwork") {
        const retained = Math.round(billings * 0.8);
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <X className="size-3.5 text-muted-foreground/70" /> Creator keeps ${retained.toLocaleString("en-US")} (80%)
          </span>
        );
      }
      const agencyRetained = Math.round(billings * 0.7);
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <X className="size-3.5 text-muted-foreground/70" /> Creator keeps ${agencyRetained.toLocaleString("en-US")} (70%)
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
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> $0.00 Platform Fee
          </span>
        );
      }
      if (plan.id === "upwork") {
        const toll = Math.round(billings * 0.2);
        return <span className="text-rose-600 dark:text-rose-400 font-medium">−${toll.toLocaleString("en-US")} toll / yr</span>;
      }
      const agencyToll = Math.round(billings * 0.3);
      return <span className="text-rose-600 dark:text-rose-400 font-medium">−${agencyToll.toLocaleString("en-US")} markup / yr</span>;
    },
  },
  {
    label: "5-Year compounded loss",
    values: (plan, quote) => {
      const billings = quote.seats;
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> $0 Lost (100% Retained)
          </span>
        );
      }
      if (plan.id === "upwork") {
        const toll5Yr = Math.round(billings * 0.2 * 5);
        return <span className="text-rose-600 dark:text-rose-400 font-medium">−${toll5Yr.toLocaleString("en-US")} Lost</span>;
      }
      const agency5Yr = Math.round(billings * 0.3 * 5);
      return <span className="text-rose-600 dark:text-rose-400 font-medium">−${agency5Yr.toLocaleString("en-US")} Lost</span>;
    },
  },
  {
    label: "Payout velocity and escrow",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> Same-day direct wire & ACH
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <X className="size-3.5 text-muted-foreground/70" /> 14 to 21 day escrow holds
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <X className="size-3.5 text-muted-foreground/70" /> Net 60 to 90 payment cycle
        </span>
      );
    },
  },
  {
    label: "Master IP ownership",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> 100% retained by creator
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <X className="size-3.5 text-muted-foreground/70" /> Platform TOS security lien
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <X className="size-3.5 text-muted-foreground/70" /> Work-for-hire rights to agency
        </span>
      );
    },
  },
  {
    label: "Client communication",
    values: (plan) => {
      if (plan.id === "nexus") {
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" /> Direct unmediated relationship
          </span>
        );
      }
      if (plan.id === "upwork") {
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <X className="size-3.5 text-muted-foreground/70" /> In-app monitoring only
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <X className="size-3.5 text-muted-foreground/70" /> Account manager intermediary
        </span>
      );
    },
  },
];

// ── 4. Main Section Component: Integrated Usage Slider Comparison ──
export function NexusComparisonSection({
  initialBillings = 105000,
  onSelectPlan,
}: {
  initialBillings?: number;
  onSelectPlan?: (planId: string) => void;
}) {
  const [billings, setBillings] = React.useState(initialBillings);
  const upworkToll = Math.round(billings * 0.2);

  // Aperture stops matching the screenshot
  const PRESET_APERTURES = [
    { label: "$40,000", sub: "Part-time", value: 40000 },
    { label: "$80,000", sub: "Active DP", value: 80000 },
    { label: "$105,000", sub: "Commercial Dir", value: 105000 },
    { label: "$160,000", sub: "Lead Operator", value: 160000 },
    { label: "$200,000+", sub: "Studio Lead", value: 200000 },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4 space-y-8">
      {/* Editorial Section Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wide text-primary bg-primary/10 rounded-full border border-primary/20 uppercase">
          Compare platforms
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          How does Nexus compare to traditional platforms?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Traditional freelance platforms take around 20% of every project plus mandatory escrow holds.
          Nexus is a verified direct directory: one flat membership, 100% day-rate retention, and direct client wire.
        </p>
      </div>

      {/* Quick Aperture Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESET_APERTURES.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setBillings(preset.value)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              billings === preset.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{preset.label}</span>
            <span className="block text-[10px] opacity-75">{preset.sub}</span>
          </button>
        ))}
      </div>

      {/* Integrated Usage Slider Pricing Table Component */}
      <UsageSliderPricingTable
        plans={NEXUS_COMPARISON_PLANS}
        rows={NEXUS_COMPARISON_ROWS}
        axis={BILLINGS_AXIS}
        value={billings}
        onValueChange={setBillings}
        recommend={() => "nexus"}
        onSelect={(planId) => {
          if (onSelectPlan) onSelectPlan(planId);
          else alert(`Selected ${planId === "nexus" ? "Nexus Direct (100% Retained)" : planId}`);
        }}
      />

      {/* Visual Reinvestment Deck Banner */}
      <div className="rounded-xl border border-border/80 bg-muted/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-semibold text-foreground">
            Annual Surplus Reinvestment Potential: +${upworkToll.toLocaleString("en-US")} / yr
          </span>
          <p className="text-muted-foreground">
            By avoiding the 20% platform toll, you retain enough margin each year to upgrade camera packages, expand your studio kit, or fund independent creative productions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectPlan?.("nexus")}
          className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          Apply for Verified Roster <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

export default NexusComparisonSection;
